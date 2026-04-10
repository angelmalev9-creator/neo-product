import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TRACK-USAGE] ${step}${detailsStr}`);
};

// Plan limits in minutes
const PLAN_LIMITS: Record<string, number> = {
  'starter': 500,
  'growth': 2500,
  'empire': 10000,
};

const normalizeNumber = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'No authorization header', success: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    let userId: string;

    try {
      const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
      if (claimsError || !claimsData?.claims?.sub) {
        logStep("Auth failed", { error: claimsError?.message });
        return new Response(
          JSON.stringify({ error: 'User not authenticated', success: false }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      userId = claimsData.claims.sub as string;
    } catch (authErr) {
      logStep("Auth exception", { message: String(authErr) });
      return new Response(
        JSON.stringify({ error: 'User not authenticated', success: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    logStep("User authenticated", { userId });

    const { action, duration_seconds, session_id, minutes } = await req.json();

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error('Profile not found');
    }

    const subscriptionTier = profile.subscription_tier || 'starter';
    const planLimit = PLAN_LIMITS[subscriptionTier] || 100;
    const currentUsed = parseFloat(profile.used_minutes || '0');

    logStep("Current usage", { 
      tier: subscriptionTier, 
      limit: planLimit, 
      used: currentUsed 
    });

    if (action === 'start_session') {
      const { data: session, error: sessionError } = await supabase
        .from('voice_sessions')
        .insert({
          user_id: userId,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (sessionError) {
        throw new Error(`Failed to create session: ${sessionError.message}`);
      }

      logStep("Session started", { sessionId: session.id });

      return new Response(
        JSON.stringify({ 
          success: true, 
          session_id: session.id,
          used_minutes: currentUsed,
          plan_limit: planLimit,
          remaining_minutes: Math.max(0, planLimit - currentUsed),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'end_session' && session_id) {
      const { data: session, error: fetchError } = await supabase
        .from('voice_sessions')
        .select('*')
        .eq('id', session_id)
        .eq('user_id', userId)
        .single();

      if (fetchError || !session) {
        throw new Error('Session not found');
      }

      const endTime = new Date();
      const startTime = new Date(session.started_at);
      const durationSec = (endTime.getTime() - startTime.getTime()) / 1000;
      const durationMin = durationSec / 60;

      await supabase
        .from('voice_sessions')
        .update({
          ended_at: endTime.toISOString(),
          duration_seconds: durationSec,
        })
        .eq('id', session_id);

      const newUsedMinutes = currentUsed + durationMin;
      await supabase
        .from('profiles')
        .update({
          used_minutes: newUsedMinutes,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      logStep("Session ended", { 
        sessionId: session_id, 
        durationMin: durationMin.toFixed(2),
        newTotal: newUsedMinutes.toFixed(2)
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          duration_minutes: durationMin,
          used_minutes: newUsedMinutes,
          plan_limit: planLimit,
          remaining_minutes: Math.max(0, planLimit - newUsedMinutes),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'add_speaking_time' && duration_seconds) {
      const durationMin = duration_seconds / 60;
      const newUsedMinutes = currentUsed + durationMin;

      if (newUsedMinutes > planLimit) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Usage limit exceeded',
            used_minutes: currentUsed,
            plan_limit: planLimit,
            remaining_minutes: 0,
          }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      await supabase
        .from('profiles')
        .update({
          used_minutes: newUsedMinutes,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      logStep("Speaking time added", { 
        addedSeconds: duration_seconds,
        newTotal: newUsedMinutes.toFixed(2)
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          used_minutes: newUsedMinutes,
          plan_limit: planLimit,
          remaining_minutes: Math.max(0, planLimit - newUsedMinutes),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'add_usage' && minutes !== undefined) {
      const durationMin = parseFloat(minutes) || 0;
      const newUsedMinutes = currentUsed + durationMin;

      await supabase
        .from('profiles')
        .update({
          used_minutes: newUsedMinutes,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      logStep("Usage added", { 
        addedMinutes: durationMin.toFixed(2),
        newTotal: newUsedMinutes.toFixed(2)
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          used_minutes: newUsedMinutes,
          plan_limit: planLimit,
          remaining_minutes: Math.max(0, planLimit - newUsedMinutes),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_usage') {
      const lastReset = new Date(profile.last_usage_reset || profile.created_at);
      const now = new Date();
      const daysSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24);

      let usedMinutes = currentUsed;

      if (daysSinceReset >= 30) {
        // Monthly reset - but recalculate from conversations in current period
        const newResetDate = now.toISOString();
        await supabase
          .from('profiles')
          .update({
            used_minutes: 0,
            last_usage_reset: newResetDate,
            updated_at: newResetDate,
          })
          .eq('user_id', userId);
        
        usedMinutes = 0;
        logStep("Monthly usage reset");
      } else if (usedMinutes === 0) {
        // If used_minutes is 0 but there is tracked history, recalculate from DB
        const [conversationsResult, voiceSessionsResult] = await Promise.all([
          supabase
            .from('conversations')
            .select('duration_seconds')
            .eq('user_id', userId)
            .gte('created_at', lastReset.toISOString())
            .not('duration_seconds', 'is', null),
          supabase
            .from('voice_sessions')
            .select('duration_seconds')
            .eq('user_id', userId)
            .gte('created_at', lastReset.toISOString())
            .not('duration_seconds', 'is', null),
        ]);

        const conversationMinutes = (conversationsResult.data || []).reduce(
          (sum: number, conversation: any) => sum + normalizeNumber(conversation.duration_seconds) / 60,
          0,
        );
        const voiceSessionMinutes = (voiceSessionsResult.data || []).reduce(
          (sum: number, session: any) => sum + normalizeNumber(session.duration_seconds) / 60,
          0,
        );
        const totalMinutes = conversationMinutes + voiceSessionMinutes;

        if (totalMinutes > 0) {
          usedMinutes = totalMinutes;
          await supabase
            .from('profiles')
            .update({ used_minutes: totalMinutes, updated_at: now.toISOString() })
            .eq('user_id', userId);
          logStep("Recalculated usage from history", {
            conversationMinutes: conversationMinutes.toFixed(2),
            voiceSessionMinutes: voiceSessionMinutes.toFixed(2),
            totalMinutes: totalMinutes.toFixed(2),
          });
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          used_minutes: usedMinutes,
          plan_limit: planLimit,
          remaining_minutes: Math.max(0, planLimit - usedMinutes),
          subscription_tier: subscriptionTier,
          days_until_reset: Math.max(0, 30 - daysSinceReset),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
