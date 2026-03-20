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
    const { action, userId, conversationId, userMessage, assistantMessage, durationSeconds } = await req.json();

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

    // ── START ──
    if (action === "start") {
      const { data, error } = await supabase
        .from("conversations")
        .insert({
          user_id: userId,
          session_type: "widget",
          started_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (error) {
        console.error("start error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ conversationId: data.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── MESSAGE ──
    if (action === "message") {
      if (!conversationId) {
        return new Response(JSON.stringify({ ok: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const inserts: { conversation_id: string; role: string; content: string }[] = [];

      if (userMessage) {
        inserts.push({ conversation_id: conversationId, role: "user", content: userMessage });
      }
      if (assistantMessage) {
        inserts.push({ conversation_id: conversationId, role: "assistant", content: assistantMessage });
      }

      if (inserts.length > 0) {
        const { error } = await supabase.from("conversation_messages").insert(inserts);
        if (error) console.error("message insert error:", error);

        // Update messages_count
        await supabase.rpc("increment_messages_count" as any, {
          conv_id: conversationId,
          delta: inserts.length,
        }).then(() => {}).catch(() => {
          // Fallback: manual update
          supabase
            .from("conversations")
            .update({ messages_count: inserts.length, updated_at: new Date().toISOString() })
            .eq("id", conversationId)
            .then(() => {});
        });
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ADD_USAGE ──
    if (action === "add_usage") {
      if (conversationId && durationSeconds) {
        await supabase
          .from("conversations")
          .update({
            duration_seconds: durationSeconds,
            updated_at: new Date().toISOString(),
          })
          .eq("id", conversationId);
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── END ──
    if (action === "end") {
      if (!conversationId) {
        return new Response(JSON.stringify({ ok: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const now = new Date().toISOString();

      // Get messages count
      const { count } = await supabase
        .from("conversation_messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", conversationId);

      // Get conversation start time for duration
      const { data: convo } = await supabase
        .from("conversations")
        .select("started_at")
        .eq("id", conversationId)
        .single();

      let duration = 0;
      if (convo?.started_at) {
        duration = Math.round((Date.now() - new Date(convo.started_at).getTime()) / 1000);
      }

      await supabase
        .from("conversations")
        .update({
          ended_at: now,
          duration_seconds: duration,
          messages_count: count || 0,
          updated_at: now,
        })
        .eq("id", conversationId);

      // Auto-summarize if there are messages
      if (count && count > 0) {
        try {
          const baseUrl = Deno.env.get("SUPABASE_URL")!;
          const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

          // Fire-and-forget summarize
          fetch(`${baseUrl}/functions/v1/summarize-conversation`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${serviceKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ conversationId }),
          }).catch((e) => console.error("Auto-summarize call failed:", e));
        } catch (e) {
          console.error("Auto-summarize error:", e);
        }
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("widget-track-conversation error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});