import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  MessageSquare, Clock, TrendingUp, Users, Phone, Mail, Building,
  ChevronDown, ChevronUp, RefreshCw, User, Briefcase, FileText,
  Sparkles, Target, CheckCircle2, Tag, ListChecks, Bot, UserCircle,
  Calendar, Globe,
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
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      loadMessages(id);
      // Auto-summarize if no summary yet
      const convo = conversations.find(c => c.id === id);
      if (convo && !convo.summary && (convo.messages_count || 0) > 0) {
        summarizeConversation(id);
      }
    }
  };

  const summarizeConversation = async (conversationId: string) => {
    setSummarizing(conversationId);
    try {
      const { data, error } = await supabase.functions.invoke('summarize-conversation', { body: { conversationId } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      loadData();
    } catch (e: any) {
      console.error('Summarize error:', e);
      toast({ title: 'Грешка', description: e?.message || 'Неуспешно обобщаване', variant: 'destructive' });
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

  const getSentimentStyle = (s: string | null) => {
    if (s === 'positive') return { label: 'Позитивен', dot: 'bg-green-500', cls: 'bg-green-500/10 text-green-500 border-green-500/20' };
    if (s === 'negative') return { label: 'Негативен', dot: 'bg-red-500', cls: 'bg-red-500/10 text-red-500 border-red-500/20' };
    return { label: 'Неутрален', dot: 'bg-muted-foreground', cls: 'bg-muted text-muted-foreground border-border/30' };
  };

  /** Parse rich summary into structured parts */
  const parseSummary = (raw: string | null) => {
    if (!raw) return null;
    const lines = raw.split('\n').filter(Boolean);
    const summary = lines[0] || '';
    let intent = '', outcome = '', tags = '', actions = '';
    for (const line of lines.slice(1)) {
      if (line.startsWith('🎯')) intent = line.replace(/^🎯\s*Намерение:\s*/, '');
      else if (line.startsWith('✅')) outcome = line.replace(/^✅\s*Резултат:\s*/, '');
      else if (line.startsWith('🏷️')) tags = line.replace(/^🏷️\s*/, '');
      else if (line.startsWith('📋')) actions = line.replace(/^📋\s*Следващи стъпки:\s*/, '');
    }
    return { summary, intent, outcome, tags, actions };
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
        <ScrollArea className="h-[560px]">
          <div className="space-y-3 pr-3">
            {conversations.map((convo) => {
              const lead = getLeadForConversation(convo.id);
              const isExpanded = expandedId === convo.id;
              const convoMessages = messages[convo.id];
              const sentimentStyle = getSentimentStyle(convo.sentiment);
              const parsed = parseSummary(convo.summary);
              const isSummarizing = summarizing === convo.id;

              return (
                <div key={convo.id} className="rounded-xl border border-border/30 bg-card/50 overflow-hidden transition-all hover:border-primary/20">
                  {/* Row header */}
                  <div className="p-3 sm:p-4 cursor-pointer flex items-start gap-3" onClick={() => toggleExpand(convo.id)}>
                    {/* Date block */}
                    <div className="shrink-0 w-14 text-center pt-0.5">
                      <p className="text-lg font-bold text-foreground leading-none">{new Date(convo.started_at).getDate()}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{new Date(convo.started_at).toLocaleDateString('bg-BG', { month: 'short' })}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(convo.started_at).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {lead ? (
                          <span className="font-medium text-sm text-foreground flex items-center gap-1.5">
                            <UserCircle className="w-3.5 h-3.5 text-primary" />
                            {getLeadName(lead)}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5" />
                            Анонимен посетител
                          </span>
                        )}
                        {convo.sentiment && (
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${sentimentStyle.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sentimentStyle.dot} inline-block mr-1`} />
                            {sentimentStyle.label}
                          </Badge>
                        )}
                        {convo.lead_captured && (
                          <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/20 px-1.5 py-0">
                            ✓ Клиент
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {convo.messages_count || 0} съобщения · {formatDuration(convo.duration_seconds)}
                        {lead?.service && <> · <span className="text-primary">{lead.service}</span></>}
                      </p>
                      {/* Show summary preview (first line only) when collapsed */}
                      {!isExpanded && parsed?.summary && (
                        <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-1">{parsed.summary}</p>
                      )}
                    </div>

                    <div className="shrink-0 pt-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* Expanded detail panel */}
                  {isExpanded && (
                    <div className="border-t border-border/20 bg-background/30">
                      {/* AI Summary section */}
                      <div className="px-4 py-3.5">
                        {isSummarizing ? (
                          <div className="flex items-center gap-2 text-xs text-primary">
                            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                            <span>AI анализира разговора...</span>
                          </div>
                        ) : parsed ? (
                          <div className="space-y-3">
                            {/* Main summary */}
                            <div>
                              <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-1.5 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-primary" /> AI Анализ
                              </p>
                              <p className="text-xs text-foreground leading-relaxed">{parsed.summary}</p>
                            </div>

                            {/* Intent + Outcome grid */}
                            {(parsed.intent || parsed.outcome) && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {parsed.intent && (
                                  <div className="rounded-lg bg-primary/5 border border-primary/10 px-3 py-2">
                                    <p className="text-[10px] uppercase font-semibold text-primary/70 flex items-center gap-1 mb-0.5">
                                      <Target className="w-3 h-3" /> Намерение
                                    </p>
                                    <p className="text-xs text-foreground">{parsed.intent}</p>
                                  </div>
                                )}
                                {parsed.outcome && (
                                  <div className="rounded-lg bg-green-500/5 border border-green-500/10 px-3 py-2">
                                    <p className="text-[10px] uppercase font-semibold text-green-600/70 flex items-center gap-1 mb-0.5">
                                      <CheckCircle2 className="w-3 h-3" /> Резултат
                                    </p>
                                    <p className="text-xs text-foreground">{parsed.outcome}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Tags */}
                            {parsed.tags && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Tag className="w-3 h-3 text-muted-foreground shrink-0" />
                                {parsed.tags.split(', ').map((tag, i) => (
                                  <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0 bg-muted/50">{tag}</Badge>
                                ))}
                              </div>
                            )}

                            {/* Action items */}
                            {parsed.actions && (
                              <div className="rounded-lg bg-muted/30 border border-border/20 px-3 py-2">
                                <p className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1 mb-1">
                                  <ListChecks className="w-3 h-3" /> Следващи стъпки
                                </p>
                                <p className="text-xs text-foreground">{parsed.actions}</p>
                              </div>
                            )}

                            {/* Re-summarize button */}
                            <Button
                              size="sm" variant="ghost"
                              onClick={(e) => { e.stopPropagation(); summarizeConversation(convo.id); }}
                              className="text-[10px] h-6 px-2 text-muted-foreground hover:text-primary gap-1"
                            >
                              <RefreshCw className="w-2.5 h-2.5" /> Анализирай отново
                            </Button>
                          </div>
                        ) : (convo.messages_count || 0) > 0 ? (
                          <Button
                            size="sm" variant="outline"
                            onClick={(e) => { e.stopPropagation(); summarizeConversation(convo.id); }}
                            className="gap-1.5 text-xs"
                          >
                            <Sparkles className="w-3 h-3" /> Обобщи с AI
                          </Button>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">Няма достатъчно данни за анализ</p>
                        )}
                      </div>

                      <Separator className="opacity-20" />

                      {/* Lead data panel */}
                      {lead && (
                        <>
                          <div className="px-4 py-3">
                            <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-2 flex items-center gap-1">
                              <User className="w-3 h-3 text-primary" /> Клиентски данни
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {(lead.first_name || lead.last_name || lead.name) && (
                                <div className="flex items-center gap-1.5 text-foreground"><UserCircle className="w-3.5 h-3.5 text-primary" /> {getLeadName(lead)}</div>
                              )}
                              {lead.email && <div className="flex items-center gap-1.5 text-foreground"><Mail className="w-3.5 h-3.5 text-primary" /> {lead.email}</div>}
                              {lead.phone && <div className="flex items-center gap-1.5 text-foreground"><Phone className="w-3.5 h-3.5 text-primary" /> {lead.phone}</div>}
                              {lead.company && <div className="flex items-center gap-1.5 text-foreground"><Building className="w-3.5 h-3.5 text-primary" /> {lead.company}</div>}
                              {lead.service && <div className="flex items-center gap-1.5 text-foreground"><Briefcase className="w-3.5 h-3.5 text-primary" /> {lead.service}</div>}
                            </div>
                            {lead.notes && <p className="text-xs text-muted-foreground mt-2 italic border-l-2 border-primary/20 pl-2">"{lead.notes}"</p>}
                          </div>
                          <Separator className="opacity-20" />
                        </>
                      )}

                      {/* Transcription */}
                      <div className="px-4 py-3">
                        <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-2 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-primary" /> Транскрипция
                        </p>
                        {loadingMessages === convo.id ? (
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-2/3" />
                          </div>
                        ) : convoMessages && convoMessages.length > 0 ? (
                          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                            {convoMessages.map((msg) => (
                              <div key={msg.id} className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                                <div className={`rounded-xl px-3 py-2 max-w-[85%] text-xs leading-relaxed ${
                                  msg.role === 'assistant'
                                    ? 'bg-primary/5 border border-primary/10 text-foreground rounded-tl-sm'
                                    : 'bg-muted/60 text-foreground rounded-tr-sm'
                                }`}>
                                  <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 mb-0.5">
                                    {msg.role === 'assistant' ? <><Bot className="w-2.5 h-2.5" /> NEO</> : <><UserCircle className="w-2.5 h-2.5" /> Клиент</>}
                                    <span className="text-[9px] font-normal ml-1 opacity-50">
                                      {new Date(msg.created_at).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                  </span>
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

            {/* Orphan leads */}
            {orphanLeads.length > 0 && (
              <>
                <div className="pt-3">
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider px-1 mb-2 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Клиенти без разговор ({orphanLeads.length})
                  </p>
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
                          <UserCircle className="w-3.5 h-3.5 text-primary" />
                          <span className="font-medium text-sm text-foreground">{getLeadName(lead)}</span>
                          {lead.source && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{lead.source === 'widget' ? 'Уиджет' : lead.source}</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                          {lead.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</span>}
                          {lead.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>}
                        </div>
                        {lead.service && <p className="text-xs mt-1"><Briefcase className="w-3 h-3 inline mr-1 text-primary" />{lead.service}</p>}
                        {lead.notes && <p className="text-xs text-muted-foreground mt-1 italic border-l-2 border-primary/20 pl-2">"{lead.notes}"</p>}
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
