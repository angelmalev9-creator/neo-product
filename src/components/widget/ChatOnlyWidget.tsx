import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, Sparkles, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import LeadCaptureModal, { LeadData } from '@/components/widget/LeadCaptureModal';
import { buildDeterministicReply } from '@/lib/deterministicChat';
import neoLogoImg from '@/assets/neo-logo.png';

type Message = { role: 'user' | 'assistant'; content: string };

type ChatConfig = {
  color?: string;
  backgroundColor?: string;
  autoGreet?: boolean;
  autoGreetMessage?: string;
  hideNeoBranding?: boolean;
};

type ChatOnlyWidgetProps = {
  userId: string;
  companyName: string;
  logoUrl: string | null;
  systemPrompt: string;
  config: ChatConfig | null;
};
const ChatOnlyWidget = ({ userId, companyName, logoUrl, systemPrompt, config }: ChatOnlyWidgetProps) => {
  const greeting = config?.autoGreet === false
    ? ''
    : (config?.autoGreetMessage || 'Здравейте! Как мога да Ви помогна днес?');
  const [messages, setMessages] = useState<Message[]>(greeting ? [{ role: 'assistant', content: greeting }] : []);
  const [textInput, setTextInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const conversationIdRef = useRef<string | null>(null);
  const messageSeqRef = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);
  const widgetColor = config?.color || '#ea384c';

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isSending]);

  const trackConversation = useCallback(async (action: string, data: Record<string, unknown> = {}) => {
    const { data: result, error } = await supabase.functions.invoke('widget-track-conversation', {
      body: { action, userId, conversationId: conversationIdRef.current, ...data },
    });
    if (error) console.error('[CHAT-WIDGET] track error:', error);
    return result;
  }, [userId]);
  const ensureConversation = useCallback(async () => {
    if (conversationIdRef.current) return conversationIdRef.current;
    const result = await trackConversation('start', { channel: 'chat' });
    const id = result?.conversationId || null;
    if (id) conversationIdRef.current = id;
    return id;
  }, [trackConversation]);

  const persistMessage = useCallback(async (role: Message['role'], content: string) => {
    const id = await ensureConversation();
    if (!id || !content.trim()) return;
    const seq = ++messageSeqRef.current;
    await trackConversation('message', role === 'user'
      ? { conversationId: id, userMessage: content.trim(), seq }
      : { conversationId: id, assistantMessage: content.trim(), seq });
  }, [ensureConversation, trackConversation]);

  const handleLeadSubmit = useCallback(async (data: LeadData) => {
    const id = await ensureConversation();
    const { error } = await supabase.functions.invoke('widget-capture-lead', {
      body: { userId, firstName: data.firstName, lastName: data.lastName, email: data.email, service: data.service, conversationId: id },
    });
    if (error) throw error;
    setLeadSubmitted(true);
  }, [ensureConversation, userId]);
  const handleSend = useCallback(async () => {
    const message = textInput.trim();
    if (!message || isSending) return;

    setTextInput('');
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setIsSending(true);

    try {
      await persistMessage('user', message);
      const reply = buildDeterministicReply(message, systemPrompt, companyName);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      await persistMessage('assistant', reply);
    } catch (error) {
      console.error('[CHAT-WIDGET] send error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Възникна временен проблем. Моля, опитайте отново или оставете контакт.',
      }]);
    } finally {
      setIsSending(false);
    }
  }, [companyName, isSending, persistMessage, systemPrompt, textInput]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };
  const Avatar = ({ small = false }: { small?: boolean }) => (
    <div className={`${small ? 'w-7 h-7' : 'w-9 h-9'} rounded-xl overflow-hidden shrink-0 bg-muted/50`}>
      <img src={logoUrl || neoLogoImg} alt="" className="w-full h-full object-cover" />
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-[hsl(220_55%_10%)] text-foreground overflow-hidden">
      <LeadCaptureModal
        isOpen={showLeadModal}
        onClose={() => setShowLeadModal(false)}
        onSubmit={handleLeadSubmit}
        companyName={companyName}
      />

      <header className="border-b border-border/20 bg-card/50 backdrop-blur-xl px-4 py-3 flex items-center gap-3">
        <Avatar />
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold truncate">{companyName || 'NEO'}</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-[10px] text-muted-foreground">Чат асистент · онлайн</span>
          </div>
        </div>
        {!leadSubmitted && (
          <button
            onClick={() => setShowLeadModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors"
          >
            <UserPlus className="w-3 h-3 text-primary" />
            <span className="text-[10px] text-primary font-medium">Контакт</span>
          </button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((message, index) => (
          <div key={index} className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.role === 'assistant' && <Avatar small />}
            <div
              className={`max-w-[82%] px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap break-words ${
                message.role === 'assistant'
                  ? 'bg-card/80 border border-border/20 rounded-2xl rounded-tl-md'
                  : 'text-white rounded-2xl rounded-tr-md'
              }`}
              style={message.role === 'user' ? { backgroundColor: widgetColor } : undefined}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex gap-2 justify-start">
            <Avatar small />
            <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-md bg-card/80 border border-border/20">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <Sparkles className="w-3 h-3 animate-pulse" />
                Търся в информацията на сайта...
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </main>

      <footer className="border-t border-border/20 bg-card/50 backdrop-blur-xl p-4">
        <div className="flex gap-2">
          <Input
            value={textInput}
            onChange={event => setTextInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Напишете съобщение..."
            className="flex-1 text-xs h-11 bg-muted/30 border-border/20 rounded-xl"
            disabled={isSending}
          />
          <Button
            onClick={() => void handleSend()}
            disabled={!textInput.trim() || isSending}
            size="icon"
            className="shrink-0 h-11 w-11 rounded-xl text-white"
            style={{ backgroundColor: widgetColor }}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-2 text-[9px] text-muted-foreground/50">
          <MessageSquare className="w-3 h-3" />
          <span>Отговори само от информацията на сайта</span>
        </div>
        {!config?.hideNeoBranding && (
          <p className="text-center text-[9px] text-muted-foreground/35 mt-1">
            Powered by NEO
          </p>
        )}
      </footer>
    </div>
  );
};

export default ChatOnlyWidget;
