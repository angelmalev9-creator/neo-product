import { useState, useEffect, useRef, useCallback } from 'react';
import { Phone, PhoneOff, Clock, Send, MessageSquare, Mic } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useGeminiVoice } from '@/hooks/useGeminiVoice';
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
  const [isSendingText, setIsSendingText] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const lastTrackedMinutesRef = useRef<number>(0);
  const isDisconnectingRef = useRef<boolean>(false);
  const { toast } = useToast();

  // Sync local state with prop
  useEffect(() => {
    setLocalUsedMinutes(usedMinutes);
  }, [usedMinutes]);

  const remainingMinutes = Math.max(0, planLimit - localUsedMinutes);
  const usagePercent = planLimit > 0 ? (localUsedMinutes / planLimit) * 100 : 0;

  const handleMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const handleError = useCallback((error: string) => {
    console.error('Voice error:', error);
    toast({
      title: "Грешка",
      description: error,
      variant: "destructive",
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

  // Pre-warm microphone on mount for instant connection
  useEffect(() => {
    preWarmMicrophone();
  }, [preWarmMicrophone]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Timer and REAL-TIME usage tracking every 30 seconds
  useEffect(() => {
    if (isConnected) {
      startTimeRef.current = Date.now();
      lastTrackedMinutesRef.current = 0;
      isDisconnectingRef.current = false;

      timerRef.current = setInterval(() => {
        if (startTimeRef.current && !isDisconnectingRef.current) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setCallDuration(elapsed);

          const currentSessionMinutes = elapsed / 60;
          const totalUsedMinutes = usedMinutes + currentSessionMinutes;
          
          // Update local display in real-time
          setLocalUsedMinutes(totalUsedMinutes);

          // Track to backend every 30 seconds
          if (elapsed > 0 && elapsed % 30 === 0) {
            const minutesToTrack = currentSessionMinutes - lastTrackedMinutesRef.current;
            if (minutesToTrack > 0) {
              console.log('[USAGE] Tracking', minutesToTrack.toFixed(2), 'minutes');
              lastTrackedMinutesRef.current = currentSessionMinutes;
              
              supabase.functions.invoke('track-usage', {
                body: { action: 'add_usage', minutes: minutesToTrack },
              }).then(({ data, error }) => {
                if (data && !error) {
                  console.log('[USAGE] Tracked successfully:', data.used_minutes);
                }
              }).catch(console.error);
            }
          }

          // Check if limit exceeded
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
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isConnected, usedMinutes, planLimit, toast]);

  // Build system prompt when data changes
  useEffect(() => {
    if (!demoSession) return;

    let contextInfo = '';
    if (demoSession.summary) {
      contextInfo = demoSession.summary;
    }

    const templatePrompts: Record<string, string> = {
      sales: `Ти си ТОП ПРОДАВАЧ с 20 години опит!

СЛЕД ВСЕКИ ОТГОВОР ЗАДЪЛЖИТЕЛНО:
1. Отговори на въпроса КОНКРЕТНО (2-3 изречения)
2. Добави СТОЙНОСТ - още една полза или предимство
3. Завърши с ВЪПРОС ЗА ДЕЙСТВИЕ:
   - "Искате ли да Ви изпратим оферта?"
   - "Кога Ви е удобно да започнем?"
   - "Да уговорим среща за консултация?"
   - "Какво Ви спира да се възползвате още днес?"

ТЕХНИКИ (използвай активно):
• FOMO: "Тази оферта е валидна само до..."
• SOCIAL PROOF: "Повечето ни клиенти избират..."
• VALUE STACKING: "Получавате не само X, но и Y и Z"
• URGENCY: "В момента имаме свободен капацитет"

ТОНЪТ ТИ е: Уверен, ентусиазиран, убедителен!`,

      support: `Ти си ТЪРПЕЛИВ И ГРИЖОВЕН консултант!

ПРИ ВСЕКИ ПРОБЛЕМ:
1. Изрази РАЗБИРАНЕ: "Разбирам притеснението Ви..."
2. Дай ЯСНО решение стъпка по стъпка
3. ПРОВЕРИ: "Това помогна ли? Има ли още нещо?"

ПРАВИЛА:
• НИКОГА не звучи нетърпеливо
• Обясни сложните неща с прости думи
• Бъди емпатичен - клиентът може да е разстроен

ТОНЪТ ТИ е: Спокоен, разбиращ, търпелив!`,

      info: `Ти си ТОЧЕН И ОБЕКТИВЕН информатор!

ДАВАЙ:
1. ФАКТИ - без емоционални украси
2. КРАТКИ отговори - максимум 2-3 изречения
3. Допълнителна информация САМО ако помолят

ТОНЪТ ТИ е: Обективен, информативен, професионален!`,
    };

    const baseTemplate = templatePrompts[promptTemplate] || templatePrompts.sales;
    const company = companyName || 'компанията';

    const prompt = `Ти си НЕО – елитен виртуален консултант на ${company}. 
Ти си ГЛАСОВ И ТЕКСТОВ асистент 2-в-1!

${baseTemplate}

ЗНАНИЯ ЗА КОМПАНИЯТА:
${contextInfo}

${customPrompt ? `ДОПЪЛНИТЕЛНИ ИНСТРУКЦИИ:\n${customPrompt}\n` : ''}

ПРАВИЛА:
1. Отговаряй САМО с информация от горните знания
2. Отговори: 2-3 изречения максимум
3. Бъди директен и конкретен
4. НИКОГА не казвай "ще се свържем" или "обадете се по-късно"
5. НИКОГА не казвай че нямаш информация - ако клиентът пита, значи информацията Е в знанията ти!
6. Използвай учтива форма (Вие, Вас, Ви)

Говори САМО на ЧИСТ БЪЛГАРСКИ!`;

    setSystemPrompt(prompt);

    // Prepare session in advance with voice speed (sessionId is undefined for dashboard)
    prepareSession(prompt, company).catch((err) => {
      console.error('Prepare session error:', err);
    });
  }, [demoSession, companyName, customPrompt, promptTemplate, voiceSpeed, prepareSession]);

  const handleStartCall = useCallback(async () => {
    if (!demoSession || !systemPrompt) {
      toast({
        title: "Грешка",
        description: "Моля, първо заредете база знания (обучете NEO с Вашия сайт)",
        variant: "destructive",
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

    // Check mic permission
    let micGranted = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      micGranted = true;
    } catch {
      micGranted = false;
    }

    if (!micGranted) {
      toast({
        title: "🎤 Микрофонът не е разрешен",
        description: "НЕО ще ви отговаря с глас, а вие пишете.",
      });
    }

    setMessages([]);
    setCallDuration(0);
    await connect(systemPrompt, companyName || 'компанията', undefined, !micGranted);
  }, [demoSession, systemPrompt, companyName, connect, toast, remainingMinutes]);

  const handleEndCall = useCallback(() => {
    console.log('[CALL] End call requested');
    
    // ВЕДНАГА прекъсни връзката - без проверки
    disconnect();
    
    // Изчисти таймера ВЕДНАГА
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Запази стойности преди да ги нулираме
    const startTime = startTimeRef.current;
    const lastTracked = lastTrackedMinutesRef.current;
    
    // Нулирай refs ВЕДНАГА
    startTimeRef.current = null;
    lastTrackedMinutesRef.current = 0;
    setCallDuration(0);
    
    // Async tracking в background - няма да блокира UI
    if (startTime) {
      const totalMinutes = (Date.now() - startTime) / 1000 / 60;
      const untrackedMinutes = totalMinutes - lastTracked;
      
      console.log('[CALL] Total:', totalMinutes.toFixed(2), 'min, untracked:', untrackedMinutes.toFixed(2), 'min');
      
      if (untrackedMinutes > 0.01) {
        supabase.functions.invoke('track-usage', {
          body: { action: 'add_usage', minutes: untrackedMinutes },
        }).then(({ data }) => {
          if (data) {
            console.log('[CALL] Final tracked:', data.used_minutes);
            onUsageUpdate(data.used_minutes);
            setLocalUsedMinutes(data.used_minutes);
          }
        }).catch(console.error);
      }
    }
  }, [disconnect, onUsageUpdate]);

  // Handle sending text message
  const handleSendText = useCallback(async () => {
    if (!textInput.trim() || !isConnected) return;

    const userMessage = textInput.trim();
    setTextInput('');
    setIsSendingText(true);

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    // Send to Gemini
    sendText(userMessage);

    setIsSendingText(false);
  }, [textInput, isConnected, sendText]);

  // Handle Enter key in text input
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  }, [handleSendText]);

  // Format time as MM:SS
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
        {/* Call button */}
        <div className="relative inline-block mb-4">
          <button
            onClick={isConnected ? handleEndCall : handleStartCall}
            disabled={isConnecting || (!canStartCall && !isConnected)}
            className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
              isConnected 
                ? 'bg-destructive' 
                : isConnecting
                ? 'bg-primary/50 cursor-wait'
                : canStartCall
                ? 'bg-gradient-to-br from-primary to-primary/80 neo-glow-soft hover:scale-105'
                : 'bg-muted cursor-not-allowed'
            }`}
          >
            {isConnected ? (
              <PhoneOff className="w-8 h-8 text-white" />
            ) : (
              <Phone className="w-8 h-8 text-white" />
            )}
          </button>
          
          {isConnected && (
            <div className="absolute inset-0 rounded-full border-2 border-primary/40 animate-ping" />
          )}
        </div>

        {/* Timer */}
        {isConnected && (
          <div className="flex items-center justify-center gap-1.5 mb-3 text-primary">
            <Clock className="w-4 h-4" />
            <span className="font-mono font-bold text-sm">{formatTime(callDuration)}</span>
          </div>
        )}

        {/* Status */}
        <div className="text-sm mb-3 h-5">
          {isConnecting ? (
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
          <div className="mt-4 max-h-48 overflow-y-auto space-y-2 text-left">
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

        {/* Text input - only when connected */}
        {isConnected && (
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

      {/* Info */}
      <p className="text-center text-xs text-muted-foreground">
        Гласов + текстов разговор в реално време • Минутите се броят от плана Ви
      </p>
    </div>
  );
};

export default VoiceTest;
