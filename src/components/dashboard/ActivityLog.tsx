import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MessageSquare, Clock, Users, Phone, Mail,
  ChevronDown, ChevronUp, RefreshCw, User, Briefcase,
  Sparkles, Bot, UserCircle, Globe, TrendingUp,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Conversation {
  id: string;
  session_type: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  messages_count: number | null;
  summary: string | null;
  sentiment: string | null;
  lead_captured: boolean;
}

interface ConversationMessage {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
}

interface CapturedLead {
  id: string;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  service: string | null;
  source: string | null;
  created_at: string;
  conversation_id: string | null;
}

interface EmailLog {
  id: string;
  conversation_id: string | null;
  recipient_email: string;
  subject: string;
  body: string;
  status: string | null;
  intent: string | null;
  sent_at: string | null;
  created_at: string;
}

interface ActivityLogProps {
  userId: string;
}

const ActivityLog = ({ userId }: ActivityLogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [leads, setLeads] = useState<CapturedLead[]>([]);
  const [messages, setMessages] = useState<Record<string, ConversationMessage[]>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState<string | null>(null);
  const [emails, setEmails] = useState<Record<string, EmailLog[]>>({});
  const [summarizing, setSummarizing] = useState<string | null>(null);

  useEffect(() => { if (userId) loadData(); }, [userId]);

  // Realtime
  useEffect(() => {
    if (!userId) return;
    const ch1 = supabase.channel('activity-convos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `user_id=eq.${userId}` }, () => loadData())
      .subscribe();
    const ch2 = supabase.channel('activity-leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'captured_leads', filter: `user_id=eq.${userId}` }, () => loadData())
      .subscribe();
    const ch3 = supabase.channel(`activity-messages-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversation_messages' }, (payload) => {
        const row = payload.new as ConversationMessage;
        if (!row?.conversation_id) return;
        setMessages(prev => {
          const current = prev[row.conversation_id];
          if (!current) return prev;
          if (current.some(m => m.id === row.id)) return prev;
          return { ...prev, [row.conversation_id]: [...current, row].sort((a, b) => a.created_at.localeCompare(b.created_at)) };
        });
        setConversations(prev => prev.map(c =>
          c.id === row.conversation_id ? { ...c, messages_count: (c.messages_count || 0) + 1 } : c
        ));
      }).subscribe();
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); supabase.removeChannel(ch3); };
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [convosRes, leadsRes] = await Promise.all([
        supabase.from('conversations').select('*').eq('user_id', userId).order('started_at', { ascending: false }).limit(100),
        supabase.from('captured_leads').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(100),
      ]);
      setConversations(convosRes.data || []);
      setLeads(leadsRes.data || []);
    } catch {
      toast({ title: 'Грешка', description: 'Неуспешно зареждане', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const loadMessages = async (conversationId: string) => {
    if (messages[conversationId]) return;
    setLoadingMessages(conversationId);
    try {
      const [msgsRes, emailsRes] = await Promise.all([
        supabase.from('conversation_messages').select('*')
          .eq('conversation_id', conversationId).order('created_at', { ascending: true }),
        supabase.from('email_logs').select('*')
          .eq('conversation_id', conversationId).order('created_at', { ascending: false }),
      ]);
      setMessages(prev => ({ ...prev, [conversationId]: msgsRes.data || [] }));
      if (emailsRes.data && emailsRes.data.length > 0) {
        setEmails(prev => ({ ...prev, [conversationId]: emailsRes.data as EmailLog[] }));
      }
    } catch {} finally { setLoadingMessages(null); }
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    loadMessages(id);
    const convo = conversations.find(c => c.id === id);
    if (convo && !convo.summary && (convo.messages_count || 0) > 0) summarizeConversation(id);
  };

  const summarizeConversation = async (conversationId: string) => {
    setSummarizing(conversationId);
    try {
      const { data, error } = await supabase.functions.invoke('summarize-conversation', { body: { conversationId } });
      if (error || data?.error) throw new Error(data?.error || 'fail');
      loadData();
    } catch (e: any) {
      toast({ title: 'Грешка', description: e?.message || 'Неуспешно', variant: 'destructive' });
    } finally { setSummarizing(null); }
  };

  const getLeadForConversation = (convoId: string) => leads.find(l => l.conversation_id === convoId);
  const getLeadName = (lead: CapturedLead) => {
    if (lead.first_name || lead.last_name) return `${lead.first_name || ''} ${lead.last_name || ''}`.trim();
    return lead.name || 'Неизвестен';
  };
  const formatDuration = (s: number | null) => {
    if (!s) return '0с';
    return s < 60 ? `${s}с` : `${Math.floor(s / 60)}м ${s % 60}с`;
  };

  const parseSummary = (raw: string | null) => {
    if (!raw) return null;
    const lines = raw.split('\n').filter(Boolean);
    let summary = lines[0] || '', intent = '', outcome = '', actions = '';
    for (const line of lines.slice(1)) {
      if (line.startsWith('🎯')) intent = line.replace(/^🎯\s*Намерение:\s*/, '');
      else if (line.startsWith('✅')) outcome = line.replace(/^✅\s*Резултат:\s*/, '');
      else if (line.startsWith('📋')) actions = line.replace(/^📋\s*Следващи стъпки:\s*/, '');
    }
    return { summary, intent, outcome, actions };
  };

  const totalConvos = conversations.length;
  const totalMinutes = Math.round(conversations.reduce((a, c) => a + (c.duration_seconds || 0), 0) / 60);
  const leadsCount = conversations.filter(c => c.lead_captured).length;

  if (loading) {
    return <div className="space-y-3">
      {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
    </div>;
  }

  return (
    <div className="space-y-4">
      {/* Compact stats row */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5 text-primary" /> {totalConvos} разговори</span>
        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-primary" /> {totalMinutes} мин</span>
        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-green-500" /> {leadsCount} клиенти</span>
        <div className="ml-auto">
          <Button variant="ghost" size="sm" onClick={loadData} className="gap-1 text-xs h-7 px-2">
            <RefreshCw className="w-3 h-3" /> Обнови
          </Button>
        </div>
      </div>

      {conversations.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Все още няма записани разговори</p>
        </div>
      ) : (
        <ScrollArea className="h-[560px]">
          <div className="space-y-2 pr-2">
            {conversations.map((convo) => {
              const lead = getLeadForConversation(convo.id);
              const isExpanded = expandedId === convo.id;
              const convoMessages = messages[convo.id];
              const convoEmails = emails[convo.id];
              const parsed = parseSummary(convo.summary);
              const isSummarizing = summarizing === convo.id;
              const date = new Date(convo.started_at);

              return (
                <div key={convo.id} className="rounded-xl border border-border/30 bg-card/50 overflow-hidden transition-colors hover:border-primary/20">
                  {/* Collapsed row */}
                  <div className="p-3 cursor-pointer flex items-center gap-3" onClick={() => toggleExpand(convo.id)}>
                    {/* Time */}
                    <div className="shrink-0 text-center w-12">
                      <p className="text-sm font-bold text-foreground">{date.getDate()} {date.toLocaleDateString('bg-BG', { month: 'short' })}</p>
                      <p className="text-[10px] text-muted-foreground">{date.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>

                    {/* Name + short summary */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {lead ? (
                          <span className="font-medium text-sm text-foreground truncate">{getLeadName(lead)}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Посетител</span>
                        )}
                        <span className="text-[10px] text-muted-foreground">{convo.messages_count || 0} съобщ. · {formatDuration(convo.duration_seconds)}</span>
                      </div>
                      {!isExpanded && parsed?.summary && (
                        <p className="text-xs text-muted-foreground/70 mt-0.5 line-clamp-1">{parsed.summary}</p>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {convo.lead_captured && <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/20 px-1.5 py-0">✓</Badge>}
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* Expanded */}
                  {isExpanded && (
                    <div className="border-t border-border/20 bg-background/30">
                      {/* Top section: Client data + Summary side by side */}
                      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Client data */}
                        <div className="rounded-lg bg-muted/20 border border-border/20 p-3">
                          <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                            <User className="w-3 h-3 text-primary" /> Данни
                          </p>
                          {lead ? (
                            <div className="space-y-1.5 text-xs">
                              <div className="flex items-center gap-1.5 text-foreground font-medium">
                                <UserCircle className="w-3.5 h-3.5 text-primary" /> {getLeadName(lead)}
                              </div>
                              {lead.email && <div className="flex items-center gap-1.5 text-foreground"><Mail className="w-3.5 h-3.5 text-muted-foreground" /> {lead.email}</div>}
                              {lead.phone && <div className="flex items-center gap-1.5 text-foreground"><Phone className="w-3.5 h-3.5 text-muted-foreground" /> {lead.phone}</div>}
                              {lead.service && <div className="flex items-center gap-1.5 text-foreground"><Briefcase className="w-3.5 h-3.5 text-muted-foreground" /> {lead.service}</div>}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">Няма данни за клиента</p>
                          )}
                        </div>

                        {/* AI Summary */}
                        <div className="rounded-lg bg-muted/20 border border-border/20 p-3">
                          <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-primary" /> Резюме
                          </p>
                          {isSummarizing ? (
                            <div className="flex items-center gap-2 text-xs text-primary">
                              <Sparkles className="w-3 h-3 animate-pulse" /> Анализиране...
                            </div>
                          ) : parsed ? (
                            <div className="space-y-1.5 text-xs">
                              <p className="text-foreground leading-relaxed">{parsed.summary}</p>
                              {parsed.intent && <p className="text-muted-foreground"><span className="text-primary font-medium">Намерение:</span> {parsed.intent}</p>}
                              {parsed.outcome && <p className="text-muted-foreground"><span className="text-green-500 font-medium">Резултат:</span> {parsed.outcome}</p>}
                              {parsed.actions && <p className="text-muted-foreground"><span className="font-medium">Стъпки:</span> {parsed.actions}</p>}
                              <button onClick={(e) => { e.stopPropagation(); summarizeConversation(convo.id); }}
                                className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 mt-1">
                                <RefreshCw className="w-2.5 h-2.5" /> Преанализирай
                              </button>
                            </div>
                          ) : (convo.messages_count || 0) > 0 ? (
                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); summarizeConversation(convo.id); }} className="gap-1 text-xs h-7">
                              <Sparkles className="w-3 h-3" /> Анализирай
                            </Button>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">Няма данни</p>
                          )}
                        </div>
                      </div>

                      {/* Transcript */}
                      <div className="px-3 pb-3">
                        <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-primary" /> Транскрипция
                        </p>
                        {loadingMessages === convo.id ? (
                          <div className="space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>
                        ) : convoMessages && convoMessages.length > 0 ? (
                          <div className="space-y-1 max-h-64 overflow-y-auto rounded-lg bg-muted/10 border border-border/10 p-2">
                            {convoMessages.map((msg) => (
                              <div key={msg.id} className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                                <div className={`rounded-lg px-2.5 py-1.5 max-w-[85%] text-xs leading-relaxed ${
                                  msg.role === 'assistant'
                                    ? 'bg-primary/5 text-foreground'
                                    : 'bg-muted/60 text-foreground'
                                }`}>
                                  <span className="text-[9px] font-medium text-muted-foreground">
                                    {msg.role === 'assistant' ? 'NEO' : 'Клиент'}
                                    {' · '}
                                    {new Date(msg.created_at).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  <p className="mt-0.5">{msg.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">Няма записана транскрипция</p>
                        )}
                      </div>

                      {/* Emails sent */}
                      {convoEmails && convoEmails.length > 0 && (
                        <div className="px-3 pb-3">
                          <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-primary" /> Изпратени имейли
                          </p>
                          <div className="space-y-1.5">
                            {convoEmails.map((email) => (
                              <div key={email.id} className="rounded-lg bg-muted/20 border border-border/20 p-2.5">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${
                                    email.status === 'sent' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                    email.status === 'failed' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                    'bg-muted text-muted-foreground border-border/20'
                                  }`}>
                                    {email.status === 'sent' ? 'Изпратен' : email.status === 'failed' ? 'Грешка' : email.status || 'Чакащ'}
                                  </Badge>
                                  <span className="text-[9px] text-muted-foreground">
                                    {email.sent_at ? new Date(email.sent_at).toLocaleString('bg-BG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                                  </span>
                                </div>
                                <p className="text-xs font-medium text-foreground">{email.subject}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">До: {email.recipient_email}</p>
                                {email.intent && <p className="text-[10px] text-muted-foreground/70 mt-0.5">Тип: {email.intent}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default ActivityLog;
