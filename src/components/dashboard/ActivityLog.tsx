import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MessageSquare, Clock, TrendingUp, Users, Phone, Mail, Building,
  ChevronDown, ChevronUp, RefreshCw, User, Briefcase, FileText,
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

interface Stats {
  totalConversations: number;
  totalMinutes: number;
  avgDuration: number;
  leadsCapured: number;
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
  const [stats, setStats] = useState<Stats>({ totalConversations: 0, totalMinutes: 0, avgDuration: 0, leadsCapured: 0 });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState<string | null>(null);

  useEffect(() => { if (userId) loadData(); }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const ch1 = supabase.channel('activity-convos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `user_id=eq.${userId}` }, () => loadData())
      .subscribe();
    const ch2 = supabase.channel('activity-leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'captured_leads', filter: `user_id=eq.${userId}` }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [convosRes, leadsRes] = await Promise.all([
        supabase.from('conversations').select('*').eq('user_id', userId).order('started_at', { ascending: false }).limit(100),
        supabase.from('captured_leads').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(100),
      ]);
      if (convosRes.error) throw convosRes.error;
      if (leadsRes.error) throw leadsRes.error;

      const convos = convosRes.data || [];
      const leadsData = leadsRes.data || [];
      setConversations(convos);
      setLeads(leadsData);

      const totalConvos = convos.length;
      const totalSeconds = convos.reduce((a, c) => a + (c.duration_seconds || 0), 0);
      setStats({
        totalConversations: totalConvos,
        totalMinutes: Math.round(totalSeconds / 60),
        avgDuration: totalConvos > 0 ? Math.round(totalSeconds / totalConvos) : 0,
        leadsCapured: convos.filter(c => c.lead_captured).length,
      });
    } catch (error) {
      console.error('Error loading activity:', error);
      toast({ title: 'Грешка', description: 'Неуспешно зареждане', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    if (messages[conversationId]) return;
    setLoadingMessages(conversationId);
    try {
      const { data, error } = await supabase
        .from('conversation_messages').select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setMessages(prev => ({ ...prev, [conversationId]: data || [] }));
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setLoadingMessages(null);
    }
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) { setExpandedId(null); } else { setExpandedId(id); loadMessages(id); }
  };

  const summarizeConversation = async (conversationId: string) => {
    setSummarizing(conversationId);
    try {
      const { data, error } = await supabase.functions.invoke('summarize-conversation', { body: { conversationId } });
      if (error) throw error;
      toast({ title: 'Обобщението е готово' });
      loadData();
    } catch {
      toast({ title: 'Грешка', description: 'Неуспешно обобщаване', variant: 'destructive' });
    } finally {
      setSummarizing(null);
    }
  };

  const getLeadForConversation = (convoId: string) => leads.find(l => l.conversation_id === convoId);

  const getLeadName = (lead: CapturedLead) => {
    if (lead.first_name || lead.last_name) return `${lead.first_name || ''} ${lead.last_name || ''}`.trim();
    return lead.name || 'Неизвестен';
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0с';
    if (seconds < 60) return `${seconds}с`;
    return `${Math.floor(seconds / 60)}м ${seconds % 60}с`;
  };

  const getSentimentLabel = (s: string | null) => {
    if (s === 'positive') return { label: 'Позитивен', cls: 'bg-green-500/10 text-green-600 border-green-500/20' };
    if (s === 'negative') return { label: 'Негативен', cls: 'bg-red-500/10 text-red-600 border-red-500/20' };
    return { label: 'Неутрален', cls: 'bg-muted text-muted-foreground border-border/30' };
  };

  const orphanLeads = leads.filter(l => !l.conversation_id || !conversations.some(c => c.id === l.conversation_id));

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<MessageSquare className="w-4 h-4 text-primary" />} value={stats.totalConversations} label="Разговори" />
        <StatCard icon={<Clock className="w-4 h-4 text-primary" />} value={stats.totalMinutes} label="Минути" />
        <StatCard icon={<Users className="w-4 h-4 text-green-600" />} value={stats.leadsCapured} label="Клиенти" bgClass="bg-green-500/10" />
        <StatCard icon={<TrendingUp className="w-4 h-4 text-primary" />} value={formatDuration(stats.avgDuration)} label="Ср. време" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Дневник на дискусиите
        </h4>
        <Button variant="ghost" size="sm" onClick={loadData} className="gap-1 text-xs">
          <RefreshCw className="w-3 h-3" /> Обнови
        </Button>
      </div>

      {conversations.length === 0 && orphanLeads.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Все още няма записани разговори</p>
        </div>
      ) : (
        <ScrollArea className="h-[500px]">
          <div className="space-y-3 pr-3">
            {conversations.map((convo) => {
              const lead = getLeadForConversation(convo.id);
              const isExpanded = expandedId === convo.id;
              const convoMessages = messages[convo.id];

              return (
                <div key={convo.id} className="rounded-xl border border-border/30 bg-card/50 overflow-hidden transition-colors hover:border-primary/20">
                  <div className="p-3 sm:p-4 cursor-pointer flex items-start gap-3" onClick={() => toggleExpand(convo.id)}>
                    <div className="shrink-0 w-14 text-center pt-0.5">
                      <p className="text-lg font-bold text-foreground leading-none">{new Date(convo.started_at).getDate()}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{new Date(convo.started_at).toLocaleDateString('bg-BG', { month: 'short' })}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(convo.started_at).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {lead ? (
                          <span className="font-medium text-sm text-foreground">{getLeadName(lead)}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Анонимен посетител</span>
                        )}
                        {convo.sentiment && (() => {
                          const s = getSentimentLabel(convo.sentiment);
                          return <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${s.cls}`}>{s.label}</Badge>;
                        })()}
                        {convo.lead_captured && (
                          <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20 px-1.5 py-0">Клиент</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {convo.messages_count || 0} съобщения / {formatDuration(convo.duration_seconds)}
                        {lead?.service && <> / <span className="text-primary">{lead.service}</span></>}
                      </p>
                      {convo.summary && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{convo.summary}</p>}
                    </div>
                    <div className="shrink-0 pt-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border/20 bg-background/30">
                      {lead && (
                        <div className="px-4 py-3 border-b border-border/20">
                          <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-2">Клиентски данни</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {(lead.first_name || lead.last_name || lead.name) && (
                              <div className="flex items-center gap-1.5 text-foreground"><User className="w-3 h-3 text-primary" /> {getLeadName(lead)}</div>
                            )}
                            {lead.email && <div className="flex items-center gap-1.5 text-foreground"><Mail className="w-3 h-3 text-primary" /> {lead.email}</div>}
                            {lead.phone && <div className="flex items-center gap-1.5 text-foreground"><Phone className="w-3 h-3 text-primary" /> {lead.phone}</div>}
                            {lead.company && <div className="flex items-center gap-1.5 text-foreground"><Building className="w-3 h-3 text-primary" /> {lead.company}</div>}
                            {lead.service && <div className="flex items-center gap-1.5 text-foreground"><Briefcase className="w-3 h-3 text-primary" /> {lead.service}</div>}
                          </div>
                          {lead.notes && <p className="text-xs text-muted-foreground mt-2 italic">"{lead.notes}"</p>}
                        </div>
                      )}

                      <div className="px-4 py-3 border-b border-border/20">
                        {convo.summary ? (
                          <div>
                            <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-1">Обобщение</p>
                            <p className="text-xs text-foreground">{convo.summary}</p>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); summarizeConversation(convo.id); }} disabled={summarizing === convo.id} className="gap-1 text-xs">
                            {summarizing === convo.id ? 'Обобщаване...' : 'Обобщи с AI'}
                          </Button>
                        )}
                      </div>

                      <div className="px-4 py-3">
                        <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-2">Транскрипция</p>
                        {loadingMessages === convo.id ? (
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-2/3" />
                          </div>
                        ) : convoMessages && convoMessages.length > 0 ? (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {convoMessages.map((msg) => (
                              <div key={msg.id} className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                                <div className={`rounded-lg px-3 py-1.5 max-w-[85%] text-xs ${msg.role === 'assistant' ? 'bg-primary/10 text-foreground' : 'bg-muted text-foreground'}`}>
                                  <span className="text-[10px] font-semibold text-muted-foreground block mb-0.5">{msg.role === 'assistant' ? 'NEO' : 'Клиент'}</span>
                                  {msg.content}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">Няма записана транскрипция</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {orphanLeads.length > 0 && (
              <>
                <div className="pt-3">
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider px-1 mb-2">Клиенти без разговор ({orphanLeads.length})</p>
                </div>
                {orphanLeads.map((lead) => (
                  <div key={lead.id} className="rounded-xl border border-border/30 bg-card/50 p-3 sm:p-4">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 w-14 text-center pt-0.5">
                        <p className="text-lg font-bold text-foreground leading-none">{new Date(lead.created_at).getDate()}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">{new Date(lead.created_at).toLocaleDateString('bg-BG', { month: 'short' })}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-primary" />
                          <span className="font-medium text-sm text-foreground">{getLeadName(lead)}</span>
                          {lead.source && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{lead.source === 'widget' ? 'Уиджет' : lead.source}</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                          {lead.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</span>}
                          {lead.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>}
                        </div>
                        {lead.service && <p className="text-xs mt-1"><Briefcase className="w-3 h-3 inline mr-1 text-primary" />{lead.service}</p>}
                        {lead.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{lead.notes}"</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

const StatCard = ({ icon, value, label, bgClass = 'bg-primary/10' }: { icon: React.ReactNode; value: string | number; label: string; bgClass?: string }) => (
  <Card className="border-border/30 bg-card/50">
    <CardContent className="p-3 sm:p-4">
      <div className="flex items-center gap-2.5">
        <div className={`p-1.5 rounded-lg ${bgClass}`}>{icon}</div>
        <div>
          <p className="text-xl font-bold text-foreground leading-tight">{value}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default ActivityLog;
