import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const TWILIO_SID = Deno.env.get("TWILIO_ACCOUNT_SID")!;
    const TWILIO_AUTH = Deno.env.get("TWILIO_AUTH_TOKEN")!;
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const PHONE_SERVER_URL = Deno.env.get("NEO_PHONE_SERVER_URL") || "https://phone.neo-assistant.com";

    if (!TWILIO_SID || !TWILIO_AUTH) {
      return new Response(JSON.stringify({ error: "Twilio не е конфигуриран" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("authorization") || "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { phoneNumber, sessionId } = body;

    if (!phoneNumber) {
      return new Response(JSON.stringify({ error: "Missing phoneNumber" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const auth = "Basic " + btoa(`${TWILIO_SID}:${TWILIO_AUTH}`);

    // Buy number from Twilio
    const buyResp = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/IncomingPhoneNumbers.json`,
      {
        method: "POST",
        headers: { Authorization: auth, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          PhoneNumber: phoneNumber,
          VoiceUrl: `${PHONE_SERVER_URL}/incoming-call`,
          VoiceMethod: "POST",
          StatusCallback: `${PHONE_SERVER_URL}/call-status`,
          StatusCallbackMethod: "POST",
        }),
      }
    );

    if (!buyResp.ok) {
      const errData = await buyResp.json();
      const msg = errData.message || errData.code || "Unknown error";
      const isUpgradeNeeded = msg.toLowerCase().includes("upgrade");
      return new Response(JSON.stringify({
        error: isUpgradeNeeded
          ? "Twilio акаунтът е в пробен режим. Моля, ъпгрейднете го от console.twilio.com, за да можете да купувате номера."
          : `Не успяхме да закупим номера: ${msg}`,
        upgrade_required: isUpgradeNeeded,
      }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const twilioNumber = await buyResp.json();
    const twilioMonthlyCost = 1.00;
    const customerPrice = parseFloat((twilioMonthlyCost * 1.20).toFixed(2));

    const { data: phoneRecord, error: dbErr } = await supabase
      .from("phone_numbers")
      .insert({
        session_id: sessionId,
        user_id: user.id,
        twilio_sid: twilioNumber.sid,
        phone_number: twilioNumber.phone_number,
        friendly_name: twilioNumber.friendly_name,
        twilio_cost_monthly: twilioMonthlyCost,
        customer_price_monthly: customerPrice,
        status: "active",
        webhook_url: `${PHONE_SERVER_URL}/incoming-call`,
      })
      .select()
      .single();

    if (dbErr) {
      // Rollback — release from Twilio
      await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/IncomingPhoneNumbers/${twilioNumber.sid}.json`,
        { method: "DELETE", headers: { Authorization: auth } }
      );
      return new Response(JSON.stringify({ error: "DB грешка, номерът беше освободен" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, phone: phoneRecord }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
