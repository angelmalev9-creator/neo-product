import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const BUILD_ID = "store-scrape-results_v1.16_booking_semantics_guardrails_2026-03-08";

const corsHeaders = {
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

function safeString(x: unknown) {
  return typeof x === "string" ? x : "";
}

function domainFromUrl(u: string) {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function filterPagesToSiteDomain(pages: any[], siteUrl: string) {
  const siteDomain = domainFromUrl(siteUrl);
  if (!siteDomain) return Array.isArray(pages) ? pages : [];
  const out: any[] = [];
  for (const p of Array.isArray(pages) ? pages : []) {
    const url = safeString(p?.url || p?.page_url || "").trim();
    if (!url) {
      // if crawler didn’t provide url, we keep it (best-effort)
      out.push(p);
      continue;
    }
    const d = domainFromUrl(url);
    if (!d || d === siteDomain) out.push(p);
  }
  return out;
}

function resolveServiceKey(): {
  key: string;
  source: "NEO_SERVICE_ROLE_KEY" | "SUPABASE_SERVICE_ROLE_KEY" | "missing";
} {
  const neo = Deno.env.get("NEO_SERVICE_ROLE_KEY") || "";
  if (neo) return { key: neo, source: "NEO_SERVICE_ROLE_KEY" };

  const supa = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (supa) return { key: supa, source: "SUPABASE_SERVICE_ROLE_KEY" };

  return { key: "", source: "missing" };
}

/**
 * Service-role guard:
 * Accept ONLY service role key, via:
 * - Authorization: Bearer <SERVICE_KEY>
 * - apikey: <SERVICE_KEY>
 */
function assertServiceRole(req: Request) {
  const resolved = resolveServiceKey();
  const serviceKey = resolved.key;

  const auth = req.headers.get("authorization") || "";
  const apikey = req.headers.get("apikey") || "";

  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  const ok = (bearer && bearer === serviceKey) || (apikey && apikey === serviceKey);

  if (!ok) {
    return {
      ok: false as const,
      reason: "Unauthorized: service role required",
      debug: {
        expectedKeySource: resolved.source,
        hasAuthorizationHeader: !!auth,
        hasApikeyHeader: !!apikey,
        bearerLooksLikeJwt: bearer.includes("."),
      },
    };
  }

  return { ok: true as const, source: resolved.source };
}

type CapabilityIn = {
  url?: string;
  domain?: string;
  kind?: string;
  fingerprint?: string;
  schema?: unknown;
  dom_snapshot?: string | null;
  [k: string]: unknown;
};

function isVideoEmbedUrl(u: string) {
  try {
    const host = new URL(u).hostname.replace(/^www\./, "");
    return (
      host === "player.vimeo.com" ||
      host === "vimeo.com" ||
      host === "youtube.com" ||
      host === "www.youtube.com" ||
      host === "youtu.be"
    );
  } catch {
    return false;
  }
}

const AI_WIDGET_HOSTS = new Set([
  "neo-assistant.com",
  "app.neo-assistant.com",
  "tidio.com",
  "tidiochat.com",
  "intercom.io",
  "widget.intercom.io",
  "js.intercomcdn.com",
  "crisp.chat",
  "client.crisp.chat",
  "embed.tawk.to",
  "tawk.to",
  "chat.openai.com",
  "chatbot.com",
  "landbot.io",
  "chatra.io",
  "drift.com",
  "js.driftt.com",
  "widget.drift.com",
  "embed.small.chat",
  "smallchat.io",
  "app.chatfuel.com",
  "manychat.com",
  "widget.manychat.com",
]);

function isAiWidgetUrl(u: string) {
  try {
    const host = new URL(u).hostname.replace(/^www\./, "");
    if (AI_WIDGET_HOSTS.has(host)) return true;
    for (const blocked of AI_WIDGET_HOSTS) {
      if (host.endsWith("." + blocked)) return true;
    }
    return false;
  } catch {
    return false;
  }
}

const BOOKING_WIDGET_HOSTS = new Set([
  "calendly.com",
  "app.calendly.com",
  "assets.calendly.com",
  "clockpms.com",
  "app.clockpms.com",
  "simplybook.me",
  "app.simplybook.me",
  "appointlet.com",
  "app.appointlet.com",
  "acuityscheduling.com",
  "squareup.com",
  "booksy.com",
  "vagaro.com",
  "mindbodyonline.com",
  "fresha.com",
  "treatwell.com",
  "setmore.com",
  "youcanbook.me",
  "oncehub.com",
  "doodle.com",
  "meetings.hubspot.com",
]);

function classifyKind(url: string, rawKind: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (BOOKING_WIDGET_HOSTS.has(host)) return "booking_widget";
    for (const h of BOOKING_WIDGET_HOSTS) {
      if (host.endsWith("." + h)) return "booking_widget";
    }
    if (rawKind === "booking_widget") return "skip";
    return rawKind || "unknown";
  } catch {
    return rawKind || "unknown";
  }
}

function clampText(s: string, max: number) {
  if (!s) return "";
  return s.length <= max ? s : s.slice(0, max) + "…";
}

function normalizeCapabilities(
  raw: unknown,
  fallbackSiteUrl: string,
): Array<{
  url: string;
  domain: string;
  kind: string;
  fingerprint: string;
  schema: any;
  dom_snapshot: string | null;
}> {
  const arr = Array.isArray(raw) ? raw : [];
  const out: any[] = [];

  for (const item of arr) {
    const c = (item || {}) as CapabilityIn;

    const url = safeString(c.url || "").trim();
    if (!url) continue;

    if (isVideoEmbedUrl(url)) continue;
    if (isAiWidgetUrl(url)) continue;

    const rawKind = safeString(c.kind || "").trim() || "unknown";
    const kind = classifyKind(url, rawKind);
    if (kind === "skip") continue;

    const fp =
      safeString(c.fingerprint || "").trim() ||
      safeString((c as any).fp || "").trim() ||
      safeString((c as any).hash || "").trim();

    let schema: any = c.schema ?? null;
    if (!schema || typeof schema !== "object") {
      schema = { ...c };
      delete schema.schema;
    }

    if (!fp) continue;

    const domain = safeString(c.domain || "").trim() || domainFromUrl(url) || domainFromUrl(fallbackSiteUrl) || "";

    out.push({
      url,
      domain,
      kind,
      fingerprint: fp,
      schema,
      dom_snapshot: c.dom_snapshot ? clampText(safeString(c.dom_snapshot), 8000) : null,
    });
  }

  return out;
}

// ===== Contacts extraction =====
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_CANDIDATE_RE = /(\+?\d[\d\s().-]{6,}\d)/g;
const DATE_DOT_RE = /\b\d{1,2}\.\d{1,2}\.\d{4}\b/;
const MAPS_RE = /\bhttps?:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.google\.[a-z.]+)\/[^\s<>"']+/gi;

function normalizePhone(raw: string) {
  const s = String(raw || "").trim();
  if (!s) return "";
  if (DATE_DOT_RE.test(s)) return "";
  const hasPlus = s.startsWith("+");
  const digits = s.replace(/[^\d]/g, "");
  if (digits.length < 8 || digits.length > 15) return "";
  return hasPlus ? `+${digits}` : digits;
}

function normalizeLine(s: string) {
  return String(s || "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[•|]+/g, " ")
    .trim();
}

function splitTextLines(text: string) {
  return String(text || "")
    .split(/\n+/g)
    .map((x) => normalizeLine(x))
    .filter(Boolean);
}

function extractContactsFromText(text: string) {
  const emails = (text.match(EMAIL_RE) || []).map((x) => x.trim()).filter(Boolean);
  const phonesRaw: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = PHONE_CANDIDATE_RE.exec(text)) !== null) phonesRaw.push(m[1]);
  const phones = phonesRaw.map(normalizePhone).filter(Boolean);
  return {
    emails: Array.from(new Set(emails)).slice(0, 30),
    phones: Array.from(new Set(phones)).slice(0, 30),
  };
}

function extractAddressesFromText(text: string) {
  const lines = splitTextLines(text);
  const out: string[] = [];

  for (const ln of lines) {
    const l = ln.toLowerCase();
    if (l.startsWith("адрес") || l.includes("адрес:") || l.includes("адрес -")) {
      const cleaned = ln.replace(/^\s*адрес\s*[:\-]?\s*/i, "").trim();
      if (cleaned.length >= 10 && cleaned.length <= 320) out.push(cleaned);
    }
  }

  const marker = /\b(ул\.|бул\.|жк|кв\.|гр\.|пл\.|булевард|улица)\b/i;
  for (const ln of lines) {
    if (marker.test(ln)) {
      if (ln.length >= 10 && ln.length <= 320) out.push(ln);
    }
  }

  const maps = text.match(MAPS_RE) || [];
  for (const u of maps) out.push(u.trim());

  return Array.from(new Set(out)).slice(0, 30);
}

function extractContactsFromPages(pages: any[]) {
  const emailSet = new Set<string>();
  const phoneSet = new Set<string>();
  const addressSet = new Set<string>();

  for (const p of pages || []) {
    const contacts = (p?.structured?.contacts || p?.structured?.contact || null) as any;
    if (contacts?.emails?.length) contacts.emails.forEach((e: any) => emailSet.add(String(e).trim()));
    if (contacts?.phones?.length)
      contacts.phones.forEach((ph: any) => {
        const n = normalizePhone(String(ph));
        if (n) phoneSet.add(n);
      });
    if (contacts?.addresses?.length) contacts.addresses.forEach((a: any) => addressSet.add(normalizeLine(String(a))));

    const content = safeString(p?.content || "");
    if (content) {
      const c = extractContactsFromText(content);
      c.emails.forEach((e) => emailSet.add(e));
      c.phones.forEach((ph) => phoneSet.add(ph));

      const addrs = extractAddressesFromText(content);
      addrs.forEach((a) => addressSet.add(normalizeLine(a)));
    }
  }

  return {
    emails: Array.from(emailSet).filter(Boolean),
    phones: Array.from(phoneSet).filter(Boolean),
    addresses: Array.from(addressSet).filter(Boolean),
  };
}

// ===== Summary = cleaned scraped_content =====
const DROP_LINE_PATTERNS: RegExp[] = [
  /cookies?/i,
  /политика\s+за\s+поверителност/i,
  /privacy\s+policy/i,
  /terms?\s+of\s+service/i,
  /условия/i,
  /copyright/i,
  /all\s+rights\s+reserved/i,
  /запазени\s+права/i,
  /настройки\s+на\s+бисквит/i,
  /accept\s+all/i,
  /reject\s+all/i,
  /menu\b/i,
  /\bменю\b/i,
  /начало\b/i,
  /home\b/i,
];

function shouldDropLine(line: string) {
  const ln = normalizeLine(line);
  if (!ln) return true;
  if (ln.length <= 2) return true;
  if (ln.length > 420) return true;
  for (const re of DROP_LINE_PATTERNS) {
    if (re.test(ln)) return true;
  }
  return false;
}

function buildCleanedSummaryFromScrapedContent(pages: any[], siteUrl: string) {
  const out: string[] = [];

  const headerParts: string[] = [];
  if (siteUrl) headerParts.push(`Сайт: ${siteUrl}`);
  const dom = siteUrl ? domainFromUrl(siteUrl) : "";
  if (dom) headerParts.push(`Домейн: ${dom}`);
  if (headerParts.length) out.push(headerParts.join(" | "));
  out.push("");

  const seen = new Set<string>();

  for (const p of pages || []) {
    const url = safeString(p?.url || p?.page_url || "").trim();
    const title = safeString(p?.title || p?.page_title || "").trim();
    const content = safeString(p?.content || "");

    if (!content) continue;

    const pageHead: string[] = [];
    if (title) pageHead.push(title);
    if (url) pageHead.push(url);
    if (pageHead.length) out.push(`=== ${pageHead.join(" — ")} ===`);

    const lines = splitTextLines(content);

    for (const ln of lines) {
      const cleaned = normalizeLine(ln);
      if (shouldDropLine(cleaned)) continue;

      const key = cleaned.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      out.push(cleaned);
    }

    out.push("");
  }

  while (out.length && !out[out.length - 1].trim()) out.pop();
  return out.join("\n").trim();
}

function appendContactsToSummary(
  summary: string,
  contacts: { emails: string[]; phones: string[]; addresses: string[] },
) {
  const s = (summary || "").trim();
  const hasAny =
    (contacts.emails?.length || 0) > 0 || (contacts.phones?.length || 0) > 0 || (contacts.addresses?.length || 0) > 0;
  if (!hasAny) return s;

  const parts: string[] = [];
  if (contacts.addresses.length) parts.push(`Адрес: ${contacts.addresses.join(" | ")}`);
  if (contacts.phones.length) parts.push(`Телефон: ${contacts.phones.join(", ")}`);
  if (contacts.emails.length) parts.push(`Имейл: ${contacts.emails.join(", ")}`);

  const block = `КОНТАКТИ: ${parts.join(" | ")}`;
  if (!s) return block;
  if (s.includes("КОНТАКТИ:")) return s;
  return `${s}\n\n${block}`;
}

// ===== Forms block in summary (deterministic) =====
type FieldDescriptor = { key: string; required: boolean };

function extractFieldDescriptors(schema: any): FieldDescriptor[] {
  const out: FieldDescriptor[] = [];
  const seen = new Set<string>();

  const push = (keyRaw: string, required: boolean) => {
    const key = safeString(keyRaw).trim();
    if (!key) return;
    const norm = key.toLowerCase();
    if (seen.has(norm)) return;
    seen.add(norm);
    out.push({ key, required });
  };

  const visit = (node: any) => {
    if (!node || typeof node !== "object") return;

    const arrays: any[] = [];
    if (Array.isArray(node.fields)) arrays.push(node.fields);
    if (Array.isArray(node.inputs)) arrays.push(node.inputs);
    if (Array.isArray(node.elements)) arrays.push(node.elements);

    for (const arr of arrays) {
      for (const it of arr) {
        if (!it || typeof it !== "object") continue;
        const name = safeString(it.name) || safeString(it.id) || safeString(it.key) || safeString(it.label) || "";
        const required = Boolean(it.required || it.isRequired);
        push(name, required);
      }
    }

    for (const k of Object.keys(node)) {
      const v = node[k];
      if (v && typeof v === "object") visit(v);
    }
  };

  visit(schema);
  return out.slice(0, 30);
}

function pageTextForSemantics(page: any) {
  return [
    safeString(page?.title || page?.page_title || ""),
    safeString(page?.url || page?.page_url || ""),
    safeString(page?.content || ""),
  ]
    .filter(Boolean)
    .join("\n");
}

function detectAccommodationSignals(pages: any[]) {
  const joined = (pages || []).map(pageTextForSemantics).join("\n\n").toLowerCase();
  const reasons: string[] = [];
  let score = 0;

  const hit = (re: RegExp, pts: number, reason: string) => {
    if (re.test(joined)) {
      score += pts;
      reasons.push(reason);
    }
  };

  hit(
    /hotel|хотел|guest\s*house|къща\s*за\s*гости|villa|вила|apartment|апартамент/i,
    3,
    "accommodation brand wording detected",
  );
  hit(
    /room|rooms|стая|стаи|семеен апартамент|studio|студио|apartament|апартамент/i,
    2,
    "room inventory wording detected",
  );
  hit(/настаняване|accommodation|check\s*-?in|check\s*-?out|пристигане|напускане/i, 2, "stay period wording detected");
  hit(
    /online\s+reservation|онлайн\s+резервац|директн[аи]?\s+резервац|book\s+now|reserve/i,
    3,
    "direct booking wording detected",
  );
  hit(
    /възрастни|adults?|деца|children|брой\s+нощувк|нощувк|price\s+per\s+night|цена\s+за\s+нощувка/i,
    2,
    "guest and night pricing wording detected",
  );
  hit(
    /плащане\s+с\s+карта|bank transfer|банков\s+превод|credit\s+card|debit\s+card|карта/i,
    1,
    "payment wording detected",
  );

  return { score, reasons, isAccommodation: score >= 5, joined };
}

function buildProfiles(pages: any[], caps: Array<{ kind: string; schema: any }>, siteUrl: string) {
  const capCounts = {
    form: caps.filter((c) => c.kind === "form").length,
    wizard: caps.filter((c) => c.kind === "wizard").length,
    availability: caps.filter((c) => c.kind === "availability").length,
    booking_widget: caps.filter((c) => c.kind === "booking_widget").length,
  };

  const semantic = detectAccommodationSignals(pages);
  const canSubmitForms = capCounts.form > 0 || capCounts.wizard > 0;
  const canCheckAvailability = capCounts.availability > 0;

  let siteType =
    canCheckAvailability || capCounts.booking_widget > 0
      ? "booking"
      : semantic.isAccommodation
        ? "booking"
        : canSubmitForms
          ? "lead_gen"
          : "general_business";
  let bookingMode = "none";
  const reasons: string[] = [];

  if (capCounts.availability > 0) {
    bookingMode = /плащане\s+с\s+карта|credit\s+card|debit\s+card|банков\s+превод/i.test(semantic.joined)
      ? "payment_required"
      : "availability_only";
    reasons.push(`availability capabilities: ${capCounts.availability}`);
  } else if (semantic.isAccommodation) {
    bookingMode = /плащане\s+с\s+карта|credit\s+card|debit\s+card|банков\s+превод/i.test(semantic.joined)
      ? "payment_required"
      : "unknown";
    reasons.push(...semantic.reasons);
  } else if (canSubmitForms) {
    reasons.push("lead-gen signal detected");
  }

  if (siteType === "general_business" && canSubmitForms) siteType = "lead_gen";
  if (siteType === "booking" && canSubmitForms && !canCheckAvailability) siteType = "hybrid";
  if (!reasons.length && siteType === "general_business") reasons.push("general site signal detected");

  const confidence =
    siteType === "booking" || siteType === "hybrid"
      ? Math.min(0.95, 0.55 + semantic.score * 0.05 + capCounts.availability * 0.08 + capCounts.booking_widget * 0.04)
      : canSubmitForms
        ? 0.75
        : 0.6;

  const site_profile = {
    primary_mode: siteType,
    secondary_modes: [],
    confidence,
  };

  const action_profile = {
    can_answer_questions: true,
    can_submit_forms: canSubmitForms,
    can_check_availability: canCheckAvailability,
    can_submit_booking_inquiry: canSubmitForms && (siteType === "booking" || siteType === "hybrid"),
    can_complete_direct_booking: false,
  };

  const booking_profile = {
    mode: bookingMode,
    ui_type:
      capCounts.booking_widget > 0 ? "iframe_or_widget" : capCounts.availability > 0 ? "inline_or_native" : "unknown",
    fields: {
      check_in: /check\s*-?in|пристигане|настаняване/i.test(semantic.joined),
      check_out: /check\s*-?out|напускане|заминаване/i.test(semantic.joined),
      adults: /възрастни|adults?/i.test(semantic.joined),
      children: /деца|children/i.test(semantic.joined),
      rooms: /rooms?|стаи?/i.test(semantic.joined),
    },
    reasons,
    confidence,
    entry_points: [],
    vendor_signals: [],
    capability_counts: capCounts,
  };

  const business_detection = {
    reasons,
    site_type: siteType,
    confidence,
    source_url: siteUrl,
    booking_mode: bookingMode,
    generated_by: BUILD_ID,
    can_submit_forms: canSubmitForms,
    can_check_availability: canCheckAvailability,
  };

  return { site_profile, action_profile, booking_profile, business_detection };
}

function appendExecutionProfileToSummary(summary: string, profiles: ReturnType<typeof buildProfiles>) {
  const s = (summary || "").trim();
  const lines = [
    "EXECUTION PROFILE:",
    `- site_type: ${profiles.business_detection.site_type}`,
    `- booking_mode: ${profiles.business_detection.booking_mode}`,
    `- can_submit_forms: ${profiles.action_profile.can_submit_forms}`,
    `- can_check_availability: ${profiles.action_profile.can_check_availability}`,
  ];
  const block = lines.join("\n");
  if (!s) return block;
  if (s.includes("EXECUTION PROFILE:")) return s;
  return `${s}

${block}`;
}

function appendFormsToSummary(
  summary: string,
  caps: Array<{ url: string; kind: string; fingerprint: string; schema: any }>,
) {
  const s = (summary || "").trim();
  if (!caps?.length) return s;
  if (s.includes("ФОРМИ/ДЕЙСТВИЯ")) return s;

  const lines: string[] = [];
  lines.push("ФОРМИ/ДЕЙСТВИЯ (детерминистично открити):");

  const sorted = [...caps].sort(
    (a, b) => (a.url || "").localeCompare(b.url || "") || (a.kind || "").localeCompare(b.kind || ""),
  );

  for (const c of sorted) {
    const fields = extractFieldDescriptors(c.schema);
    const req = fields.filter((f) => f.required).map((f) => f.key);
    const opt = fields.filter((f) => !f.required).map((f) => f.key);

    lines.push(`- ${c.kind} @ ${c.url}`);
    if (req.length) lines.push(`  • задължителни: ${req.join(", ")}`);
    if (opt.length) lines.push(`  • други: ${opt.join(", ")}`);
    if (!req.length && !opt.length) lines.push("  • полета: (неразпознати)");
  }

  const block = lines.join("\n");
  return s ? `${s}\n\n${block}` : block;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.method === "GET") {
    return json(200, { success: true, build_id: BUILD_ID });
  }

  if (req.method !== "POST") return json(405, { success: false, error: "Method not allowed", build_id: BUILD_ID });

  const guard = assertServiceRole(req);
  if (!guard.ok) {
    return json(401, {
      success: false,
      error: (guard as any).reason,
      debug: (guard as any).debug,
      build_id: BUILD_ID,
    });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const resolved = resolveServiceKey();
    const SERVICE_ROLE = resolved.key;

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const body = await req.json().catch(() => ({}));

    const sessionId = safeString(body?.sessionId).trim();
    const siteUrl = safeString(body?.siteUrl).trim();
    const pages = Array.isArray(body?.pages) ? body.pages : [];
    const structuredIn =
      body?.structured_data && typeof body.structured_data === "object" ? body.structured_data : null;
    const capabilitiesRaw = body?.capabilities;

    if (!sessionId) return json(400, { success: false, error: "Missing sessionId", build_id: BUILD_ID });

    // ✅ Filter pages to site domain (prevents mixed-site contamination)
    const pagesFiltered = filterPagesToSiteDomain(pages, siteUrl);

    const contacts = extractContactsFromPages(pagesFiltered);

    // ✅ summary is cleaned scraped_content (deterministic)
    let summary = buildCleanedSummaryFromScrapedContent(pagesFiltered, siteUrl);

    summary = appendContactsToSummary(summary, contacts);

    const caps = normalizeCapabilities(capabilitiesRaw, siteUrl);
    summary = appendFormsToSummary(summary, caps);

    const profiles = buildProfiles(pagesFiltered, caps, siteUrl);
    summary = appendExecutionProfileToSummary(summary, profiles);

    const structured_data: any = structuredIn && typeof structuredIn === "object" ? structuredIn : {};
    if (!structured_data.global_facts || typeof structured_data.global_facts !== "object") {
      structured_data.global_facts = {};
    }
    const gf = structured_data.global_facts;
    const existingEmails = Array.isArray(gf.emails) ? gf.emails.map(String) : [];
    const existingPhones = Array.isArray(gf.phones) ? gf.phones.map(String) : [];
    const existingAddresses = Array.isArray(gf.addresses) ? gf.addresses.map(String) : [];

    gf.emails = Array.from(new Set([...existingEmails, ...contacts.emails])).slice(0, 50);
    gf.phones = Array.from(new Set([...existingPhones, ...contacts.phones])).slice(0, 50);
    gf.addresses = Array.from(new Set([...existingAddresses, ...contacts.addresses])).slice(0, 50);

    structured_data.site_profile = profiles.site_profile;
    structured_data.action_profile = profiles.action_profile;
    structured_data.booking_profile = profiles.booking_profile;
    structured_data.capability_overview = {
      total: caps.length,
      by_kind: profiles.booking_profile.capability_counts,
      generated_by: BUILD_ID,
    };

    const { error: updErr } = await supabase
      .from("demo_sessions")
      .update({
        url: siteUrl || null,
        scraped_content: pages,
        summary: summary || null,
        structured_data: structured_data || null,
        business_detection: profiles.business_detection,
        status: "ready",
        error_message: null,
      })
      .eq("id", sessionId);

    if (updErr) {
      return json(500, {
        success: false,
        error: "demo_sessions update failed",
        details: updErr.message,
        build_id: BUILD_ID,
      });
    }

    let upserted = 0;

    if (caps.length > 0) {
      const rows = caps.map((c) => ({
        session_id: sessionId,
        url: c.url,
        domain: c.domain,
        kind: c.kind,
        fingerprint: c.fingerprint,
        schema: c.schema,
        dom_snapshot: c.dom_snapshot,
      }));

      const { error: upErr } = await supabase.from("form_schemas").upsert(rows, {
        onConflict: "session_id,url,kind,fingerprint",
        ignoreDuplicates: false,
      });

      if (upErr) {
        return json(200, {
          success: true,
          build_id: BUILD_ID,
          demo_sessions: { updated: true },
          summary_chars: summary.length,
          form_schemas: {
            received: Array.isArray(capabilitiesRaw) ? capabilitiesRaw.length : 0,
            normalized: caps.length,
            upserted: 0,
            error: upErr.message,
          },
          warning: "form_schemas upsert failed (demo_sessions still updated)",
        });
      }

      upserted = rows.length;
    }

    return json(200, {
      success: true,
      build_id: BUILD_ID,
      demo_sessions: { updated: true },
      summary_chars: summary.length,
      form_schemas: {
        received: Array.isArray(capabilitiesRaw) ? capabilitiesRaw.length : 0,
        normalized: caps.length,
        upserted,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json(500, { success: false, error: msg, build_id: BUILD_ID });
  }
});
