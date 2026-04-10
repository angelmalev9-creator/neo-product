import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const normalizeWhitespace = (value: string) => String(value || "").replace(/\s+/g, " ").trim();

function transliterateBulgarianToLatin(text: string) {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sht", ъ: "a", ь: "", ю: "yu", я: "ya",
  };
  return Array.from(String(text || "").toLowerCase()).map((char) => map[char] ?? char).join("");
}

function normalizeSpokenEmailText(text: string) {
  return transliterateBulgarianToLatin(text)
    .replace(/maimunsko|maimunka|klyomba|klumba|klomba/g, " @ ")
    .replace(/джимейл|g\s*mail|gmal|gmeil|gmial/g, " gmail ")
    .replace(/tochka\s*kom|dot\s*com|точка\s*ком/g, " .com ")
    .replace(/tochka\s*bg|dot\s*bg|точка\s*бг/g, " .bg ")
    .replace(/tochka\s*net|dot\s*net|точка\s*нет/g, " .net ")
    .replace(/tochka\s*org|dot\s*org|точка\s*орг/g, " .org ")
    .replace(/\s*(?:at|et|маймунско|маймунка)\s*/g, " @ ")
    .replace(/\s*(?:tochka|dot)\s*/g, " . ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Clean up common spoken prefixes that get concatenated with email addresses.
 * E.g. "imeilamieangelmalev7@gmail.com" → "angelmalev7@gmail.com"
 */
function cleanEmailPrefix(email: string): string {
  // Remove common Bulgarian spoken prefixes that got merged into the local part
  const prefixes = [
    /^imeila?\s*mi\s*e\s*/i,
    /^imeilat?\s*mi\s*e\s*/i,
    /^emaila?\s*mi\s*e\s*/i,
    /^moya(?:t)?\s*imeil\s*e\s*/i,
    /^moya(?:t)?\s*email\s*e\s*/i,
    /^imeil\s*/i,
    /^email\s*/i,
  ];
  
  let local = email.split("@")[0];
  const domain = email.split("@").slice(1).join("@");
  
  for (const prefix of prefixes) {
    const cleaned = local.replace(prefix, "");
    if (cleaned !== local && cleaned.length >= 2) {
      local = cleaned;
      break;
    }
  }
  
  return `${local}@${domain}`;
}

function extractEmails(text: string) {
  const emails = new Set<string>();
  const variants = [text, normalizeSpokenEmailText(text)];

  for (const variant of variants) {
    const matches = variant.match(/[a-z0-9._%+-]+\s*@\s*[a-z0-9.-]+\s*\.\s*[a-z]{2,}/gi) || [];
    for (const match of matches) {
      let normalized = match
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/@gmail(?!\.)/g, "@gmail.com")
        .replace(/@abv(?!\.)/g, "@abv.bg")
        .replace(/@outlook(?!\.)/g, "@outlook.com")
        .replace(/@hotmail(?!\.)/g, "@hotmail.com")
        .replace(/@yahoo(?!\.)/g, "@yahoo.com");

      // Clean spoken prefixes that got merged
      normalized = cleanEmailPrefix(normalized);

      if (/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(normalized)) {
        emails.add(normalized);
      }
    }
  }

  return [...emails];
}

function extractPhones(text: string) {
  const phones = new Set<string>();
  const matches = text.match(/(?:\+359|0)[\d\s-]{7,16}\d/g) || [];

  for (const match of matches) {
    const compact = match.replace(/[^\d+]/g, "");
    if (compact.startsWith("+359") && compact.length >= 12) phones.add(compact);
    else {
      const digits = compact.replace(/\D/g, "");
      if (digits.length >= 10 && digits.length <= 13) phones.add(digits.startsWith("359") ? `+${digits}` : digits);
    }
  }

  return [...phones];
}

function extractName(text: string) {
  const patterns = [
    /казвам се\s+([А-ЯA-Z][а-яa-z]+(?:\s+[А-ЯA-Z][а-яa-z]+)?)/u,
    /аз съм\s+([А-ЯA-Z][а-яa-z]+(?:\s+[А-ЯA-Z][а-яa-z]+)?)/u,
    /името ми е\s+([А-ЯA-Z][а-яa-z]+(?:\s+[А-ЯA-Z][а-яa-z]+)?)/u,
    /на името на\s+([А-ЯA-Z][а-яa-z]+(?:\s+[А-ЯA-Z][а-яa-z]+)?)/u,
    // Transliterated patterns
    /kazvam se\s+([a-z]+)/iu,
    /az sam\s+([a-z]+)/iu,
    /sa\s+([a-z]+)\s*[,.\s]/iu,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const name = normalizeWhitespace(match[1]);
      // Capitalize first letter
      return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    }
  }

  const capitalized = text.match(/[А-ЯA-Z][а-яa-z]+\s+[А-ЯA-Z][а-яa-z]+/gu) || [];
  return capitalized[0] ? normalizeWhitespace(capitalized[0]) : null;
}

function inferSentiment(text: string) {
  if (/(грешка|проблем|ядос|не работи|какво стана|извинявам се)/i.test(text)) return "negative";
  if (/(благодаря|чудесно|отлично|супер|удобно|потвърждавам|записана успешно)/i.test(text)) return "positive";
  return "neutral";
}

function buildTags(text: string) {
  const tags = new Set<string>();
  const normalized = text.toLowerCase();

  if (/резервац|час|консултац|среща/.test(normalized)) tags.add("резервация");
  if (/цена|пакет|оферта|купя|закупя/.test(normalized)) tags.add("покупка");
  if (/имейл|@/.test(normalized)) tags.add("имейл");
  if (/телефон|\+359|08\d{8}/.test(normalized)) tags.add("телефон");
  if (/уебсайт|сайт|seo|страници/.test(normalized)) tags.add("уебсайт");
  if (/видео|маркетинг|реклама/.test(normalized)) tags.add("маркетинг");
  if (/paket|пакет|essential|professional|enterprise/i.test(normalized)) tags.add("пакет");

  return [...tags];
}

function buildFallbackAnalysis(messages: Array<{ role: string; content: string }>, transcript: string, lead: any) {
  const userTranscript = messages.filter((message) => message.role === "user").map((message) => message.content).join("\n");
  const combined = `${transcript}\n${userTranscript}`;
  const emails = extractEmails(combined);
  const phones = extractPhones(combined);
  const name = lead?.name || [lead?.first_name, lead?.last_name].filter(Boolean).join(" ") || extractName(userTranscript) || extractName(transcript) || null;
  const bookingIntent = /резервац|запиш|час|консултац|среща/i.test(combined);
  const bookingConfirmed = /записан[ао]? успешно|консултацията е записана|потвърждавам|очакваме ви|насрочим/i.test(combined);
  const purchaseIntent = /купя|купувам|закупя|искам.*пакет|поръчк/i.test(combined) || /kupq|kupya|iskam.*paket/i.test(combined);
  const pricingIntent = /цена|пакет|оферта/i.test(combined);
  const hasContact = Boolean(name || lead?.email || emails[0] || lead?.phone || phones[0]);

  // Extract specific package/service mentioned
  const packageMatch = combined.match(/пакет\s*(essential|professional|enterprise|1|2|3|стартов|базов|про)/i)
    || combined.match(/paket\s*(essential|professional|enterprise|1|2|3)/i);
  const packageName = packageMatch ? packageMatch[1] : null;

  return {
    summary: purchaseIntent && packageName
      ? `Клиентът ${name || 'посетител'} иска да закупи пакет ${packageName}${hasContact ? ' и остави данни за контакт.' : '.'}`
      : bookingConfirmed
        ? `Разговорът с ${name || 'клиента'} приключва с потвърден час.`
        : hasContact
          ? `${name || 'Клиентът'} проявява интерес и оставя данни за контакт.`
          : "Информативен разговор без конкретно действие.",
    client_intent: purchaseIntent
      ? `Клиентът иска да закупи${packageName ? ` пакет ${packageName}` : ' услуга'}.`
      : bookingIntent
        ? "Клиентът иска записване на час или консултация."
        : pricingIntent
          ? "Клиентът търси информация за цени и пакети."
          : "Клиентът задава въпроси.",
    outcome: bookingConfirmed
      ? "Потвърдена резервация/консултация."
      : purchaseIntent && hasContact
        ? "Заявка за покупка с предоставени контактни данни."
        : hasContact
          ? "Събрани контактни данни за последващо свързване."
          : "Без финално действие.",
    sentiment: inferSentiment(combined),
    tags: buildTags(combined),
    action_items: [
      purchaseIntent && hasContact
        ? `Свържете се с ${name || 'клиента'} за финализиране на покупката${packageName ? ` на пакет ${packageName}` : ''}.`
        : bookingConfirmed
          ? "Потвърдете часа и продължете с обслужването."
          : hasContact
            ? `Свържете се с ${name || 'клиента'} по оставените данни.`
            : "Прегледайте разговора.",
    ],
    client_name: name,
    client_email: lead?.email || emails[0] || null,
    client_phone: lead?.phone || phones[0] || null,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId } = await req.json();
    if (!conversationId) {
      return new Response(JSON.stringify({ error: "Missing conversationId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load conversation + messages + lead
    const [convoRes, msgsRes, leadRes] = await Promise.all([
      supabase.from("conversations").select("*").eq("id", conversationId).single(),
      supabase
        .from("conversation_messages")
        .select("role, content, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(1000),
      supabase
        .from("captured_leads")
        .select("first_name, last_name, name, email, phone, service, notes, source")
        .eq("conversation_id", conversationId)
        .maybeSingle(),
    ]);

    if (convoRes.error || !convoRes.data) {
      return new Response(JSON.stringify({ error: "Conversation not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const messages = msgsRes.data || [];
    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "No messages to summarize" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Filter out system/action messages from transcript
    const cleanMessages = messages.filter((m) => {
      const c = m.content || "";
      if (c.startsWith("[SYSTEM:") || c.startsWith("[CURRENT_DATE_CONTEXT:")) return false;
      if (c.trim().startsWith('{"action_request"')) return false;
      return true;
    });

    // Build transcript for AI
    const transcript = cleanMessages
      .map((m) => `${m.role === "assistant" ? "NEO" : "Клиент"}: ${m.content}`)
      .join("\n");

    const lead = leadRes.data;
    const leadInfo = lead
      ? `\nДанни за клиента: ${[lead.first_name, lead.last_name].filter(Boolean).join(" ") || lead.name || "Неизвестен"}, email: ${lead.email || "няма"}, телефон: ${lead.phone || "няма"}, услуга: ${lead.service || "няма"}`
      : "";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let analysis: any = null;
    let usedFallback = false;

    if (LOVABLE_API_KEY) {
      try {
        const aiResponse = await fetch(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                {
                  role: "system",
                  content: `Ти си бизнес анализатор. Анализирай разговор между AI асистент (NEO) и клиент.

ВАЖНО:
- summary трябва да е КОНКРЕТНО за бизнеса: включи име на клиента, какво точно иска (пакет, услуга, час), дали е оставил данни.
- client_intent трябва да описва ТОЧНОТО намерение: "Иска да закупи пакет Essential" е добре, "Проявява интерес" е лошо.
- outcome трябва да описва КОНКРЕТНИЯ резултат: "Поръчка за пакет Essential изпратена, данни: Ангел, angelmalev7@gmail.com" е добре.
- action_items трябва да са ДЕЙСТВИЯ: "Обадете се на 0887700811 за финализиране на покупката" е добре.
- При имейли внимавай за грешни префикси: "imeilamieangelmalev7@gmail.com" всъщност е "angelmalev7@gmail.com" (имейла ми е = речеви префикс).
- Разпознавай транслитериран български: "iskam da kupq" = "искам да купя", "kazvam sa" = "казвам се".

Отговори САМО с валиден JSON обект (без markdown, без \`\`\`), съдържащ summary, client_intent, outcome, sentiment, tags, action_items, client_name, client_email, client_phone.`,
                },
                {
                  role: "user",
                  content: `Разговор (${cleanMessages.length} съобщения, ${Math.round((convoRes.data.duration_seconds || 0) / 60)} мин):${leadInfo}\n\n${transcript}`,
                },
              ],
              tools: [{
                type: "function",
                function: {
                  name: "conversation_analysis",
                  description: "Structured analysis of a customer conversation with specific, actionable details",
                  parameters: {
                    type: "object",
                    properties: {
                      summary: { type: "string", description: "Кратко конкретно резюме с име на клиент и какво иска" },
                      client_intent: { type: "string", description: "Точно намерение: какъв пакет/услуга/час" },
                      outcome: { type: "string", description: "Конкретен резултат с детайли" },
                      sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
                      tags: { type: "array", items: { type: "string" } },
                      action_items: { type: "array", items: { type: "string" }, description: "Конкретни действия с имена и контакти" },
                      client_name: { type: ["string", "null"] },
                      client_email: { type: ["string", "null"], description: "Чист имейл без речеви префикси" },
                      client_phone: { type: ["string", "null"] },
                    },
                    required: ["summary", "client_intent", "outcome", "sentiment", "tags", "client_name", "client_email", "client_phone"],
                  },
                },
              }],
              tool_choice: { type: "function", function: { name: "conversation_analysis" } },
            }),
          },
        );

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          console.error("[SUMMARIZE] AI error:", aiResponse.status, errText);
          usedFallback = true;
        } else {
          const aiData = await aiResponse.json();
          const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall?.function?.arguments) {
            analysis = JSON.parse(toolCall.function.arguments);
          } else {
            const content = aiData?.choices?.[0]?.message?.content || "";
            try {
              analysis = JSON.parse(content.replace(/```json?\n?|\n?```/g, "").trim());
            } catch {
              usedFallback = true;
            }
          }
        }
      } catch (error) {
        console.error("[SUMMARIZE] Fallback triggered:", error);
        usedFallback = true;
      }
    } else {
      usedFallback = true;
    }

    if (!analysis || usedFallback) {
      analysis = buildFallbackAnalysis(cleanMessages, transcript, lead);
    }

    // Clean extracted email from spoken prefixes
    if (analysis.client_email) {
      analysis.client_email = cleanEmailPrefix(analysis.client_email);
    }

    // Build rich summary text
    const richSummary = [
      analysis.summary,
      analysis.client_intent ? `\n🎯 Намерение: ${analysis.client_intent}` : "",
      analysis.outcome ? `\n✅ Резултат: ${analysis.outcome}` : "",
      analysis.tags?.length ? `\n🏷️ ${analysis.tags.join(", ")}` : "",
      analysis.action_items?.length
        ? `\n📋 Следващи стъпки: ${analysis.action_items.join("; ")}`
        : "",
    ]
      .filter(Boolean)
      .join("");

    // Update conversation
    const { error: updateError } = await supabase
      .from("conversations")
      .update({
        summary: richSummary,
        sentiment: analysis.sentiment || "neutral",
      })
      .eq("id", conversationId);

    if (updateError) {
      console.error("[SUMMARIZE] Update error:", updateError);
    }

    // Extract and upsert client data into captured_leads if AI found contact info
    const mergedClientName = analysis.client_name || lead?.name || [lead?.first_name, lead?.last_name].filter(Boolean).join(" ") || null;
    const mergedClientEmail = analysis.client_email || lead?.email || null;
    const mergedClientPhone = analysis.client_phone || lead?.phone || null;
    const hasClientData = mergedClientName || mergedClientEmail || mergedClientPhone;
    if (hasClientData) {
      const convo = convoRes.data;
      // Check if a lead already exists for this conversation
      const { data: existingLead } = await supabase
        .from("captured_leads")
        .select("id")
        .eq("conversation_id", conversationId)
        .maybeSingle();

      const leadData: Record<string, any> = {
        user_id: convo.user_id,
        conversation_id: conversationId,
        source: usedFallback ? "fallback_extraction" : "ai_extraction",
      };

      // Parse name into first/last
      if (mergedClientName) {
        const nameParts = mergedClientName.trim().split(/\s+/);
        leadData.first_name = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1).toLowerCase() : null;
        leadData.last_name = nameParts.slice(1).map((p: string) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(" ") || null;
        leadData.name = [leadData.first_name, leadData.last_name].filter(Boolean).join(" ");
      }
      // Clean email before saving
      if (mergedClientEmail) leadData.email = cleanEmailPrefix(mergedClientEmail);
      if (mergedClientPhone) leadData.phone = mergedClientPhone;

      if (existingLead) {
        await supabase
          .from("captured_leads")
          .update(leadData)
          .eq("id", existingLead.id);
        console.log("[SUMMARIZE] Updated existing lead:", existingLead.id);
        await supabase.from("conversations").update({ lead_captured: true }).eq("id", conversationId);
      } else {
        const { error: leadError } = await supabase
          .from("captured_leads")
          .insert(leadData);
        if (leadError) console.error("[SUMMARIZE] Lead insert error:", leadError);
        else {
          await supabase
            .from("conversations")
            .update({ lead_captured: true })
            .eq("id", conversationId);
          console.log("[SUMMARIZE] Created new lead from AI extraction");
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        summary: richSummary,
        sentiment: analysis.sentiment,
        analysis,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[SUMMARIZE] Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
