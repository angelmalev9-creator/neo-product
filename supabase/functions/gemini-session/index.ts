import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  "Access-Control-Max-Age": "86400",
};

const MAX_SYSTEM_INSTRUCTION_CHARS = 120000;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function safeStr(x: unknown): string {
  return typeof x === "string" ? x : "";
}

function clamp(s: string, max: number) {
  if (!s) return "";
  return s.length <= max ? s : s.slice(0, max) + "…";
}

function hardLimit(s: string, max: number) {
  if (!s) return "";
  return s.length <= max ? s : s.slice(0, max);
}

function strip(s: string): string {
  return s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

/* ─────────── Extract structured context from DB data ─────────── */

function formatSections(structured: any): string {
  const s = structured?.sections;
  if (!s) return "";
  const lines: string[] = [];

  const services = s.services?.items;
  if (Array.isArray(services) && services.length) {
    lines.push("УСЛУГИ:");
    for (const it of services.slice(0, 30)) {
      const title = safeStr(it?.title);
      const desc = safeStr(it?.description);
      lines.push(`- ${title}${desc ? ` — ${desc}` : ""}`);
    }
    lines.push("");
  }

  const packages = s.packages?.items;
  if (Array.isArray(packages) && packages.length) {
    lines.push("ПАКЕТИ:");
    for (const it of packages.slice(0, 20)) {
      const name = safeStr(it?.name);
      const price = safeStr(it?.price);
      const desc = safeStr(it?.description);
      const bullets = Array.isArray(it?.bullets)
        ? it.bullets.slice(0, 24).map((x: any) => safeStr(x)).filter(Boolean)
        : [];

      lines.push(`- ${name}${price ? ` — ${price}` : ""}${desc ? ` — ${desc}` : ""}`);
      if (bullets.length) {
        lines.push(`  включва:`);
        for (const bullet of bullets) lines.push(`  • ${bullet}`);
      }
    }
    lines.push("");
  }

  const pricingPlans = s.pricing?.plans;
  if (Array.isArray(pricingPlans) && pricingPlans.length) {
    lines.push("ЦЕНОВИ ПЛАНОВЕ:");
    for (const it of pricingPlans.slice(0, 20)) {
      const name = safeStr(it?.name);
      const price = safeStr(it?.price || it?.price_text);
      lines.push(`- ${name}${price ? ` — ${price}` : ""}`);
    }
    lines.push("");
  }

  const faq = s.faq?.questions;
  if (Array.isArray(faq) && faq.length) {
    lines.push("ЧЕСТО ЗАДАВАНИ ВЪПРОСИ:");
    for (const q of faq.slice(0, 30)) lines.push(`- ${safeStr(q)}`);
    lines.push("");
  }

  const contact = s.contact;
  if (contact) {
    const hours = Array.isArray(contact?.hours) ? contact.hours.slice(0, 8) : [];
    const phones = Array.isArray(contact?.phones) ? contact.phones.slice(0, 8) : [];
    const emails = Array.isArray(contact?.emails) ? contact.emails.slice(0, 8) : [];
    const addresses = Array.isArray(contact?.addresses) ? contact.addresses.slice(0, 6) : [];

    if (hours.length || phones.length || emails.length || addresses.length) {
      lines.push("КОНТАКТИ:");
      if (hours.length) lines.push(`- Работно време: ${hours.join(", ")}`);
      if (phones.length) lines.push(`- Телефон: ${phones.join(", ")}`);
      if (emails.length) lines.push(`- Имейл: ${emails.join(", ")}`);
      if (addresses.length) lines.push(`- Адрес: ${addresses.join(" | ")}`);
      lines.push("");
    }
  }

  return lines.join("\n").trim();
}

function formatPricing(structured: any): string {
  const lines: string[] = [];
  const pages = Array.isArray(structured?.pages) ? structured.pages : [];

  for (const p of pages) {
    const pricing = p?.structured?.pricing;
    if (!pricing) continue;

    const cards = Array.isArray(pricing?.pricing_cards) ? pricing.pricing_cards : [];
    const inst = Array.isArray(pricing?.installment_plans) ? pricing.installment_plans : [];
    if (!cards.length && !inst.length) continue;

    if (cards.length) {
      lines.push("ЦЕНОВИ ПАКЕТИ:");
      for (const c of cards.slice(0, 20)) {
        const title = safeStr(c?.title);
        const price = safeStr(c?.price_text);
        const badge = safeStr(c?.badge);
        const features = Array.isArray(c?.features)
          ? c.features.slice(0, 18).map((x: any) => safeStr(x)).filter(Boolean)
          : [];

        if (!title && !price && !features.length) continue;
        lines.push(`- ${title}${badge ? ` [${badge}]` : ""}: ${price || "—"}`);
        if (features.length) {
          lines.push(`  включва:`);
          for (const feature of features) lines.push(`  • ${feature}`);
        }
      }
    }

    if (inst.length) {
      lines.push("РАЗСРОЧЕНО ПЛАЩАНЕ:");
      for (const c of inst.slice(0, 20)) {
        const title = safeStr(c?.title);
        const price = safeStr(c?.price_text);
        if (!title && !price) continue;
        lines.push(`- ${title}: ${price || "—"}`);
      }
    }

    lines.push("");
  }

  return lines.join("\n").trim();
}

function formatGlobalFacts(structured: any): string {
  const gf = structured?.global_facts;
  if (!gf) return "";

  const lines: string[] = [];
  const add = (k: string, arr: any, max = 8) => {
    if (Array.isArray(arr) && arr.length) lines.push(`${k}: ${arr.slice(0, max).join(", ")}`);
  };

  add("Имейли", gf.emails, 8);
  add("Телефони", gf.phones, 8);
  add("Адреси", gf.addresses, 6);
  add("Работно време", gf.hours, 8);

  return lines.join("\n");
}

function extractCorpusExcerpts(structured: any, maxChars: number): string {
  const legacy = safeStr(structured?.cleaned_corpus || "");
  if (legacy && legacy.length > 200) return clamp(strip(legacy), maxChars);

  const pages = Array.isArray(structured?.pages) ? structured.pages : [];
  if (!pages.length) return "";

  const parts: string[] = [];
  let total = 0;

  const sorted = [...pages].sort((a, b) => {
    const order: Record<string, number> = { services: 0, contact: 1, about: 2, faq: 3, general: 9 };
    return (order[a?.pageType] ?? 9) - (order[b?.pageType] ?? 9);
  });

  for (const p of sorted) {
    if (total >= maxChars) break;

    const raw = safeStr(p?.content || "");
    const content = raw
      .replace(/=== HTML_CONTENT_START ===/g, "")
      .replace(/=== HTML_CONTENT_END ===/g, "")
      .replace(/=== OCR_CONTENT_START ===/g, "")
      .replace(/=== OCR_CONTENT_END ===/g, "")
      .trim();

    if (!content || content.length < 50) continue;

    const url = safeStr(p?.url || "");
    const title = safeStr(p?.title || "");
    const chunk = `[${title || url}]\n${content}`;
    const allowed = maxChars - total;

    parts.push(clamp(strip(chunk), allowed));
    total += chunk.length;
  }

  return parts.join("\n\n").trim();
}

/**
 * Extracts high-priority content blocks from the cleaned_summary text:
 * - DIALOG_CONTENT blocks (full package spec dialogs: Включено / Не е включено per section)
 * - INCLUDED_DETAILS / EXCLUDED_DETAILS sections
 * - PACKAGES section
 * - TECHNOLOGY section
 *
 * These are injected BEFORE the general corpus so they are never cut off by char limits.
 */
function extractPriorityContent(summary: string): string {
  if (!summary) return "";

  const out: string[] = [];

  // 1. Extract all ---DIALOG--- blocks (full package specs)
  // Format in summary: "Пакет BASIC — €350/кв.м. ... Close\n---DIALOG---\nПакет STANDART ..."
  const dialogParts = summary.split(/---DIALOG---/);
  const dialogBlocks: string[] = [];
  for (const part of dialogParts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    // A dialog block starts with "Пакет " and contains package spec details
    if (/^Пакет\s+/i.test(trimmed) || /Включено|Не е включено/i.test(trimmed)) {
      // Remove trailing "Close" marker
      const cleaned = trimmed.replace(/\s*Close\s*$/i, "").trim();
      if (cleaned.length > 100) dialogBlocks.push(cleaned);
    }
  }
  if (dialogBlocks.length) {
    out.push("PACKAGE_FULL_SPECS (детайлна спецификация на пакетите — Включено / Не е включено):");
    out.push(dialogBlocks.join("\n\n---\n"));
    out.push("");
  }

  // 2. Extract PACKAGES section from the LLM-ready summary header
  const packagesMatch = summary.match(/^PACKAGES:\n([\s\S]*?)(?=\n[A-Z_]+:|\n══|$)/m);
  if (packagesMatch) {
    out.push("PACKAGES:\n" + packagesMatch[1].trim());
    out.push("");
  }

  // 3. Extract INCLUDED_DETAILS section
  const includedMatch = summary.match(/^INCLUDED_DETAILS:\n([\s\S]*?)(?=\n[A-Z_]+:|\n══|$)/m);
  if (includedMatch) {
    out.push("INCLUDED_DETAILS:\n" + includedMatch[1].trim());
    out.push("");
  }

  // 4. Extract EXCLUDED_DETAILS section
  const excludedMatch = summary.match(/^EXCLUDED_DETAILS:\n([\s\S]*?)(?=\n[A-Z_]+:|\n══|$)/m);
  if (excludedMatch) {
    out.push("EXCLUDED_DETAILS:\n" + excludedMatch[1].trim());
    out.push("");
  }

  // 5. Extract TECHNOLOGY section
  const techMatch = summary.match(/^TECHNOLOGY:\n([\s\S]*?)(?=\n[A-Z_]+:|\n══|$)/m);
  if (techMatch) {
    out.push("TECHNOLOGY:\n" + techMatch[1].trim());
    out.push("");
  }

  // 6. Extract PRICING section
  const pricingMatch = summary.match(/^PRICING:\n([\s\S]*?)(?=\n[A-Z_]+:|\n══|$)/m);
  if (pricingMatch) {
    out.push("PRICING:\n" + pricingMatch[1].trim());
    out.push("");
  }

  return out.join("\n").trim();
}

function buildFullBusinessContext(session: any, actionsBlock: string): string {
  const structured = session?.structured_data || {};
  const parts: string[] = [];

  const summary = strip(safeStr(structured?.cleaned_summary || session?.summary || "")).trim();

  // ── PRIORITY FIRST: extract package specs, dialog blocks, inclusions ──
  // These must appear BEFORE the general clamped summary so they are never cut off.
  const priorityContent = extractPriorityContent(summary);
  if (priorityContent) {
    parts.push("PRIORITY_PACKAGE_DATA (точни данни за пакети — използвай с приоритет):\n" + priorityContent);
  }

  // General summary (clamped — may cut long sites, but priority data is already above)
  if (summary) parts.push("\nSUMMARY:\n" + clamp(summary, 48000));

  const contacts = structured?.contacts || {};
  const legacyFacts = formatGlobalFacts(structured);
  const contactLines: string[] = [];
  if (legacyFacts) contactLines.push(legacyFacts);

  const emails = Array.isArray(contacts?.emails) ? contacts.emails : [];
  const phones = Array.isArray(contacts?.phones) ? contacts.phones : [];
  if (emails.length) contactLines.push(`Имейли: ${emails.slice(0, 8).join(", ")}`);
  if (phones.length) contactLines.push(`Телефони: ${phones.slice(0, 8).join(", ")}`);
  if (contactLines.length) parts.push("\nGLOBAL_FACTS:\n" + contactLines.join("\n"));

  const sections = formatSections(structured);
  if (sections) parts.push("\nSECTIONS:\n" + sections);

  const legacyPricing = formatPricing(structured);
  if (legacyPricing) parts.push("\nPRICING:\n" + legacyPricing);

  const pages = Array.isArray(structured?.pages) ? structured.pages : [];
  const pricingLines: string[] = [];

  for (const p of pages) {
    const pc = p?.structured?.pricing;
    if (!pc) continue;
    const cards = Array.isArray(pc.pricing_cards) ? pc.pricing_cards : [];
    for (const c of cards.slice(0, 8)) {
      const title = safeStr(c?.title);
      const price = safeStr(c?.price_text);
      if (!title && !price) continue;
      pricingLines.push(`- ${title}: ${price || "—"}`);
    }
  }

  if (pricingLines.length) parts.push("\nPRICING_FROM_PAGES:\n" + pricingLines.join("\n"));

  if (pages.length) {
    const indexLines = pages
      .slice(0, 80)
      .map((p: any) => {
        const url = safeStr(p?.url || "").replace(/^https?:\/\/[^/]+/, "");
        const title = safeStr(p?.title || "");
        const type = safeStr(p?.pageType || "");
        return `${url} — ${title}${type && type !== "general" ? ` [${type}]` : ""}`;
      })
      .filter(Boolean);

    if (indexLines.length) {
      parts.push("\nPAGE_INDEX (всички crawl-нати страници):\n" + indexLines.join("\n"));
    }
  }

  if (actionsBlock) parts.push("\n" + actionsBlock);

  const corpus = extractCorpusExcerpts(structured, 40000);
  if (corpus) parts.push("\nFULL_SITE_CONTENT:\n" + corpus);

  return parts.join("\n").trim();
}

/* ─────────── Form schema extraction ─────────── */

type FieldDescriptor = { key: string; required: boolean };

function extractFieldDescriptors(schema: any): FieldDescriptor[] {
  const out: FieldDescriptor[] = [];
  const seen = new Set<string>();

  const push = (keyRaw: string, required: boolean) => {
    const key = safeStr(keyRaw).trim();
    if (!key) return;
    const norm = key.toLowerCase();
    if (seen.has(norm)) return;
    seen.add(norm);
    out.push({ key, required });
  };

  const inferRequiredFromLabel = (label: string, required: boolean) => {
    const l = safeStr(label).trim();
    if (!l) return required;
    if (l.includes("*")) return true;
    return required;
  };

  const visitJsonSchema = (node: any) => {
    if (!node || typeof node !== "object") return;
    const props = node.properties;
    const reqArr = Array.isArray(node.required) ? node.required.map(String) : [];
    if (props && typeof props === "object") {
      for (const k of Object.keys(props)) push(k, reqArr.includes(k));
    }
  };

  const visit = (node: any) => {
    if (!node || typeof node !== "object") return;
    visitJsonSchema(node);

    const arrays: any[] = [];
    if (Array.isArray(node.fields)) arrays.push(node.fields);
    if (Array.isArray(node.inputs)) arrays.push(node.inputs);
    if (Array.isArray(node.elements)) arrays.push(node.elements);
    if (Array.isArray(node.controls)) arrays.push(node.controls);
    if (Array.isArray(node.components)) arrays.push(node.components);
    if (Array.isArray(node?.form?.fields)) arrays.push(node.form.fields);

    for (const arr of arrays) {
      for (const it of arr) {
        if (!it || typeof it !== "object") continue;

        const name =
          safeStr((it as any).name) ||
          safeStr((it as any).id) ||
          safeStr((it as any).key) ||
          "";

        const label =
          safeStr((it as any).label) ||
          safeStr((it as any).aria_label) ||
          safeStr((it as any).ariaLabel) ||
          "";

        const placeholder =
          safeStr((it as any).placeholder) ||
          safeStr((it as any).aria_placeholder) ||
          "";

        let required = Boolean(
          (it as any).required ||
            (it as any).isRequired ||
            (it as any).mandatory ||
            (it as any).rules?.required,
        );

        required = inferRequiredFromLabel(label, required);

        if (name) push(name, required);
        else if (label) push(label, required);
        else if (placeholder) push(placeholder, required);
      }
    }

    const choiceArrays: any[] = [];
    if (Array.isArray(node.choices)) choiceArrays.push(node.choices);
    if (Array.isArray(node?.schema?.choices)) choiceArrays.push(node.schema.choices);

    for (const choiceArr of choiceArrays) {
      for (const choice of choiceArr) {
        if (!choice || typeof choice !== "object") continue;

        const choiceName = safeStr(choice.name) || safeStr(choice.label) || "";
        if (!choiceName) continue;

        let required = Boolean(choice.required);
        required = inferRequiredFromLabel(choiceName, required);

        const options = Array.isArray(choice.options)
          ? choice.options.map((o: any) => safeStr(o?.label) || safeStr(o?.value)).filter(Boolean)
          : [];

        const keyWithOptions = options.length
          ? `${choiceName} (избор: ${options.join(" / ")})`
          : choiceName;

        push(keyWithOptions, required);
      }
    }

    for (const k of Object.keys(node)) {
      const v = (node as any)[k];
      if (v && typeof v === "object") visit(v);
    }
  };

  visit(schema);
  return out.slice(0, 60);
}

function formatActionsFromFormSchemas(rowsInput: any[]): {
  text: string;
  hasActions: boolean;
  hasAvailability: boolean;
  hasLeadForm: boolean;
  hasWizard: boolean;
} {
  const rows = Array.isArray(rowsInput) ? rowsInput : [];
  if (rows.length === 0) {
    return { text: "", hasActions: false, hasAvailability: false, hasLeadForm: false, hasWizard: false };
  }

  const lines: string[] = [];
  const hasAvailability = rows.some((r) => safeStr(r?.kind).trim().toLowerCase() === "availability");
  const hasLeadForm = rows.some((r) => safeStr(r?.kind).trim().toLowerCase() === "form");
  const hasWizard = rows.some((r) => safeStr(r?.kind).trim().toLowerCase() === "wizard");

  lines.push("ACTIONS (формуляри/действия, открити детерминистично):");

  const sorted = [...rows].sort(
    (a, b) => safeStr(a?.url).localeCompare(safeStr(b?.url)) || safeStr(a?.kind).localeCompare(safeStr(b?.kind)),
  );

  for (const r of sorted.slice(0, 12)) {
    const url = safeStr(r?.url).trim();
    const kind = safeStr(r?.kind).trim() || "form";
    const formId = safeStr(r?.id).trim();
    const fingerprint = safeStr(r?.fingerprint).trim();
    const schema = r?.schema;

    const fields = extractFieldDescriptors(schema);
    const req = fields.filter((f) => f.required).map((f) => f.key);
    const opt = fields.filter((f) => !f.required).map((f) => f.key);

    lines.push(`- ${kind}${url ? ` @ ${url}` : ""}`);
    if (formId) lines.push(`  form_id: ${formId}`);
    if (fingerprint) lines.push(`  fingerprint: ${fingerprint}`);
    if (req.length) lines.push(`  required_keys: ${req.join(", ")}`);
    if (opt.length) lines.push(`  optional_keys: ${opt.join(", ")}`);

    if (!req.length && !opt.length) {
      lines.push("  keys: (unknown)");
      lines.push(
        "  note: ако keys са unknown (inputs без name/id), след потвърждение използвай PROBE_MODE с празни fields:{} за live scan от worker.",
      );
    }
  }

  lines.push("");
  lines.push("ACTION_RULES:");
  lines.push("- Ако клиентът иска 'попълни формата': използваш САМО required_keys. Не добавяш свои полета.");
  lines.push(
    "- Събираш ВСЕКИ required_key един по един, включително полета с '(избор: ...)' — за тях предлагаш опциите на клиента и чакаш отговор.",
  );

  if (hasAvailability) {
    lines.push(
      "- ПРИОРИТЕТ НА ФОРМИТЕ: Ако има kind=availability — използвай го САМО когато клиентът изрично иска резервация, час, дати, наличност или свободен слот.",
    );
    lines.push(
      "- kind=availability — workflow само за сайтове, които РЕАЛНО имат онлайн booking/availability. Ако такъв flow липсва в ACTIONS, не измисляй записване на час, резервация или calendar flow.",
    );
    lines.push(
      "- Ако клиентът описва проблем, симптом, нужда от консултация или въпрос за услуга, това НЕ е booking intent по подразбиране. Първо помогни и насочи според сайта.",
    );
  }

  if (hasLeadForm) {
    lines.push(
      "- kind=form (лесна форма): ако сайтът няма online booking, НЕ предлагай записване на час по подразбиране. Първо помогни, после предложи запитване/контактна форма.",
    );
    lines.push("- Събираш required_keys и чак на 'потвърждавам' връщаш submit_form action_request.");
  }

  if (hasWizard) {
    lines.push("- kind=wizard: водиш клиента стъпка по стъпка и искаш само следващото нужно поле.");
  }

  lines.push("- PROBE_MODE се ползва само ако keys са (unknown) или е wizard/multi-step.");
  lines.push("- Не казваш, че е изпратено. Казваш: 'Готово — ако потвърдите, ще подам запитването през формата.'");

  return { text: lines.join("\n").trim(), hasActions: true, hasAvailability, hasLeadForm, hasWizard };
}

/* ─────────── Search Worker — Gemini function calling tool ─────────── */

function buildSearchToolDeclaration() {
  return [
    {
      functionDeclarations: [
        {
          name: "search_site_content",
          description:
            "Търси в реално време в съдържанието на сайта чрез search worker. " +
            "Използвай го само когато точната информация липсва след пълно търсене в бизнес контекста. " +
            "Това е за цени, продукти, наличност, модели, размери, марки, сравнения и конкретни детайли, " +
            "които не присъстват буквално или логически в контекста. " +
            "НЕ казвай на клиента, че търсиш — просто търси и после отговори.",
          parameters: {
            type: "OBJECT",
            properties: {
              query: {
                type: "STRING",
                description:
                  "Search query по формула: domain + ключови думи. " +
                  "Кратко и конкретно. Примери: " +
                  "'praktiker.bg климатици цена', " +
                  "'praktiker.bg базов климатик отопление охлаждане 200 евро', " +
                  "'praktiker.bg пътека 50x100 цена'.",
              },
            },
            required: ["query"],
          },
        },
      ],
    },
  ];
}

async function callSearchWorker(
  workerUrl: string,
  workerSecret: string,
  sessionId: string,
  query: string,
  siteUrl: string,
): Promise<string> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${workerUrl}/search`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${workerSecret}`,
      },
      body: JSON.stringify({ session_id: sessionId, query, site_url: siteUrl }),
    });

    clearTimeout(timer);

    if (!res.ok) {
      console.warn("[SEARCH-WORKER] HTTP error:", res.status);
      return "";
    }

    const data = await res.json();
    const results = Array.isArray(data.results) ? data.results : [];
    if (!results.length) return "";

    const lines: string[] = [`REAL_TIME_SEARCH_RESULTS (query: "${query}"):`];

    for (const r of results.slice(0, 5)) {
      if (r.url || r.title) lines.push(`\n[${r.title || r.url}]`);

      const parts = [
        safeStr(r?.snippet),
        ...(Array.isArray(r?.excerpts) ? r.excerpts.map((x: unknown) => safeStr(x)) : []),
      ].filter(Boolean);

      for (const ex of parts.slice(0, 3)) {
        lines.push(`  ${ex}`);
      }

      if (safeStr(r?.price)) {
        lines.push(`  цена: ${safeStr(r.price)}`);
      }
    }

    return lines.join("\n");
  } catch (e) {
    console.warn("[SEARCH-WORKER] fetch failed:", e);
    return "";
  }
}

/* ─────────── NEO System Prompt ─────────── */

function buildSystemPrompt(
  companyNameResolved: string,
  sessionId: string,
  businessContext: string,
  actionJsonRules: string,
  ctaRule: string,
  hasSearchWorker: boolean,
): string {
  const searchWorkerSection = hasSearchWorker
    ? [
        ``,
        `══════════════════════════════════════════`,
        `REAL-TIME SEARCH (search_site_content)`,
        `══════════════════════════════════════════`,
        ``,
        `Имаш достъп до инструмент search_site_content за търсене в реално време.`,
        ``,
        `КОГА ГО ВИКАШ:`,
        `- Само когато след пълно търсене в контекста липсва точният отговор.`,
        `- За конкретен продукт, цена, наличност, модел, размер, марка, характеристики, спецификации, описание, материал, сравнение.`,
        `- За follow-up въпрос, ако контекстът и вече намереното не стигат.`,
        `- НЕ го викаш за пакет/услуга/оферта, ако информацията вече е в контекста, но е разпръсната на няколко места.`,
        `- При пакетни въпроси първо правиш логически fallback вътре в контекста. Search е последна стъпка, не първа.`,
        ``,
        `⛔ КОГА НИКОГА НЕ ГО ВИКАШ:`,
        `- Когато клиентът потвърждава поръчка, запитване или резервация ("да", "потвърждавам", "искам", "поръчвам", "съгласен съм").`,
        `- Когато трябва да върнеш action_request JSON (submit_form, make_reservation, book_slot).`,
        `- Когато всички required данни вече са събрани и следващата стъпка е изпращане на формата/резервацията.`,
        `- Ако вече си в submit_form flow и току-що си поискал missing_required поле → следващият отговор на клиента е continuation на form flow, НЕ е search.`,
        `- Search е САМО за търсене на ИНФОРМАЦИЯ, НИКОГА за потвърждаване на действия.`,
        `- Ако клиентът казва "да", "потвърждавам", "коректни са", или отговори на последното липсващо form поле:
STOP reasoning.
DO NOT search.
DO NOT ask anything.
DO NOT continue conversation.
Return only submit flow.`,
        ``,
        `КОГА НЕ ПИТАШ ДОПЪЛНИТЕЛНО:`,
        `- Ако клиентът вече е дал достатъчно за търсене: категория, употреба, бюджет или основна характеристика.`,
        `- Ако вече знаете кой продукт обсъждате и клиентът пита за размери/характеристики/наличност → не задаваш излишни въпроси, а търсиш.`,
        ``,
        `КАК ДА ФОРМУЛИРАШ query:`,
        `- Винаги включваш domain-а на сайта + ключови думи.`,
        `- Формула: "domain + ключови думи"`,
        `- За follow-up въпроси: включи името на продукта + новия въпрос.`,
        `- Примери:`,
        `  "praktiker.bg климатици цена"`,
        `  "praktiker.bg SANG SAC-25CH3 характеристики мощност"`,
        `  "redics.bg мъжки спортен екип сиво размери наличност"`,
        ``,
        `СЛЕД SEARCH:`,
        `- Ползваш само конкретни данни от резултата.`,
        `- Ако search върне характеристики → ги изреждаш ясно.`,
        `- Ако search не върне достатъчно → казваш ясно какво липсва, без да измисляш.`,
        ``,
        `ANTI-HALLUCINATION:`,
        `- Цената не е характеристика.`,
        `- Цената не е размер.`,
        `- Ако липсва конкретна характеристика → не я измисляш.`,
        `- Ако не знаеш отговора и след search → казваш честно, че това не се вижда в наличните данни.`,
        ``,
      ].join("\n")
    : "";

  return [
    `╔═══════════════════════════════════════════════════════════╗`,
    `║  СТЪПКА НУЛА — Прочети ЦЕЛИЯ БИЗНЕС КОНТЕКСТ в края.    ║`,
    `║  Той е единственият източник на истина за този бизнес.   ║`,
    `╚═══════════════════════════════════════════════════════════╝`,
    ``,
    `══════════════════════════════════════════`,
    `ТВЪРД ЛИМИТ ЗА ДЪЛЖИНА НА ОТГОВОРА (АБСОЛЮТЕН)`,
    `══════════════════════════════════════════`,
    ``,
    `ПРАВИЛО №1 — МАКСИМУМ 2-3 ИЗРЕЧЕНИЯ НА ОТГОВОР.`,
    `Това е най-важното правило. Нарушаването му е ЗАБРАНЕНО.`,
    ``,
    `- При "Да/Не" въпрос → 1 изречение.`,
    `- При проста цена/факт → 1-2 изречения.`,
    `- При сравнение или описание → максимум 3 изречения.`,
    `- При НЕИЗБЕЖНО изброяване (пакет "какво включва") → максимум 4 изречения.`,
    ``,
    `АКО НЕ МОЖЕШ ДА СЕ ПОБЕРЕШ В 3 ИЗРЕЧЕНИЯ:`,
    `→ Кажи най-важното в 2-3 изречения.`,
    `→ Завърши с логически свързан въпрос: "Искате ли да чуете и за [останалото]?"`,
    `→ Ако клиентът каже "да" → продължи с нови 2-3 изречения.`,
    ``,
    `ПРИМЕР (ПРАВИЛНО):`,
    `"Essential пакетът е двеста и десет евро и включва сайт до 5 страници, SEO оптимизация и месечна поддръжка. Искате ли да чуете какво още е включено?"`,
    ``,
    `ПРИМЕР (ГРЕШНО):`,
    `"Essential пакетът е двеста и десет евро. Включва сайт до 5 страници. Също така SEO оптимизация. И месечна поддръжка. Освен това имате и домейн. И SSL сертификат. И..."`,
    `→ Това е 6+ изречения. ЗАБРАНЕНО.`,
    ``,
    `НИКОГА не надвишавай 4 изречения дори при изброяване.`,
    ``,

    `══════════════════════════════════════════`,
    `МОЗЪК НА НЕО — ПРЕДИ ВСЕКИ ОТГОВОР`,
    `══════════════════════════════════════════`,
    ``,
    `1) Определи intent: information / recommendation / lead / reservation / product discovery.`,
    `2) Какво РЕАЛНО иска? Ситуацията зад думите.`,
    `3) Прекъснал ли се е? → "Разказвайте — слушам Ви." СТОП.`,
    `4) Завършил ли е мисълта си? → ако не → 1 въпрос. НЕ давай информация първи.`,
    `5) Знаеш ли ситуацията му? → АКО НЕ: 1 въпрос. → АКО ДА: действай.`,
    ``,
    `⛔ Не давай контакти като първи отговор на проблем — предлагай решение.`,
    `⛔ Не изреждай всички пакети — препоръчай конкретно.`,
    `⛔ Не описвай услуга — описвай какво ще се промени за клиента.`,
    ``,

    `══════════════════════════════════════════`,
    `ТЕМПЕРАТУРА НА КЛИЕНТА → РЕАКЦИЯ`,
    `══════════════════════════════════════════`,
    ``,
    `ГОРЕЩ (иска цена/пакет/действие): директен отговор (1 изр.) → следваща стъпка.`,
    `ТОПЪЛ (сравнява/обмисля): отговор → 1 причина защо е добро за него → стъпка.`,
    `СТУДЕН ("просто питам"): кратък отговор → 1 факт → 1 въпрос за ситуацията му.`,
    `УЯЗВИМ (споделя трудност): чуй → нормализирай → конкретно решение.`,
    `"Ще помисля" / "Скъпо" / "Не": адресирай 1 път. След 2 опита → уважи.`,
    ``,

    `══════════════════════════════════════════`,
    `БИЗНЕС ТИП (определи веднъж)`,
    `══════════════════════════════════════════`,
    ``,
    `ТИП А (записване на час): availability в ACTIONS → цел: запиши час.`,
    `ТИП Б (запитване/оферта): form в ACTIONS → цел: изпрати запитване.`,
    `ТИП В (e-commerce): продукти с цени → цел: насочи към поръчка.`,
    `ТИП Г (информационен): без форми/цени → цел: насочи към контакт.`,
    `ТИП Д (неясен): задай 1 въпрос, после действай по тип.`,
    ``,
    `Ако ACTIONS има availability → Тип А приоритет. Само form → Тип Б.`,
    ``,

    `══════════════════════════════════════════`,
    `RETRIEVAL ПРАВИЛА`,
    `══════════════════════════════════════════`,
    ``,
    `Приоритет: 1.PACKAGES/SECTIONS 2.PRICING 3.FULL_SITE_CONTENT 4.SUMMARY`,
    `При конфликт → вярвай на по-конкретния. Ако пита "включва ли" → намери exact list → Да/Не + факт.`,
    `Ако няма готов list → събери от целия контекст за СЪЩИЯ пакет. "Няма" → само след пълно търсене.`,
    `Не пренасяй feature от един пакет в друг.`,
    ``,
    `⛔ Не казвай "няма информация" без да претърсиш. Не измисляй цени/включвания/срокове.`,
    `⛔ Не добавяй billing модел ако не е в контекста. Не предлагай договори ако не са налични.`,
    `При lead forms → само "запитване", никога "договор"/"подписване"/"аванс".`,
    ``,
    `ЗА ПРОДУКТИ: Ако липсва цена/размер/наличност/характеристика и има searchWorker → search.`,
    `Не казвай "цените варират" без факт.`,
    ``,

    searchWorkerSection,

    `══════════════════════════════════════════`,
    `ИДЕНТИЧНОСТ И ТОН`,
    `══════════════════════════════════════════`,
    ``,
    `Вие сте НЕО — представител на ${companyNameResolved}.`,
    `Представяте се като човек. НЕ разкривате, че сте AI.`,
    `Ако питат: "Работя с дигитален асистент, но всичко важно минава през мен." Продължете.`,
    ``,
    `Тон: топъл, уверен, конкретен. Като умен приятел-експерт.`,
    `"Вие" с възрастни. "Ти" само ако клиентът е започнал.`,
    `Естествени: "разбирам", "ясно", "добре", "точно"`,
    ``,
    `ЗАБРАНЕНИ ФРАЗИ: "Разбира се, с удоволствие" | "С радост" | "Щастлив/а" | "Позволете ми"`,
    `| "Не се колебайте" | "Ако имате въпроси" | "Чудесно" (като начало) | "модерни и функционални"`,
    `| "реални резултати" | "цялостна подкрепа" | "професионално присъствие"`,
    ``,
    `ЗАБРАНЕНИ ЗВУЦИ: "ъмм" | "мхм" | "аха" | "хмм" | "знаеш ли" | "виж" | "представи си"`,
    `Тези се добавят автоматично от аудио системата.`,
    ``,
    `Без емоджи. Без корпоративен жаргон. Без излишна радост.`,
    ``,

    `══════════════════════════════════════════`,
    `ГЛАСОВ РЕЖИМ — ЧИСЛА И ЦЕНИ`,
    `══════════════════════════════════════════`,
    ``,
    `КРИТИЧНО:`,
    `- "3.06 EUR" → "три евро и шест стотинки". НИКОГА "триста шест".`,
    `- "8560 EUR" → "осем хиляди петстотин и шестдесет евро".`,
    `- Billing period САМО ако е изрично в данните ("/мес", "monthly").`,
    `- Ако цена < 10 евро → тя НЕ Е стотици. Провери два пъти.`,
    `- "€250" → "двеста и петдесет евро". Не произнасяй "€" като буква.`,
    ``,

    `══════════════════════════════════════════`,
    `ПРОДАЖБА ЧРЕЗ СТОЙНОСТ`,
    `══════════════════════════════════════════`,
    ``,
    `Описвай РЕЗУЛТАТА, не услугата: "Имаме SEO" → "Ще ви намират в Google".`,
    `1 препоръка с причина. Ако 2 подходящи → сравни и посочи по-добрия ЗА НЕГО.`,
    `Upsell: 1 допълнително нещо, веднъж, естествено. Не агресивно.`,
    `Социално доказателство: САМО от контекста. Не измисляй статистики.`,
    ``,

    `══════════════════════════════════════════`,
    `СЦЕНАРИИ`,
    `══════════════════════════════════════════`,
    ``,
    `Проблем/нужда: признай → решение от сайта → 1 следваща стъпка. ⛔ Не контакти.`,
    `Иска контакти: дай от контекста + "Мога да подам запитване вместо Вас."`,
    `Пита за цена: точна цена + "Включва [X]." + 1 изречение стойност.`,
    `"Просто питам": "Какво Ви е довело да питате?"`,
    `Прекъснал се: "Слушам Ви." СТОП.`,
    `Нерешителен: ПРЕПОРЪЧАЙ конкретно с 1 причина. Не питай пак.`,
    ``,
    `ИМЕЙЛ/ТЕЛЕФОН: Ако не са ясни → "Може ли да го напишете в чата?"`,
    ``,
    `ПЪРВО СЪОБЩЕНИЕ: Не генерирай greeting. Widget-ът го изпраща. Чакай клиента.`,
    ``,

    actionJsonRules,
    ``,
    `FINALIZATION RULE:`,
    `- Ако няма изпратен action_request → не казваш "готово е". Чакаш потвърждение.`,
    ``,
    ctaRule,
    ``,

    `═══════════════════════════`,
    `БИЗНЕС КОНТЕКСТ:`,
    `═══════════════════════════`,
    businessContext || `Няма допълнителна информация за "${companyNameResolved}".`,
    `═══════════════════════════`,
  ].join("\n");
}
function resolveSearchProxyUrl(req: Request): string {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")?.trim();
  if (SUPABASE_URL) {
    return `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/search-worker-proxy`;
  }

  const reqUrl = new URL(req.url);
  return `${reqUrl.origin}/functions/v1/search-worker-proxy`;
}

/* ─────────── Main handler ─────────── */

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_KEY =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
      Deno.env.get("NEO_SERVICE_ROLE_KEY") ||
      "";

    const SEARCH_WORKER_URL = Deno.env.get("SEARCH_WORKER_URL")?.trim() ?? "";
    const SEARCH_WORKER_SECRET = Deno.env.get("SEARCH_WORKER_SECRET")?.trim() ?? "";
    const searchWorkerConfigured = Boolean(SEARCH_WORKER_URL && SEARCH_WORKER_SECRET);

    const body = await req.json().catch(() => ({}));
    const enableSearch = body?.enableSearch === true;
    const hasSearchWorker = searchWorkerConfigured && enableSearch;
    const searchProxyUrl = hasSearchWorker ? resolveSearchProxyUrl(req) : null;
    const sessionId = safeStr(body.sessionId).trim();
    const reqCompanyName = safeStr(body.companyName).trim();
    const externalContext = safeStr(body.systemPrompt).trim();

    let businessContext = externalContext;
    let hasActions = false;
    let hasAvailability = false;
    let hasLeadForm = false;
    let hasWizard = false;
    let companyNameResolved = reqCompanyName || "компанията";
    let sessionSiteUrl = "";
    let sessionVoiceName = "Enceladus";

    if (sessionId && SUPABASE_URL && SUPABASE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

        const { data: session, error } = await supabase
          .from("demo_sessions")
          .select("summary, structured_data, company_name, url, voice_name")
          .eq("id", sessionId)
          .single();

        if (!error && session) {
          const dbCompany = safeStr(session?.company_name).trim();
          if (dbCompany) companyNameResolved = dbCompany;
          sessionSiteUrl = safeStr(session?.url).trim();
          sessionVoiceName = safeStr(session?.voice_name).trim() || "Enceladus";
        } else if (error) {
          console.warn("[GEMINI-SESSION] demo_sessions fetch error:", error?.message);
        }

        const { data: formRows, error: formErr } = await supabase
          .from("form_schemas")
          .select("id, fingerprint, url, kind, schema, updated_at")
          .eq("session_id", sessionId)
          .order("updated_at", { ascending: false })
          .limit(30);

        if (formErr) {
          console.warn("[GEMINI-SESSION] form_schemas fetch error:", formErr?.message);
        }

        const actions = formatActionsFromFormSchemas(formRows || []);
        hasActions = actions.hasActions;
        hasAvailability = actions.hasAvailability;
        hasLeadForm = actions.hasLeadForm;
        hasWizard = actions.hasWizard;

        if (!error && session) {
          const dbContext = buildFullBusinessContext(session, actions.text);
          if (dbContext) businessContext = dbContext;
        }
      } catch (e) {
        console.warn("[GEMINI-SESSION] DB fetch failed, using provided context:", e);
      }
    }

    const ctaRule = hasActions
      ? `4) Завършвате с ТОЧНО 1 конкретен въпрос или предложение за следваща стъпка — НО САМО ако НЕ трябва да върнете action_request JSON. Ако има kind=availability и вече имате check_in + check_out + guests, НЕ задавате CTA — връщате само JSON. Ако няма booking intent, НЕ предлагате резервация по подразбиране. За форми: "Искате ли да подам запитването вместо Вас? Само потвърдете и е готово." Никога не завършвайте с "Ако имате въпроси".`
      : `4) Завършвате с ТОЧНО 1 конкретен въпрос или следваща стъпка. Примери: "Имате ли вече парцел?", "Кога бихте искали да започнете?", "Да продължим ли с детайлите?" Никога не завършвайте с "Ако имате въпроси".`;

    const actionJsonRules = [
      `ACTION_REQUEST_JSON_ONLY (критично):
      SUBMIT_FINALIZATION_RULE (ABSOLUTE):
- Ако required_keys са събрани и клиентът потвърди:
следващият отговор ЗАДЪЛЖИТЕЛНО е submit.
не въпрос.
не search.
не explanation.
не recommendation.
само action request.
Няма изключения.`,
      
      `- Това важи САМО ако има "ACTIONS" в контекста.`,
      `- Ако клиентът каже "потвърждавам" и ВСИЧКИ required_keys за избраната форма са събрани: връщате САМО JSON (без текст).`,
      `- Преди JSON проверяваш всеки required_key. Ако липсва дори един → не пращаш JSON.`,
      `- Ако липсва required_key → искаш само 1 следващо поле.

FIELD LOCK RULE:
- Once user provides a field it is LOCKED.
- Locked fields are never requested again.
- Never re-ask for name email phone already collected.`,
      `- Ако вече си поискал missing_required поле за form flow и клиентът отговори на него → връщаш пак submit_form JSON със същите form_id/fingerprint и новото поле в fields. НЕ правиш search.`,
      `- fields ползва само exact keys от required_keys.`,
      `- PROBE_MODE: само ако keys са unknown или е wizard.`,
      ``,
      `RESERVATION / AVAILABILITY RULES:`,
      `- kind=availability се използва само ако такъв flow реално съществува в ACTIONS.`,
      `- Не превръщаш normal contact flow в booking flow.`,
      `- Не предполагаш booking полета, ако системата не ги е върнала.`,
      `- Ако клиентът иска availability / резервация / дати / час и има kind=availability:`,
      `  1) събираш само минимално нужните данни едно по едно`,
      `  2) щом имаш check_in + check_out + guests → връщаш само JSON:`,
      `  {"type":"action_request","action":"make_reservation","session_id":"${sessionId}","phase":"check","check_in":"YYYY-MM-DD","check_out":"YYYY-MM-DD","guests":"N","rooms":"1"}`,
      `- Ако клиентът току-що е дал последното липсващо поле → в същия отговор връщаш само JSON.`,
      `- След availability result: представяш само това, което системата е върнала.`,
      `- Ако клиентът избере вариант/стая/час и има booking flow → връщаш само JSON:`,
      `  {"type":"action_request","action":"make_reservation","session_id":"${sessionId}","phase":"reserve","room_type":"<избраният вариант>"}`,
      `- Ако системата върне needs_input / missing_required:`,
      `  * искаш само следващото нужно поле`,
      `  * използваш exact label-и от missing_required`,
      `  * не добавяш свои полета`,
      `- Ако липсва booking flow в ACTIONS → не връщаш make_reservation JSON.`,
      `- Ако сайтът е contact / lead form → водиш submit_form flow, не booking flow.`,
      `- Ако системата стигне до плащане или външен booking_url → насочваш клиента натам. Никога не искаш данни за карта в чата.`,
    ].join("\n");

    const fullInstruction = hardLimit(
      buildSystemPrompt(
        companyNameResolved,
        sessionId,
        businessContext,
        actionJsonRules,
        ctaRule,
        hasSearchWorker,
      ),
      MAX_SYSTEM_INSTRUCTION_CHARS,
    );

    const tools = hasSearchWorker ? buildSearchToolDeclaration() : [];

    return json(200, {
      success: true,

      apiKey: GEMINI_API_KEY,
      model: "gemini-3.1-flash-live-preview",
      systemInstruction: fullInstruction,

      api_key: GEMINI_API_KEY,
      system_instruction: fullInstruction,
      instruction: fullInstruction,

      tools,
      searchProxyUrl,
      searchSessionSiteUrl: sessionSiteUrl,

      companyNameResolved,
      hasActions,
      hasSearchWorker,
      voiceName: sessionVoiceName,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[GEMINI-SESSION] Error:", errorMessage);
    return json(500, { success: false, error: errorMessage });
  }
});