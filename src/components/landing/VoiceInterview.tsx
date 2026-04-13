import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Phone, PhoneOff, Clock, Send, MicOff, Mic } from "lucide-react";
import VoicePicker from "@/components/dashboard/VoicePicker";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useGeminiVoice } from "@/hooks/useGeminiVoice";
import { useAudioEffects } from "@/hooks/useAudioEffects";
import { useAgentCore } from "@/hooks/useAgentCore";
import DemoEndModal from "./DemoEndModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { z } from "zod";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// Note: cleanTranscript function is used in handleMessage callback

/**
 * Clean raw voice transcript by removing fillers, repetitions, and structuring sentences.
 * Uses a backend LLM call to process the text.
 */
async function cleanTranscript(rawText: string, role: "user" | "assistant"): Promise<string> {
  // Keep cleaning available for short utterances too ("Да", "Не", etc.)
  // but avoid wasting calls for extremely short/noisy chunks.
  if (!rawText || rawText.trim().length < 3) return rawText;

  try {
    const { data, error } = await supabase.functions.invoke("clean-transcript", {
      body: { text: rawText, role },
    });

    if (error || !data?.cleaned) {
      console.warn("[VoiceInterview] Transcript cleaning failed, using raw:", error);
      return rawText;
    }

    return data.cleaned;
  } catch (err) {
    console.error("[VoiceInterview] cleanTranscript error:", err);
    return rawText;
  }
}

interface VoiceInterviewProps {
  sessionId: string | null;
}

type DemoEmailLog = {
  id: string;
  created_at: string;
  sent_at: string | null;
  recipient_email: string;
  subject: string;
  body: string;
  status: string | null;
  intent: string | null;
  is_demo: boolean | null;
};

const DEMO_DURATION_SECONDS = 300;

// ✅ CRITICAL: Final message needs 10+ seconds to be spoken clearly
const DEMO_END_TRIGGER_SECONDS = 10;

const VoiceInterview = ({ sessionId }: VoiceInterviewProps) => {
  // ✅ CRITICAL: useScrollAnimation MUST be the very first hook to avoid React "Should have a queue" errors
  const { ref: sectionRef, isVisible } = useScrollAnimation();

  const { t } = useTranslation();
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(DEMO_DURATION_SECONDS);
  const [demoEnded, setDemoEnded] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [actionsTaken, setActionsTaken] = useState<string[]>([]);
  const [latestEmailLog, setLatestEmailLog] = useState<DemoEmailLog | null>(null);
  const [emailLogOpen, setEmailLogOpen] = useState(false);

  // Live streaming transcripts for real-time display
  const [liveAssistantTranscript, setLiveAssistantTranscript] = useState<string>("");
  const [liveUserTranscript, setLiveUserTranscript] = useState<string>("");

  // Fallback manual contact capture (shown only when backend asks for it)
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactError, setContactError] = useState<string | null>(null);
  const [lastAgentResponse, setLastAgentResponse] = useState<string | null>(null);

  // ✅ Show resend button when user says "не получих"
  const [showResendBtn, setShowResendBtn] = useState(false);

  // ✅ Text-only mode: when user declines mic, they can still chat with NEO
  const [textOnlyMode, setTextOnlyMode] = useState(false);

  // Voice selection state for demo
  const [demoVoice, setDemoVoice] = useState<string>("Enceladus");
  const [demoVoiceSpeed, setDemoVoiceSpeed] = useState<number>(1.0);

  // Force-show contact panel when assistant explicitly asks for name/email.
  const [forceContactPanel, setForceContactPanel] = useState(false);
  const forceContactPanelRef = useRef(false);

  // IMPORTANT: getState() is ref-based and does not trigger renders.
  // We keep a snapshot here so UI (contact panel) reacts instantly to backend state changes.
  const [agentStateSnapshot, setAgentStateSnapshot] = useState<any | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  // ✅ FIX: Init promise lock to prevent double/triple initialization
  const initPromiseRef = useRef<Promise<string | null> | null>(null);
  const lastInitSessionIdRef = useRef<string | null>(null);

  // ✅ FIX: Track if greeting was already added to chat (to prevent duplicate)
  const greetingShownRef = useRef(false);

  const prevSpeakingRef = useRef(false);
  const prevListeningRef = useRef(false);

  // Refs to avoid hook-order dependency issues (sendText/getState/processMessage are defined later)
  const sendTextRef = useRef<((text: string, asUser?: boolean) => void) | null>(null);
  const speakFixedTextRef = useRef<((text: string) => void) | null>(null);
  const getStateRef = useRef<(() => any) | null>(null);
  const processMessageRef = useRef<((msg: string) => Promise<string | null>) | null>(null);
  const agentCoreProcessRef = useRef<((text: string) => Promise<string | null>) | null>(null);

  // ✅ demo end control
  const demoEndedRef = useRef(false);

  // ✅ critical: make sure final message is actually sent & spoken
  const finalMessageSentRef = useRef(false);
  const finalMessageSpokenRef = useRef(false);
  const finalMessageTextRef = useRef<string>("");

  // ✅ used to detect assistant messages after final end message
  const lastAssistantMessageAtRef = useRef<number>(0);

  // ✅ Track previous contact panel state for voice prompt
  const prevShowContactPanelRef = useRef(false);

  const {
    playConnectSound,
    playDisconnectSound,
    playSpeakingStart,
    playListeningStart,
    startAmbient,
    stopAmbient,
    initAudioContext,
  } = useAudioEffects({ ambientVolume: 0.06, effectsVolume: 0.25 });

  const fetchLatestEmailLog = useCallback(async () => {
    if (!sessionId) return;
    const sessionToken = sessionStorage.getItem(`neo_session_${sessionId}`);
    if (!sessionToken) return;

    const { data, error } = await supabase.functions.invoke("demo-email-log", {
      body: { session_id: sessionId, session_token: sessionToken },
    });

    if (error) {
      console.error("[DEMO] demo-email-log invoke error:", error);
      return;
    }

    const email = (data as any)?.email as DemoEmailLog | null | undefined;
    if (email) setLatestEmailLog(email);
  }, [sessionId]);

  // IMPORTANT: memoize callbacks so useAgentCore doesn't re-create init/process on every render
  const handleAgentError = useCallback((error: string) => {
    console.error("[DEMO] Agent error:", error);
  }, []);

  const handleAgentAction = useCallback(
    (action: string) => {
      console.log("[DEMO] Agent action:", action);
      setActionsTaken((prev) => [...prev, action]);

      const safeSend = sendTextRef.current;
      const stateGetter = getStateRef.current;
      const agentState = stateGetter?.();

      // ✅ NEW: Detailed logging for Action Engine actions
      if (action === "availability_checked") {
        console.log("[DEMO] ✅ execute-action called - availability check completed", {
          availability_result: agentState?.availability_result,
          availability_checked: agentState?.availability_checked,
          check_in: agentState?.check_in,
          check_out: agentState?.check_out,
          guests: agentState?.guests,
          room_type: agentState?.room_type,
        });
      }

      if (action === "booking_created") {
        console.log("[DEMO] ✅ execute-action called - booking completed");
        toast({
          title: "✅ Час запазен!",
          description: "Изпратено е потвърждение на имейла.",
        });
        // Notify Gemini to confirm vocally (hidden system message)
        safeSend?.(
          "[SYSTEM: Резервацията беше направена успешно. Потвърди на клиента, че часът е запазен и имейлът е изпратен.]",
          false,
        );
      } else if (action === "email_sent") {
        toast({
          title: "📧 Имейл изпратен!",
          description: "Проверете пощата си.",
        });
        fetchLatestEmailLog();
        setEmailLogOpen(true);
        // Notify Gemini to confirm vocally (hidden system message)
        safeSend?.("[SYSTEM: Имейлът беше изпратен успешно. Потвърди на клиента да провери пощата си.]", false);
      } else if (action === "calculation_done") {
        if (agentState?.calculation_result) {
          toast({
            title: "🧮 Изчисление готово!",
            description: `Обща сума: ${agentState.calculation_result} ${agentState.calculation_unit || ""}`,
          });
          safeSend?.(
            `[SYSTEM: Изчислението е готово. Резултат: ${agentState.calculation_breakdown} ${agentState.calculation_unit}. Обща сума: ${agentState.calculation_result} ${agentState.calculation_unit}. Обясни на клиента и попитай дали иска имейл с офертата.]`,
            false,
          );
        }
      }
    },
    [fetchLatestEmailLog, toast],
  );

  const {
    initialize: initAgent,
    processMessage,
    getState,
    reset: resetAgent,
  } = useAgentCore({
    onAction: handleAgentAction,
    onError: handleAgentError,
  });

  // Keep the latest getState and processMessage in refs for stable callbacks
  useEffect(() => {
    getStateRef.current = getState as any;
    processMessageRef.current = processMessage;
    agentCoreProcessRef.current = processMessage;
  }, [getState, processMessage]);

  // ✅ Hard-coded final demo message (NOT i18n dependent)
  const buildFinalDemoMessage = useCallback(() => {
    return "За съжаление ДЕМО сесията приключи. Ако ви хареса НЕО, може да изберете план според нуждите на бизнеса ви, и да създадете свой НЕО асистент в рамките на 5 минути, без сложни настройки или опит.";
  }, []);

  /**
   * ✅ handleMessage receives ONE message per turn from useGeminiVoice
   * (already aggregated). We clean it here BEFORE adding to the chat.
   */
  /**
   * Extract email from voice transcript with Bulgarian phonetic normalization.
   * Converts "маймунка", "ат", "точка" etc. into proper email format.
   */
  const extractEmailFromVoice = useCallback((text: string): string | null => {
    // ✅ CRITICAL FIX: Normalize to lowercase first for consistent matching
    let normalized = text.toLowerCase();

    // Bulgarian variants for "@" (ordered from longer to shorter patterns)
    normalized = normalized.replace(/маймунско\s*а/g, "@");
    normalized = normalized.replace(/маймунката/g, "@"); // with article
    normalized = normalized.replace(/маймунка/g, "@");
    normalized = normalized.replace(/маймунче/g, "@");
    normalized = normalized.replace(/маймунско/g, "@"); // adjective alone
    normalized = normalized.replace(/кльомба/g, "@");
    normalized = normalized.replace(/а малко/g, "@");

    // ✅ NEW: Handle "9 маймунка" patterns (number before @)
    normalized = normalized.replace(/(\d)\s*@/g, "$1@");

    // English/Bulgarian variants
    normalized = normalized.replace(/\s*(?:at|ет|ат)\s*/g, "@");
    normalized = normalized.replace(/\s*(?:точка|dot|point|дот)\s*/g, ".");
    normalized = normalized.replace(/\s*(?:тире|dash|дефис)\s*/g, "-");
    normalized = normalized.replace(/\s*(?:подчертавка|underscore)\s*/g, "_");

    // ✅ NEW: Handle common transcription artifacts
    normalized = normalized.replace(/\s*комерсиал\s*/g, ".com");
    normalized = normalized.replace(/\s*джи\s*мейл\s*/g, "gmail");
    normalized = normalized.replace(/\s*g\s*mail\s*/g, "gmail");

    // Remove spaces but preserve structure
    normalized = normalized.replace(/\s+/g, "");

    const emailMatch = normalized.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i);
    return emailMatch?.[0]?.toLowerCase() || null;
  }, []);

  /**
   * Extract name from voice transcript using common Bulgarian patterns.
   */
  const extractNameFromVoice = useCallback((text: string): string | null => {
    // ✅ Pattern 1: Explicit name phrases (highest priority)
    const explicitPatterns = [
      /казвам се\s+([А-Яа-яA-Za-z]+(?:\s+[А-Яа-яA-Za-z]+)?)/i,
      /аз съм\s+([А-Яа-яA-Za-z]+(?:\s+[А-Яа-яA-Za-z]+)?)/i,
      /името ми е\s+([А-Яа-яA-Za-z]+(?:\s+[А-Яа-яA-Za-z]+)?)/i,
      /моето име е\s+([А-Яа-яA-Za-z]+(?:\s+[А-Яа-яA-Za-z]+)?)/i,
    ];

    for (const pattern of explicitPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    // ✅ Pattern 2: Look for capitalized Bulgarian/Latin words (Proper Names)
    // Common non-name words to exclude
    const nonNameWords = new Set([
      "здравейте",
      "добър",
      "благодаря",
      "моля",
      "имейлът",
      "gmail",
      "google",
      "yahoo",
      "abv",
      "mail",
      "email",
      "имейл",
      "да",
      "не",
      "добре",
      "ок",
      "маймунка",
      "маймунката",
      "точка",
      "ком",
      "джи",
      "мейл",
      "нео",
      "neo",
      "искам",
      "моля",
      "може",
      "бих",
      "информация",
      "час",
      "запазя",
      "резервирам",
    ]);

    // Find capitalized words (Bulgarian or Latin)
    const capitalizedWords = text.match(/[А-ЯA-Z][а-яa-z]+/g) || [];
    const validWords = capitalizedWords.filter((w) => !nonNameWords.has(w.toLowerCase()));

    // ✅ Pattern 2a: Two consecutive capitalized words = full name (e.g., "Ангел Малев")
    if (validWords.length >= 2) {
      const potentialName = validWords.slice(0, 2).join(" ");
      if (potentialName.length >= 4) {
        return potentialName;
      }
    }

    // ✅ Pattern 2b: Single capitalized word as first name (e.g., "Ангел")
    if (validWords.length === 1 && validWords[0].length >= 3) {
      return validWords[0];
    }

    return null;
  }, []);

  // ✅ Domain validation and correction for common transcription errors
  const VALID_DOMAINS = [
    "gmail.com",
    "yahoo.com",
    "abv.bg",
    "mail.bg",
    "outlook.com",
    "hotmail.com",
    "icloud.com",
    "protonmail.com",
  ];

  const DOMAIN_CORRECTIONS: Record<string, string> = {
    "mail.com": "gmail.com",
    "gmai.com": "gmail.com",
    "gmail.co": "gmail.com",
    "gmial.com": "gmail.com",
    "gmal.com": "gmail.com",
    "yaho.com": "yahoo.com",
    "yahoo.co": "yahoo.com",
    "abv.com": "abv.bg",
    "mailbg.com": "mail.bg",
  };

  const validateAndCorrectDomain = useCallback((email: string): string => {
    const atIndex = email.indexOf("@");
    if (atIndex < 0) return email;

    const local = email.slice(0, atIndex);
    const domain = email.slice(atIndex + 1).toLowerCase();

    // Direct match - valid domain
    if (VALID_DOMAINS.includes(domain)) return email;

    // Known corrections
    if (DOMAIN_CORRECTIONS[domain]) {
      console.log(`[DEMO] Correcting domain: ${domain} → ${DOMAIN_CORRECTIONS[domain]}`);
      return `${local}@${DOMAIN_CORRECTIONS[domain]}`;
    }

    return email;
  }, []);

  /**
   * ✅ handleMessage receives ONE message per turn from useGeminiVoice
   * (already aggregated). We clean it here BEFORE adding to the chat.
   */
  // ✅ Ref за маркиране на typed input (за skip cleanTranscript)
  const skipCleanForTypedRef = useRef<string | null>(null);

  // ✅ Prevent duplicate typed sends (Enter+Click / double tap)
  const typedSendLockRef = useRef(false);
  const lastTypedSendRef = useRef<{ text: string; ts: number } | null>(null);

  // ✅ FIX: Track typed user messages already added to chat, so handleMessage skips the duplicate
  const typedMessageAddedRef = useRef<string | null>(null);

  const handleMessage = useCallback(
    async (message: Message) => {
      let content = message.content;

      if (message.role === "user") {
        setLiveUserTranscript("");
      }

      if (message.role === "assistant") {
        setLiveAssistantTranscript("");
      }

      // ✅ Filter out raw action_request JSON that leaks into messages
      if (content && (
        content.startsWith('action_request:') ||
        content.startsWith('{"type":"action_request"') ||
        /^\s*\{[\s\S]*"action"\s*:\s*"(submit_form|make_reservation|book_slot)"/.test(content)
      )) {
        console.log("[VoiceInterview] Filtering out action_request JSON from chat");
        return;
      }

      // ✅ SPEED FIX: Assistant transcripts are already clean from Gemini - NEVER clean them
      if (message.role === "assistant") {
        // Skip cleanTranscript entirely for assistant messages
      } else {
        const isTypedInput = skipCleanForTypedRef.current === content;
        if (isTypedInput) {
          skipCleanForTypedRef.current = null;
          console.log("[VoiceInterview] Typed input - skipping cleanTranscript");
        }
      }

      if (!content || content.trim().length < 2) {
        console.log("[VoiceInterview] Skipping empty/garbage cleaned message");
        return;
      }

      if (message.role === "user" && typedMessageAddedRef.current === content) {
        console.log("[VoiceInterview] Skipping duplicate typed user message in handleMessage");
        typedMessageAddedRef.current = null;
        return;
      }

      const cleanedMessage: Message = { role: message.role, content };

      // Deduplicate greeting messages — keep only the latest version
      if (message.role === "assistant") {
        const lc = content.toLowerCase();
        const isGreeting = lc.includes("здравейте") || lc.includes("нео от") || lc.includes("с какво мога");
        
        if (isGreeting) {
          setMessages((prev) => {
            if (prev.length === 0) return [{ role: "assistant", content }];
            const firstIsGreeting = prev[0]?.role === "assistant" && 
              (prev[0].content.toLowerCase().includes("здравейте") || prev[0].content.toLowerCase().includes("нео от"));
            if (firstIsGreeting) {
              const updated = [...prev];
              updated[0] = { role: "assistant", content };
              return updated;
            }
            return prev;
          });
          lastAssistantMessageAtRef.current = Date.now();
          if (finalMessageSentRef.current) finalMessageSpokenRef.current = true;
          return;
        }
        
        if (greetingShownRef.current) {
          greetingShownRef.current = false;
        }
      }

      setMessages((prev) => [...prev, cleanedMessage]);

      if (message.role === "assistant") {
        lastAssistantMessageAtRef.current = Date.now();

        const txt = (message.content || "").toLowerCase();

        // ═══════════════════════════════════════════════════════════════
        // ✅ STRICT FLOW: Panel appears ONLY after user confirms AND NEO asks for data
        // Step 1: User says "искам имейл", "да", etc.
        // Step 2: NEO explicitly asks for name/email with specific phrases
        // Step 3: ONLY THEN panel appears + NEO prompts manual entry
        // ═══════════════════════════════════════════════════════════════

        // Keywords that indicate NEO is explicitly requesting contact data
        const requestingDataKeywords = [
          "какъв е имейлът",
          "на кой имейл",
          "имейл адрес",
          "вашият имейл",
          "как се казвате",
          "името ви",
          "вашите имена",
          "моля кажете ми",
          "моля въведете",
          "попълнете полетата",
          "въведете данните",
          "ще ми трябват данни",
          "за да изпратя",
          "данни за изпращане",
        ];

        // Email contact panel trigger removed - no emails for now

        // ✅ If final message was already sent and assistant responded afterwards,
        // we consider it as "caught" (likely will speak)
        if (finalMessageSentRef.current) {
          finalMessageSpokenRef.current = true;
        }
      }

      // ✅ REMOVED: No auto-fill from voice - fields stay empty for manual input only

      // ✅ User message UI-only processing (agent-core is called in useGeminiVoice critical path)
      if (message.role === "user" && message.content && message.content.trim().length > 2) {
        // Detect "не получих" – show resend button
        const lowerContent = message.content.toLowerCase();
        if (
          /\bне\s*(съм\s*)?(полу)?чих(а|ме)?\b/i.test(lowerContent) ||
          /\bne\s*poluchih/i.test(lowerContent) ||
          lowerContent.includes("не виждам имейл") ||
          lowerContent.includes("не получих")
        ) {
          console.log("[DEMO] User indicates they did not receive email – showing resend button");
          setShowResendBtn(true);
        }

        // Snapshot agent state for UI updates (contact panel visibility)
        const safeGetState = getStateRef.current;
        if (safeGetState) {
          const st = safeGetState() as any;
          setAgentStateSnapshot(st);
          if (st?.name && st?.email) {
            forceContactPanelRef.current = false;
            setForceContactPanel(false);
          }
        }
      }
    },
    [contactEmail, contactName, extractEmailFromVoice, extractNameFromVoice],
  );

  const submitContactFallback = useCallback(async () => {
    // ✅ First, apply domain correction to the email
    const correctedEmail = validateAndCorrectDomain(contactEmail.trim().toLowerCase());

    const schema = z.object({
      name: z.string().trim().min(2).max(100),
      email: z.string().trim().email().max(255),
    });

    const parsed = schema.safeParse({ name: contactName, email: correctedEmail });
    if (!parsed.success) {
      setContactError("Моля, въведете валидни име и имейл.");
      return;
    }
    setContactError(null);

    // Send contact data to agent-core for immediate email action
    try {
      // 1) Tell NEO we're processing - but NOT to confirm sent yet
      sendTextRef.current?.(
        `[SYSTEM: Клиентът въведе данните: Име: ${parsed.data.name}, Имейл: ${parsed.data.email}. Подготвям имейла. Кажи: 'Обработвам заявката ви...' и ИЗЧАКАЙ системата да потвърди изпращането. НЕ казвай че е изпратен докато не получиш [SYSTEM: email sent] потвърждение!]`,
        false,
      );

      // 2) Process message - backend will send email and return status
      const reply = await processMessage(`Казвам се ${parsed.data.name}. Имейлът ми е ${parsed.data.email}.`);
      if (reply) setLastAgentResponse(reply);

      // 3) Refresh snapshot and check if email was sent
      const newState = getState() as any;
      setAgentStateSnapshot(newState);

      // 4) If email was actually sent (backend sets last_action), confirm
      if (newState?.last_action === "email_sent") {
        toast({
          title: "📧 Имейл изпратен успешно!",
          description: "Проверете пощата си.",
        });
        fetchLatestEmailLog();
        setEmailLogOpen(true);

        // NOW tell NEO to confirm vocally
        sendTextRef.current?.(
          `[SYSTEM: email sent - Имейлът беше изпратен УСПЕШНО на ${parsed.data.email}. СЕГА можеш да потвърдиш на клиента: 'Готово! Изпратих ви имейла. Моля, проверете пощата си, включително папка Спам.']`,
          false,
        );
      } else {
        toast({
          title: "Данните са приети",
          description: "Заявката се обработва...",
        });
      }
    } catch (e) {
      console.error("[DEMO] submitContactFallback failed", e);

      sendTextRef.current?.(
        "[SYSTEM: Възникна проблем при изпращането на имейла. Извини се на клиента и помоли да опита отново.]",
        false,
      );
      toast({
        title: "Грешка",
        description: "Не успях да изпратя имейла. Опитайте отново.",
        variant: "destructive",
      });
    }
  }, [contactEmail, contactName, processMessage, toast, getState, validateAndCorrectDomain]);

  // ✅ Resend last email on user request
  const handleResend = useCallback(async () => {
    const st = getState() as any;
    if (!st?.email || !st?.name) {
      toast({
        title: "Липсват данни",
        description: "Не мога да изпратя имейл без име и адрес.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Преизпращане...",
      description: "Опитвам да изпратя имейла отново.",
    });

    // Send a deterministic message; backend will detect resend intent and re-trigger
    try {
      sendTextRef.current?.(
        `[SYSTEM: Потребителят поиска да изпратиш имейла отново. Изпрати имейла на ${st.email} и потвърди.]`,
        false,
      );
      const reply = await processMessage(`Моля, изпрати имейла отново на ${st.email}.`);
      if (reply) setLastAgentResponse(reply);
      // Hide resend after attempt
      setShowResendBtn(false);
    } catch (err) {
      console.error("[DEMO] Resend failed", err);
    }
  }, [getState, processMessage, toast]);

  // ✅ NEW: Fallback TTS using Web Speech API
  const speakWithFallback = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) {
      console.log("[DEMO] speechSynthesis not supported");
      return false;
    }

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "bg-BG";
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to find a Bulgarian voice
    const voices = speechSynthesis.getVoices();
    const bgVoice = voices.find((v) => v.lang.startsWith("bg"));
    if (bgVoice) {
      utterance.voice = bgVoice;
    }

    speechSynthesis.speak(utterance);
    console.log("[DEMO] Fallback TTS used for:", text.substring(0, 50) + "...");
    return true;
  }, []);

  const handleError = useCallback(
    (error: string) => {
      console.error("Voice error:", error);

      // ✅ CRITICAL: If demo ended and final message wasn't spoken, use TTS fallback
      if (demoEnded && finalMessageTextRef.current && !finalMessageSpokenRef.current) {
        console.log("[DEMO] Connection error at demo end - triggering TTS fallback");
        speakWithFallback(finalMessageTextRef.current);
        finalMessageSpokenRef.current = true;
      }

      // ✅ FIX: If demo ended and we get a connection error, trigger the review modal
      if (demoEnded && !showEndModal) {
        console.log("[DEMO] Connection error after demo ended - showing review modal");
        setShowEndModal(true);
        stopAmbient();
      }

      toast({
        title: t("interview.error"),
        description: error,
        variant: "destructive",
      });
    },
    [toast, t, demoEnded, showEndModal, stopAmbient, speakWithFallback],
  );

  const {
    isConnected,
    isConnecting,
    isSpeaking,
    isListening,
    isMicMuted,
    toggleMicMute,
    connect,
    disconnect,
    prepareSession,
    preWarmMicrophone,
    sendText,
    getSessionData,
    setVoiceOverride,
  } = useGeminiVoice({
    onMessage: handleMessage,
    onError: handleError,
    onTranscript: (transcript, isFinal, role) => {
      if (role === 'assistant') {
        if (!isFinal) {
          setLiveAssistantTranscript(transcript);
        } else {
          setLiveAssistantTranscript('');
        }
      } else if (role === 'user') {
        setLiveUserTranscript(transcript);
      }
    },
  });

  // ✅ Text-only: chat history for Gemini REST API (same AI as voice mode)
  const textChatHistoryRef = useRef<Array<{ role: string; parts: Array<{ text: string }> }>>([]);

  const callGeminiText = useCallback(
    async (userMessage: string): Promise<string | null> => {
      const session = getSessionData?.();
      if (!session?.apiKey || !session?.systemInstruction) {
        console.warn("[TEXT-ONLY] No Gemini session data");
        return null;
      }

      textChatHistoryRef.current.push({ role: "user", parts: [{ text: userMessage }] });

      try {
        const model = "gemini-2.5-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${session.apiKey}`;

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: session.systemInstruction }] },
            contents: textChatHistoryRef.current,
            generationConfig: { temperature: 0.8, maxOutputTokens: 1024 },
          }),
        });

        if (!res.ok) {
          console.error("[TEXT-ONLY] Gemini API error:", res.status);
          return null;
        }

        const data = await res.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (reply) {
          textChatHistoryRef.current.push({ role: "model", parts: [{ text: reply }] });
        }
        return reply || null;
      } catch (e) {
        console.error("[TEXT-ONLY] Gemini REST failed:", e);
        return null;
      }
    },
    [getSessionData],
  );

  // Keep the latest sendText in a ref for callbacks defined above
  useEffect(() => {
    sendTextRef.current = sendText;
  }, [sendText]);

  // speakFixedText removed from hook — ref stays as no-op for callers

  // Show contact panel whenever contact details are needed but missing.
  // We intentionally do NOT depend on `step === "collecting"` because the UI must be reliable:
  // - sometimes the assistant wording implies it needs name/email
  // - sometimes state updates lag a render
  // In all those cases, if intent requires contact + fields are missing, we show the panel.
  // Parse explicit "име:" / "имейл:" commands from typed text (100% reliable)
  const parseExplicitCommands = useCallback((text: string) => {
    const nameMatch = text.match(/(?:име|name)\s*[:：]\s*([А-Яа-яA-Za-z\s]+?)(?:\.|,|$|\s+(?:имейл|email))/i);
    const emailMatch = text.match(/(?:имейл|email|e-mail)\s*[:：]\s*([\w.+-]+@[\w.-]+\.[a-z]{2,})/i);
    // Auto-detect standalone email (if user just types an email)
    const standaloneEmail = !emailMatch ? text.match(/^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i) : null;

    return {
      name: nameMatch?.[1]?.trim() || null,
      email: (emailMatch?.[1] || standaloneEmail?.[0])?.toLowerCase().trim() || null,
      hasExplicitData: !!(nameMatch || emailMatch || standaloneEmail),
    };
  }, []);

  // ✅ ОПРОСТЕНА ЛОГИКА: Panel се показва САМО когато forceContactPanel е true
  // Премахнато автоматичното показване при intent detection
  const shouldShowContactPanel = useCallback(() => {
    if (!isConnected && !textOnlyMode) return false;

    // ✅ САМО explicit force - без auto-intent
    return forceContactPanelRef.current || forceContactPanel;
  }, [isConnected, forceContactPanel, textOnlyMode]);

  // ✅ When contact inputs become visible, track panel visibility
  useEffect(() => {
    const showPanel = shouldShowContactPanel();
    prevShowContactPanelRef.current = showPanel;
  }, [shouldShowContactPanel]);
  // ✅ Pre-warm mic
  useEffect(() => {
    if (sessionId && systemPrompt) preWarmMicrophone();
  }, [sessionId, systemPrompt, preWarmMicrophone]);

  // ✅ Scroll - ONLY the chat container, not the page
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, liveAssistantTranscript, liveUserTranscript]);

  // ✅ Timer (runs in both voice AND text-only mode)
  useEffect(() => {
    if ((!isConnected && !textOnlyMode) || demoEnded) return;

    // clear previous if any
    if (timerRef.current) window.clearInterval(timerRef.current);

    timerRef.current = window.setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= DEMO_END_TRIGGER_SECONDS && !demoEndedRef.current) {
          demoEndedRef.current = true;
          setDemoEnded(true);

          const msg = buildFinalDemoMessage();
          finalMessageTextRef.current = msg;

          // ✅ FIXED: Send final message as SYSTEM instruction so Gemini says it VERBATIM
          // Previously sent as user turn → Gemini tried to RESPOND instead of SPEAK
          if (!finalMessageSentRef.current) {
            finalMessageSentRef.current = true;
            // ✅ Do NOT set finalMessageSpokenRef = true here!
            // Let it be set when Gemini actually speaks (in assistant message handler)
            // This enables TTS fallback if Gemini fails to speak

            // ✅ Show final message in chat instantly
            setMessages((prev) => [...prev, { role: "assistant", content: msg }]);

            // ✅ Speak it via Gemini WS (so it actually uses NEO voice)
            // IMPORTANT: send as a strict instruction so it's short and verbatim.
            sendTextRef.current?.(`[SYSTEM: Кажи дословно и кратко: "${msg}"]`);

            // Do NOT call speakFixedTextRef (it's a no-op)
            console.log("[DEMO] Final demo message sent to Gemini for speech");
          }
        }

        if (prev <= 1) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [isConnected, textOnlyMode, demoEnded, sendText, companyName, buildFinalDemoMessage]);

  /**
   * ✅ Robust disconnect logic:
   * We do NOT disconnect instantly when demoEnded.
   * We disconnect only AFTER:
   * - final message was sent
   * - assistant has FINISHED speaking AND stayed silent for a short, stable window
   *   (Gemini Live can toggle isSpeaking between audio chunks; we debounce to avoid cutting CTA).
   */
  const wasEverSpeakingRef = useRef(false);
  const disconnectTriggeredRef = useRef(false);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!demoEnded) return;
    if (!isConnected) return;
    if (disconnectTriggeredRef.current) return;

    // Always clear any pending close timer when state changes
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    // Track if assistant ever started speaking after demo ended
    if (isSpeaking) {
      wasEverSpeakingRef.current = true;
      return; // Still speaking, wait
    }

    // If we're here, isSpeaking is false
    // Only disconnect if:
    // 1. Assistant was speaking and now stopped (normal flow)
    // 2. Or we waited long enough and assistant never spoke (fallback)

    const performDisconnect = () => {
      if (disconnectTriggeredRef.current) return;
      disconnectTriggeredRef.current = true;

      // ✅ CRITICAL: If final message was NOT spoken by Gemini, use TTS fallback
      if (!finalMessageSpokenRef.current && finalMessageTextRef.current) {
        console.log("[DEMO] Voice connection closing - using TTS fallback for final message");
        speakWithFallback(finalMessageTextRef.current);
        finalMessageSpokenRef.current = true;
      }

      playDisconnectSound();
      stopAmbient();
      disconnect();
      setShowEndModal(true);
    };

    if (wasEverSpeakingRef.current) {
      // ✅ БЕЗОПАСНО ЗАТВАРЯНЕ: Изчакваме минимум 3 секунди след последния audio chunk
      // Това гарантира, че финалното изречение се изговаря докрай
      const STABLE_SILENCE_MS = 3000; // Увеличено от 600ms на 3000ms
      const MIN_SINCE_LAST_ASSISTANT_MS = 2500; // Увеличено от 500ms на 2500ms

      const sinceLastAssistant = Date.now() - (lastAssistantMessageAtRef.current || 0);
      const extraDelay = Math.max(0, MIN_SINCE_LAST_ASSISTANT_MS - sinceLastAssistant);

      closeTimerRef.current = window.setTimeout(() => {
        // Re-check at execution time
        if (!isConnected) return;
        if (disconnectTriggeredRef.current) return;
        if (isSpeaking) return;

        // Final guard: if assistant just emitted text very recently, wait a bit more
        const sinceLast = Date.now() - (lastAssistantMessageAtRef.current || 0);
        if (sinceLast < MIN_SINCE_LAST_ASSISTANT_MS) return;

        performDisconnect();
      }, STABLE_SILENCE_MS + extraDelay);
    } else {
      // ✅ FIX: Wait 10s (was 3s) before fallback disconnect
      // Gemini needs 3-5s to process SYSTEM instruction and generate audio
      // 3s was too short → "assistant never spoke" → final message lost
      const fallbackTimeout = setTimeout(() => {
        if (!wasEverSpeakingRef.current && !isSpeaking) {
          console.log("[DEMO] Fallback disconnect - assistant never spoke after 10s");
          performDisconnect();
        }
      }, 10000);

      return () => clearTimeout(fallbackTimeout);
    }
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [demoEnded, isConnected, isSpeaking, disconnect, playDisconnectSound, stopAmbient, speakWithFallback]);

  // Reset disconnect refs when demo resets
  useEffect(() => {
    if (!demoEnded) {
      wasEverSpeakingRef.current = false;
      disconnectTriggeredRef.current = false;

      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    }
  }, [demoEnded]);

  // ✅ Sounds
  useEffect(() => {
    if (isSpeaking && !prevSpeakingRef.current) playSpeakingStart();
    prevSpeakingRef.current = isSpeaking;
  }, [isSpeaking, playSpeakingStart]);

  useEffect(() => {
    if (isListening && !prevListeningRef.current) playListeningStart();
    prevListeningRef.current = isListening;
  }, [isListening, playListeningStart]);

  // ✅ Reset demo
  useEffect(() => {
    if (!isConnected && !showEndModal) {
      setTimeRemaining(DEMO_DURATION_SECONDS);
      setDemoEnded(false);
      setActionsTaken([]);
      demoEndedRef.current = false;

      finalMessageSentRef.current = false;
      finalMessageSpokenRef.current = false;
      finalMessageTextRef.current = "";
      lastAssistantMessageAtRef.current = 0;
      greetingShownRef.current = false;
    }
  }, [isConnected, showEndModal]);

  // ✅ Fetch session data and pre-prepare
  useEffect(() => {
    if (!sessionId) return;

    const fetchSessionData = async () => {
      const { data: session } = await supabase
        .from("demo_sessions")
        .select("scraped_content, summary, url, company_name, voice_name")
        .eq("id", sessionId)
        .single();

      if (!session) return;

      // Load voice from session
      if ((session as any).voice_name) {
        setDemoVoice((session as any).voice_name);
      }

      const extractedCompanyName =
        session.company_name?.trim() ||
        (session.url
          ? new URL(session.url).hostname
              .replace("www.", "")
              .replace(/\.bg$|\.com$/i, "")
              .replace(/[-_]/g, " ")
          : "компанията");

      setCompanyName(extractedCompanyName);

      // ✅ FIX: Use promise lock for init to prevent double init
      if (lastInitSessionIdRef.current !== sessionId) {
        lastInitSessionIdRef.current = sessionId;
        initPromiseRef.current = initAgent(sessionId);
      }

      // ★ Gemini is TTS-only now — no knowledge in system prompt
      const prompt = `TTS for ${extractedCompanyName}`;

      setSystemPrompt(prompt);

      prepareSession(prompt, extractedCompanyName, sessionId).catch((err) => {
        console.error("Prepare session error:", err);
      });
    };

    fetchSessionData();
  }, [sessionId, prepareSession, initAgent]);

  useEffect(() => {
    setLatestEmailLog(null);
    setEmailLogOpen(false);
    if (sessionId) fetchLatestEmailLog();
  }, [sessionId, fetchLatestEmailLog]);

  const handleDemoVoiceChange = useCallback((voiceId: string) => {
    setDemoVoice(voiceId);
    setVoiceOverride(voiceId);
    if (sessionId) {
      supabase.from('demo_sessions').update({ voice_name: voiceId } as any).eq('id', sessionId).then();
    }
  }, [setVoiceOverride, sessionId]);

  const startCall = useCallback(async () => {
    if (!sessionId || !systemPrompt) {
      toast({
        title: t("interview.error"),
        description: t("interview.trainNeoFirst"),
        variant: "destructive",
      });
      return;
    }

    // Ensure agent-core is initialized BEFORE any user messages (voice or typed) are processed.
    // Also reset agent state so old name/email never "carry" into a new call.
    try {
      resetAgent();
      setAgentStateSnapshot(null);
      setForceContactPanel(false);
      forceContactPanelRef.current = false;
      setContactName("");
      setContactEmail("");
      setContactError(null);

      if (lastInitSessionIdRef.current !== sessionId || !initPromiseRef.current) {
        lastInitSessionIdRef.current = sessionId;
        initPromiseRef.current = initAgent(sessionId);
      }
      await initPromiseRef.current;

      setAgentStateSnapshot(getState() as any);
    } catch (e) {
      console.error("[DEMO] initAgent in startCall failed", e);
    }

    // Apply selected voice before connecting
    setVoiceOverride(demoVoice);

    initAudioContext();

    // ✅ Check microphone permission BEFORE connecting
    let micGranted = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop tracks immediately — useGeminiVoice will request its own stream
      stream.getTracks().forEach((t) => t.stop());
      micGranted = true;
    } catch (err) {
      console.log("[DEMO] Microphone denied or unavailable:", err);
      micGranted = false;
    }

    // Gemini ще изговори и покаже поздрава автоматично чрез trigger в useGeminiVoice
    greetingShownRef.current = false;

    if (micGranted) {
      // Full voice + text mode
      setTextOnlyMode(false);
      playConnectSound();
      startAmbient();
      await connect(systemPrompt, companyName, sessionId ?? undefined);
    } else {
      // Text-only mode — connect to Gemini WS for audio output, but skip mic/STT
      setTextOnlyMode(true);
      playConnectSound();
      toast({
        title: "🎤 Микрофонът не е разрешен",
        description: "НЕО ще ви отговаря с глас, а вие пишете.",
      });
      await connect(systemPrompt, companyName, sessionId ?? undefined, true);
    }
  }, [
    sessionId,
    systemPrompt,
    companyName,
    connect,
    toast,
    t,
    initAudioContext,
    playConnectSound,
    startAmbient,
    resetAgent,
    initAgent,
    getState,
  ]);

  const endCall = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    playDisconnectSound();
    stopAmbient();
    const pendingUser = liveUserTranscript.trim();
    if (pendingUser) {
      setMessages(prev => [...prev, { role: 'user', content: pendingUser }]);
    }
    // Commit any partial assistant transcript before disconnecting
    const pendingAssistant = liveAssistantTranscript.trim();
    if (pendingAssistant) {
      setMessages(prev => [...prev, { role: 'assistant', content: pendingAssistant }]);
    }
    setLiveAssistantTranscript('');
    setLiveUserTranscript('');
    disconnect();
    setTextOnlyMode(false);
  }, [disconnect, playDisconnectSound, stopAmbient, liveAssistantTranscript, liveUserTranscript]);

  const handleTryAgain = useCallback(() => {
    setShowEndModal(false);
    setMessages([]);
    setTimeRemaining(DEMO_DURATION_SECONDS);
    setDemoEnded(false);
    setTextInput("");
    setTextOnlyMode(false);

    demoEndedRef.current = false;
    finalMessageSentRef.current = false;
    finalMessageSpokenRef.current = false;
    finalMessageTextRef.current = "";
    lastAssistantMessageAtRef.current = 0;
    greetingShownRef.current = false;
    textChatHistoryRef.current = [];
  }, []);

  const handleSendText = useCallback(async () => {
    const trimmed = textInput.trim();
    if (!trimmed || (!isConnected && !textOnlyMode)) return;

    // ✅ hard guard against duplicate sends
    if (typedSendLockRef.current) return;
    const now = Date.now();
    const last = lastTypedSendRef.current;
    if (last && last.text === trimmed && now - last.ts < 700) return;

    typedSendLockRef.current = true;
    lastTypedSendRef.current = { text: trimmed, ts: now };

    setTextInput("");

    // 1) Parse explicit commands locally for 100% reliable capture
    const parsed = parseExplicitCommands(trimmed);

    // If the user typed name/email in chat, reflect them in the fallback inputs too.
    // This removes the feeling that only the panel works.
    if (parsed.name) setContactName(parsed.name);
    if (parsed.email) setContactEmail(parsed.email);

    // 2) Build enhanced message for backend if explicit data found
    let messageForAgent = trimmed;
    if (parsed.hasExplicitData) {
      // Restructure message to guarantee backend parsing
      const parts: string[] = [];
      if (parsed.name) parts.push(`Казвам се ${parsed.name}.`);
      if (parsed.email) parts.push(`Имейлът ми е ${parsed.email}.`);
      // Append original text only if it contains more than just the data
      const remainingText = trimmed
        .replace(/(?:име|name)\s*[:：]\s*[А-Яа-яA-Za-z\s]+/gi, "")
        .replace(/(?:имейл|email|e-mail)\s*[:：]\s*[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "")
        .trim();
      if (remainingText && remainingText.length > 3) parts.push(remainingText);
      messageForAgent = parts.join(" ").trim() || trimmed;

      console.log("[DEMO] Explicit command parsed:", { name: parsed.name, hasEmail: !!parsed.email });
    }

    // ✅ Both voice mode and text-only mode use Gemini WS via sendText
    if (isConnected) {
      skipCleanForTypedRef.current = messageForAgent;
      typedMessageAddedRef.current = messageForAgent;
      setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
      sendText(messageForAgent);
      typedSendLockRef.current = false;
      return;
    }

    typedSendLockRef.current = false;
  }, [
    textInput,
    isConnected,
    textOnlyMode,
    sessionId,
    getState,
    initAgent,
    processMessage,
    parseExplicitCommands,
    callGeminiText,
    fetchLatestEmailLog,
  ]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendText();
      }
    },
    [handleSendText],
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // useScrollAnimation moved to top of component as sectionRef/isVisible

  // UI
  if (!sessionId) {
    return (
      <section
        ref={sectionRef}
        id="voice-interview"
        className={`py-12 lg:py-16 relative neo-section-hidden ${isVisible ? "neo-section-visible" : ""}`}
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-md lg:max-w-lg mx-auto text-center">
            <div className="neo-glass-subtle border border-border/20 rounded-lg lg:rounded-xl p-6 lg:p-8">
              <Phone className="w-8 h-8 lg:w-10 lg:h-10 text-primary/40 mx-auto mb-3 lg:mb-4" />
              <h3 className="text-sm lg:text-base font-bold text-foreground/70 mb-1 lg:mb-2">
                {t("interview.trainFirst")} <span className="neo-gradient-text text-primary-foreground">NEO</span>{" "}
                {t("interview.trainFirstSuffix")}
              </h3>
              <p className="text-[10px] lg:text-xs text-muted-foreground">{t("interview.enterUrl")}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (showEndModal) {
    return (
      <section
        ref={sectionRef}
        id="voice-interview"
        className={`py-12 lg:py-16 relative neo-section-hidden ${isVisible ? "neo-section-visible" : ""}`}
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-md lg:max-w-lg mx-auto">
            <DemoEndModal onTryAgain={handleTryAgain} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      id="voice-interview"
      className={`py-12 lg:py-16 relative neo-section-hidden ${isVisible ? "neo-section-visible" : ""}`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-md lg:max-w-lg mx-auto">
          <div className="text-center mb-4 lg:mb-6">
            <div className="inline-flex items-center gap-1.5 neo-badge mb-2 lg:mb-3 py-1 px-2 lg:py-1.5 lg:px-3">
              <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-primary font-medium text-[10px] lg:text-xs">{t("interview.step2")}</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-display font-black text-foreground">
              {t("interview.callTitle")} <span className="neo-gradient-text capitalize">{companyName || "NEO"}</span>
            </h2>
          </div>

          {/* Voice picker — shown before call starts */}
          {!isConnected && !textOnlyMode && (
            <div className="mb-4 text-left">
              <VoicePicker
                selectedVoice={demoVoice}
                onVoiceChange={handleDemoVoiceChange}
                voiceSpeed={demoVoiceSpeed}
                onSpeedChange={setDemoVoiceSpeed}
                disabled={isConnecting}
                compact
              />
            </div>
          )}

            <div className="neo-glass-subtle border border-border/20 rounded-lg lg:rounded-xl p-4 lg:p-6 text-center">
              <div className="relative inline-flex items-center justify-center mb-4 lg:mb-6">
                <button
                  onClick={isConnected || textOnlyMode ? endCall : startCall}
                  disabled={isConnecting}
                  className={`relative w-20 h-20 lg:w-24 lg:h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isConnected || textOnlyMode
                      ? "bg-destructive"
                      : isConnecting
                        ? "bg-primary/50 cursor-wait"
                        : "bg-gradient-to-br from-primary to-primary/80 neo-glow-soft hover:scale-105"
                  }`}
                >
                  {isConnected || textOnlyMode ? (
                    <PhoneOff className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
                  ) : (
                    <Phone className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
                  )}
                </button>

                {(isConnected || textOnlyMode) && (
                  <div className="absolute inset-0 rounded-full border-2 border-primary/40 animate-ping pointer-events-none" />
                )}
              </div>

              {/* Mic mute button - below call button */}
              {(isConnected || textOnlyMode) && !textOnlyMode && (
                <button
                  onClick={toggleMicMute}
                  className={`flex items-center gap-2 mx-auto mb-4 px-4 py-2 rounded-full text-xs font-medium transition-all border ${
                    isMicMuted
                      ? 'bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20'
                      : 'bg-muted/10 border-border/30 text-muted-foreground hover:text-foreground hover:border-border/50'
                  }`}
                >
                  {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  {isMicMuted ? 'Включете микрофона си' : 'Изключете микрофона си'}
                </button>
              )}

            {(isConnected || textOnlyMode) && (
              <div
                className={`flex items-center justify-center gap-1.5 mb-3 ${
                  timeRemaining <= 10 ? "text-destructive" : "text-primary"
                }`}
              >
                <Clock className="w-4 h-4" />
                <span className="font-mono font-bold text-sm">{formatTime(timeRemaining)}</span>
              </div>
            )}

            {latestEmailLog && (
              <div className="mb-3">
                <Dialog open={emailLogOpen} onOpenChange={setEmailLogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      Виж последния изпратен имейл
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Последен имейл (демо)</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 text-sm">
                      <div className="text-muted-foreground">
                        <div>
                          <span className="font-medium text-foreground">До:</span> {latestEmailLog.recipient_email}
                        </div>
                        <div>
                          <span className="font-medium text-foreground">Тема:</span> {latestEmailLog.subject}
                        </div>
                        <div>
                          <span className="font-medium text-foreground">Статус:</span>{" "}
                          {latestEmailLog.status || "unknown"}
                        </div>
                      </div>
                      <div className="rounded-md border border-border/40 bg-background/50">
                        <ScrollArea className="h-[50vh] p-3">
                          <div
                            className="prose prose-sm max-w-none"
                            // content is generated by our backend; used only as demo proof
                            dangerouslySetInnerHTML={{ __html: latestEmailLog.body }}
                          />
                        </ScrollArea>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            <div className="text-xs lg:text-sm mb-3 lg:mb-4 h-5">
              {textOnlyMode ? (
                <span className="text-primary font-medium">💬 Текстов режим — пишете съобщение</span>
              ) : isConnecting ? (
                <span className="text-primary font-medium animate-pulse">{t("interview.connecting")}</span>
              ) : isSpeaking ? (
                <span className="text-primary font-medium">{t("interview.speaking")}</span>
              ) : isListening ? (
                <span className="text-neo-success font-medium animate-pulse">{t("interview.listening")}</span>
              ) : isConnected ? (
                <span className="text-muted-foreground">{t("interview.connected")}</span>
              ) : (
                <span className="text-muted-foreground">{t("interview.pressToCall")}</span>
              )}
            </div>

            {/* Contact panel and resend button removed - no email functionality for now */}

            {(messages.length > 0 || liveAssistantTranscript || liveUserTranscript) && (
              <div
                ref={messagesContainerRef}
                className="mt-4 lg:mt-6 max-h-[60vh] overflow-y-auto space-y-2 lg:space-y-3 text-left"
              >
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-2 lg:p-3 rounded-lg text-xs lg:text-sm break-words whitespace-pre-wrap ${
                      msg.role === "assistant"
                        ? "bg-primary/10 border border-primary/20"
                        : "bg-muted/30 border border-border/20"
                    }`}
                  >
                    <span className="font-medium text-[10px] lg:text-xs text-muted-foreground block mb-1">
                      {msg.role === "assistant" ? t("interview.neo") : t("interview.you")}
                    </span>
                    {msg.content}
                  </div>
                ))}
                {liveUserTranscript && (
                  <div className="p-2 lg:p-3 rounded-lg text-xs lg:text-sm bg-muted/30 border border-border/20 animate-pulse italic break-words whitespace-pre-wrap">
                    <span className="font-medium text-[10px] lg:text-xs text-muted-foreground block mb-1">
                      {t("interview.you")}
                    </span>
                    {liveUserTranscript}
                  </div>
                )}
                {liveAssistantTranscript && (
                  <div className="p-2 lg:p-3 rounded-lg text-xs lg:text-sm bg-primary/10 border border-primary/20 animate-pulse break-words whitespace-pre-wrap">
                    <span className="font-medium text-[10px] lg:text-xs text-muted-foreground block mb-1">
                      {t("interview.neo")}
                    </span>
                    {liveAssistantTranscript}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {(isConnected || textOnlyMode) && (
              <div className="mt-4 lg:mt-6 flex gap-2">
                <Input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t("interview.writeMessage")}
                  className="flex-1 text-sm bg-background/50 border-border/30"
                  disabled={isSpeaking}
                />
                <Button
                  onClick={handleSendText}
                  disabled={!textInput.trim() || isSpeaking}
                  size="icon"
                  className="shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <p className="text-center text-[10px] lg:text-xs text-muted-foreground mt-3 lg:mt-4">
            {t("interview.speakOrWrite")}
          </p>
        </div>
      </div>
    </section>
  );
};

export default VoiceInterview;
