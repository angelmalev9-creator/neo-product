import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
        .limit(200),
      supabase
        .from("captured_leads")
        .select("first_name, last_name, name, email, phone, service, notes")
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

    // Build transcript for AI
    const transcript = messages
      .map((m) => `${m.role === "assistant" ? "NEO" : "Клиент"}: ${m.content}`)
      .join("\n");

    const lead = leadRes.data;
    const leadInfo = lead
      ? `\nДанни за клиента: ${[lead.first_name, lead.last_name].filter(Boolean).join(" ") || lead.name || "Неизвестен"}, email: ${lead.email || "няма"}, телефон: ${lead.phone || "няма"}, услуга: ${lead.service || "няма"}`
      : "";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
              content: `Ти си бизнес анализатор. Анализирай разговор между AI асистент (NEO) и клиент. Отговори САМО с валиден JSON обект (без markdown, без \`\`\`), съдържащ:

{
  "summary": "Кратко обобщение (2-3 изречения) — какво е искал клиентът и какъв е резултатът",
  "client_intent": "Какво точно е искал клиентът (1 изречение)",
  "outcome": "Какъв е резултатът от разговора (1 изречение)",
  "sentiment": "positive" | "neutral" | "negative",
  "tags": ["масив", "от", "ключови", "теми"],
  "action_items": ["масив от следващи стъпки ако има такива"],
  "client_name": "Пълното име на клиента ако е споменато в разговора, иначе null",
  "client_email": "Имейлът на клиента ако е споменат, иначе null",
  "client_phone": "Телефонният номер на клиента ако е споменат (само цифри), иначе null"
}

Пиши на български. Бъди кратък и конкретен. Извличай данните на клиента директно от транскрипцията — ако клиентът е казал името си, имейла или телефона, задължително ги включи.`,
            },
            {
              role: "user",
              content: `Разговор (${messages.length} съобщения, ${Math.round((convoRes.data.duration_seconds || 0) / 60)} мин):${leadInfo}\n\n${transcript}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "conversation_analysis",
                description: "Structured analysis of a customer conversation",
                parameters: {
                  type: "object",
                  properties: {
                    summary: { type: "string", description: "2-3 sentence summary in Bulgarian" },
                    client_intent: { type: "string", description: "What the client wanted" },
                    outcome: { type: "string", description: "Result of the conversation" },
                    sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
                    tags: { type: "array", items: { type: "string" }, description: "Key topics" },
                    action_items: { type: "array", items: { type: "string" }, description: "Next steps if any" },
                    client_name: { type: "string", description: "Client full name if mentioned, null otherwise" },
                    client_email: { type: "string", description: "Client email if mentioned, null otherwise" },
                    client_phone: { type: "string", description: "Client phone number (digits only) if mentioned, null otherwise" },
                  },
                  required: ["summary", "client_intent", "outcome", "sentiment", "tags"],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "conversation_analysis" } },
        }),
      },
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("[SUMMARIZE] AI error:", aiResponse.status, errText);
      return new Response(
        JSON.stringify({ error: `AI error: ${aiResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiData = await aiResponse.json();
    let analysis: any;

    // Extract from tool call response
    const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      analysis = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try parsing content as JSON
      const content = aiData?.choices?.[0]?.message?.content || "";
      try {
        analysis = JSON.parse(content.replace(/```json?\n?|\n?```/g, "").trim());
      } catch {
        analysis = { summary: content, sentiment: "neutral", tags: [], client_intent: "", outcome: "" };
      }
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

    // ── Extract & save client data from transcript ──
    const cleanNull = (v: any) => (v && v !== "null" && v !== "none" && v !== "няма") ? String(v).trim() : null;
    const cName = cleanNull(analysis.client_name);
    const cEmail = cleanNull(analysis.client_email);
    const cPhone = cleanNull(analysis.client_phone);
    const hasClientData = cName || cEmail || cPhone;
    if (hasClientData && !lead) {
      const nameParts = (analysis.client_name || "").trim().split(/\s+/);
      const firstName = nameParts[0] || null;
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

      const { error: leadErr } = await supabase.from("captured_leads").insert({
        user_id: convoRes.data.user_id,
        conversation_id: conversationId,
        first_name: firstName,
        last_name: lastName,
        name: analysis.client_name || null,
        email: analysis.client_email || null,
        phone: analysis.client_phone || null,
        source: "ai_extraction",
      });
      if (leadErr) console.error("[SUMMARIZE] Lead insert error:", leadErr);
      else {
        await supabase.from("conversations").update({ lead_captured: true }).eq("id", conversationId);
        console.log("[SUMMARIZE] Extracted lead:", { name: analysis.client_name, email: analysis.client_email, phone: analysis.client_phone });
      }
    } else if (hasClientData && lead) {
      // Update existing lead with any new data
      const updates: Record<string, string> = {};
      if (analysis.client_name && !lead.name && !lead.first_name) {
        const nameParts = analysis.client_name.trim().split(/\s+/);
        updates.first_name = nameParts[0];
        if (nameParts.length > 1) updates.last_name = nameParts.slice(1).join(" ");
        updates.name = analysis.client_name;
      }
      if (analysis.client_email && !lead.email) updates.email = analysis.client_email;
      if (analysis.client_phone && !lead.phone) updates.phone = analysis.client_phone;
      if (Object.keys(updates).length > 0) {
        await supabase.from("captured_leads").update(updates).eq("conversation_id", conversationId);
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
