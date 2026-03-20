import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { userId, firstName, lastName, email, phone, service, conversationId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const name = [firstName, lastName].filter(Boolean).join(" ") || null;

    const { data, error } = await supabase
      .from("captured_leads")
      .insert({
        user_id: userId,
        first_name: firstName || null,
        last_name: lastName || null,
        name,
        email: email || null,
        phone: phone || null,
        service: service || null,
        conversation_id: conversationId || null,
        source: "widget",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Lead capture error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark conversation as lead_captured
    if (conversationId) {
      await supabase
        .from("conversations")
        .update({ lead_captured: true, updated_at: new Date().toISOString() })
        .eq("id", conversationId);
    }

    return new Response(JSON.stringify({ ok: true, leadId: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("widget-capture-lead error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});