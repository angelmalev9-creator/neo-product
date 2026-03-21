import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BUILD_ID = "neo-worker-proxy_v1.16_unavail_fix_2026-03-14";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function safeStr(x: unknown) {
  return typeof x === "string" ? x : "";
}
function safeJson(x: unknown, max = 1200) {
  try {
    const s = JSON.stringify(x);
    return s.length > max ? s.slice(0, max) + "...[truncated]" : s;
  } catch {
    return "[unserializable]";
  }
}

function traceIdFrom(body: any) {
  const raw =
    safeStr(body?.trace_id) ||
    safeStr(body?.session_id) ||
    `trace_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return raw.slice(0, 120);
}
function isObject(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object" && !Array.isArray(x);
}

function isNonEmptyObject(x: unknown): x is Record<string, unknown> {
  return isObject(x) && Object.keys(x).length > 0;
}

class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TimeoutError";
  }
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.toLowerCase().includes("aborted")) throw new TimeoutError(msg);
    throw e;
  } finally {
    clearTimeout(t);
  }
}

function looksLikeNoActiveSession(result: any): boolean {
  const msg = safeStr(result?.message) || safeStr(result?.error);
  return msg.toLowerCase().includes("няма активна сесия");
}

function createSupabaseServiceClient() {
  const SUPABASE_URL = (Deno.env.get("SUPABASE_URL") || "").trim();
  const SUPABASE_KEY =
    (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "").trim() ||
    (Deno.env.get("NEO_SERVICE_ROLE_KEY") || "").trim();
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

// ═══════════════════════════════════════════════════════════════
// NEW v1.12: Gemini Vision proxy
// Форвардва screenshot+prompt от Node.js worker към Gemini API.
// GEMINI_API_KEY живее само тук — никога не се излага на worker-а.
// ═══════════════════════════════════════════════════════════════

async function handleGeminiVision(req: Request): Promise<Response> {
  const GEMINI_API_KEY = (Deno.env.get("GEMINI_API_KEY") || "").trim();
  if (!GEMINI_API_KEY) {
    console.error("[GEMINI-VISION] GEMINI_API_KEY not set in env");
    return json(500, { success: false, error: "GEMINI_API_KEY not configured in proxy env" });
  }

  // Auth: Bearer = NEO_WORKER_SECRET
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "").trim();
  const WORKER_SECRET = (Deno.env.get("NEO_WORKER_SECRET") || "").trim();
  if (!WORKER_SECRET || token !== WORKER_SECRET) {
    return json(401, { success: false, error: "Unauthorized" });
  }

  let body: any;
  try { body = await req.json(); }
  catch { return json(400, { success: false, error: "Invalid JSON body" }); }

  const model = safeStr(body?.model) || "gemini-1.5-flash";
  const screenshotBase64 = safeStr(body?.screenshot_base64);
  const systemPrompt = safeStr(body?.system_prompt);
  const userPrompt = safeStr(body?.user_prompt);

  if (!screenshotBase64) {
    return json(400, { success: false, error: "Missing screenshot_base64" });
  }

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const geminiBody: any = {
    contents: [{
      role: "user",
      parts: [
        { inline_data: { mime_type: "image/png", data: screenshotBase64 } },
        { text: userPrompt || "Analyze this form." }
      ]
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
    }
  };
  if (systemPrompt) {
    geminiBody.system_instruction = { parts: [{ text: systemPrompt }] };
  }

  try {
    const t0 = Date.now();
    const resp = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      console.error(`[GEMINI-VISION] API error ${resp.status}: ${errText.slice(0, 200)}`);
      return json(502, { success: false, error: `Gemini API error: ${resp.status}`, detail: errText.slice(0, 200) });
    }

    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const timingMs = Date.now() - t0;
    console.log(`[GEMINI-VISION] OK model=${model} timing=${timingMs}ms response_len=${text.length}`);

    return json(200, { success: true, text, model, timing_ms: timingMs });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[GEMINI-VISION] fetch error:", msg);
    return json(500, { success: false, error: msg });
  }
}

// ═══════════════════════════════════════════════════════════════
// DB helpers (unchanged from v1.11)
// ═══════════════════════════════════════════════════════════════

async function loadMinimalUrl(
  sessionId: string,
  formId?: string,
  fingerprint?: string
): Promise<{ url: string; source: "demo_sessions" | "form_schemas_exact" | "form_schemas_any" } | null> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return null;

  {
    const { data, error } = await supabase.from("demo_sessions").select("url").eq("id", sessionId).single();
    const url = safeStr((data as any)?.url).trim();
    if (!error && url) return { url, source: "demo_sessions" };
  }
  if (formId || fingerprint) {
    let q = supabase.from("form_schemas").select("url").eq("session_id", sessionId).limit(1);
    if (formId) q = q.eq("id", formId);
    else if (fingerprint) q = q.eq("fingerprint", fingerprint);
    const { data, error } = await q.maybeSingle();
    const url = safeStr((data as any)?.url).trim();
    if (!error && url) return { url, source: "form_schemas_exact" };
  }
  {
    const { data, error } = await supabase.from("form_schemas").select("url").eq("session_id", sessionId).limit(1).maybeSingle();
    const url = safeStr((data as any)?.url).trim();
    if (!error && url) return { url, source: "form_schemas_any" };
  }
  return null;
}

async function loadKindForForm(
  sessionId: string,
  formId?: string,
  fingerprint?: string
): Promise<"form" | "wizard" | "availability" | null> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return null;
  const normalize = (k: unknown) => safeStr(k).trim().toLowerCase();

  if (formId || fingerprint) {
    let q = supabase.from("form_schemas").select("kind").eq("session_id", sessionId).limit(1);
    if (formId) q = q.eq("id", formId);
    else if (fingerprint) q = q.eq("fingerprint", fingerprint);
    const { data, error } = await q.maybeSingle();
    if (!error && data) {
      const k = normalize((data as any)?.kind);
      if (k === "wizard") return "wizard";
      if (k === "form") return "form";
      if (k === "availability") return "availability";
    }
  }
  if (fingerprint) {
    const pref = fingerprint.slice(0, 12);
    if (pref.length >= 8) {
      const { data, error } = await supabase.from("form_schemas").select("kind").eq("session_id", sessionId).ilike("fingerprint", `${pref}%`).limit(1).maybeSingle();
      if (!error && data) {
        const k = normalize((data as any)?.kind);
        if (k === "wizard") return "wizard";
        if (k === "form") return "form";
        if (k === "availability") return "availability";
      }
    }
  }
  {
    const { data, error } = await supabase.from("form_schemas").select("kind").eq("session_id", sessionId).limit(1).maybeSingle();
    if (!error && data) {
      const k = normalize((data as any)?.kind);
      if (k === "wizard") return "wizard";
      if (k === "form") return "form";
      if (k === "availability") return "availability";
    }
  }
  return null;
}

async function loadFormSchema(sessionId: string, formId?: string, fingerprint?: string): Promise<any | null> {
  const supabase = createSupabaseServiceClient();
  if (!supabase || (!formId && !fingerprint)) return null;
  let q = supabase.from("form_schemas").select("schema").eq("session_id", sessionId).limit(1);
  if (formId) q = q.eq("id", formId);
  else if (fingerprint) q = q.eq("fingerprint", fingerprint);
  const { data, error } = await q.maybeSingle();
  if (error || !data) return null;
  return (data as any).schema ?? null;
}

async function loadSiteMapForSession(sessionId: string): Promise<any | null> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("demo_sessions").select("site_map_info, site_map, url").eq("id", sessionId).single();
  if (error || !data) return null;
  const siteMap = (data as any).site_map_info ?? (data as any).site_map ?? null;
  if (!siteMap) return null;
  if (isObject(siteMap) && !(siteMap as any).url && safeStr((data as any).url)) {
    (siteMap as any).url = safeStr((data as any).url);
  }
  return siteMap;
}

function buildMinimalSiteMap(sessionId: string, url: string) {
  return { site_id: sessionId, url, buttons: [], forms: [], prices: [] };
}

// ═══════════════════════════════════════════════════════════════
// Worker call helpers (unchanged)
// ═══════════════════════════════════════════════════════════════

async function callWorkerOnce(
  workerBaseUrl: string,
  workerSecret: string,
  path: string,
  payload: any,
  timeoutMs: number
): Promise<{ ok: boolean; status: number; result: any; raw_text?: string }> {
  const url = `${workerBaseUrl.replace(/\/$/, "")}${path.startsWith("/") ? "" : "/"}${path}`;

  const r = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${workerSecret}`,
      },
      body: JSON.stringify(payload),
    },
    timeoutMs
  );

  const rawText = await r.text().catch(() => "");
  let result: any = null;

  try {
    result = rawText ? JSON.parse(rawText) : null;
  } catch {
    result = null;
  }

  return {
    ok: r.ok,
    status: r.status,
    result,
    raw_text: rawText.slice(0, 2000),
  };
}

async function callWorkerWithRetryOnAbort(
  workerBaseUrl: string,
  workerSecret: string,
  path: string,
  payload: any,
  timeoutMs: number
): Promise<{ ok: boolean; status: number; result: any; raw_text?: string; retried: boolean }> {
  try {
    const r = await callWorkerOnce(workerBaseUrl, workerSecret, path, payload, timeoutMs);
    return { ...r, retried: false };
  } catch (e) {
    if (e instanceof TimeoutError) {
      const retryMs = Math.min(Math.round(timeoutMs * 1.8), 120000);
      const r2 = await callWorkerOnce(workerBaseUrl, workerSecret, path, payload, retryMs);
      return { ...r2, retried: true };
    }
    throw e;
  }
}

// ═══════════════════════════════════════════════════════════════
// Response helpers (unchanged)
// ═══════════════════════════════════════════════════════════════

function extractNeedsInput(workerResult: any): { needs_input: boolean; next: any | null; observation: any | null } {
  const obs = workerResult?.observation ?? null;
  const needs = Boolean(workerResult?.needs_input) || Boolean(obs?.needs_input) || Boolean(workerResult?.needsInput) || Boolean(obs?.needsInput);
  const next = obs?.wizard_next ?? obs?.next_step ?? workerResult?.wizard_next ?? workerResult?.next_step ?? null;
  return { needs_input: needs, next, observation: obs };
}

function normalizeMissingRequired(workerResult: any): string[] {
  const obs = workerResult?.observation ?? null;
  const candidates = [workerResult?.missing_required, workerResult?.missing_fields, workerResult?.missing, obs?.missing_required, obs?.missing_fields, obs?.missing, obs?.required_missing];
  for (const c of candidates) {
    if (Array.isArray(c)) return c.map((x) => safeStr(x).trim()).filter(Boolean).slice(0, 20);
    if (isObject(c)) return Object.keys(c).map((k) => safeStr(k).trim()).filter(Boolean).slice(0, 20);
  }
  return [];
}

function normKey(s: string) { return safeStr(s).trim().toLowerCase(); }

function pickFirstValue(data: Record<string, unknown>, keys: string[]) {
  for (const k of keys) { const v = data[k]; const sv = safeStr(v); if (sv.trim()) return sv.trim(); }
  const dataKeys = Object.keys(data);
  for (const dk of dataKeys) { const ndk = normKey(dk); for (const k of keys) { if (ndk.includes(normKey(k))) { const sv = safeStr(data[dk]); if (sv.trim()) return sv.trim(); } } }
  return "";
}

function mapWizardDataByLabels(schema: any, incoming: Record<string, unknown>) {
  const fieldsArr = Array.isArray(schema?.fields) ? schema.fields : [];
  const choicesArr = Array.isArray(schema?.choices) ? schema.choices : [];
  const allNamesEmpty = fieldsArr.every((f: any) => !safeStr(f?.name).trim());
  if (!allNamesEmpty && !choicesArr.length) return incoming;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(incoming)) { const cleanKey = k.replace(/\s*\(избор:.*?\)\s*$/i, "").trim(); out[cleanKey] = v; if (cleanKey !== k) out[k] = v; }
  const emailVal = pickFirstValue(out, ["email", "e-mail", "имейл", "mail"]);
  const phoneVal = pickFirstValue(out, ["phone", "tel", "telephone", "телефон", "gsm"]);
  const nameVal  = pickFirstValue(out, ["name", "full_name", "име", "три имена", "имена"]);
  const ageVal   = pickFirstValue(out, ["age", "възраст"]);
  if (allNamesEmpty) {
    for (const f of fieldsArr) {
      const label = safeStr(f?.label).trim(); if (!label) continue;
      const n = normKey(label);
      if (!out[label]) {
        if (n.includes("имейл") && emailVal) out[label] = emailVal;
        else if (n.includes("телефон") && phoneVal) out[label] = phoneVal;
        else if (n.includes("три имена") && nameVal) out[label] = nameVal;
        else if (n.includes("възраст") && ageVal) out[label] = ageVal;
      }
    }
  }
  for (const choice of choicesArr) {
    const choiceName = safeStr(choice?.name).trim(); const choiceLabel = safeStr(choice?.label).trim();
    if (!choiceName && !choiceLabel) continue;
    const val = safeStr(out[choiceName] || out[choiceLabel]).trim();
    if (val) { if (choiceName) out[choiceName] = val; if (choiceLabel && choiceLabel !== choiceName) out[choiceLabel] = val; }
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════
// POST-SUBMIT EMAIL NOTIFICATIONS (unchanged from v1.11)
// ═══════════════════════════════════════════════════════════════

async function loadOwnerEmail(sessionId: string): Promise<string | null> {
  try {
    const SUPABASE_URL = (Deno.env.get("SUPABASE_URL") || "").trim();
    const SUPABASE_KEY = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("NEO_SERVICE_ROLE_KEY") || "").trim();
    if (!SUPABASE_URL || !SUPABASE_KEY) return null;
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await supabase.from("demo_sessions").select("structured_data, company_name, url").eq("id", sessionId).single();
    if (error || !data) return null;
    const contact = data.structured_data?.sections?.contact;
    if (Array.isArray(contact?.emails) && contact.emails.length > 0) return contact.emails[0];
    const gf = data.structured_data?.global_facts;
    if (Array.isArray(gf?.emails) && gf.emails.length > 0) return gf.emails[0];
    return null;
  } catch { return null; }
}

async function loadCompanyName(sessionId: string): Promise<string> {
  try {
    const SUPABASE_URL = (Deno.env.get("SUPABASE_URL") || "").trim();
    const SUPABASE_KEY = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("NEO_SERVICE_ROLE_KEY") || "").trim();
    if (!SUPABASE_URL || !SUPABASE_KEY) return "компанията";
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data } = await supabase.from("demo_sessions").select("company_name").eq("id", sessionId).single();
    return safeStr(data?.company_name).trim() || "компанията";
  } catch { return "компанията"; }
}

function extractClientInfo(fields: Record<string, unknown>): { email: string; name: string; phone: string } {
  const normalize = (s: unknown) => safeStr(s).trim();
  let email = "", name = "", phone = "";
  for (const [k, v] of Object.entries(fields)) {
    const key = k.toLowerCase().replace(/\*/g, "").trim(); const val = normalize(v); if (!val) continue;
    if (!email && (key.includes("имейл") || key.includes("email") || key.includes("e-mail") || key.includes("mail") || key.includes("поща"))) { if (val.includes("@")) email = val; }
    if (!name && (key.includes("име") || key.includes("name") || key.includes("names"))) name = val;
    if (!phone && (key.includes("телефон") || key.includes("phone") || key.includes("tel") || key.includes("gsm"))) phone = val;
  }
  if (!email) email = normalize(fields.email || fields.Email || fields["Имейл"] || fields["Имейл *"]);
  if (!name)  name  = normalize(fields.name  || fields.Name  || fields["Име"]   || fields["Три имена"] || fields["Три имена *"]);
  if (!phone) phone = normalize(fields.phone || fields.Phone || fields["Телефон"] || fields["Телефон *"]);
  return { email, name, phone };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildOwnerEmailHtml(clientName: string, clientEmail: string, clientPhone: string, fields: Record<string, unknown>, companyName: string): string {
  const labelMap: Record<string, string> = { name:"Име",yourname:"Име",full_name:"Име","три имена":"Име",email:"Имейл",youremail:"Имейл","e-mail":"Имейл",mail:"Имейл",phone:"Телефон",yourphone:"Телефон",tel:"Телефон",telephone:"Телефон",gsm:"Телефон",message:"Съобщение",yourmessage:"Съобщение",comment:"Коментар",plan:"Пакет",package:"Пакет",service:"Услуга",date:"Дата",time:"Час",address:"Адрес",city:"Град",company:"Фирма",subject:"Тема" };
  function translateKey(key: string): string { const k = key.toLowerCase().replace(/[\*\s]+/g,"").trim(); for (const [eng,bg] of Object.entries(labelMap)) { if (k===eng||k.includes(eng)) return bg; } return key.charAt(0).toUpperCase()+key.slice(1); }
  const fieldRows = Object.entries(fields).filter(([,v]) => safeStr(v).trim()).map(([k,v]) => { const label=translateKey(k); const val=safeStr(v).trim(); const isLink=val.includes("@")?`<a href="mailto:${escapeHtml(val)}" style="color:#dc2626;text-decoration:none;">${escapeHtml(val)}</a>`:escapeHtml(val); return `<tr><td style="padding:10px 16px;font-size:13px;font-weight:600;color:#6b7280;border-bottom:1px solid #f3f4f6;width:120px;vertical-align:top;font-family:'Montserrat',Arial,sans-serif;">${escapeHtml(label)}</td><td style="padding:10px 16px;font-size:14px;color:#111827;border-bottom:1px solid #f3f4f6;font-family:'Montserrat',Arial,sans-serif;">${isLink}</td></tr>`; }).join("");
  return `<!DOCTYPE html><html lang="bg"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet"><style>*{font-family:'Montserrat',Arial,Helvetica,sans-serif!important;}@media only screen and (max-width:480px){.neo-outer{padding:12px 8px!important;}.neo-pad{padding-left:16px!important;padding-right:16px!important;}.neo-card{border-radius:8px!important;}.neo-title{font-size:16px!important;}.neo-sub{font-size:12px!important;}td{font-size:13px!important;}}</style></head><body style="margin:0;padding:0;background-color:#f3f4f6;font-family:'Montserrat',Arial,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;"><tr><td class="neo-outer" style="padding:24px 16px;"><table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" class="neo-card" style="max-width:540px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);"><tr><td style="background-color:#111827;padding:20px 24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="width:36px;vertical-align:middle;"><div style="width:32px;height:32px;background-color:#dc2626;border-radius:6px;text-align:center;line-height:32px;"><span style="color:#ffffff;font-size:14px;font-weight:700;">N</span></div></td><td style="vertical-align:middle;padding-left:10px;"><p class="neo-title" style="color:#ffffff;font-size:17px;font-weight:700;margin:0;">Ново запитване</p><p class="neo-sub" style="color:#9ca3af;font-size:13px;margin:4px 0 0;"><span style="color:#dc2626;">NEO</span> получи запитване за ${escapeHtml(companyName)}</p></td></tr></table></td></tr><tr><td style="background-color:#dc2626;height:3px;font-size:1px;">&nbsp;</td></tr><tr><td class="neo-pad" style="padding:24px;"><p style="color:#111827;font-size:14px;font-weight:700;margin:0 0 14px;">Данни от клиента:</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">${fieldRows}</table></td></tr><tr><td class="neo-pad" style="padding:0 24px 20px;"><div style="border-top:1px solid #f3f4f6;padding-top:14px;"><p style="color:#9ca3af;font-size:12px;margin:0;line-height:1.5;">Подадено автоматично от <strong style="color:#dc2626;">NEO</strong> — AI асистент на вашия сайт. <a href="https://neo-assistant.com" style="color:#dc2626;text-decoration:none;">neo-assistant.com</a></p></div></td></tr></table></td></tr></table></body></html>`;
}

function buildClientEmailHtml(clientName: string, companyName: string): string {
  return `<!DOCTYPE html><html lang="bg"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet"><style>*{font-family:'Montserrat',Arial,Helvetica,sans-serif!important;}@media only screen and (max-width:480px){.neo-outer{padding:12px 8px!important;}.neo-pad{padding-left:16px!important;padding-right:16px!important;}.neo-card{border-radius:8px!important;}.neo-greeting{font-size:17px!important;}.neo-text{font-size:13px!important;}}</style></head><body style="margin:0;padding:0;background-color:#f3f4f6;font-family:'Montserrat',Arial,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;"><tr><td class="neo-outer" style="padding:24px 16px;"><table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" class="neo-card" style="max-width:540px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);"><tr><td style="background-color:#111827;padding:20px 24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="width:36px;vertical-align:middle;"><div style="width:32px;height:32px;background-color:#dc2626;border-radius:6px;text-align:center;line-height:32px;"><span style="color:#ffffff;font-size:14px;font-weight:700;">N</span></div></td><td style="vertical-align:middle;padding-left:10px;"><p style="color:#ffffff;font-size:16px;font-weight:700;margin:0;"><span style="color:#dc2626;">NEO</span> Assistant</p></td></tr></table></td></tr><tr><td style="background-color:#dc2626;height:3px;font-size:1px;">&nbsp;</td></tr><tr><td class="neo-pad" style="padding:24px 24px 0;"><div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;text-align:center;"><p style="color:#166534;font-size:14px;font-weight:600;margin:0;">✅ Запитването Ви е изпратено успешно</p></div></td></tr><tr><td class="neo-pad" style="padding:20px 24px;"><p class="neo-greeting" style="color:#111827;font-size:18px;font-weight:700;margin:0 0 14px;">Здравейте${clientName?", "+escapeHtml(clientName):""}!</p><p class="neo-text" style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 12px;">Вашето запитване към <strong>${escapeHtml(companyName)}</strong> беше изпратено успешно. Екипът ще се свърже с Вас възможно най-скоро.</p><p class="neo-text" style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;">Обикновено отговор се получава в рамките на работния ден.</p></td></tr><tr><td class="neo-pad" style="padding:0 24px 20px;"><div style="border-top:1px solid #e5e7eb;padding-top:14px;"><p style="color:#9ca3af;font-size:12px;margin:0 0 2px;">С уважение,</p><p style="color:#111827;font-size:13px;font-weight:600;margin:0;"><span style="color:#dc2626;">NEO</span> — Вашият бизнес асистент</p></div></td></tr><tr><td style="background-color:#f9fafb;border-top:1px solid #f3f4f6;padding:16px 24px;"><p style="color:#9ca3af;font-size:11px;line-height:1.5;margin:0 0 8px;">Този имейл е подготвен от <strong style="color:#dc2626;">NEO</strong> — интелигентен AI асистент за бизнеси.</p><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background-color:#dc2626;border-radius:5px;"><a href="https://neo-assistant.com" style="display:inline-block;color:#ffffff;text-decoration:none;padding:6px 16px;font-size:11px;font-weight:600;" target="_blank">Научете повече</a></td><td style="padding-left:10px;"><a href="https://neo-assistant.com" style="color:#dc2626;text-decoration:none;font-size:11px;" target="_blank">neo-assistant.com</a></td></tr></table></td></tr><tr><td style="background-color:#111827;padding:12px 24px;text-align:center;"><p style="color:#6b7280;font-size:10px;margin:0;">&copy; ${new Date().getFullYear()} NEO Assistant</p></td></tr></table></td></tr></table></body></html>`;
}

async function sendPostSubmitEmails(sessionId: string, fields: Record<string, unknown>): Promise<void> {
  try {
    const SUPABASE_URL = (Deno.env.get("SUPABASE_URL") || "").trim();
    const SUPABASE_KEY = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("NEO_SERVICE_ROLE_KEY") || "").trim();
    const INTERNAL_KEY = (Deno.env.get("INTERNAL_FUNCTION_KEY") || "").trim();
    if (!SUPABASE_URL) { console.log("[POST-SUBMIT-EMAIL] No SUPABASE_URL, skipping"); return; }
    const sb = (SUPABASE_URL && SUPABASE_KEY) ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

    // Load user_id from demo_sessions for logging
    let sessionUserId: string | null = null;
    if (sb) {
      try {
        const { data: sess } = await sb.from("demo_sessions").select("user_id").eq("id", sessionId).single();
        sessionUserId = sess?.user_id || null;
      } catch { /* ignore */ }
    }

    const [ownerEmail, companyName] = await Promise.all([loadOwnerEmail(sessionId), loadCompanyName(sessionId)]);
    const client = extractClientInfo(fields);
    console.log(`[POST-SUBMIT-EMAIL] owner=${ownerEmail||"none"} client=${client.email||"none"} company=${companyName} user_id=${sessionUserId||"none"}`);
    const emailExecutorUrl = `${SUPABASE_URL}/functions/v1/action_email_executor`;
    const RESEND_API_KEY = (Deno.env.get("RESEND_API_KEY") || "").trim();
    const EMAIL_FROM = Deno.env.get("EMAIL_FROM") || "NEO Assistant <onboarding@resend.dev>";

    const logEmail = async (to: string, subject: string, body: string, status: string, intent: string) => {
      if (!sb || !sessionUserId) return;
      try {
        await sb.from("email_logs").insert({
          user_id: sessionUserId,
          recipient_email: to,
          recipient_name: client.name || null,
          subject,
          body,
          status,
          intent,
          sent_at: status === "sent" ? new Date().toISOString() : null,
          demo_session_id: sessionId,
          is_demo: false,
        });
      } catch (e) { console.warn(`[POST-SUBMIT-EMAIL] log insert failed:`, e); }
    };

    const sendEmail = async (to: string, subject: string, html: string, intent: string) => {
      let sent = false;
      if (INTERNAL_KEY && emailExecutorUrl) {
        try {
          const res = await fetch(emailExecutorUrl, { method:"POST", headers:{"Content-Type":"application/json","x-internal-key":INTERNAL_KEY}, body:JSON.stringify({mode:"real",to,subject,content:html}) });
          const result = await res.json().catch(()=>({}));
          if (result?.success) { console.log(`[POST-SUBMIT-EMAIL] via executor to ${to}: OK`); sent = true; }
          else console.warn(`[POST-SUBMIT-EMAIL] executor failed for ${to}: ${result?.error||res.status}`);
        } catch (e) { console.warn(`[POST-SUBMIT-EMAIL] executor error for ${to}:`, e); }
      }
      if (!sent && RESEND_API_KEY) {
        try {
          const res = await fetch("https://api.resend.com/emails", { method:"POST", headers:{Authorization:`Bearer ${RESEND_API_KEY}`,"Content-Type":"application/json"}, body:JSON.stringify({from:EMAIL_FROM,to:[to],subject,html}) });
          const data = await res.json().catch(()=>({}));
          sent = res.ok;
          console.log(`[POST-SUBMIT-EMAIL] via Resend direct to ${to}: ${res.ok?"OK":data?.error||res.status}`);
        } catch (e) { console.error(`[POST-SUBMIT-EMAIL] Resend direct failed for ${to}:`, e); }
      }
      if (!sent && !RESEND_API_KEY && !INTERNAL_KEY) { console.error(`[POST-SUBMIT-EMAIL] No way to send email to ${to}`); }
      await logEmail(to, subject, html, sent ? "sent" : "failed", intent);
    };
    const promises: Promise<void>[] = [];
    if (ownerEmail) {
      const ownerSubject = `Ново запитване от ${client.name||"клиент"} чрез NEO`;
      const ownerHtml = buildOwnerEmailHtml(client.name, client.email, client.phone, fields, companyName);
      promises.push(sendEmail(ownerEmail, ownerSubject, ownerHtml, "owner_notification"));
    }
    if (client.email && client.email.includes("@")) {
      const clientSubject = `Запитването Ви към ${companyName} е изпратено`;
      const clientHtml = buildClientEmailHtml(client.name, companyName);
      promises.push(sendEmail(client.email, clientSubject, clientHtml, "client_confirmation"));
    }
    await Promise.allSettled(promises);
  } catch (e) { console.error("[POST-SUBMIT-EMAIL] unexpected error:", e); }
}

// ═══════════════════════════════════════════════════════════════
// MAIN SERVE HANDLER
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// AVAILABILITY HANDLER v1.13
// 1. Calls worker /check-availability (fills dates, screenshot)
// 2. Sends screenshot to /gemini-vision for structured parsing
// 3. Returns availability_result with rooms + prices to NEO
// ═══════════════════════════════════════════════════════════════

async function handleAvailabilityCheck(opts: {
  t0: number;
  session_id: string;
  form_id: string;
  fingerprint: string;
  fields: Record<string, unknown>;
  payloadUrl: string;
  WORKER_URL: string;
  WORKER_SECRET: string;
  PREPARE_TIMEOUT_MS: number;
  FILL_TIMEOUT_MS: number;
}): Promise<Response> {
  const { t0, session_id, form_id, fingerprint, fields, payloadUrl,
          WORKER_URL, WORKER_SECRET, PREPARE_TIMEOUT_MS, FILL_TIMEOUT_MS } = opts;

  const SUPABASE_SELF_URL = (Deno.env.get("SUPABASE_URL") || "").trim();
  const SUPABASE_FUNCTION_NAME =
    (Deno.env.get("NEO_PROXY_FUNCTION_NAME") || "neo-worker-proxy").trim();
  const WORKER_SECRET_VAL = WORKER_SECRET;

  console.log(`[AVAIL-PROXY] Starting availability check session=${session_id}`);

  // ── Step 1: call worker /check-availability ────────────────
  const availPayload: any = {
    site_id: session_id,
    session_id,
    form_id: form_id || undefined,
    fingerprint: fingerprint || undefined,
    kind: "availability",
    data: fields,
    auto_submit: false,
  };

  let avail = await callWorkerWithRetryOnAbort(
    WORKER_URL, WORKER_SECRET_VAL, "/check-availability", availPayload, FILL_TIMEOUT_MS
  );

  // ── Auto prepare-session if no active session ──────────────
  if (avail.ok && looksLikeNoActiveSession(avail.result)) {
    let siteMap = await loadSiteMapForSession(session_id);
    if (!siteMap) {
      const u = await loadMinimalUrl(session_id, form_id || undefined, fingerprint || undefined);
      const url = (u?.url || payloadUrl).trim();
      if (!url) {
        return json(200, {
          success: false, error: "No active session and no URL found",
          stage: "availability_prepare_missing", timing_ms: Date.now() - t0, build_id: BUILD_ID,
        });
      }
      siteMap = buildMinimalSiteMap(session_id, url);
    }
    const prep = await callWorkerWithRetryOnAbort(
      WORKER_URL, WORKER_SECRET_VAL, "/prepare-session",
      { site_id: session_id, session_id, site_map: siteMap }, PREPARE_TIMEOUT_MS
    );
    if (!prep.ok || prep.result?.success !== true) {
      return json(200, {
        success: false, error: "Auto prepare-session failed for availability",
        stage: "availability_prepare_failed", timing_ms: Date.now() - t0, build_id: BUILD_ID,
      });
    }
    avail = await callWorkerWithRetryOnAbort(
      WORKER_URL, WORKER_SECRET_VAL, "/check-availability", availPayload, FILL_TIMEOUT_MS
    );
  }

  if (!avail.ok || !avail.result?.success) {
    console.error(`[AVAIL-PROXY] Worker check-availability failed: ${JSON.stringify(avail.result)}`);
    return json(200, {
      success: false, error: "Availability worker failed",
      stage: "availability_worker_failed",
      worker_result: avail.result, timing_ms: Date.now() - t0, build_id: BUILD_ID,
    });
  }

  const observation = avail.result?.observation as any;
  const screenshotBase64 = safeStr(observation?.screenshot_base64);

  if (!screenshotBase64) {
    return json(200, {
      success: false, error: "No screenshot from worker",
      stage: "availability_no_screenshot", timing_ms: Date.now() - t0, build_id: BUILD_ID,
    });
  }

  // ── Step 2: send screenshot to Gemini Vision ───────────────
  console.log(`[AVAIL-PROXY] Sending screenshot to Gemini Vision (len=${screenshotBase64.length})`);

  const visionSystemPrompt = [
    "You are analyzing a hotel availability results page screenshot.",
    "Extract ONLY truly available room types with their prices.",
    "Return ONLY valid JSON, no markdown, no explanation.",
    "CRITICAL — Unavailability detection:",
    "- Room cards showing a red badge/overlay with 'Не е налично', 'Not available', 'Unavailable', or 'Sold out' are NOT available. Set available=false for those rooms and do NOT include them as available options.",
    "- Only include rooms with available=true in the 'rooms' array where the card has no unavailability overlay and shows a booking button.",
    "- Set top-level available=true only if at least one room has no unavailability badge.",
    "JSON schema:",
    `{
  "available": boolean,
  "rooms": [
    {
      "name": string,
      "price_per_night": number | null,
      "total_price": number | null,
      "currency": string,
      "available": boolean,
      "description": string | null,
      "max_guests": number | null,
      "meal_plan": string | null
    }
  ],
  "check_in": string | null,
  "check_out": string | null,
  "nights": number | null,
  "currency": string,
  "raw_summary": string
}`,
    "If no rooms are available, set available=false and rooms=[].",
    "For prices: extract numeric value only (e.g. 120 not '120 BGN').",
    "currency: detect from page (BGN, EUR, USD etc). Default BGN.",
    "raw_summary: 1-2 sentence summary noting which rooms are available and which are unavailable.",
  ].join("\n");

  const visionUserPrompt =
    `Extract hotel availability results. Check-in: ${safeStr(observation?.check_in)}, Check-out: ${safeStr(observation?.check_out)}. Return JSON only.`;

  let availabilityResult: any = null;
  try {
    // Call our own /gemini-vision endpoint (same proxy function, different path)
    const visionUrl = `${SUPABASE_SELF_URL}/functions/v1/${SUPABASE_FUNCTION_NAME}/gemini-vision`;
    const visionResp = await fetch(visionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${WORKER_SECRET_VAL}`,
      },
      body: JSON.stringify({
        screenshot_base64: screenshotBase64,
        system_prompt: visionSystemPrompt,
        user_prompt: visionUserPrompt,
        model: "gemini-2.5-flash-lite",
      }),
    });

    if (visionResp.ok) {
      const visionData = await visionResp.json();
      console.log(`[AVAIL-PROXY] Vision raw success=${visionData?.success} text=${String(visionData?.text || "").slice(0, 1200)}`);

      if (visionData?.success && visionData?.text) {
        try {
          const cleaned = String(visionData.text).replace(/```json|```/g, "").trim();
          const jsonCandidate =
            cleaned.startsWith("{")
              ? cleaned
              : (cleaned.match(/\{[\s\S]*\}/)?.[0] || "");

          availabilityResult = jsonCandidate ? JSON.parse(jsonCandidate) : null;

          console.log(
            `[AVAIL-PROXY] Vision parsed: available=${availabilityResult?.available} rooms=${Array.isArray(availabilityResult?.rooms) ? availabilityResult.rooms.length : 0}`
          );
        } catch (parseErr) {
          console.warn(`[AVAIL-PROXY] Vision JSON parse failed: ${String(visionData.text).slice(0, 500)}`);
          availabilityResult = {
            available: null,
            rooms: [],
            raw_summary: String(visionData.text).slice(0, 1000),
            parse_error: true,
          };
        }
      }
    } else {
      const rawVisionText = await visionResp.text().catch(() => "");
      console.warn(`[AVAIL-PROXY] Vision endpoint returned ${visionResp.status}: ${rawVisionText.slice(0, 500)}`);
    }
  } catch (e) {
    console.error(`[AVAIL-PROXY] Vision call failed: ${e instanceof Error ? e.message : String(e)}`);
  }

  // ── Step 3: return structured result to NEO ────────────────
  return json(200, {
    success: true,
    stage: "availability_result",
    kind: "availability",
    availability_result: availabilityResult,
    check_in: safeStr(observation?.check_in),
    check_out: safeStr(observation?.check_out),
    guests: safeStr(observation?.guests),
    search_clicked: observation?.search_clicked,
    fill_result: observation?.fill_result,
    timing_ms: Date.now() - t0,
    build_id: BUILD_ID,
  });
}

// ═══════════════════════════════════════════════════════════════
// MAKE RESERVATION HANDLER v1.14
// Двуфазов workflow:
//   phase=check  → worker /make-reservation → screenshot → Gemini Vision парсва стаи/цени
//   phase=reserve → worker /make-reservation → попълва guest данни → връща booking_url
// ═══════════════════════════════════════════════════════════════

async function handleMakeReservation(opts: {
  t0: number;
  body: any;
  WORKER_URL: string;
  WORKER_SECRET: string;
  PREPARE_TIMEOUT_MS: number;
  FILL_TIMEOUT_MS: number;
}): Promise<Response> {
  const { t0, body, WORKER_URL, WORKER_SECRET, PREPARE_TIMEOUT_MS, FILL_TIMEOUT_MS } = opts;

  const session_id  = safeStr(body?.session_id);
  const phase       = safeStr(body?.phase) as "check" | "reserve";
  const check_in    = safeStr(body?.check_in || body?.fields?.check_in || body?.fields?.настаняване);
  const check_out   = safeStr(body?.check_out || body?.fields?.check_out || body?.fields?.отпътуване);
  const guests      = safeStr(body?.guests || body?.fields?.guests || body?.fields?.гости || "2");
  const rooms       = safeStr(body?.rooms || body?.fields?.rooms || "1");
  const room_type   = safeStr(body?.room_type || body?.fields?.room_type || "");
  const payloadUrl  = safeStr(body?.site_url || body?.url).trim();

  // Guest details (for phase=reserve)
  const guest_name    = safeStr(body?.guest_name  || body?.fields?.name  || body?.fields?.["Три имена"] || body?.fields?.["Имена"]);
  const guest_email   = safeStr(body?.guest_email || body?.fields?.email || body?.fields?.["Имейл"]);
  const guest_phone   = safeStr(body?.guest_phone || body?.fields?.phone || body?.fields?.["Телефон"]);
  const guest_message = safeStr(body?.guest_message || body?.fields?.message || body?.fields?.["Съобщение"] || "");
  const confirmed_price = safeStr(body?.confirmed_price || "");
  // ✅ Bulgarian Clock PMS specific fields
  const guest_egn        = safeStr(body?.guest_egn        || body?.fields?.egn        || body?.fields?.["ЕГН"]                || "");
  const guest_birthdate  = safeStr(body?.guest_birthdate  || body?.fields?.birthdate  || body?.fields?.["Дата на раждане"]    || "");
  const guest_gender     = safeStr(body?.guest_gender     || body?.fields?.gender     || body?.fields?.["Пол"]                || body?.fields?.["Пол (код)"] || "");
  const guest_country    = safeStr(body?.guest_country    || body?.fields?.country    || body?.fields?.["Държава"]            || "");
  const guest_doc_type   = safeStr(body?.guest_doc_type   || body?.fields?.doc_type   || body?.fields?.["Тип документ"]       || "");
  const guest_doc_number = safeStr(body?.guest_doc_number || body?.fields?.doc_number || body?.fields?.["Номер на документ"]  || "");

  const SUPABASE_SELF_URL = (Deno.env.get("SUPABASE_URL") || "").trim();
  const SUPABASE_FUNCTION_NAME =
    (Deno.env.get("NEO_PROXY_FUNCTION_NAME") || "neo-worker-proxy").trim();
  const WORKER_SECRET_VAL = WORKER_SECRET;

    const trace_id = traceIdFrom(body);

  console.log(
    `[RESERVATION-PROXY] trace=${trace_id} start phase=${phase} session=${session_id} check_in=${check_in} check_out=${check_out} guests=${guests} rooms=${rooms} room_type=${room_type || "-"}`
  );
  console.log(
    `[RESERVATION-PROXY] trace=${trace_id} guest_name=${guest_name ? "set" : "missing"} guest_email=${guest_email ? "set" : "missing"} guest_phone=${guest_phone ? "set" : "missing"} guest_egn=${guest_egn ? "set" : "-"} guest_birthdate=${guest_birthdate ? "set" : "-"} guest_gender=${guest_gender ? "set" : "-"} guest_country=${guest_country ? "set" : "-"} guest_doc_type=${guest_doc_type ? "set" : "-"} guest_doc_number=${guest_doc_number ? "set" : "-"}`
  );

  // Build worker payload
  const reservationPayload: any = {
    site_id: session_id,
    session_id,
    phase,
    check_in,
    check_out,
    guests,
    rooms,
    room_type: room_type || undefined,
    guest_name:    guest_name || undefined,
    guest_email:   guest_email || undefined,
    guest_phone:   guest_phone || undefined,
    guest_message: guest_message || undefined,
    confirmed_price: confirmed_price || undefined,
    // ✅ Bulgarian Clock PMS specific fields
    guest_egn:        guest_egn        || undefined,
    guest_birthdate:  guest_birthdate  || undefined,
    guest_gender:     guest_gender     || undefined,
    guest_country:    guest_country    || undefined,
    guest_doc_type:   guest_doc_type   || undefined,
    guest_doc_number: guest_doc_number || undefined,
    auto_submit: false, // ВИНАГИ false — спираме преди плащане
  };

  // ── Call worker /make-reservation ────────────────────────────
  console.log(
    `[RESERVATION-PROXY] trace=${trace_id} calling worker /make-reservation payload=${safeJson(reservationPayload, 2200)}`
  );

  let workerResp = await callWorkerWithRetryOnAbort(
    WORKER_URL, WORKER_SECRET_VAL, "/make-reservation", reservationPayload, FILL_TIMEOUT_MS
  );
  // ── Auto prepare-session ако няма активна сесия ──────────────
  if (workerResp.ok && looksLikeNoActiveSession(workerResp.result)) {
    let siteMap = await loadSiteMapForSession(session_id);
    if (!siteMap) {
      const u = await loadMinimalUrl(session_id);
      const url = (u?.url || payloadUrl).trim();
      if (!url) {
        return json(200, {
          success: false, error: "No active session and no URL found",
          stage: "reservation_prepare_missing", timing_ms: Date.now() - t0, build_id: BUILD_ID,
        });
      }
      siteMap = buildMinimalSiteMap(session_id, url);
    }
    const prep = await callWorkerWithRetryOnAbort(
      WORKER_URL, WORKER_SECRET_VAL, "/prepare-session",
      { site_id: session_id, session_id, site_map: siteMap }, PREPARE_TIMEOUT_MS
    );
    if (!prep.ok || prep.result?.success !== true) {
      return json(200, {
        success: false, error: "Auto prepare-session failed for reservation",
        stage: "reservation_prepare_failed", timing_ms: Date.now() - t0, build_id: BUILD_ID,
      });
    }
    workerResp = await callWorkerWithRetryOnAbort(
      WORKER_URL, WORKER_SECRET_VAL, "/make-reservation", reservationPayload, FILL_TIMEOUT_MS
    );
  }

   const workerResult = workerResp.result;

  console.log(
    `[RESERVATION-PROXY] trace=${trace_id} worker_ok=${workerResp.ok} status=${workerResp.status} retried=${workerResp.retried} has_result=${!!workerResult} raw_text_len=${(workerResp.raw_text || "").length}`
  );
  console.log(
    `[RESERVATION-PROXY] trace=${trace_id} worker_result=${safeJson(workerResult, 2200)}`
  );
  if (workerResp.raw_text) {
    console.log(
      `[RESERVATION-PROXY] trace=${trace_id} worker_raw_text=${workerResp.raw_text.slice(0, 2000)}`
    );
  }

  if (!workerResp.ok) {
    return json(200, {
      success: false,
      phase,
      stage: "reservation_worker_http_error",
      error: `Worker returned HTTP ${workerResp.status}`,
      worker_status: workerResp.status,
      worker_result: workerResult,
      worker_raw_text: workerResp.raw_text || "",
      timing_ms: Date.now() - t0,
      build_id: BUILD_ID,
    });
  }

  if (!workerResult) {
    return json(200, {
      success: false,
      phase,
      stage: "reservation_worker_invalid_json",
      error: "Worker returned empty or non-JSON response",
      worker_status: workerResp.status,
      worker_result: null,
      worker_raw_text: workerResp.raw_text || "",
      timing_ms: Date.now() - t0,
      build_id: BUILD_ID,
    });
  }

  // ── PHASE CHECK: parse screenshot with Gemini Vision ─────────
  if (phase === "check") {
    const screenshotBase64 = safeStr(workerResult?.screenshot_base64);

    if (!screenshotBase64) {
      return json(200, {
        success: false,
        phase: "check",
        stage: "reservation_no_screenshot",
        error: workerResult?.message || "No screenshot from worker",
        worker_status: workerResp.status,
        worker_result: workerResult,
        worker_raw_text: workerResp.raw_text || "",
        timing_ms: Date.now() - t0,
        build_id: BUILD_ID,
      });
    }

    // Send to Gemini Vision for structured parsing
    const visionSystemPrompt = [
      "You are analyzing a hotel booking / availability results screenshot.",
      "Your task is to extract the booking result in strict JSON.",
      "Return ONLY valid JSON. No markdown. No explanation. No prose outside JSON.",
      "Important:",
      "- The page may be in Bulgarian or English.",
      "- The page may show room cards, price blocks, booking summary, or a no-availability message.",
      "CRITICAL — Room availability detection:",
      "- If a room card shows a red banner/badge saying 'Не е налично' (Bulgarian) or 'Not available' or 'Unavailable' or 'Sold out' — set that room's available=false. Do NOT include it as an available room.",
      "- Only include rooms in the 'rooms' array where available=true (no unavailability badge/overlay visible on the card).",
      "- If ALL rooms show unavailability badges, set the top-level available=false and rooms=[].",
      "- Only set top-level available=true if at least one room card has NO unavailability badge and shows a booking button (e.g. 'ПОКАЖИ ТАРИФИТЕ', 'Book', 'Select').",
      "- If prices are not clearly visible but at least one room is available (no badge), still return available=true.",
      "- If the screenshot is unclear, still return valid JSON with your best effort and explain uncertainty in raw_summary.",
      "JSON schema:",
      `{
  "available": boolean | null,
  "rooms": [
    {
      "name": string,
      "price_per_night": number | null,
      "total_price": number | null,
      "currency": string,
      "available": boolean,
      "description": string | null,
      "max_guests": number | null,
      "meal_plan": string | null,
      "nights": number | null
    }
  ],
  "check_in": string | null,
  "check_out": string | null,
  "nights": number | null,
  "currency": string | null,
  "raw_summary": string
}`,
      "For prices: extract numeric value only.",
      "currency: detect from page if visible, otherwise null.",
      "raw_summary: 1-3 short sentences describing exactly what is visible, including which rooms are unavailable.",
      "Never return null as the whole response.",
    ].join("\n");

    const visionUserPrompt = [
      "Extract hotel availability results from this screenshot.",
      `Check-in: ${safeStr(workerResult?.observation?.check_in || body?.check_in)}`,
      `Check-out: ${safeStr(workerResult?.observation?.check_out || body?.check_out)}`,
      `Guests: ${safeStr(workerResult?.observation?.guests || body?.guests)}`,
      "Return JSON only."
    ].join("\n");

    let availabilityResult: any = null;
    try {
      const visionUrl = `${SUPABASE_SELF_URL}/functions/v1/${SUPABASE_FUNCTION_NAME}/gemini-vision`;
      const visionResp = await fetch(visionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${WORKER_SECRET_VAL}`,
        },
        body: JSON.stringify({
          screenshot_base64: screenshotBase64,
          system_prompt: visionSystemPrompt,
          user_prompt: visionUserPrompt,
          model: "gemini-2.5-flash-lite",
        }),
      });

      if (visionResp.ok) {
        const visionData = await visionResp.json();
        if (visionData?.success && visionData?.text) {
          try {
            const cleaned = visionData.text.replace(/```json|```/g, "").trim();
            availabilityResult = JSON.parse(cleaned);
            console.log(`[RESERVATION-PROXY] Vision parsed: available=${availabilityResult?.available} rooms=${availabilityResult?.rooms?.length}`);
          } catch {
            availabilityResult = { available: null, raw_summary: visionData.text.slice(0, 500), parse_error: true };
          }
        }
      }
    } catch (e) {
      console.error(`[RESERVATION-PROXY] Vision call failed: ${e instanceof Error ? e.message : String(e)}`);
    }

    return json(200, {
      success: true,
      phase: "check",
      stage: "reservation_check_result",
      check_in,
      check_out,
      guests,
      rooms,
      availability_result: availabilityResult,
      screenshot_base64: screenshotBase64,
      worker_result: workerResult,
      timing_ms: Date.now() - t0,
      build_id: BUILD_ID,
    });
  }

  // ── PHASE RESERVE: continue booking step-by-step ──────────────
  if (phase === "reserve") {
    const bookingUrl = safeStr(workerResult?.booking_url || "");
    const screenshotBase64 = safeStr(workerResult?.screenshot_base64);
    const observation = workerResult?.observation || {};
    const missingRequired = Array.isArray(observation?.missing_required)
      ? observation.missing_required.map((x: unknown) => safeStr(x)).filter(Boolean)
      : [];

    const needsInput =
      String(workerResult?.message || "") === "reserve_current_step_needs_input" ||
      missingRequired.length > 0;

    return json(200, {
      success: workerResp.ok && (workerResult?.ok === true || !!bookingUrl || needsInput),
      phase: "reserve",
      stage: needsInput ? "reservation_reserve_needs_input" : "reservation_reserve_result",
      needs_input: needsInput,
      missing_required: missingRequired,
      selected_room_type: room_type,
      worker_message: safeStr(workerResult?.message || ""),
      current_step: safeStr(observation?.current_step || "reserve"),
      payment_required: !!observation?.payment_required,
      can_continue: observation?.can_continue !== false,
      booking_url: bookingUrl || null,
      screenshot_base64: screenshotBase64 || null,
      message: workerResult?.message || "",
      confirmed_price,
      check_in,
      check_out,
      guests,
      room_type: room_type || null,
      worker_result: workerResult,
      timing_ms: Date.now() - t0,
      build_id: BUILD_ID,
    });
  }

  return json(400, { success: false, error: `Unknown phase: ${phase}`, build_id: BUILD_ID });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method === "GET") return json(200, { success: true, build_id: BUILD_ID });

  // ── NEW v1.14: Make Reservation endpoint ────────────────────
  if (req.method === "POST") {
    const reqPath = new URL(req.url).pathname;
    if (reqPath.endsWith("/make-reservation") || reqPath === "/make-reservation") {
      const t0 = Date.now();
      const WORKER_URL = (Deno.env.get("NEO_WORKER_URL") || "").trim();
      const WORKER_SECRET = (Deno.env.get("NEO_WORKER_SECRET") || "").trim();
      const DEFAULT_TIMEOUT_MS = Number(Deno.env.get("NEO_WORKER_TIMEOUT_MS") || "90000");
      const PREPARE_TIMEOUT_MS = Number(Deno.env.get("NEO_WORKER_PREPARE_TIMEOUT_MS") || String(DEFAULT_TIMEOUT_MS));
      const FILL_TIMEOUT_MS    = Number(Deno.env.get("NEO_WORKER_FILL_TIMEOUT_MS") || String(DEFAULT_TIMEOUT_MS));

      const body = await req.json().catch(() => ({}));
      const trace_id = traceIdFrom(body);

      console.log(`[RESERVATION-ENTRY] trace=${trace_id} path=${reqPath}`);
      console.log(`[RESERVATION-ENTRY] trace=${trace_id} body=${safeJson(body, 2000)}`);
      console.log(`[RESERVATION-ENTRY] trace=${trace_id} worker_url=${WORKER_URL ? "set" : "missing"} worker_secret=${WORKER_SECRET ? "set" : "missing"}`);

      if (!WORKER_URL || !WORKER_SECRET) {
        console.error(`[RESERVATION-ENTRY] trace=${trace_id} missing worker env`);
        return json(500, { success: false, error: "Worker env missing", trace_id, build_id: BUILD_ID });
      }

      if (!safeStr(body?.session_id) || !safeStr(body?.phase)) {
        console.error(
          `[RESERVATION-ENTRY] trace=${trace_id} rejected missing session_id/phase session_id=${safeStr(body?.session_id)} phase=${safeStr(body?.phase)}`
        );
        return json(400, {
          success: false,
          error: "Missing session_id or phase",
          trace_id,
          build_id: BUILD_ID
        });
      }

      return handleMakeReservation({ t0, body: { ...body, trace_id }, WORKER_URL, WORKER_SECRET, PREPARE_TIMEOUT_MS, FILL_TIMEOUT_MS });
    }
  }

  // ── NEW v1.12: Gemini Vision proxy endpoint ─────────────────
  if (req.method === "POST") {
    const reqPath = new URL(req.url).pathname;
    if (reqPath.endsWith("/gemini-vision") || reqPath === "/gemini-vision") {
      return handleGeminiVision(req);
    }
  }

  const t0 = Date.now();

  try {
    const WORKER_URL = (Deno.env.get("NEO_WORKER_URL") || "").trim();
    const WORKER_SECRET = (Deno.env.get("NEO_WORKER_SECRET") || "").trim();
    const DEFAULT_TIMEOUT_MS = Number(Deno.env.get("NEO_WORKER_TIMEOUT_MS") || "60000");
    const PREPARE_TIMEOUT_MS = Number(Deno.env.get("NEO_WORKER_PREPARE_TIMEOUT_MS") || String(DEFAULT_TIMEOUT_MS));
    const FILL_TIMEOUT_MS    = Number(Deno.env.get("NEO_WORKER_FILL_TIMEOUT_MS")    || String(DEFAULT_TIMEOUT_MS));

    if (!WORKER_URL || !WORKER_SECRET) {
      return json(500, { success: false, error: "Worker env missing", build_id: BUILD_ID });
    }

    const body = await req.json().catch(() => ({}));
    if (safeStr(body?.type) !== "action_request" || safeStr(body?.action) !== "submit_form") {
      return json(400, { success: false, error: "Invalid action payload", build_id: BUILD_ID });
    }

    const session_id  = safeStr(body?.session_id);
    const form_id     = safeStr(body?.form_id);
    const fingerprint = safeStr(body?.fingerprint);
    const payloadUrl  = safeStr(body?.site_url || body?.url || body?.siteUrl).trim();

    let fields: Record<string, unknown> = isObject(body?.fields) ? (body.fields as any) : {};
    const confirmed: Record<string, unknown> | undefined = isNonEmptyObject(body?.confirmed) ? (body.confirmed as any) : undefined;
    const strict_select = body?.strict_select === false ? false : true;

    // ── Kind detection — теперь поддержка availability ──────
    let kind = safeStr(body?.kind).trim().toLowerCase();
    if (!["wizard","form","availability"].includes(kind)) kind = "";
    const dbKind = await loadKindForForm(session_id, form_id || undefined, fingerprint || undefined);
    if (dbKind) kind = dbKind;
    if (!["wizard","form","availability"].includes(kind)) kind = "form";

    if (!session_id || (!form_id && !fingerprint)) {
      return json(400, { success: false, error: "Missing session_id/form_id-or-fingerprint", build_id: BUILD_ID });
    }

    // ═══════════════════════════════════════════════════════════════
    // AVAILABILITY BRANCH — kind=availability: check dates, screenshot, vision parse
    // ═══════════════════════════════════════════════════════════════
    if (kind === "availability") {
      return await handleAvailabilityCheck({
        t0, session_id, form_id, fingerprint, fields, payloadUrl,
        WORKER_URL, WORKER_SECRET, PREPARE_TIMEOUT_MS, FILL_TIMEOUT_MS,
      });
    }
    // ═══════════════════════════════════════════════════════════════

    // Wizard label remapping
    if (kind === "wizard") {
      const schema = await loadFormSchema(session_id, form_id || undefined, fingerprint || undefined);
      if (schema) fields = mapWizardDataByLabels(schema, fields);
    }

    const fillPayload: any = {
      session_id, site_id: session_id,
      form_id: form_id || undefined,
      fingerprint: fingerprint || undefined,
      kind, data: fields, confirmed,
      auto_submit: body?.auto_submit !== false,
      strict_select,
    };

    let fill = await callWorkerWithRetryOnAbort(WORKER_URL, WORKER_SECRET, "/fill-form", fillPayload, FILL_TIMEOUT_MS);

    if (fill.ok && looksLikeNoActiveSession(fill.result)) {
      let siteMap = await loadSiteMapForSession(session_id);
      if (!siteMap) {
        const u = await loadMinimalUrl(session_id, form_id || undefined, fingerprint || undefined);
        const url = (u?.url || payloadUrl).trim();
        if (!url) {
          return json(200, { success: false, error: "Worker has no active session AND no url found", stage: "prepare_input_missing", timing_ms: Date.now()-t0, worker_status: fill.status, worker_result: fill.result, build_id: BUILD_ID });
        }
        siteMap = buildMinimalSiteMap(session_id, url);
        (siteMap as any).source = u?.source || (payloadUrl ? "payload" : "unknown");
      }

      const prepPayload = { site_id: session_id, session_id, site_map: siteMap };
      const prep = await callWorkerWithRetryOnAbort(WORKER_URL, WORKER_SECRET, "/prepare-session", prepPayload, PREPARE_TIMEOUT_MS);
      const prepOk = prep.ok && prep.result?.success === true;
      if (!prepOk) {
        return json(200, { success: false, error: "Auto prepare-session failed", stage: "prepare_failed", timing_ms: Date.now()-t0, prepare_status: prep.status, prepare_result: prep.result, prepare_retried: prep.retried, worker_status: fill.status, worker_result: fill.result, worker_retried: fill.retried, build_id: BUILD_ID });
      }
      fill = await callWorkerWithRetryOnAbort(WORKER_URL, WORKER_SECRET, "/fill-form", fillPayload, FILL_TIMEOUT_MS);
    }

    const workerOk = fill.ok && fill.result?.success === true;
    console.log(`[PROXY] workerOk=${workerOk} fill.ok=${fill.ok} fill.result?.success=${fill.result?.success}`);

    if (workerOk) {
      console.log(`[POST-SUBMIT-EMAIL] TRIGGERED session=${session_id}`);
      sendPostSubmitEmails(session_id, fields).catch((e) => console.error("[POST-SUBMIT-EMAIL] bg error:", e));
    } else {
      console.log(`[POST-SUBMIT-EMAIL] SKIPPED — workerOk=${workerOk}`);
    }

    let missing_required = normalizeMissingRequired(fill.result);
    const extracted = extractNeedsInput(fill.result);
    const needs_input = extracted.needs_input || missing_required.length > 0;
    const next = extracted.next;
    const observation = extracted.observation;

    if (next && Array.isArray((next as any)?.missing_required) && (next as any).missing_required.length > 0) {
      const nextMissing = (next as any).missing_required as Array<{ label?: string; type?: string; options?: any[] }>;
      const nextMissingLabels = nextMissing.map((m) => { const label=safeStr(m?.label).trim(); if (!label) return ""; const opts=Array.isArray(m?.options)?m.options.map((o:any)=>safeStr(o?.label||o?.value||o?.text).trim()).filter(Boolean):[]; const type=safeStr(m?.type).trim(); if (opts.length>0) return `${label} (избор: ${opts.join(" / ")})`; if (type==="button_group") return label; return label; }).filter(Boolean);
      for (const lbl of nextMissingLabels) { if (!missing_required.some((m)=>m===lbl||lbl.startsWith(m)||m.startsWith(lbl))) missing_required.push(lbl); }
    }

    return json(200, {
      success: workerOk || needs_input,
      submitted: workerOk,
      email_notifications: workerOk ? "sent" : "not_applicable",
      stage: needs_input ? "needs_input" : "fill_done",
      kind, needs_input, missing_required, next, observation,
      timing_ms: Date.now()-t0,
      worker_status: fill.status,
      worker_result: fill.result,
      worker_retried: fill.retried,
      build_id: BUILD_ID,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const isAbort = msg.toLowerCase().includes("aborted");
    return json(500, { success: false, error: msg, stage: isAbort?"timeout_abort":"proxy_exception", timing_ms: Date.now()-t0, build_id: BUILD_ID });
  }
});