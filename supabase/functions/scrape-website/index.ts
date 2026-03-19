import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BUILD_ID = "scrape-website_v3.7_caps_fallback_site_capabilities_2026-02-24";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FETCH_TIMEOUT_MS = 120_000;
const MAX_ATTEMPTS = 30;
const POLL_DELAY_MS = 3_000;

type DebugEvent = {
  t: string;
  step: string;
  data?: Record<string, unknown>;
};

function nowISO() {
  return new Date().toISOString();
}

function sanitize(s: string, max = 500) {
  const out = String(s ?? "");
  return out.length > max ? out.slice(0, max) + "…" : out;
}

function stripControlChars(s: string): string {
  return s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

function cleanContent(raw: string): string {
  if (!raw) return "";
  let s = stripControlChars(String(raw)).replace(/\r/g, "");

  s = s
    .replace(/===\s*HTML_CONTENT_START\s*===/gi, "")
    .replace(/===\s*HTML_CONTENT_END\s*===/gi, "")
    .replace(/===\s*OCR_CONTENT_START\s*===/gi, "")
    .replace(/===\s*OCR_CONTENT_END\s*===/gi, "");

  s = s
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trimEnd())
    .join("\n");

  s = s.replace(/\n{3,}/g, "\n\n").trim();

  return s;
}

function extractKeywords(text: string): string[] {
  const tokens = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((w) => w.length >= 4);

  const freq: Record<string, number> = {};
  for (const t of tokens) freq[t] = (freq[t] || 0) + 1;

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 14)
    .map(([w]) => w);
}

function buildChunks(cleanText: string, url: string, title: string, pageIndex: number) {
  const parts = cleanText
    .split(/\n{2,}|(?<=[\.\!\?])\s+/)
    .map((x) => x.trim())
    .filter(Boolean);

  const chunks: any[] = [];
  let buf = "";
  let chunkIndex = 0;

  const flush = () => {
    const t = buf.trim();
    if (t.length >= 80) {
      chunks.push({
        id: `p${pageIndex}_c${chunkIndex}`,
        url,
        title,
        section: "",
        text: t,
        keywords: extractKeywords(t),
        char_len: t.length,
      });
      chunkIndex++;
    }
    buf = "";
  };

  for (const p of parts) {
    const next = (buf ? buf + "\n" : "") + p;
    if (next.length <= 1600) {
      buf = next;
      continue;
    }
    flush();
    buf = p;

    if (buf.length > 1800) {
      const hard = buf;
      buf = "";
      for (let i = 0; i < hard.length; i += 1600) {
        const slice = hard.slice(i, i + 1600).trim();
        if (slice.length >= 80) {
          chunks.push({
            id: `p${pageIndex}_c${chunkIndex}`,
            url,
            title,
            section: "",
            text: slice,
            keywords: extractKeywords(slice),
            char_len: slice.length,
          });
          chunkIndex++;
        }
      }
    }
  }

  flush();
  return chunks;
}

function uniq(arr: string[]) {
  return Array.from(new Set(arr.map((x) => x.trim()).filter(Boolean)));
}

function extractEmails(text: string) {
  const re = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  return uniq(text.match(re) || []);
}

function extractPhones(text: string) {
  const re = /(\+?\d[\d\s().-]{6,}\d)/g;
  const raw = (text.match(re) || []).map((x) => x.replace(/\s+/g, " ").trim());
  return uniq(raw.filter((p) => p.length >= 7 && p.length <= 22));
}

function extractHours(text: string) {
  const re = /(\d{1,2}:\d{2}\s*[-–]\s*\d{1,2}:\d{2})/g;
  return uniq(text.match(re) || []);
}

function extractMoney(text: string) {
  const re = /(\d{1,3}(?:[ \u00A0]\d{3})*(?:[.,]\d{1,2})?)\s*(лв\.?|leva|eur|€)/gi;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) out.push(`${m[1]} ${m[2].replace(/\.$/, "")}`);
  return uniq(out);
}

function extractPackagesAndPrices(cleanText: string) {
  const t = cleanText;
  const candidates: string[] = [];

  const packRe = /([A-ZА-Я][A-ZА-Яa-zа-я0-9\s-]{2,50})\s+(?:package|пакет)/gi;
  let m: RegExpExecArray | null;
  while ((m = packRe.exec(t)) !== null) candidates.push(m[0].trim());

  const capsRe = /\b([A-Z][A-Za-z0-9]+)\s+(Package)\b/g;
  while ((m = capsRe.exec(t)) !== null) candidates.push(`${m[1]} ${m[2]}`);

  const money = extractMoney(t);
  return { package_names: uniq(candidates).slice(0, 30), money_values: money.slice(0, 60) };
}

function extractFaqQuestions(cleanText: string) {
  const qs = cleanText
    .split("?")
    .map((x) => x.trim())
    .filter((x) => x.length >= 12)
    .map((x) => x + "?");
  return uniq(qs).slice(0, 25);
}

function buildGlobalFacts(pages: Array<{ url: string; title: string; clean_text: string }>) {
  const full = pages.map((p) => p.clean_text).join("\n\n");
  return {
    emails: extractEmails(full),
    phones: extractPhones(full),
    hours: extractHours(full),
    money: extractMoney(full),
    packages: extractPackagesAndPrices(full),
    top_topics: extractKeywords(full),
    faq_questions: extractFaqQuestions(full),
  };
}

function buildRichSummary(siteUrl: string, firstTitle: string, stats: { pages: number; chunks: number }, facts: any) {
  const domain = (() => {
    try {
      return new URL(siteUrl).hostname.replace(/^www\./, "");
    } catch {
      return siteUrl || "unknown";
    }
  })();

  const lines: string[] = [];
  lines.push(`Уебсайт: ${domain}`);
  if (firstTitle) lines.push(`Заглавие: ${firstTitle}`);
  lines.push(`URL: ${siteUrl}`);
  lines.push(`Страници: ${stats.pages}`);
  lines.push(`Инфо блокове: ${stats.chunks}`);

  if (facts?.top_topics?.length) lines.push(`Основни теми: ${facts.top_topics.slice(0, 12).join(", ")}`);

  if (facts?.packages?.package_names?.length) {
    lines.push(`Пакети/планове (имената от текста): ${facts.packages.package_names.slice(0, 12).join(", ")}`);
  }

  if (facts?.money?.length) lines.push(`Засечени цени/суми (без контекст): ${facts.money.slice(0, 14).join(", ")}`);

  if (facts?.hours?.length) lines.push(`Работно време (формати): ${facts.hours.slice(0, 6).join(", ")}`);
  if (facts?.emails?.length) lines.push(`Имейли: ${facts.emails.slice(0, 6).join(", ")}`);
  if (facts?.phones?.length) lines.push(`Телефони: ${facts.phones.slice(0, 6).join(", ")}`);
  if (facts?.faq_questions?.length)
    lines.push(`FAQ (примерни въпроси): ${facts.faq_questions.slice(0, 8).join(" | ")}`);

  lines.push(`Генерирано: ${new Date().toLocaleString("bg-BG")}`);
  return lines.join("\n");
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

serve(async (req) => {
  const debug: DebugEvent[] = [];
  const push = (step: string, data?: Record<string, unknown>) => debug.push({ t: nowISO(), step, data });

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const url = body?.url;
    const sessionId = body?.sessionId;

    push("build_id", { build_id: BUILD_ID });
    push("request_received", { hasUrl: !!url, hasSessionId: !!sessionId });

    if (!url || !sessionId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing url or sessionId", build_id: BUILD_ID, debug }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const resolved = resolveServiceKey();
    const serviceKey = resolved.key;

    const keyMeta = {
      source: resolved.source,
      startsWithEyJ: typeof serviceKey === "string" ? serviceKey.startsWith("eyJ") : false,
      len: typeof serviceKey === "string" ? serviceKey.length : 0,
    };
    push("service_key_meta", keyMeta);

    if (!supabaseUrl) {
      return new Response(
        JSON.stringify({ success: false, error: "Server misconfig: SUPABASE_URL missing", build_id: BUILD_ID, debug }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!serviceKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server misconfig: no service role key found.",
          build_id: BUILD_ID,
          debug,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    push("session_upsert_start", { sessionId });

    const { data: existing, error: existingErr } = await supabase
      .from("demo_sessions")
      .select("id")
      .eq("id", sessionId)
      .maybeSingle();

    if (existingErr) {
      push("session_lookup_error", { message: existingErr.message });
      return new Response(
        JSON.stringify({
          success: false,
          error: "Session lookup failed",
          details: existingErr.message,
          build_id: BUILD_ID,
          debug,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!existing) {
      const { error: insertErr } = await supabase
        .from("demo_sessions")
        .insert({ id: sessionId, url, status: "scraping", error_message: null });

      if (insertErr) {
        push("session_insert_error", { message: insertErr.message });
        return new Response(
          JSON.stringify({
            success: false,
            error: "Session insert failed",
            details: insertErr.message,
            build_id: BUILD_ID,
            debug,
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      push("session_inserted", { sessionId });
    } else {
      const { error: startErr } = await supabase
        .from("demo_sessions")
        .update({ status: "scraping", error_message: null })
        .eq("id", sessionId);

      if (startErr) {
        push("session_update_error", { message: startErr.message });
        return new Response(
          JSON.stringify({
            success: false,
            error: "Session status update failed",
            details: startErr.message,
            build_id: BUILD_ID,
            debug,
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      push("session_updated_scraping", { sessionId });
    }

    const crawlerUrl = "http://37.60.224.81:10000";
    push("crawler_start", { crawlerUrl });

    const crawlerPayload = { url, maxPages: 120, maxDepth: 6, followInternalLinks: true, includeSitemap: true };

    let pages: any[] = [];
    let capabilities: any[] = [];
    let capabilitiesSource: "capabilities" | "site_capabilities" | "none" = "none";
    let attempts = 0;

    while (attempts < MAX_ATTEMPTS) {
      attempts++;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      try {
        push("crawler_post_attempt", { attempts });

        const resp = await fetch(crawlerUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(crawlerPayload),
          signal: controller.signal,
        });

        const text = await resp.text();
        let json: any = null;
        try {
          json = JSON.parse(text);
        } catch {}

        push("crawler_response", { attempts, status: resp.status, ok: resp.ok, bodySnippet: sanitize(text, 400) });

        if (resp.ok && json?.success && Array.isArray(json.pages) && json.pages.length > 0) {
          pages = json.pages;

          if (Array.isArray(json.capabilities)) {
            capabilities = json.capabilities;
            capabilitiesSource = "capabilities";
          } else if (Array.isArray(json.site_capabilities)) {
            capabilities = json.site_capabilities;
            capabilitiesSource = "site_capabilities";
          } else {
            capabilities = [];
            capabilitiesSource = "none";
          }

          push("crawler_pages_ok", {
            pagesCount: pages.length,
            capabilitiesCount: capabilities.length,
            capabilitiesSource,
            cached: !!json.cached,
          });
          break;
        }

        if (resp.status === 202 || json?.status === "in_progress") {
          await new Promise((r) => setTimeout(r, POLL_DELAY_MS));
          continue;
        }

        if (resp.status === 429) {
          await new Promise((r) => setTimeout(r, POLL_DELAY_MS * 2));
          continue;
        }

        await new Promise((r) => setTimeout(r, POLL_DELAY_MS));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        push("crawler_error", { attempts, error: msg });
        await new Promise((r) => setTimeout(r, POLL_DELAY_MS));
      } finally {
        clearTimeout(timeout);
      }
    }

    if (!pages.length) {
      await supabase
        .from("demo_sessions")
        .update({ status: "error", error_message: "Crawler did not return pages in time" })
        .eq("id", sessionId);

      return new Response(
        JSON.stringify({ success: false, error: "Crawler did not return pages in time", build_id: BUILD_ID, debug }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { error: rawErr } = await supabase
      .from("demo_sessions")
      .update({ status: "processing", scraped_content: pages, error_message: null })
      .eq("id", sessionId);

    if (rawErr) {
      await supabase
        .from("demo_sessions")
        .update({ status: "error", error_message: `Raw pages write failed: ${rawErr.message}` })
        .eq("id", sessionId);

      return new Response(
        JSON.stringify({
          success: false,
          error: "Raw pages write failed",
          details: rawErr.message,
          build_id: BUILD_ID,
          debug,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    push("kb_build_start", { pagesCount: pages.length });

    const kb: any = {
      version: "kb_v2.1",
      generated_at: new Date().toISOString(),
      site: { base_url: url },
      pages: [],
      chunks: [],
      cleaned_corpus: "",
      global_facts: {},
      stats: { pages: 0, chunks: 0, total_chars_clean: 0, cleaned_corpus_chars: 0 },
    };

    let totalChars = 0;
    const corpusParts: string[] = [];

    for (let i = 0; i < pages.length; i++) {
      const p = pages[i] || {};
      const pUrl = String(p.url || "");
      const title = String(p.title || "");
      const pageType = String(p.pageType || p.page_type || "");
      const clean = cleanContent(String(p.content || ""));

      const structured = p?.structured && typeof p.structured === "object" ? p.structured : null;

      totalChars += clean.length;

      kb.pages.push({
        url: pUrl,
        title,
        page_type: pageType,
        clean_text: clean,
        structured,
      });

      kb.chunks.push(...buildChunks(clean, pUrl, title, i));

      if (clean) {
        corpusParts.push(
          [
            `=== PAGE ${i + 1}/${pages.length} ===`,
            `URL: ${pUrl}`,
            `TITLE: ${title}`,
            `TYPE: ${pageType}`,
            "",
            clean,
          ].join("\n"),
        );
      }
    }

    kb.cleaned_corpus = corpusParts.join("\n\n").trim();
    kb.stats = {
      pages: kb.pages.length,
      chunks: kb.chunks.length,
      total_chars_clean: totalChars,
      cleaned_corpus_chars: kb.cleaned_corpus.length,
    };

    kb.global_facts = buildGlobalFacts(kb.pages);

    const firstTitle = String(kb.pages?.[0]?.title || "").trim();
    const summary = buildRichSummary(
      url,
      firstTitle,
      { pages: kb.stats.pages, chunks: kb.stats.chunks },
      kb.global_facts,
    );

    push("kb_build_done", {
      pages: kb.stats.pages,
      chunks: kb.stats.chunks,
      totalChars,
      cleanedCorpusChars: kb.stats.cleaned_corpus_chars,
      capabilitiesCount: capabilities.length,
      capabilitiesSource,
    });

    const storeUrl = `${supabaseUrl}/functions/v1/store-scrape-results`;
    push("store_call_start", { storeUrl });

    const storeResp = await fetch(storeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
      },
      body: JSON.stringify({ sessionId, siteUrl: url, pages, summary, structured_data: kb, capabilities }),
    });

    const storeText = await storeResp.text();
    push("store_call_done", { ok: storeResp.ok, status: storeResp.status, bodySnippet: sanitize(storeText, 800) });

    if (!storeResp.ok) {
      await supabase
        .from("demo_sessions")
        .update({ status: "error", error_message: `Store failed: ${sanitize(storeText, 350)}` })
        .eq("id", sessionId);

      return new Response(
        JSON.stringify({
          success: false,
          error: "Store failed",
          details: sanitize(storeText, 1500),
          build_id: BUILD_ID,
          debug,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        crawlId: sessionId,
        pagesCount: pages.length,
        capabilitiesCount: capabilities.length,
        capabilitiesSource,
        status: "ready",
        summary,
        structured_data: kb,
        build_id: BUILD_ID,
        debug,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ success: false, error: msg, build_id: BUILD_ID, debug: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
