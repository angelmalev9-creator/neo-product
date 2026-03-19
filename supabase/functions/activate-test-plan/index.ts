import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Auth failed");

    const { tier } = await req.json();
    const validTiers = ["starter", "growth", "empire"];
    if (!validTiers.includes(tier)) throw new Error("Invalid tier");

    // Activate subscription directly (no Stripe) - 30 days from now
    const subscriptionEnd = new Date();
    subscriptionEnd.setDate(subscriptionEnd.getDate() + 30);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        subscription_status: "active",
        subscription_tier: tier,
        subscription_end: subscriptionEnd.toISOString(),
      })
      .eq("user_id", userData.user.id);

    if (updateError) throw updateError;

    console.log(`[ACTIVATE-TEST-PLAN] Activated ${tier} for user ${userData.user.id}`);

    return new Response(JSON.stringify({ success: true, tier, subscription_end: subscriptionEnd.toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
