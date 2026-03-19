import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, Mail, Briefcase, Calendar, RefreshCw, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CapturedLead {
  id: string;
  first_name: string | null;
  last_name: string | null;
  name: string | null;
  email: string | null;
  service: string | null;
  notes: string | null;
  source: string | null;
  created_at: string;
}

interface PotentialClientsProps {
  userId: string;
}

const PotentialClients: React.FC<PotentialClientsProps> = ({ userId }) => {
  const [leads, setLeads] = useState<CapturedLead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('captured_leads')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching leads:', error);
        return;
      }

      setLeads(data || []);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchLeads();
    }
  }, [userId]);

  // Real-time subscription for new leads
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('captured-leads-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'captured_leads',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('New lead captured:', payload.new);
          setLeads(prev => [payload.new as CapturedLead, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('bg-BG', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDisplayName = (lead: CapturedLead) => {
    if (lead.first_name || lead.last_name) {
      return `${lead.first_name || ''} ${lead.last_name || ''}`.trim();
    }
    return lead.name || 'Неизвестен';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse text-primary">Зареждане...</div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <h4 className="text-sm font-medium text-muted-foreground mb-1">
          Няма потенциални клиенти
        </h4>
        <p className="text-xs text-muted-foreground/70">
          Когато посетители попълнят формата в уиджета, те ще се появят тук
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {leads.length} {leads.length === 1 ? 'потенциален клиент' : 'потенциални клиенти'}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchLeads}
          className="gap-1.5 text-xs"
        >
          <RefreshCw className="w-3 h-3" />
          Опресни
        </Button>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="p-4 rounded-xl bg-card/50 border border-border/30 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-medium text-foreground text-sm truncate">
                      {getDisplayName(lead)}
                    </h4>
                    {lead.email && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{lead.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {formatDate(lead.created_at)}
                  </div>
                </div>
              </div>

              {(lead.service || lead.notes) && (
                <div className="mt-3 pt-3 border-t border-border/20">
                  {lead.service && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <Briefcase className="w-3 h-3 text-primary" />
                      <span className="text-muted-foreground">Интерес:</span>
                      <span className="text-foreground font-medium">{lead.service}</span>
                    </div>
                  )}
                  {lead.notes && (
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                      {lead.notes}
                    </p>
                  )}
                </div>
              )}

              {lead.source && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary">
                    {lead.source === 'widget' ? 'От уиджет' : lead.source}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default PotentialClients;
