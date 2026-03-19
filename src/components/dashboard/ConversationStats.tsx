import { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId]);

  // Real-time subscription for conversations and leads
  useEffect(() => {
    if (!userId) return;

    console.log('[ConversationStats] Setting up realtime subscriptions for user:', userId);

    // Subscribe to conversations changes
    const conversationsChannel = supabase
      .channel('conversations-realtime-stats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[ConversationStats] Conversation change:', payload.eventType, payload);
          // Reload data on any change
          loadData();
        }
      )
      .subscribe((status) => {
        console.log('[ConversationStats] Conversations subscription status:', status);
      });

    // Subscribe to captured_leads changes
    const leadsChannel = supabase
      .channel('leads-realtime-stats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'captured_leads',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[ConversationStats] Lead change:', payload.eventType, payload);
          loadData();
        }
      )
      .subscribe((status) => {
        console.log('[ConversationStats] Leads subscription status:', status);
      });

    return () => {
      console.log('[ConversationStats] Cleaning up realtime subscriptions');
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(leadsChannel);
    };
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load conversations
      const { data: convos, error: convosError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(50);

      if (convosError) throw convosError;

      // Load captured leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('captured_leads')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (leadsError) throw leadsError;

      setConversations(convos || []);
      setLeads(leadsData || []);

      // Calculate stats
      const totalConvos = convos?.length || 0;
      const totalSeconds = convos?.reduce((acc, c) => acc + (c.duration_seconds || 0), 0) || 0;
      const leadsCount = convos?.filter(c => c.lead_captured).length || 0;

      const sentimentBreakdown = {
        positive: convos?.filter(c => c.sentiment === 'positive').length || 0,
        neutral: convos?.filter(c => c.sentiment === 'neutral').length || 0,
        negative: convos?.filter(c => c.sentiment === 'negative').length || 0,
      };

      setStats({
        totalConversations: totalConvos,
        totalMinutes: Math.round(totalSeconds / 60),
        avgDuration: totalConvos > 0 ? Math.round(totalSeconds / totalConvos) : 0,
        leadsCapured: leadsCount,
        sentimentBreakdown,
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
  };

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

  const getSentimentIcon = (sentiment: string | null) => {
    switch (sentiment) {
      case 'positive':
        return <Smile className="w-4 h-4 text-green-500" />;
      case 'negative':
        return <Frown className="w-4 h-4 text-red-500" />;
      default:
        return <Meh className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getSentimentBadge = (sentiment: string | null) => {
    const colors: Record<string, string> = {
      positive: 'bg-green-500/10 text-green-500 border-green-500/20',
      negative: 'bg-red-500/10 text-red-500 border-red-500/20',
      neutral: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    };
    return colors[sentiment || 'neutral'] || colors.neutral;
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0с';
    if (seconds < 60) return `${seconds}с`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}м ${secs}с`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="w-5 h-5 text-primary" />
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
