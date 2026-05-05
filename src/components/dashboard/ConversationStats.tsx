import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MessageSquare,
  Clock,
  TrendingUp,
  Users,
  Phone,
  Mail,
  Building,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCw,
  Smile,
  Meh,
  Frown,
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

interface CapturedLead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  created_at: string;
  conversation_id: string | null;
}

interface Stats {
  totalConversations: number;
  totalMinutes: number;
  avgDuration: number;
  leadsCapured: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

interface ConversationStatsProps {
  userId: string;
}

const ConversationStats = ({ userId }: ConversationStatsProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [leads, setLeads] = useState<CapturedLead[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalConversations: 0,
    totalMinutes: 0,
    avgDuration: 0,
    leadsCapured: 0,
    sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
  });
  const [expandedConversation, setExpandedConversation] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState<string | null>(null);

  // ═══════════════════════════════════════════════════════════════
  // FIX: loadData разделен на две части:
  //   1) loadStats — ползва count: exact (без limit) за ТОЧНИ числа
  //   2) loadConversations — зарежда последните 50 за списъка
  //
  // ПРЕДИ: limit(50) → stats се изчисляваха от 50 записа → 58 мин
  // СЕГА: stats ползват агрегирани DB queries без limit
  // ═══════════════════════════════════════════════════════════════

  const loadData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // ── Stats: агрегирани queries БЕЗ limit ──
      const [
        totalConvRes,
        totalDurRes,
        leadsCountRes,
        sentimentPosRes,
        sentimentNeuRes,
        sentimentNegRes,
        recentConvos,
        leadsData,
      ] = await Promise.all([
        // Total conversations count (exact, no limit)
        supabase
          .from('conversations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),

        // Total duration (ALL conversations, no limit)
        supabase
          .from('conversations')
          .select('duration_seconds')
          .eq('user_id', userId)
          .not('duration_seconds', 'is', null),

        // Leads count (exact)
        supabase
          .from('captured_leads')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),

        // Sentiment counts
        supabase
          .from('conversations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('sentiment', 'positive'),
        supabase
          .from('conversations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('sentiment', 'neutral'),
        supabase
          .from('conversations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('sentiment', 'negative'),

        // Recent conversations for the list (limit 50 — display only)
        supabase
          .from('conversations')
          .select('*')
          .eq('user_id', userId)
          .order('started_at', { ascending: false })
          .limit(50),

        // Recent leads for the list
        supabase
          .from('captured_leads')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      // Conversations for display
      setConversations(recentConvos.data || []);
      setLeads(leadsData.data || []);

      // Stats from aggregated queries
      const totalConvos = totalConvRes.count ?? 0;

      // Sum ALL duration_seconds (no limit)
      const totalSeconds = (totalDurRes.data || []).reduce(
        (acc: number, c: any) => acc + (c.duration_seconds || 0),
        0,
      );

      const leadsCount = leadsCountRes.count ?? 0;

      setStats({
        totalConversations: totalConvos,
        totalMinutes: Math.round(totalSeconds / 60),
        avgDuration: totalConvos > 0 ? Math.round(totalSeconds / totalConvos) : 0,
        leadsCapured: leadsCount,
        sentimentBreakdown: {
          positive: sentimentPosRes.count ?? 0,
          neutral: sentimentNeuRes.count ?? 0,
          negative: sentimentNegRes.count ?? 0,
        },
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      toast({
        title: 'Грешка',
        description: 'Неуспешно зареждане на статистиката',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    if (userId) loadData();
  }, [userId, loadData]);

  // ═══════════════════════════════════════════════════════════════
  // FIX: Вместо собствени realtime subscriptions (дублираха Dashboard-а),
  // слушаме CustomEvents от Dashboard.tsx единния realtime канал.
  // Това елиминира 2 излишни Supabase канала.
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!userId) return;

    const handleUpdate = () => { loadData(); };

    window.addEventListener('neo-conversations-updated', handleUpdate);
    window.addEventListener('neo-leads-updated', handleUpdate);

    return () => {
      window.removeEventListener('neo-conversations-updated', handleUpdate);
      window.removeEventListener('neo-leads-updated', handleUpdate);
    };
  }, [userId, loadData]);

  const summarizeConversation = async (conversationId: string) => {
    setSummarizing(conversationId);
    try {
      const { data, error } = await supabase.functions.invoke('summarize-conversation', {
        body: { conversationId },
      });

      if (error) throw error;

      toast({
        title: 'Обобщението е готово',
        description: data.summary,
      });

      // Reload data to show updated summary
      loadData();

    } catch (error) {
      console.error('Summarize error:', error);
      toast({
        title: 'Грешка',
        description: 'Неуспешно обобщаване на разговора',
        variant: 'destructive',
      });
    } finally {
      setSummarizing(null);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds || seconds <= 0) return '0с';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}с`;
    return `${m}м ${s}с`;
  };

  const getSentimentIcon = (sentiment: string | null) => {
    if (sentiment === 'positive') return <Smile className="w-4 h-4 text-green-500" />;
    if (sentiment === 'negative') return <Frown className="w-4 h-4 text-red-500" />;
    return <Meh className="w-4 h-4 text-yellow-500" />;
  };

  const getSentimentBadge = (sentiment: string) => {
    if (sentiment === 'positive') return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (sentiment === 'negative') return 'bg-red-500/10 text-red-500 border-red-500/20';
    return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="neo-glass border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalConversations}</p>
                <p className="text-xs text-muted-foreground">Разговори</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="neo-glass border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalMinutes}</p>
                <p className="text-xs text-muted-foreground">Минути</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="neo-glass border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Users className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.leadsCapured}</p>
                <p className="text-xs text-muted-foreground">Лийдове</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="neo-glass border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{formatDuration(stats.avgDuration)}</p>
                <p className="text-xs text-muted-foreground">Ср. време</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sentiment Overview */}
      {stats.totalConversations > 0 && (
        <Card className="neo-glass border-border/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Настроение на клиентите
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Smile className="w-4 h-4 text-green-500" />
                <span className="text-sm">{stats.sentimentBreakdown.positive} позитивни</span>
              </div>
              <div className="flex items-center gap-2">
                <Meh className="w-4 h-4 text-yellow-500" />
                <span className="text-sm">{stats.sentimentBreakdown.neutral} неутрални</span>
              </div>
              <div className="flex items-center gap-2">
                <Frown className="w-4 h-4 text-red-500" />
                <span className="text-sm">{stats.sentimentBreakdown.negative} негативни</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Captured Leads */}
      {leads.length > 0 && (
        <Card className="neo-glass border-border/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Клиентски данни ({leads.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-3">
                {leads.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-3 rounded-lg bg-background/50 border border-border/30 space-y-2"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {lead.name && (
                        <span className="font-medium text-foreground">{lead.name}</span>
                      )}
                      {lead.company && (
                        <Badge variant="outline" className="gap-1">
                          <Building className="w-3 h-3" />
                          {lead.company}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      {lead.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {lead.email}
                        </span>
                      )}
                      {lead.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {lead.phone}
                        </span>
                      )}
                    </div>
                    {lead.notes && (
                      <p className="text-xs text-muted-foreground">{lead.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Recent Conversations */}
      <Card className="neo-glass border-border/30">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            Последни разговори
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={loadData} className="gap-1">
            <RefreshCw className="w-3 h-3" />
            Обнови
          </Button>
        </CardHeader>
        <CardContent>
          {conversations.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Все още няма записани разговори
            </p>
          ) : (
            <ScrollArea className="h-72">
              <div className="space-y-2">
                {conversations.map((convo) => (
                  <div
                    key={convo.id}
                    className="p-3 rounded-lg bg-background/50 border border-border/30"
                  >
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedConversation(
                        expandedConversation === convo.id ? null : convo.id
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {getSentimentIcon(convo.sentiment)}
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {new Date(convo.started_at).toLocaleDateString('bg-BG', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {convo.messages_count || 0} съобщения • {formatDuration(convo.duration_seconds)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {convo.lead_captured && (
                          <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/20">
                            Лийд
                          </Badge>
                        )}
                        {convo.sentiment && (
                          <Badge variant="outline" className={`text-xs ${getSentimentBadge(convo.sentiment)}`}>
                            {convo.sentiment === 'positive' ? 'Позитивен' :
                             convo.sentiment === 'negative' ? 'Негативен' : 'Неутрален'}
                          </Badge>
                        )}
                        {expandedConversation === convo.id ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {expandedConversation === convo.id && (
                      <div className="mt-3 pt-3 border-t border-border/30 space-y-2">
                        {convo.summary ? (
                          <p className="text-sm text-muted-foreground">{convo.summary}</p>
                        ) : (
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground italic">
                              Няма обобщение
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => summarizeConversation(convo.id)}
                              disabled={summarizing === convo.id}
                              className="gap-1 text-xs"
                            >
                              <Sparkles className="w-3 h-3" />
                              {summarizing === convo.id ? 'Обобщаване...' : 'Обобщи с AI'}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConversationStats;