import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

const getSupabaseAdmin = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

const getUserId = async (req: Request): Promise<string | null> => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data } = await supabase.auth.getUser(token);
  return data?.user?.id || null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, code } = await req.json();

    const REDIRECT_URI = "https://neo-assistant.com/dashboard";
    const userId = await getUserId(req);

    if (!userId) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = getSupabaseAdmin();

    // ── GET AUTH URL ──
    if (action === "get-auth-url") {
      const scopes = [
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/userinfo.email",
      ].join(" ");

      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: "code",
        scope: scopes,
        access_type: "offline",
        prompt: "select_account",
      });

      return new Response(
        JSON.stringify({ authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── EXCHANGE CODE ──
    if (action === "exchange-code") {
      if (!code) {
        return new Response(JSON.stringify({ error: "Missing code or redirectUri" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Exchange authorization code for tokens
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      });

      const tokenData = await tokenRes.json();
      if (tokenData.error) {
        console.error("Token exchange error:", tokenData);
        return new Response(JSON.stringify({ error: tokenData.error_description || tokenData.error }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get user email
      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const userInfo = await userInfoRes.json();

      // Store tokens in email_settings
      const expiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString();

      await admin
        .from("email_settings")
        .upsert(
          {
            user_id: userId,
            gmail_connected: true,
            gmail_email: userInfo.email,
            gmail_access_token: tokenData.access_token,
            gmail_refresh_token: tokenData.refresh_token || null,
            gmail_token_expires_at: expiresAt,
          },
          { onConflict: "user_id" },
        );

      return new Response(
        JSON.stringify({ success: true, email: userInfo.email }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── DISCONNECT ──
    if (action === "disconnect") {
      await admin
        .from("email_settings")
        .update({
          gmail_connected: false,
          gmail_email: null,
          gmail_access_token: null,
          gmail_refresh_token: null,
          gmail_token_expires_at: null,
          email_enabled: false,
        })
        .eq("user_id", userId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── SEND EMAIL ──
    if (action === "send-email") {
      const { to, subject, body: htmlBody, senderName } = await req.json().catch(() => ({}));
      // We already parsed req.json above, re-parse from the original action body
      // Actually we need to get these from the same parsed body
      return new Response(JSON.stringify({ error: "Use send-gmail-email function" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── REFRESH TOKEN (internal) ──
    if (action === "refresh-token") {
      const { data: settings } = await admin
        .from("email_settings")
        .select("gmail_refresh_token")
        .eq("user_id", userId)
        .single();

      if (!settings?.gmail_refresh_token) {
        return new Response(JSON.stringify({ error: "No refresh token" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          refresh_token: settings.gmail_refresh_token,
          grant_type: "refresh_token",
        }),
      });

      const refreshData = await refreshRes.json();
      if (refreshData.error) {
        return new Response(JSON.stringify({ error: refreshData.error }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const newExpires = new Date(Date.now() + (refreshData.expires_in || 3600) * 1000).toISOString();

      await admin
        .from("email_settings")
        .update({
          gmail_access_token: refreshData.access_token,
          gmail_token_expires_at: newExpires,
        })
        .eq("user_id", userId);

      return new Response(
        JSON.stringify({ success: true, access_token: refreshData.access_token }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("gmail-oauth error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
