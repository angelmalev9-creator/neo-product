import { useState, useCallback, useRef } from "react";

interface SimpleState {
  session_id: string;
  site_id?: string;
  site_url?: string;
  company_name: string;
  conversation_history: Array<{ role: "user" | "assistant"; content: string }>;
}

interface AgentResponse {
  success: boolean;
  response?: string;
  state?: SimpleState | null;
  error?: string;
  build_id?: string;
  context_for_prompt?: string;
  context_char_count?: number;
  observation?: {
    prices?: string[];
    hasAvailability?: boolean;
    noAvailability?: boolean;
    url?: string;
    title?: string;
  } | null;
  action_taken?: string | null;
  greeting?: string;
}

interface UseAgentCoreProps {
  onAction?: (action: string) => void;
  onError?: (error: string) => void;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://onufuxczpqlxxkgyltlz.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

async function safeJson(res: Response): Promise<any> {
  try { return await res.json(); } catch { return null; }
}

function pickError(payload: any, fallback: string) {
  if (!payload) return fallback;
  return payload.error || payload.details || payload.response || payload.message || (typeof payload === "string" ? payload : "") || fallback;
}

export const useAgentCore = ({ onAction, onError }: UseAgentCoreProps = {}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const stateRef = useRef<SimpleState | null>(null);
  const initializingRef = useRef<string | null>(null);
  const contextRef = useRef<string>("");
  const buildIdRef = useRef<string>("");
  const lastSessionIdRef = useRef<string>("");

  const initialize = useCallback(async (sessionId: string): Promise<string | null> => {
    if (!sessionId) return null;
    if (initializingRef.current === sessionId) return null;
    if (stateRef.current?.session_id === sessionId) return null;

    initializingRef.current = sessionId;
    lastSessionIdRef.current = sessionId;

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/neo-agent-core`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
        body: JSON.stringify({ action: "init", session_id: sessionId }),
      });
      const payload = await safeJson(res);
      if (!res.ok) throw new Error(pickError(payload, `HTTP ${res.status}`));
      const data = payload as AgentResponse;
      buildIdRef.current = data?.build_id || "";
      if (data?.context_for_prompt) contextRef.current = data.context_for_prompt;
      if (data?.success && data?.state) {
        stateRef.current = data.state;
        setIsInitialized(true);
        return (data.greeting || payload?.greeting || null) as string | null;
      }
      throw new Error(pickError(data, "Initialization failed"));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Initialization failed";
      onError?.(msg);
      initializingRef.current = null;
      return null;
    } finally {
      initializingRef.current = null;
    }
  }, [onError]);

  const processMessage = useCallback(async (userMessage: string): Promise<string | null> => {
    const clean = (userMessage || "").trim();
    if (!clean) return null;
    if (!stateRef.current) {
      const sid = lastSessionIdRef.current;
      if (sid) await initialize(sid);
    }
    if (!stateRef.current) throw new Error("Agent not initialized");

    setIsProcessing(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/neo-agent-core`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
        body: JSON.stringify({
          action: "respond",
          session_id: stateRef.current.session_id,
          user_message: clean,
          state: stateRef.current,
        }),
      });
      const payload = await safeJson(res);
      if (!res.ok) throw new Error(pickError(payload, `HTTP ${res.status}`));
      const data = payload as AgentResponse;
      if (data?.build_id) buildIdRef.current = data.build_id;
      if (data?.context_for_prompt) contextRef.current = data.context_for_prompt;
      if (data?.success) {
        if (data.state) stateRef.current = data.state;
        if (data.action_taken) onAction?.(data.action_taken);
        return data.response || null;
      }
      throw new Error(pickError(data, "Backend returned success:false"));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Processing failed";
      onError?.(msg);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [initialize, onAction, onError]);

  const processAction = useCallback(async (payload: {
    sessionId?: string;
    intent: string;
    collected_fields?: Record<string, any>;
    missing_fields?: string[];
    page_url?: string;
  }): Promise<AgentResponse | null> => {
    const sid = payload.sessionId || stateRef.current?.session_id || lastSessionIdRef.current || "";
    if (!sid) throw new Error("Missing session id for action.");
    setIsProcessing(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/neo-agent-core`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
        body: JSON.stringify({ action: "act", session_id: sid, payload, state: stateRef.current }),
      });
      const data = (await safeJson(res)) as AgentResponse;
      if (!res.ok) throw new Error(pickError(data, `HTTP ${res.status}`));
      return data || null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const getState = useCallback(() => stateRef.current, []);
  const getContextForPrompt = useCallback(() => contextRef.current || "", []);
  const getBuildId = useCallback(() => buildIdRef.current || "", []);
  const reset = useCallback(() => {
    stateRef.current = null;
    contextRef.current = "";
    buildIdRef.current = "";
    setIsInitialized(false);
  }, []);

  return { isInitialized, isProcessing, initialize, processMessage, processAction, getState, getContextForPrompt, getBuildId, reset };
};
