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

    // Build system prompt
    const companyName = profile.company_name || demoSession?.company_name || "компанията";
    let systemPrompt = profile.custom_system_prompt || profile.prompt_template || "";

    // If no custom prompt, build a default one
    if (!systemPrompt) {
      systemPrompt = `Ти си NEO — AI гласов асистент на ${companyName}. Отговаряй кратко и професионално на български език.`;
      if (demoSession?.summary) {
        systemPrompt += `\n\nИнформация за компанията:\n${demoSession.summary}`;
      }
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
