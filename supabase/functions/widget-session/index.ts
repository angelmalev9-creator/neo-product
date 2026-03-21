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
    console.log("[WIDGET-SESSION] Function started");

    const { userId } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("company_name, custom_system_prompt, prompt_template, widget_config, logo_url, website_url, selected_voice, voice_speed")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "User profile not found" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user's demo session (scraped site data) for knowledge base
    const { data: demoSession } = await supabase
      .from("demo_sessions")
      .select("id, url, summary, status, company_name, structured_data")
      .eq("user_id", userId)
      .eq("status", "ready")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fetch calendar settings
    const { data: calSettings } = await supabase
      .from("calendar_settings")
      .select("calendar_enabled, booking_type, default_meeting_duration, working_hours_start, working_hours_end, working_days, auto_book_after_conversation, required_booking_fields")
      .eq("user_id", userId)
      .maybeSingle();

    // Resolve company name from multiple sources
    let companyName = profile.company_name || demoSession?.company_name || "";
    
    // Try to extract from structured_data
    if (!companyName && demoSession?.structured_data) {
      const sd = typeof demoSession.structured_data === 'string' 
        ? JSON.parse(demoSession.structured_data) 
        : demoSession.structured_data;
      companyName = sd?.company_name || sd?.companyName || sd?.name || "";
    }
    
    // Try to extract from summary (first line often has the site name)
    if (!companyName && demoSession?.summary) {
      const titleMatch = demoSession.summary.match(/===\s*(.+?)(?:\s*[-—|]|===)/);
      if (titleMatch) {
        companyName = titleMatch[1].trim();
      }
    }
    
    // Fallback to domain name
    if (!companyName && demoSession?.url) {
      try {
        const domain = new URL(demoSession.url).hostname.replace(/^www\./, '');
        companyName = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
      } catch {}
    }
    
    if (!companyName) companyName = "компанията";

    let systemPrompt = profile.custom_system_prompt || profile.prompt_template || "";

    // If no custom prompt, build a default one
    if (!systemPrompt) {
      systemPrompt = `Ти си NEO — AI гласов асистент на ${companyName}. Отговаряй кратко и професионално на български език.`;
      if (demoSession?.summary) {
        systemPrompt += `\n\nИнформация за компанията:\n${demoSession.summary}`;
      }
    }

    // Add calendar instructions if enabled — placed as HIGH-PRIORITY override
    if (calSettings?.calendar_enabled) {
      // CRITICAL: Strip ALL form-related instructions from the prompt
      // This prevents Gemini from using submit_form when calendar is the intended booking mechanism
      systemPrompt = systemPrompt
        .replace(/ФОРМИ\/ДЕЙСТВИЯ[^]*?(?=\n\n[A-ZА-Я]|\n\nEXECUTION|\z)/g, '')
        .replace(/ФОРМИ[^]*?(?=\n\n[A-ZА-Я]|\n\nEXECUTION|\z)/g, '')
        .replace(/can_submit_forms:\s*true/g, 'can_submit_forms: false')
        .replace(/submit_form/g, '(DISABLED)')
        .replace(/контактна\s*форма/gi, 'календар за записване')
        .replace(/контактната\s*форма/gi, 'календара за записване')
        .replace(/форма(?:та)?\s+за\s+(?:контакт|запитване|връзка)/gi, 'календар за записване')
        .replace(/попълн(?:им|ете|ите)\s+форма/gi, 'запишем час')
        .replace(/изпрат(?:им|ете|я)\s+запитване/gi, 'запишем час')
        .replace(/подам\s+запитване/gi, 'запиша час');

      const bt = calSettings.booking_type || "consultation";
      const label = bt === "reservation" ? "резервация" : bt === "meeting" ? "среща" : "консултация";
      const labelPlural = bt === "reservation" ? "резервации" : bt === "meeting" ? "срещи" : "консултации";
      const days = (calSettings.working_days || [1,2,3,4,5]).map((d: number) => {
        const names = ["неделя","понеделник","вторник","сряда","четвъртък","петък","събота"];
        return names[d];
      }).join(", ");
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      // Build required fields instruction
      const reqFields: string[] = calSettings.required_booking_fields || ["name"];
      const fieldLabels: Record<string, string> = { name: "име", email: "имейл", phone: "телефон", service: "услуга" };
      const requiredFieldsList = reqFields.map((f: string) => fieldLabels[f] || f).join(", ");
      const fieldJsonHints = reqFields.map((f: string) => {
        if (f === "name") return '"attendee_name":"Име"';
        if (f === "email") return '"attendee_email":"имейл"';
        if (f === "phone") return '"attendee_phone":"телефон"';
        if (f === "service") return '"service":"услуга"';
        return "";
      }).filter(Boolean).join(",");
      
      systemPrompt += `

##############################
# КАЛЕНДАР — МАКСИМАЛЕН ПРИОРИТЕТ #
##############################

Имаш ВГРАДЕН календар за ${labelPlural}. Това е РЕАЛНА система за записване.
Работно време: ${calSettings.working_hours_start || "09:00"}-${calSettings.working_hours_end || "18:00"}
Работни дни: ${days}
Продължителност: ${calSettings.default_meeting_duration || 30} мин

АБСОЛЮТНИ ПРАВИЛА (нарушаването им е ЗАБРАНЕНО):
1. Когато клиент иска ${label}, час, запазване, записване, среща, консултация или резервация → ИЗПОЛЗВАЙ book_slot
2. НИКОГА не казвай "нямаме система", "не мога да запиша", "нямаме онлайн система" — ИМАШ КАЛЕНДАР!
3. НИКОГА не използвай submit_form — тази команда е НАПЪЛНО ДЕАКТИВИРАНА
4. НИКОГА не пренасочвай към контактна форма — НЯМАШ ФОРМА, ИМАШ КАЛЕНДАР
5. НИКОГА не питай "искате ли да подам запитването чрез формата" — НЯМА ФОРМА
6. Казвай "${label}" (не "среща" ако типът е "резервация" и обратно)
7. ПРОАКТИВНО предлагай: "Искате ли да ви запиша ${label}? Мога да проверя свободните часове."

ЗАДЪЛЖИТЕЛНИ ДАННИ ПРЕДИ ЗАПИСВАНЕ:
Преди да извикаш book с action="book", ТРЯБВА да събереш следните данни от клиента: ${requiredFieldsList}.
Питай ги по естествен начин в разговора. НЕ записвай час без тези данни.

ДЕЙСТВИЯ С КАЛЕНДАРА (връщаш САМО JSON, без текст преди/след):

Стъпка 1 — ВИНАГИ първо провери свободни часове:
{"type":"action_request","action":"book_slot","calendar_action":"get_slots","owner_user_id":"${userId}","date":"${tomorrowStr}"}

Стъпка 2 — След като клиентът избере час И дадеш всички данни:
{"type":"action_request","action":"book_slot","calendar_action":"book","owner_user_id":"${userId}","date":"YYYY-MM-DD","time":"HH:MM",${fieldJsonHints}}

ВАЖНО: Ако клиентът не уточни дата, използвай ${tomorrowStr}. Ако попита кога си свободен, извикай get_slots.
ВАЖНО: Когато връщаш JSON за book_slot, отговорът трябва да съдържа САМО JSON обекта. Никакъв текст.
ВАЖНО: Ако клиентът поиска ${label} или час, ВЕДНАГА извикай get_slots и предложи часове. НЕ питай нищо за форма.`;
    }

    const response = {
      systemPrompt,
      companyName,
      widgetConfig: profile.widget_config || null,
      logoUrl: profile.logo_url || null,
      websiteUrl: profile.website_url || null,
      selectedVoice: profile.selected_voice || null,
      voiceSpeed: profile.voice_speed || 1,
      // Pass sessionId so widget can use gemini-session with knowledge
      sessionId: demoSession?.id || null,
    };

    console.log("[WIDGET-SESSION] Returning session data, sessionId:", demoSession?.id || "none");

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[WIDGET-SESSION] Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
