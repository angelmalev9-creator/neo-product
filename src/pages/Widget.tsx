import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Phone, PhoneOff, X, Send, Mic, MicOff, MessageSquare, Bot, User, UserPlus, Sparkles, Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useGeminiVoice } from '@/hooks/useGeminiVoice';
import { useAudioEffects } from '@/hooks/useAudioEffects';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import LeadCaptureModal, { LeadData } from '@/components/widget/LeadCaptureModal';
import { cleanTranscriptForStorage } from '@/utils/transcriptCleanup';
import neoLogoImg from '@/assets/neo-logo.png';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface WidgetConfig {
  position: string;
  color: string;
  buttonText: string;
  autoGreet: boolean;
  autoGreetMessage?: string;
  buttonSize: string;
}

interface CatalogItem {
  name: string;
  description: string | null;
  price: number | null;
  priceUnit: string | null;
  capacity: number | null;
  amenities: string[] | null;
  images: string[] | null;
  category: string | null;
}

const normalizeTranscriptChunk = (value: string) => value.replace(/\s+/g, ' ').trim();

const extractIncrementalTranscript = (previous: string, incoming: string) => {
  const prev = normalizeTranscriptChunk(previous);
  const next = normalizeTranscriptChunk(incoming);

  if (!next) return '';
  if (!prev) return next;
  if (next === prev || prev.includes(next)) return '';
  if (next.startsWith(prev)) return normalizeTranscriptChunk(next.slice(prev.length));

  const repeatedIndex = next.indexOf(prev);
  if (repeatedIndex >= 0) {
    return normalizeTranscriptChunk(next.slice(repeatedIndex + prev.length));
  }

  const maxOverlap = Math.min(prev.length, next.length);
  for (let len = maxOverlap; len >= 10; len -= 1) {
    if (prev.slice(-len) === next.slice(0, len)) {
      return normalizeTranscriptChunk(next.slice(len));
    }
  }

  return next;
};

// Detect if a message mentions a catalog item by name
const findMentionedCatalogItems = (text: string, catalog: CatalogItem[]): CatalogItem[] => {
  if (!catalog.length) return [];
  const lower = text.toLowerCase();
  return catalog.filter(item => {
    const name = item.name.toLowerCase();
    // Check if the item name appears in the message
    return lower.includes(name) || name.split(/\s+/).every(word => word.length > 2 && lower.includes(word));
  });
};

// Detect action processing phrases
const isActionProcessingMessage = (text: string): boolean => {
  const actionPhrases = [
    /чудесно.*имам всички данни/i,
    /имам всички данни/i,
    /преди да изпрат/i,
    /един момент/i,
    /момент.*изпращ/i,
    /подавам.*запитван/i,
    /изпращам.*запитван/i,
    /записвам.*данни/i,
    /обработвам/i,
    /проверявам.*наличност/i,
    /резервирам/i,
  ];
  return actionPhrases.some(p => p.test(text));
};

const isActionPayloadMessage = (text: string): boolean => {
  const normalized = text.trim();

  return (
    normalized.startsWith('action_request:') ||
    normalized.startsWith('{"type":"action_request"') ||
    /^\s*\{[\s\S]*"action"\s*:\s*"(submit_form|make_reservation|book_slot)"/i.test(normalized) ||
    /```\s*json[\s\S]*"action"\s*:\s*"(submit_form|make_reservation|book_slot)"/i.test(normalized)
  );
};

const isHiddenAssistantUiMessage = (text: string): boolean => {
  return isActionPayloadMessage(text) || isActionProcessingMessage(text);
};

const Widget = () => {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const companyParam = searchParams.get('company');

  const [messages, setMessages] = useState<Message[]>([]);
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>(companyParam || '');
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState<string>('');
  const [isSendingText, setIsSendingText] = useState<boolean>(false);
  const [showLeadModal, setShowLeadModal] = useState<boolean>(false);
  const [leadSubmitted, setLeadSubmitted] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [liveAssistantTranscript, setLiveAssistantTranscript] = useState<string>('');
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>([]);
  
  const [conversationId, setConversationId] = useState<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const callStartTimeRef = useRef<number | null>(null);
  const lastTrackedTimeRef = useRef<number>(0);
  const persistedTranscriptKeysRef = useRef<Set<string>>(new Set());
  const lastPersistedTranscriptRef = useRef<{ user: string; assistant: string }>({ user: '', assistant: '' });
  const typedMessageAddedRef = useRef<string | null>(null);
  const persistQueueRef = useRef<Promise<void>>(Promise.resolve());
  const messageSeqRef = useRef<number>(0);
  const actionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const { playConnectSound, playDisconnectSound, startAmbient, stopAmbient, initAudioContext } = useAudioEffects({ ambientVolume: 0.04, effectsVolume: 0.2 });

  const handleMessage = useCallback((message: Message) => {
    if (message.role === 'user') {
      setLiveTranscript('');
    }
    if (message.role === 'assistant') {
      setLiveAssistantTranscript('');
      // If assistant sends a new message, action processing is done
      setIsProcessingAction(false);
      if (actionTimeoutRef.current) {
        clearTimeout(actionTimeoutRef.current);
        actionTimeoutRef.current = null;
      }
    }
    // Skip duplicate typed user messages (already added in handleSendText)
    if (message.role === 'user' && typedMessageAddedRef.current === message.content) {
      typedMessageAddedRef.current = null;
      return;
    }
    if (message.role === 'assistant' && isHiddenAssistantUiMessage(message.content || '')) {
      setLiveAssistantTranscript('');
      setIsProcessingAction(true);
      if (actionTimeoutRef.current) clearTimeout(actionTimeoutRef.current);
      actionTimeoutRef.current = setTimeout(() => setIsProcessingAction(false), 20000);
      return;
    }

    setMessages(prev => {
      const next = [...prev, message];
      messagesRef.current = next;
      return next;
    });
  }, []);

  const handleError = useCallback((err: string) => {
    console.error('Voice error:', err);
    setError(err);
  }, []);

  const { isConnected, isConnecting, isSpeaking, isListening, isMicMuted, toggleMicMute, connect, disconnect, prepareSession, sendText, preWarmMicrophone } = useGeminiVoice({
    onMessage: handleMessage,
    onError: handleError,
    onTranscript: (transcript, isFinal, role) => {
      const normalized = transcript.replace(/\s+/g, ' ').trim();

      if (!normalized) return;

      if (role === 'user') {
        setLiveTranscript(normalized);
        if (isFinal) {
          void persistTranscriptMessage('user', normalized);
        }
        return;
      }

      if (isHiddenAssistantUiMessage(normalized)) {
        setIsProcessingAction(true);
        if (actionTimeoutRef.current) clearTimeout(actionTimeoutRef.current);
        actionTimeoutRef.current = setTimeout(() => setIsProcessingAction(false), 20000);
        setLiveAssistantTranscript('');
        return;
      }

      if (!isFinal) {
        setLiveAssistantTranscript(normalized);
      }
      if (isFinal) {
        setLiveAssistantTranscript('');
        void persistTranscriptMessage('assistant', normalized);
      }
    },
    onActionProcessingChange: (processing) => {
      setIsProcessingAction(processing);
      if (actionTimeoutRef.current) {
        clearTimeout(actionTimeoutRef.current);
        actionTimeoutRef.current = null;
      }
      if (processing) {
        setLiveAssistantTranscript('');
      }
    },
  });

  const trackConversation = useCallback(async (action: string, data: Record<string, unknown> = {}) => {
    if (!userId) return null;
    try {
      const cid = data.conversationId || conversationIdRef.current;
      const { data: result, error: trackError } = await supabase.functions.invoke('widget-track-conversation', {
        body: { action, userId, conversationId: cid, ...data },
      });
      if (trackError) {
        console.error('[WIDGET-TRACK] Error:', trackError);
        return null;
      }
      return result;
    } catch (e) {
      console.error('[WIDGET-TRACK] Exception:', e);
      return null;
    }
  }, [userId]);

  const persistTranscriptMessage = useCallback((role: Message['role'], content: string) => {
    const cleaned = cleanTranscriptForStorage(content);
    const normalized = normalizeTranscriptChunk(cleaned);
    const cid = conversationIdRef.current;
    if (!cid || !normalized) return;

    // Don't persist raw action_request JSON
    if (normalized.startsWith('action_request:') || normalized.startsWith('{"type":"action_request"')) return;

    const incremental = extractIncrementalTranscript(lastPersistedTranscriptRef.current[role], normalized);
    if (!incremental) return;

    const key = `${cid}:${role}:${incremental}`;
    if (persistedTranscriptKeysRef.current.has(key)) return;
    persistedTranscriptKeysRef.current.add(key);

    // Assign a monotonic sequence number for server-side ordering
    const seq = ++messageSeqRef.current;

    // Queue this persist call so they execute sequentially (no concurrent race)
    persistQueueRef.current = persistQueueRef.current.then(async () => {
      const result = await trackConversation('message', role === 'user'
        ? { userMessage: incremental, conversationId: cid, seq }
        : { assistantMessage: incremental, conversationId: cid, seq }
      );

      if (!result) {
        persistedTranscriptKeysRef.current.delete(key);
        return;
      }

      lastPersistedTranscriptRef.current[role] = normalized;
    }).catch(() => {
      persistedTranscriptKeysRef.current.delete(key);
    });
  }, [trackConversation]);

  useEffect(() => {
    if (!isConnected || !conversationIdRef.current || !callStartTimeRef.current) return;
    const interval = setInterval(() => {
      const elapsed = (Date.now() - callStartTimeRef.current!) / 1000;
      const sinceLast = elapsed - lastTrackedTimeRef.current;
      if (sinceLast >= 10) {
        trackConversation('add_usage', { durationSeconds: sinceLast, conversationId: conversationIdRef.current });
        lastTrackedTimeRef.current = elapsed;
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [isConnected, conversationId]);

  useEffect(() => {
    if (!conversationIdRef.current) return;
    const handleVis = () => {
      if (document.hidden && isConnected) {
        trackConversation('end', { conversationId: conversationIdRef.current });
      }
    };
    window.addEventListener('visibilitychange', handleVis);
    return () => window.removeEventListener('visibilitychange', handleVis);
  }, [conversationId, isConnected]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, liveTranscript, liveAssistantTranscript]);

  useEffect(() => {
    if (!isListening) {
      setLiveTranscript('');
    }
  }, [isListening]);

  const fetchWidgetData = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error: fnError } = await supabase.functions.invoke('widget-session', { body: { userId } });
      if (fnError || !data) { setError('Неуспешно зареждане'); return; }
      setSystemPrompt(data.systemPrompt);
      setCompanyName(data.companyName || companyParam || 'компанията');
      setConfig(data.widgetConfig);
      setLogoUrl(data.logoUrl || null);
      if (data.sessionId) setSessionId(data.sessionId);
      if (data.bookingCatalog) setCatalog(data.bookingCatalog);
      setIsReady(true);
      if (!isReady) {
        prepareSession(data.systemPrompt, data.companyName || 'компанията', data.sessionId || undefined).catch(console.error);
      }
    } catch { setError('Грешка при зареждане'); }
  }, [userId, companyParam, prepareSession, isReady]);

  useEffect(() => {
    if (!userId) { setError('Липсва userId'); return; }
    fetchWidgetData();
  }, [userId, fetchWidgetData]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`widget-sync-${userId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `user_id=eq.${userId}` },
        () => fetchWidgetData()
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchWidgetData]);

  const startCall = useCallback(async () => {
    if (!systemPrompt || !userId) return;
    initAudioContext();
    setMessages([]);
    setLiveTranscript('');
    setLiveAssistantTranscript('');
    setIsProcessingAction(false);
    persistedTranscriptKeysRef.current.clear();
    lastPersistedTranscriptRef.current = { user: '', assistant: '' };
    setError(null);
    let micGranted = false;
    try {
      await preWarmMicrophone();
      micGranted = true;
    } catch (micErr) {
      console.warn('[WIDGET] Mic unavailable, switching to text-only mode:', micErr);
      micGranted = false;
    }
    const result = await trackConversation('start');
    if (result?.conversationId) {
      conversationIdRef.current = result.conversationId;
      setConversationId(result.conversationId);
      callStartTimeRef.current = Date.now();
      messageSeqRef.current = 0;
      persistedTranscriptKeysRef.current.clear();
      lastPersistedTranscriptRef.current = { user: '', assistant: '' };
      lastTrackedTimeRef.current = 0;
      persistedTranscriptKeysRef.current.clear();
      console.log('[WIDGET] Conversation started:', result.conversationId);
    } else {
      console.warn('[WIDGET] Failed to start conversation tracking');
    }
    if (window.parent !== window) window.parent.postMessage({ type: 'NEO_CONVERSATION_STARTED' }, '*');
    playConnectSound();
    if (micGranted) startAmbient();
    await connect(systemPrompt, companyName, sessionId || undefined, !micGranted);
  }, [systemPrompt, companyName, sessionId, connect, userId, trackConversation, initAudioContext, playConnectSound, startAmbient, preWarmMicrophone]);

  const endCall = useCallback(async () => {
    const pendingUser = liveTranscript.trim();
    if (pendingUser) {
      setMessages(prev => {
        const next = [...prev, { role: 'user' as const, content: pendingUser }];
        messagesRef.current = next;
        return next;
      });
      void persistTranscriptMessage('user', pendingUser);
    }

    const pendingAssistant = liveAssistantTranscript.trim();
    if (pendingAssistant) {
      setMessages(prev => {
        const next = [...prev, { role: 'assistant' as const, content: pendingAssistant }];
        messagesRef.current = next;
        return next;
      });
      void persistTranscriptMessage('assistant', pendingAssistant);
    }
    setLiveAssistantTranscript('');
    setLiveTranscript('');
    setIsProcessingAction(false);
    stopAmbient();
    playDisconnectSound();
    disconnect();
    if (!leadSubmitted) setShowLeadModal(true);
    const cid = conversationIdRef.current;
    if (cid) {
      const currentMessages = messagesRef.current;
      for (const msg of currentMessages) {
        const key = `${cid}:${msg.role}:${msg.content.replace(/\s+/g, ' ').trim()}`;
        if (!persistedTranscriptKeysRef.current.has(key) && msg.content.trim()) {
          persistedTranscriptKeysRef.current.add(key);
          trackConversation('message', msg.role === 'user'
            ? { userMessage: msg.content.trim(), conversationId: cid }
            : { assistantMessage: msg.content.trim(), conversationId: cid }
          ).catch(() => {});
        }
      }
      await trackConversation('end', { conversationId: cid });
      conversationIdRef.current = null;
      setConversationId(null);
      callStartTimeRef.current = null;
      lastTrackedTimeRef.current = 0;
      lastPersistedTranscriptRef.current = { user: '', assistant: '' };
    }
  }, [disconnect, trackConversation, leadSubmitted, stopAmbient, playDisconnectSound, liveAssistantTranscript, liveTranscript, persistTranscriptMessage]);

  const handleLeadSubmit = useCallback(async (data: LeadData) => {
    const { error } = await supabase.functions.invoke('widget-capture-lead', {
      body: { userId, firstName: data.firstName, lastName: data.lastName, email: data.email, service: data.service, conversationId: conversationIdRef.current },
    });
    if (error) throw error;
    setLeadSubmitted(true);
  }, [userId]);

  const handleSendText = useCallback(async () => {
    if (!textInput.trim() || !isConnected) return;
    const msg = textInput.trim();
    setTextInput('');
    typedMessageAddedRef.current = msg;
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    void persistTranscriptMessage('user', msg);
    sendText(msg);
  }, [textInput, isConnected, sendText, persistTranscriptMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendText(); }
  }, [handleSendText]);

  const widgetColor = config?.color || '#ea384c';

  // Avatar component
  const AvatarIcon = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
    const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-14 h-14' };
    const iconSizes = { sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-7 h-7' };
    return (
      <div className={`${sizes[size]} rounded-xl overflow-hidden shrink-0`}>
        {logoUrl ? (
          <img src={logoUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <img src={neoLogoImg} alt="NEO" className="w-full h-full object-cover" />
        )}
      </div>
    );
  };

  // Catalog image card for mentioned items
  const CatalogCard = ({ item }: { item: CatalogItem }) => {
    const img = item.images?.[0];
    if (!img) return null;
    return (
      <div className="rounded-xl overflow-hidden border border-border/20 bg-card/60 max-w-[240px] mt-1.5 mb-1">
        <img src={img} alt={item.name} className="w-full h-28 object-cover" />
        <div className="px-2.5 py-2">
          <p className="text-xs font-semibold text-foreground">{item.name}</p>
          {item.price && (
            <p className="text-[10px] text-primary font-medium mt-0.5">
              {item.price} лв.{item.priceUnit ? ` / ${item.priceUnit}` : ''}
            </p>
          )}
        </div>
      </div>
    );
  };

  // Action processing loader
  const ActionLoader = () => (
    <div className="flex gap-2 justify-start">
      <AvatarIcon size="sm" />
      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl rounded-tl-md bg-card/80 border border-border/20">
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary"
              style={{
                animation: 'bounce 1.4s ease-in-out infinite',
                animationDelay: `${i * 0.16}s`,
              }}
            />
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground">NEO попълва формата вместо Вас...</span>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-destructive" />
          </div>
          <p className="text-destructive text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <span className="text-sm text-muted-foreground">Зареждане...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[hsl(220_55%_10%)] overflow-hidden">
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
      {/* Lead Capture Modal */}
      <LeadCaptureModal
        isOpen={showLeadModal}
        onClose={() => setShowLeadModal(false)}
        onSubmit={handleLeadSubmit}
        companyName={companyName}
      />
      
      {/* Header */}
      <header className="border-b border-border/20 bg-card/50 backdrop-blur-xl px-4 py-3 flex items-center gap-3">
        <AvatarIcon size="md" />
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-foreground leading-tight">{companyName || 'NEO'}</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-[10px] text-muted-foreground">AI Асистент</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 border border-border/20">
          <Mic className="w-3 h-3 text-primary" />
          <span className="text-[10px] text-muted-foreground">+</span>
          <MessageSquare className="w-3 h-3 text-primary" />
        </div>
        {isConnected && !leadSubmitted && (
          <button
            onClick={() => setShowLeadModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors"
          >
            <UserPlus className="w-3 h-3 text-primary" />
            <span className="text-[10px] text-primary font-medium">Контакт</span>
          </button>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {messages.length === 0 && !isConnected && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <AvatarIcon size="lg" />
            <h2 className="text-base font-bold text-foreground mt-4 mb-1">
              {companyName || 'NEO'}
            </h2>
            <p className="text-xs text-muted-foreground max-w-[220px] mb-6">
              {config?.autoGreet && config?.autoGreetMessage
                ? config.autoGreetMessage
                : 'Здравейте! Имате въпрос? Натиснете бутона и ще Ви помогна.'}
            </p>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
              <Sparkles className="w-3 h-3" />
              <span>Powered by NEO AI</span>
            </div>
          </div>
        )}
        
        {messages.map((msg, i) => {
          const cleanContent = msg.content.replace(/\[CURRENT_DATE_CONTEXT:[^\]]*\]\s*/g, '').replace(/\[SYSTEM:[^\]]*\]\s*/g, '').trim();
          if (!cleanContent || (msg.role === 'assistant' && isHiddenAssistantUiMessage(cleanContent))) return null;
          const mentionedItems = msg.role === 'assistant' ? findMentionedCatalogItems(cleanContent, catalog) : [];

          return (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && <AvatarIcon size="sm" />}
              <div className="flex flex-col max-w-[80%]">
                <div
                  className={`
                    px-3.5 py-2.5 text-xs leading-relaxed animate-fade-in break-words whitespace-pre-wrap
                    ${msg.role === 'assistant'
                      ? 'bg-card/80 border border-border/20 rounded-2xl rounded-tl-md text-foreground'
                      : 'rounded-2xl rounded-tr-md text-white'
                    }
                  `}
                  style={msg.role === 'user' ? { 
                    backgroundColor: widgetColor,
                    boxShadow: `0 2px 12px ${widgetColor}30`
                  } : undefined}
                >
                  {cleanContent}
                </div>
                {/* Show catalog item images if mentioned */}
                {mentionedItems.map((item, idx) => (
                  <CatalogCard key={idx} item={item} />
                ))}
              </div>
            </div>
          );
        })}

        {/* Action processing indicator */}
        {isProcessingAction && !isSpeaking && <ActionLoader />}

        {liveTranscript && isListening && (
          <div className="flex justify-end">
            <div className="max-w-[80%] px-3.5 py-2.5 text-xs leading-relaxed rounded-2xl rounded-tr-md bg-muted/50 border border-border/20 text-muted-foreground italic break-words">
              {liveTranscript}
            </div>
          </div>
        )}
        {liveAssistantTranscript && isSpeaking && !isHiddenAssistantUiMessage(liveAssistantTranscript) && (
          <div className="flex gap-2 justify-start">
            <AvatarIcon size="sm" />
            <div className="max-w-[80%] px-3.5 py-2.5 text-xs leading-relaxed rounded-2xl rounded-tl-md bg-card/80 border border-border/20 text-foreground/70 italic break-words">
              {liveAssistantTranscript}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Controls */}
      <div className="border-t border-border/20 bg-card/50 backdrop-blur-xl p-4 space-y-3">
        {/* Status */}
        <div className="text-center text-xs h-4 flex items-center justify-center">
          {isConnecting && (
            <span className="text-primary font-medium flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Свързване...
            </span>
          )}
          {isMicMuted && isConnected && !isSpeaking && (
            <span className="text-muted-foreground font-medium flex items-center gap-2">
              <MicOff className="w-3 h-3" />
              Микрофонът е изключен
            </span>
          )}
          {isSpeaking && (
            <span className="font-medium flex items-center gap-2" style={{ color: widgetColor }}>
              <div className="flex gap-0.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1 h-3 rounded-full" style={{ backgroundColor: widgetColor, animation: 'pulse 0.6s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
              Говори...
            </span>
          )}
          {isListening && !isMicMuted && (
            <span className="text-green-500 font-medium flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
              Слушам...
            </span>
          )}
          {isConnected && !isSpeaking && !isListening && !isConnecting && !isMicMuted && (
            <span className="text-muted-foreground">Говорете или пишете</span>
          )}
        </div>

        {/* Text input + Mic mute */}
        {isConnected && (
          <div className="flex gap-2">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Напишете съобщение..."
              className="flex-1 text-xs h-10 bg-muted/30 border-border/20 rounded-xl"
              disabled={isSendingText || isSpeaking}
            />
            <button
              onClick={toggleMicMute}
              className={`shrink-0 h-10 w-10 rounded-xl flex items-center justify-center transition-all border ${
                isMicMuted
                  ? 'bg-destructive/10 border-destructive/30 text-destructive'
                  : 'bg-muted/30 border-border/20 text-muted-foreground hover:text-foreground'
              }`}
              title={isMicMuted ? 'Включи микрофона' : 'Изключи микрофона'}
            >
              {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <Button
              onClick={handleSendText}
              disabled={!textInput.trim() || isSendingText || isSpeaking}
              size="icon"
              className="shrink-0 h-10 w-10 rounded-xl"
              style={{ backgroundColor: widgetColor, boxShadow: `0 4px 16px ${widgetColor}40` }}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Call button */}
        <button
          onClick={isConnected ? endCall : startCall}
          disabled={isConnecting}
          className={`
            w-full py-3.5 rounded-xl flex items-center justify-center gap-3 
            transition-all duration-300 font-medium text-sm
            ${isConnected
              ? 'bg-destructive/90 text-white hover:bg-destructive'
              : isConnecting
              ? 'bg-primary/50 text-white cursor-wait'
              : 'text-white hover:scale-[1.01] active:scale-[0.99]'
            }
          `}
          style={{ 
            backgroundColor: isConnected ? undefined : (isConnecting ? undefined : widgetColor),
            boxShadow: isConnected ? undefined : `0 4px 20px ${widgetColor}50`
          }}
        >
          {isConnected ? (
            <><PhoneOff className="w-5 h-5" /> Прекъсни разговора</>
          ) : (
            <><Phone className="w-5 h-5" /> {config?.buttonText || 'Започни разговор'}</>
          )}
        </button>
        
        <p className="text-center text-[9px] text-muted-foreground/40 mt-2">
          Powered by{' '}
          <a href="https://neo-assistant.com" target="_blank" rel="noopener noreferrer" className="text-primary/50 hover:text-primary transition-colors">
            NEO AI
          </a>
        </p>
      </div>
    </div>
  );
};

export default Widget;
