import { useState, useEffect, useRef, useCallback } from 'react';
import { Phone, PhoneOff, Clock, Send, MessageSquare, Mic, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useGeminiVoice } from '@/hooks/useGeminiVoice';
import { useAudioEffects } from '@/hooks/useAudioEffects';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
  const [textOnlyMode, setTextOnlyMode] = useState(false);
  const [liveAssistantTranscript, setLiveAssistantTranscript] = useState<string>('');
  const [liveUserTranscript, setLiveUserTranscript] = useState<string>('');

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const lastTrackedMinutesRef = useRef<number>(0);
  const isDisconnectingRef = useRef<boolean>(false);
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

  useEffect(() => {
    setLocalUsedMinutes(usedMinutes);
  }, [usedMinutes]);

  const remainingMinutes = Math.max(0, planLimit - localUsedMinutes);
  const usagePercent = planLimit > 0 ? (localUsedMinutes / planLimit) * 100 : 0;

  // ── Message handler ──
  const handleMessage = useCallback((message: Message) => {
    let content = message.content;
    if (!content || content.trim().length < 2) return;

    if (message.role === 'user') {
      setLiveUserTranscript('');
    }

    if (message.role === 'assistant') {
      setLiveAssistantTranscript('');
    }

    // Skip duplicate typed user messages
    if (message.role === 'user' && typedMessageAddedRef.current === content) {
      typedMessageAddedRef.current = null;
      return;
    }

    // Skip duplicate greeting — block any greeting-like assistant message while instant greeting is showing
    if (message.role === 'assistant') {
      const lc = content.toLowerCase();
      const isGreeting = lc.includes('здравейте') || lc.includes('нео от') || lc.includes('с какво мога');
      
      if (isGreeting) {
        // Always replace the first assistant message if it's still the only one (instant greeting)
        setMessages((prev) => {
          const assistantCount = prev.filter(m => m.role === 'assistant').length;
          if (assistantCount <= 1 && prev.length > 0 && prev[0].role === 'assistant') {
            const updated = [...prev];
            updated[0] = { role: 'assistant', content };
            return updated;
          }
          return prev;
        });
        greetingShownRef.current = false;
        return;
      }
      
      // If greetingShown is still true but this isn't a greeting, just clear the flag
      if (greetingShownRef.current) {
        greetingShownRef.current = false;
      }
    }

    setMessages((prev) => [...prev, { role: message.role, content }]);
  }, []);

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

  // Pre-warm microphone
  useEffect(() => {
    preWarmMicrophone();
  }, [preWarmMicrophone]);

  // Scroll to bottom
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, liveAssistantTranscript, liveUserTranscript]);

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

          // Track every 30s
          if (elapsed > 0 && elapsed % 30 === 0) {
            const minutesToTrack = currentSessionMinutes - lastTrackedMinutesRef.current;
            if (minutesToTrack > 0) {
              lastTrackedMinutesRef.current = currentSessionMinutes;
              supabase.functions.invoke('track-usage', {
                body: { action: 'add_usage', minutes: minutesToTrack },
              }).then(({ data, error }) => {
                if (data && !error) console.log('[USAGE] Tracked:', data.used_minutes);
              }).catch(console.error);
            }
          }

          if (totalUsedMinutes >= planLimit) {
            toast({ title: 'Лимит достигнат', description: 'Надвишихте лимита за Вашия план', variant: 'destructive' });
            handleEndCall();
          }
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isConnected, textOnlyMode, usedMinutes, planLimit, toast]);

  // Build system prompt & prepare session (Gemini gets knowledge via gemini-session + worker proxy)
  useEffect(() => {
    if (!demoSession) return;

    const company = companyName || 'компанията';
    // Gemini session handles knowledge injection via gemini-session edge function
    const prompt = `TTS for ${company}`;
    setSystemPrompt(prompt);

    prepareSession(prompt, company, demoSession.id).catch((err) => {
      console.error('Prepare session error:', err);
    });
  }, [demoSession, companyName, customPrompt, promptTemplate, voiceSpeed, prepareSession]);

  const handleStartCall = useCallback(async () => {
    if (!demoSession || !systemPrompt) {
      toast({ title: 'Грешка', description: 'Моля, първо заредете база знания (обучете NEO с Вашия сайт)', variant: 'destructive' });
      return;
    }

    if (remainingMinutes <= 0) {
      toast({ title: 'Лимит достигнат', description: 'Надвишихте лимита за Вашия план', variant: 'destructive' });
      return;
    }

    initAudioContext();

    // Check mic
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

    if (micGranted) {
      setTextOnlyMode(false);
      playConnectSound();
      startAmbient();
      await connect(systemPrompt, companyName || 'компанията', demoSession.id, false);
    } else {
      setTextOnlyMode(true);
      playConnectSound();
      toast({ title: '🎤 Микрофонът не е разрешен', description: 'НЕО ще ви отговаря с глас, а вие пишете.' });
      await connect(systemPrompt, companyName || 'компанията', demoSession.id, true);
    }
  }, [demoSession, systemPrompt, companyName, connect, toast, remainingMinutes, initAudioContext, playConnectSound, startAmbient]);

  const handleEndCall = useCallback(() => {
    isDisconnectingRef.current = true;
    playDisconnectSound();
    stopAmbient();

    const pendingUser = liveUserTranscript.trim();
    if (pendingUser) {
      setMessages(prev => [...prev, { role: 'user' as const, content: pendingUser }]);
    }
    
    // Commit any partial assistant transcript before disconnecting
    const pendingAssistant = liveAssistantTranscript.trim();
    if (pendingAssistant) {
      setMessages(prev => [...prev, { role: 'assistant' as const, content: pendingAssistant }]);
    }
    setLiveAssistantTranscript('');
    setLiveUserTranscript('');
    
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
  }, [disconnect, onUsageUpdate, playDisconnectSound, stopAmbient, liveAssistantTranscript, liveUserTranscript]);

  // Send text (same as demo - useGeminiVoice handles worker proxy internally)
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

    if (isConnected) {
      skipCleanForTypedRef.current = trimmed;
      typedMessageAddedRef.current = trimmed;
      setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
      sendText(trimmed);
    }

    typedSendLockRef.current = false;
  }, [textInput, isConnected, textOnlyMode, sendText]);

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
        {(messages.length > 0 || liveAssistantTranscript || liveUserTranscript) && (
          <div
            ref={messagesContainerRef}
            className="mt-4 max-h-[60vh] overflow-y-auto space-y-2 text-left"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg text-sm break-words whitespace-pre-wrap ${
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
            {liveUserTranscript && (
              <div className="p-3 rounded-lg text-sm bg-muted/30 border border-border/20 animate-pulse italic">
                <span className="font-medium text-xs text-muted-foreground block mb-1">Вие</span>
                {liveUserTranscript}
              </div>
            )}
            {liveAssistantTranscript && (
              <div className="p-3 rounded-lg text-sm bg-primary/10 border border-primary/20 animate-pulse">
                <span className="font-medium text-xs text-muted-foreground block mb-1">NEO</span>
                {liveAssistantTranscript}
              </div>
            )}
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
    </div>
  );
};

export default VoiceTest;
