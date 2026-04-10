import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const normalizeText = (value: string) => String(value || "").replace(/\s+/g, " ").trim();

const extractIncrementalMessage = (previous: string, incoming: string) => {
  const prev = normalizeText(previous);
  const next = normalizeText(incoming);

  if (!next) return "";
  if (!prev) return next;
  if (next === prev || prev.includes(next)) return "";
  if (next.startsWith(prev)) return normalizeText(next.slice(prev.length));

  const repeatedIndex = next.indexOf(prev);
  if (repeatedIndex >= 0) {
    return normalizeText(next.slice(repeatedIndex + prev.length));
  }

  const maxOverlap = Math.min(prev.length, next.length);
  for (let len = maxOverlap; len >= 10; len -= 1) {
    if (prev.slice(-len) === next.slice(0, len)) {
      return normalizeText(next.slice(len));
    }
  }

  return next;
};

const parseSeconds = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, userId, conversationId, userMessage, assistantMessage, durationSeconds, seq } = await req.json();

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

      // Use client-provided seq number for reliable chronological ordering.
      // Base timestamp = conversation start or now, then offset by seq * 100ms
      // to guarantee strict monotonic order regardless of network timing.
      const seqNum = typeof seq === "number" && seq > 0 ? seq : 0;

      const { data: recentMessages } = await supabase
        .from("conversation_messages")
        .select("role, content, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(8);

      const latestUserMessage = recentMessages?.find((message) => message.role === "user")?.content || "";
      const latestAssistantMessage = recentMessages?.find((message) => message.role === "assistant")?.content || "";

      // Compute a base timestamp: use the conversation's started_at for consistency
      let baseTimestamp: number;
      if (seqNum > 0) {
        const { data: convoData } = await supabase
          .from("conversations")
          .select("started_at")
          .eq("id", conversationId)
          .maybeSingle();
        baseTimestamp = convoData?.started_at
          ? new Date(convoData.started_at).getTime()
          : Date.now() - 60000;
      } else {
        // Fallback: use last message timestamp (legacy behavior)
        baseTimestamp = recentMessages?.[0]?.created_at
          ? new Date(recentMessages[0].created_at).getTime()
          : Date.now() - 100;
      }

      const inserts: { conversation_id: string; role: string; content: string; created_at: string }[] = [];

      if (userMessage) {
        const nextUserMessage = extractIncrementalMessage(latestUserMessage, userMessage);
        if (nextUserMessage) {
          // User messages get seq * 200ms offset from base
          const ts = seqNum > 0
            ? new Date(baseTimestamp + seqNum * 200).toISOString()
            : new Date(Math.max(Date.now(), baseTimestamp + 40)).toISOString();
          inserts.push({
            conversation_id: conversationId,
            role: "user",
            content: nextUserMessage,
            created_at: ts,
          });
        }
      }

      if (assistantMessage) {
        const nextAssistantMessage = extractIncrementalMessage(latestAssistantMessage, assistantMessage);
        if (nextAssistantMessage) {
          // Assistant messages get seq * 200ms + 100ms to always come AFTER the user message
          const ts = seqNum > 0
            ? new Date(baseTimestamp + seqNum * 200 + 100).toISOString()
            : new Date(Math.max(Date.now(), baseTimestamp + 80)).toISOString();
          inserts.push({
            conversation_id: conversationId,
            role: "assistant",
            content: nextAssistantMessage,
            created_at: ts,
          });
        }
      }

      if (inserts.length > 0) {
        const { error } = await supabase.from("conversation_messages").insert(inserts);
        if (error) console.error("message insert error:", error);

        const { count: messageCount } = await supabase
          .from("conversation_messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", conversationId);

        await supabase
          .from("conversations")
          .update({ messages_count: messageCount || 0, updated_at: new Date().toISOString() })
          .eq("id", conversationId);
      }

      return new Response(JSON.stringify({ ok: true, inserted: inserts.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ADD_USAGE ──
    if (action === "add_usage") {
      const addedSeconds = parseSeconds(durationSeconds);

      if (conversationId && durationSeconds) {
        const { data: conversation } = await supabase
          .from("conversations")
          .select("duration_seconds")
          .eq("id", conversationId)
          .maybeSingle();

        const currentDurationSeconds = parseSeconds(conversation?.duration_seconds);
        const nextDurationSeconds = currentDurationSeconds + addedSeconds;

        await supabase
          .from("conversations")
          .update({
            duration_seconds: nextDurationSeconds,
            updated_at: new Date().toISOString(),
          })
          .eq("id", conversationId);
      }

      // Also update profiles.used_minutes for real-time dashboard tracking
      if (addedSeconds > 0) {
        const addedMinutes = addedSeconds / 60;
        const { data: profile } = await supabase
          .from("profiles")
          .select("used_minutes")
          .eq("user_id", userId)
          .single();

        if (profile) {
          const currentUsed = parseFloat(String(profile.used_minutes || 0));
          await supabase
            .from("profiles")
            .update({
              used_minutes: currentUsed + addedMinutes,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);
        }
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
        .select("started_at, duration_seconds")
        .eq("id", conversationId)
        .single();

      let duration = 0;
      if (convo?.started_at) {
        duration = Math.round((Date.now() - new Date(convo.started_at).getTime()) / 1000);
      }

      const existingDurationSeconds = parseSeconds(convo?.duration_seconds);
      const finalDurationSeconds = Math.max(existingDurationSeconds, duration);

      await supabase
        .from("conversations")
        .update({
          ended_at: now,
          duration_seconds: finalDurationSeconds,
          messages_count: count || 0,
          updated_at: now,
        })
        .eq("id", conversationId);

      // Update profiles.used_minutes only with any untracked remainder
      const untrackedDurationSeconds = Math.max(0, finalDurationSeconds - existingDurationSeconds);
      if (untrackedDurationSeconds > 0) {
        const addedMinutes = untrackedDurationSeconds / 60;
        const { data: profile } = await supabase
          .from("profiles")
          .select("used_minutes")
          .eq("user_id", userId)
          .single();

        if (profile) {
          const currentUsed = parseFloat(String(profile.used_minutes || 0));
          await supabase
            .from("profiles")
            .update({
              used_minutes: currentUsed + addedMinutes,
              updated_at: now,
            })
            .eq("user_id", userId);
          console.log(`[TRACK] Updated used_minutes: ${currentUsed} + ${addedMinutes.toFixed(2)} = ${(currentUsed + addedMinutes).toFixed(2)}`);
        }
      }

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