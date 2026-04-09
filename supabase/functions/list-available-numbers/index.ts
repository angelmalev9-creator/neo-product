import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const TWILIO_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH = Deno.env.get("TWILIO_AUTH_TOKEN");

    if (!TWILIO_SID || !TWILIO_AUTH) {
      return new Response(JSON.stringify({ error: "twilio_not_configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const auth = "Basic " + btoa(`${TWILIO_SID}:${TWILIO_AUTH}`);

    // Try TollFree, Local, then Mobile
    let numbers: any[] = [];

    for (const type of ["TollFree", "Local", "Mobile"]) {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/AvailablePhoneNumbers/BG/${type}.json?VoiceEnabled=true&PageSize=20`;
      const resp = await fetch(url, { headers: { Authorization: auth } });
      if (resp.ok) {
        const data = await resp.json();
        const typed = (data.available_phone_numbers || []).map((n: any) => ({ ...n, _type: type }));
        numbers = numbers.concat(typed);
      }
      if (numbers.length >= 10) break;
    }

    const TOLL_FREE_MONTHLY = 110.00;
    const LOCAL_MONTHLY = 1.00;
    const MARKUP = 1.20;

    const formatted = numbers.map((n: any) => ({
      phoneNumber: n.phone_number,
      friendlyName: n.friendly_name,
      locality: n.locality || "",
      region: n.region || "",
      capabilities: n.capabilities,
      twilioMonthly: BASE_MONTHLY,
      customerMonthly: parseFloat((BASE_MONTHLY * MARKUP).toFixed(2)),
      customerMonthlyBGN: parseFloat((BASE_MONTHLY * MARKUP * 1.80).toFixed(2)),
    }));

    return new Response(JSON.stringify({ numbers: formatted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
