import { useState, useEffect, useRef, useCallback } from 'react';
import { Phone, PhoneOff, Clock, Send, MessageSquare, Mic, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useGeminiVoice } from '@/hooks/useGeminiVoice';
import { useAgentCore } from '@/hooks/useAgentCore';
import { useAudioEffects } from '@/hooks/useAudioEffects';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface VoiceTestProps {
  companyName: string;
  customPrompt: string;
  promptTemplate: string;
  voiceSpeed: number;
  demoSession: {
    id: string;
    url: string;
    summary: string | null;
  } | null;
  usedMinutes: number;
  planLimit: number;
  onUsageUpdate: (newUsedMinutes: number) => void;
}

type EmailLog = {
  id: string;
  created_at: string;
  sent_at: string | null;
  recipient_email: string;
  subject: string;
  body: string;
  status: string | null;
  intent: string | null;
};

const VoiceTest = ({
  companyName,
  customPrompt,
  promptTemplate,
  voiceSpeed,
  demoSession,
  usedMinutes,
  planLimit,
  onUsageUpdate,
}: VoiceTestProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [localUsedMinutes, setLocalUsedMinutes] = useState<number>(usedMinutes);
  const [textInput, setTextInput] = useState<string>('');
  const [isSendingText, setIsSendingText] = useState<boolean>(false);
  const [textOnlyMode, setTextOnlyMode] = useState(false);
  const [latestEmailLog, setLatestEmailLog] = useState<EmailLog | null>(null);
  const [emailLogOpen, setEmailLogOpen] = useState(false);
  const [actionsTaken, setActionsTaken] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const lastTrackedMinutesRef = useRef<number>(0);
  const isDisconnectingRef = useRef<boolean>(false);

  // Refs for stable callbacks
  const sendTextRef = useRef<((text: string, asUser?: boolean) => void) | null>(null);
  const getStateRef = useRef<(() => any) | null>(null);
  const processMessageRef = useRef<((msg: string) => Promise<string | null>) | null>(null);
  const initPromiseRef = useRef<Promise<string | null> | null>(null);
  const lastInitSessionIdRef = useRef<string | null>(null);
  const greetingShownRef = useRef(false);
  const skipCleanForTypedRef = useRef<string | null>(null);
  const typedMessageAddedRef = useRef<string | null>(null);
  const typedSendLockRef = useRef(false);
  const lastTypedSendRef = useRef<{ text: string; ts: number } | null>(null);

  const { toast } = useToast();

  const {
    playConnectSound,
    playDisconnectSound,
    startAmbient,
    stopAmbient,
    initAudioContext,
  } = useAudioEffects({ ambientVolume: 0.06, effectsVolume: 0.25 });

  // Sync local state with prop
  useEffect(() => {
    setLocalUsedMinutes(usedMinutes);
  }, [usedMinutes]);

  const remainingMinutes = Math.max(0, planLimit - localUsedMinutes);
  const usagePercent = planLimit > 0 ? (localUsedMinutes / planLimit) * 100 : 0;

  // ── Email log fetching ──
  const fetchLatestEmailLog = useCallback(async () => {
    if (!demoSession?.id) return;
    const sessionToken = sessionStorage.getItem(`neo_session_${demoSession.id}`);
    if (!sessionToken) return;

    const { data, error } = await supabase.functions.invoke('demo-email-log', {
      body: { sessionId: demoSession.id, sessionToken },
    });
    if (error) {
      console.error('[Dashboard] demo-email-log error:', error);
      return;
    }
    const email = (data as any)?.email as EmailLog | null | undefined;
    if (email) setLatestEmailLog(email);
  }, [demoSession?.id]);

  // ── Agent Core (same as demo) ──
  const handleAgentError = useCallback((error: string) => {
    console.error('[Dashboard] Agent error:', error);
  }, []);

  const handleAgentAction = useCallback(
    (action: string) => {
      console.log('[Dashboard] Agent action:', action);
      setActionsTaken((prev) => [...prev, action]);

      const safeSend = sendTextRef.current;
      const stateGetter = getStateRef.current;
      const agentState = stateGetter?.();

      if (action === 'booking_created') {
        console.log('[Dashboard] ✅ Booking completed');
        toast({
          title: '✅ Час запазен!',
          description: 'Изпратено е потвърждение на имейла.',
        });
        safeSend?.(
          '[SYSTEM: Резервацията беше направена успешно. Потвърди на клиента, че часът е запазен и имейлът е изпратен.]',
          false,
        );
      } else if (action === 'email_sent') {
        toast({
          title: '📧 Имейл изпратен!',
          description: 'Проверете пощата си.',
        });
        fetchLatestEmailLog();
        setEmailLogOpen(true);
        safeSend?.('[SYSTEM: Имейлът беше изпратен успешно. Потвърди на клиента да провери пощата си.]', false);
      } else if (action === 'calculation_done') {
        if (agentState?.calculation_result) {
          toast({
            title: '🧮 Изчисление готово!',
            description: `Обща сума: ${agentState.calculation_result} ${agentState.calculation_unit || ''}`,
          });
          safeSend?.(
            `[SYSTEM: Изчислението е готово. Резултат: ${agentState.calculation_breakdown} ${agentState.calculation_unit}. Обща сума: ${agentState.calculation_result} ${agentState.calculation_unit}. Обясни на клиента и попитай дали иска имейл с офертата.]`,
            false,
          );
        }
      } else if (action === 'availability_checked') {
        console.log('[Dashboard] ✅ Availability check completed');
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

  // Keep refs up to date
  useEffect(() => {
    getStateRef.current = getState as any;
    processMessageRef.current = processMessage;
  }, [getState, processMessage]);

  // ── Message handler (same approach as demo) ──
  const handleMessage = useCallback(
    async (message: Message) => {
      let content = message.content;

      if (!content || content.trim().length < 2) return;

      // Skip duplicate typed user messages
      if (message.role === 'user' && typedMessageAddedRef.current === content) {
        typedMessageAddedRef.current = null;
        return;
      }

      // Skip duplicate greeting
      if (message.role === 'assistant') {
        const isGreeting = content.toLowerCase().startsWith('здравейте');
        if (isGreeting && greetingShownRef.current) return;
      }

      setMessages((prev) => [...prev, { role: message.role, content }]);
    },
    [],
  );

  const handleError = useCallback((error: string) => {
    console.error('Voice error:', error);
    toast({
      title: 'Грешка',
      description: error,
      variant: 'destructive',
    });
  }, [toast]);

  const {
    isConnected,
    isConnecting,
    isSpeaking,
    isListening,
    connect,
    disconnect,
    prepareSession,
    preWarmMicrophone,
    sendText,
  } = useGeminiVoice({
    onMessage: handleMessage,
    onError: handleError,
  });

  // Keep sendText ref current
  useEffect(() => {
    sendTextRef.current = sendText;
  }, [sendText]);

  // Pre-warm microphone on mount
  useEffect(() => {
    preWarmMicrophone();
  }, [preWarmMicrophone]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Timer and usage tracking
  useEffect(() => {
    if (isConnected || textOnlyMode) {
      startTimeRef.current = Date.now();
      lastTrackedMinutesRef.current = 0;
      isDisconnectingRef.current = false;

      timerRef.current = setInterval(() => {
        if (startTimeRef.current && !isDisconnectingRef.current) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setCallDuration(elapsed);

          const currentSessionMinutes = elapsed / 60;
          const totalUsedMinutes = usedMinutes + currentSessionMinutes;
          setLocalUsedMinutes(totalUsedMinutes);

          if (elapsed > 0 && elapsed % 30 === 0) {
            const minutesToTrack = currentSessionMinutes - lastTrackedMinutesRef.current;
            if (minutesToTrack > 0) {
              lastTrackedMinutesRef.current = currentSessionMinutes;
              supabase.functions.invoke('track-usage', {
                body: { action: 'add_usage', minutes: minutesToTrack },
              }).then(({ data, error }) => {
                if (data && !error) {
                  console.log('[USAGE] Tracked:', data.used_minutes);
                }
              }).catch(console.error);
            }
          }

          if (totalUsedMinutes >= planLimit) {
            toast({
              title: 'Лимит достигнат',
              description: 'Надвишихте лимита за Вашия план',
              variant: 'destructive',
            });
            handleEndCall();
          }
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isConnected, textOnlyMode, usedMinutes, planLimit, toast]);

  // Build system prompt and prepare session + agent core
  useEffect(() => {
    if (!demoSession) return;

    const sessionId = demoSession.id;
    const company = companyName || 'компанията';

    // ★ Gemini is TTS-only — agent-core handles knowledge
    const prompt = `TTS for ${company}`;
    setSystemPrompt(prompt);

    // Prepare Gemini session
    prepareSession(prompt, company, sessionId).catch((err) => {
      console.error('Prepare session error:', err);
    });

    // Initialize agent-core (same as demo)
    if (lastInitSessionIdRef.current !== sessionId) {
      lastInitSessionIdRef.current = sessionId;
      initPromiseRef.current = initAgent(sessionId);
    }
  }, [demoSession, companyName, prepareSession, initAgent]);

  // Fetch email logs when session changes
  useEffect(() => {
    setLatestEmailLog(null);
    setEmailLogOpen(false);
    if (demoSession?.id) fetchLatestEmailLog();
  }, [demoSession?.id, fetchLatestEmailLog]);

  const handleStartCall = useCallback(async () => {
    if (!demoSession || !systemPrompt) {
      toast({
        title: 'Грешка',
        description: 'Моля, първо заредете база знания (обучете NEO с Вашия сайт)',
        variant: 'destructive',
      });
      return;
    }

    if (remainingMinutes <= 0) {
      toast({
        title: 'Лимит достигнат',
        description: 'Надвишихте лимита за Вашия план',
        variant: 'destructive',
      });
      return;
    }

    // Ensure agent-core is initialized
    try {
      resetAgent();
      const sessionId = demoSession.id;
      if (lastInitSessionIdRef.current !== sessionId || !initPromiseRef.current) {
        lastInitSessionIdRef.current = sessionId;
        initPromiseRef.current = initAgent(sessionId);
      }
      await initPromiseRef.current;
    } catch (e) {
      console.error('[Dashboard] initAgent failed', e);
    }

    initAudioContext();

    // Check mic permission
    let micGranted = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      micGranted = true;
    } catch {
      micGranted = false;
    }

    // Instant greeting
    const instantGreeting = `Здравейте! Аз съм НЕО от ${companyName || 'компанията'}. Какво ви интересува?`;
    setMessages([{ role: 'assistant', content: instantGreeting }]);
    greetingShownRef.current = true;
    setCallDuration(0);
    setActionsTaken([]);

    if (micGranted) {
      setTextOnlyMode(false);
      playConnectSound();
      startAmbient();
      await connect(systemPrompt, companyName || 'компанията', demoSession.id, false);
    } else {
      setTextOnlyMode(true);
      playConnectSound();
      toast({
        title: '🎤 Микрофонът не е разрешен',
        description: 'НЕО ще ви отговаря с глас, а вие пишете.',
      });
      await connect(systemPrompt, companyName || 'компанията', demoSession.id, true);
    }
  }, [demoSession, systemPrompt, companyName, connect, toast, remainingMinutes, resetAgent, initAgent, initAudioContext, playConnectSound, startAmbient]);

  const handleEndCall = useCallback(() => {
    console.log('[CALL] End call requested');
    isDisconnectingRef.current = true;
    
    playDisconnectSound();
    stopAmbient();
    disconnect();
    setTextOnlyMode(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const startTime = startTimeRef.current;
    const lastTracked = lastTrackedMinutesRef.current;
    startTimeRef.current = null;
    lastTrackedMinutesRef.current = 0;
    setCallDuration(0);

    if (startTime) {
      const totalMinutes = (Date.now() - startTime) / 1000 / 60;
      const untrackedMinutes = totalMinutes - lastTracked;
      if (untrackedMinutes > 0.01) {
        supabase.functions.invoke('track-usage', {
          body: { action: 'add_usage', minutes: untrackedMinutes },
        }).then(({ data }) => {
          if (data) {
            onUsageUpdate(data.used_minutes);
            setLocalUsedMinutes(data.used_minutes);
          }
        }).catch(console.error);
      }
    }
  }, [disconnect, onUsageUpdate, playDisconnectSound, stopAmbient]);

  // Parse explicit name/email commands from typed text
  const parseExplicitCommands = useCallback((text: string) => {
    const nameMatch = text.match(/(?:име|name)\s*[:：]\s*([А-Яа-яA-Za-z\s]+?)(?:\.|,|$|\s+(?:имейл|email))/i);
    const emailMatch = text.match(/(?:имейл|email|e-mail)\s*[:：]\s*([\w.+-]+@[\w.-]+\.[a-z]{2,})/i);
    const standaloneEmail = !emailMatch ? text.match(/^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i) : null;
    return {
      name: nameMatch?.[1]?.trim() || null,
      email: (emailMatch?.[1] || standaloneEmail?.[0])?.toLowerCase().trim() || null,
      hasExplicitData: !!(nameMatch || emailMatch || standaloneEmail),
    };
  }, []);

  // Handle sending text message (same flow as demo)
  const handleSendText = useCallback(async () => {
    const trimmed = textInput.trim();
    if (!trimmed || (!isConnected && !textOnlyMode)) return;

    if (typedSendLockRef.current) return;
    const now = Date.now();
    const last = lastTypedSendRef.current;
    if (last && last.text === trimmed && now - last.ts < 700) return;

    typedSendLockRef.current = true;
    lastTypedSendRef.current = { text: trimmed, ts: now };
    setTextInput('');

    const parsed = parseExplicitCommands(trimmed);
    let messageForAgent = trimmed;

    if (parsed.hasExplicitData) {
      const parts: string[] = [];
      if (parsed.name) parts.push(`Казвам се ${parsed.name}.`);
      if (parsed.email) parts.push(`Имейлът ми е ${parsed.email}.`);
      const remainingText = trimmed
        .replace(/(?:име|name)\s*[:：]\s*[А-Яа-яA-Za-z\s]+/gi, '')
        .replace(/(?:имейл|email|e-mail)\s*[:：]\s*[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, '')
        .trim();
      if (remainingText && remainingText.length > 3) parts.push(remainingText);
      messageForAgent = parts.join(' ').trim() || trimmed;
    }

    if (isConnected) {
      skipCleanForTypedRef.current = messageForAgent;
      typedMessageAddedRef.current = messageForAgent;
      setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
      sendText(messageForAgent);
      typedSendLockRef.current = false;
      return;
    }

    typedSendLockRef.current = false;
  }, [textInput, isConnected, textOnlyMode, sendText, parseExplicitCommands]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  }, [handleSendText]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const canStartCall = demoSession && systemPrompt && remainingMinutes > 0;

  return (
    <div className="space-y-4">
      {/* Usage display */}
      <div className="bg-background/50 rounded-lg p-3 border border-border/30">
        <div className="flex items-center justify-between text-sm mb-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Минути от плана</span>
          </div>
          <span className="font-medium text-foreground">
            {usedMinutes.toFixed(1)} / {planLimit} мин
          </span>
        </div>
        <Progress value={Math.min(usagePercent, 100)} className="h-2" />
        <p className="text-xs text-muted-foreground text-right mt-1">
          Остават: {remainingMinutes.toFixed(1)} мин
        </p>
      </div>

      {/* Mode indicator */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Mic className="w-3.5 h-3.5 text-primary" />
          <span>Глас</span>
        </div>
        <span>+</span>
        <div className="flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-primary" />
          <span>Текст</span>
        </div>
        <span className="text-primary font-medium">2-в-1</span>
      </div>

      {/* Actions taken indicator */}
      {actionsTaken.length > 0 && (
        <div className="flex flex-wrap gap-1.5 justify-center">
          {actionsTaken.map((action, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {action === 'booking_created' ? '✅ Резервация' :
               action === 'email_sent' ? '📧 Имейл' :
               action === 'calculation_done' ? '🧮 Изчисление' :
               action === 'availability_checked' ? '📅 Наличност' : action}
            </span>
          ))}
        </div>
      )}

      {/* Email log button */}
      {latestEmailLog && (
        <Dialog open={emailLogOpen} onOpenChange={setEmailLogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full gap-2">
              <Mail className="w-3.5 h-3.5" />
              Виж последния изпратен имейл
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Последен имейл</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <div className="text-muted-foreground">
                <div><span className="font-medium text-foreground">До:</span> {latestEmailLog.recipient_email}</div>
                <div><span className="font-medium text-foreground">Тема:</span> {latestEmailLog.subject}</div>
                <div><span className="font-medium text-foreground">Статус:</span> {latestEmailLog.status || 'unknown'}</div>
              </div>
              <div className="rounded-md border border-border/40 bg-background/50">
                <ScrollArea className="h-[50vh] p-3">
                  <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: latestEmailLog.body }} />
                </ScrollArea>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Call interface */}
      <div className="text-center py-4">
        <div className="relative inline-block mb-4">
          <button
            onClick={isConnected || textOnlyMode ? handleEndCall : handleStartCall}
            disabled={isConnecting || (!canStartCall && !isConnected && !textOnlyMode)}
            className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
              isConnected || textOnlyMode
                ? 'bg-destructive'
                : isConnecting
                ? 'bg-primary/50 cursor-wait'
                : canStartCall
                ? 'bg-gradient-to-br from-primary to-primary/80 neo-glow-soft hover:scale-105'
                : 'bg-muted cursor-not-allowed'
            }`}
          >
            {isConnected || textOnlyMode ? (
              <PhoneOff className="w-8 h-8 text-white" />
            ) : (
              <Phone className="w-8 h-8 text-white" />
            )}
          </button>

          {(isConnected || textOnlyMode) && (
            <div className="absolute inset-0 rounded-full border-2 border-primary/40 animate-ping" />
          )}
        </div>

        {/* Timer */}
        {(isConnected || textOnlyMode) && (
          <div className="flex items-center justify-center gap-1.5 mb-3 text-primary">
            <Clock className="w-4 h-4" />
            <span className="font-mono font-bold text-sm">{formatTime(callDuration)}</span>
          </div>
        )}

        {/* Status */}
        <div className="text-sm mb-3 h-5">
          {textOnlyMode ? (
            <span className="text-primary font-medium">💬 Текстов режим — пишете съобщение</span>
          ) : isConnecting ? (
            <span className="text-primary font-medium animate-pulse">Свързване с NEO...</span>
          ) : isSpeaking ? (
            <span className="text-primary font-medium">NEO говори...</span>
          ) : isListening ? (
            <span className="text-neo-success font-medium animate-pulse">Слушам...</span>
          ) : isConnected ? (
            <span className="text-muted-foreground">Свързан - говорете или пишете</span>
          ) : !canStartCall ? (
            <span className="text-muted-foreground">
              {remainingMinutes <= 0 ? 'Лимитът е достигнат' : 'Заредете база знания първо'}
            </span>
          ) : (
            <span className="text-muted-foreground">Натиснете за гласов + текстов тест</span>
          )}
        </div>

        {/* Messages */}
        {messages.length > 0 && (
          <div
            ref={messagesContainerRef}
            className="mt-4 max-h-48 overflow-y-auto space-y-2 text-left"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg text-sm ${
                  msg.role === 'assistant'
                    ? 'bg-primary/10 border border-primary/20'
                    : 'bg-muted/30 border border-border/20'
                }`}
              >
                <span className="font-medium text-xs text-muted-foreground block mb-1">
                  {msg.role === 'assistant' ? 'NEO' : 'Вие'}
                </span>
                {msg.content}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Text input */}
        {(isConnected || textOnlyMode) && (
          <div className="mt-4 flex gap-2">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Или напишете съобщение..."
              className="flex-1 bg-background/50"
              disabled={isSendingText || isSpeaking}
            />
            <Button
              onClick={handleSendText}
              disabled={!textInput.trim() || isSendingText || isSpeaking}
              size="icon"
              className="shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceTest;
