import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Globe, CheckCircle2, Circle, CalendarDays, Mail, Database,
  ArrowRight, Loader2, CheckCircle,
} from 'lucide-react';
import KnowledgeBaseEditor from '@/components/dashboard/KnowledgeBaseEditor';
import CalendarAutomation from '@/components/dashboard/CalendarAutomation';
import { supabase } from '@/integrations/supabase/client';

interface SetupPageProps {
  userId: string;
  section?: string;
  websiteUrl: string;
  setWebsiteUrl: (url: string) => void;
  companyName: string;
  setCompanyName: (name: string) => void;
  demoSession: any;
  setDemoSession: (s: any) => void;
  onTabChange: (tab: string) => void;
}

const SetupPage = ({
  userId, section, websiteUrl, setWebsiteUrl, companyName, setCompanyName,
  demoSession, setDemoSession, onTabChange,
}: SetupPageProps) => {
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [emailConnected, setEmailConnected] = useState(false);
  const [hasScraped, setHasScraped] = useState(!!demoSession);
  const tabsRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeTabRef.current && tabsRef.current) {
      activeTabRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [section]);

  useEffect(() => {
    loadConnectionStatus();
  }, [userId]);

  const loadConnectionStatus = async () => {
    const [calRes, emailRes] = await Promise.all([
      supabase.from('calendar_settings').select('calendar_connected').eq('user_id', userId).maybeSingle(),
      supabase.from('email_settings').select('gmail_connected').eq('user_id', userId).maybeSingle(),
    ]);
    setCalendarConnected(!!calRes.data?.calendar_connected);
    setEmailConnected(!!emailRes.data?.gmail_connected);
  };

  const steps = [
    { label: 'Сайт добавен', done: !!websiteUrl },
    { label: 'Календар свързан', done: calendarConnected },
    { label: 'Имейл свързан', done: emailConnected },
    { label: 'NEO тестван', done: false },
  ];
  const completedSteps = steps.filter((s) => s.done).length;

  // Determine which section to show
  const activeSection = section || 'website';

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground">Настройка</h1>

      {/* Progress bar */}
      <div className="rounded-2xl border border-border/10 bg-card/50 p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-foreground">Прогрес на настройката</span>
          <span className="text-xs text-muted-foreground">{completedSteps} от {steps.length}</span>
        </div>
        <div className="flex gap-2 mb-3">
          {steps.map((step, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full ${step.done ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-1.5">
              {step.done ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--neo-success))]" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-muted-foreground/40" />
              )}
              <span className={`text-[11px] ${step.done ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" ref={tabsRef}>
        {[
          { id: 'website', label: 'Уебсайт', icon: Globe },
          { id: 'calendar', label: 'Календар', icon: CalendarDays },
          { id: 'email', label: 'Имейл', icon: Mail },
          { id: 'data', label: 'Данни от сайта', icon: Database },
        ].map((tab) => (
          <button
            key={tab.id}
            ref={activeSection === tab.id ? activeTabRef : undefined}
            onClick={() => onTabChange(`setup-${tab.id}`)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeSection === tab.id
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sections */}
      {activeSection === 'website' && (
        <div className="rounded-2xl border border-border/10 bg-card/50 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Уебсайт</h2>
              <p className="text-xs text-muted-foreground">Въведете URL-а на вашия сайт, за да обучим NEO</p>
            </div>
            {websiteUrl && <CheckCircle2 className="w-4 h-4 text-[hsl(var(--neo-success))] ml-auto" />}
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">URL на сайта</Label>
              <Input
                type="url"
                placeholder="https://your-website.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="bg-background/50 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Име на компанията</Label>
              <Input
                placeholder="Вашата компания"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="bg-background/50 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {activeSection === 'calendar' && (
        <CalendarSection calendarConnected={calendarConnected} userId={userId} />
      )}

      {activeSection === 'email' && (
        <EmailLogsSection emailConnected={emailConnected} userId={userId} />
      )}

      {activeSection === 'data' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/10 bg-card/50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Данни от сайта</h2>
                <p className="text-xs text-muted-foreground">Информацията, която NEO знае за вас</p>
              </div>
              {demoSession && <CheckCircle2 className="w-4 h-4 text-[hsl(var(--neo-success))] ml-auto" />}
            </div>
            <KnowledgeBaseEditor
              userId={userId}
              currentSession={demoSession}
              onSessionUpdate={(session) => {
                setDemoSession(session);
                if (session.url) setWebsiteUrl(session.url);
                if (session.company_name) setCompanyName(session.company_name);
              }}
              onCompanyNameExtracted={(name) => setCompanyName(name)}
            />
          </div>
        </div>
      )}
    </div>
  );
};


/* ── Calendar-only section ── */
const CalendarSection = ({ calendarConnected, userId }: { calendarConnected: boolean; userId: string }) => {
  const [calendarEnabled, setCalendarEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('calendar_settings').select('calendar_enabled').eq('user_id', userId).maybeSingle();
      setCalendarEnabled(!!data?.calendar_enabled);
      setLoading(false);
    })();
  }, [userId]);

  const toggleCalendar = async (checked: boolean) => {
    setCalendarEnabled(checked);
    await supabase.from('calendar_settings').upsert({
      user_id: userId,
      calendar_connected: true,
      calendar_enabled: checked,
      auto_book_after_conversation: true,
    } as any, { onConflict: 'user_id' });
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/10 bg-card/50 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-foreground">Календар</h2>
            <p className="text-xs text-muted-foreground">
              {calendarEnabled ? 'NEO записва консултации / резервации автоматично' : 'Включете за автоматични резервации'}
            </p>
          </div>
          <Switch checked={calendarEnabled} onCheckedChange={toggleCalendar} />
          {calendarConnected && <CheckCircle2 className="w-4 h-4 text-[hsl(var(--neo-success))]" />}
        </div>
      </div>
      {calendarEnabled && <CalendarAutomation />}
    </div>
  );
};

/* ── Email logs section ── */
interface EmailLog {
  id: string;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  body: string;
  status: string;
  intent: string | null;
  sent_at: string | null;
  created_at: string;
}

const EmailLogsSection = ({ emailConnected, userId }: { emailConnected: boolean; userId: string }) => {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('email_logs')
        .select('id, recipient_email, recipient_name, subject, body, status, intent, sent_at, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);
      setLogs((data || []) as EmailLog[]);
      setLoading(false);
    })();
  }, [userId]);

  const statusBadge = (status: string) => {
    if (status === 'sent') return <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-400">Изпратен</Badge>;
    if (status === 'failed' || status === 'error') return <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">Грешка</Badge>;
    return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
  };

  const intentLabel = (intent: string | null) => {
    if (intent === 'owner_notification') return 'За вас';
    if (intent === 'client_confirmation') return 'За клиента';
    return null;
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="rounded-2xl border border-border/10 bg-card/50 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
          <Mail className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Изпратени имейли</h2>
          <p className="text-xs text-muted-foreground">Имейли изпратени от NEO за вашия бизнес</p>
        </div>
        {emailConnected && <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />}
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-8">
          <Mail className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Няма изпратени имейли все още</p>
          <p className="text-xs text-muted-foreground/60 mt-1">NEO ще изпраща имейли автоматично след разговори</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const isExpanded = expandedId === log.id;
            const label = intentLabel(log.intent);
            return (
              <div key={log.id} className="rounded-xl border border-border/10 bg-background/30 overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  className="w-full flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-3 p-2.5 sm:p-3 text-left hover:bg-muted/20 transition-colors"
                >
                  <div className="flex-1 min-w-0 w-full">
                    <p className="text-[11px] sm:text-xs font-medium text-foreground truncate">{log.subject}</p>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                      До: {log.recipient_name ? `${log.recipient_name} (${log.recipient_email})` : log.recipient_email}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 w-full sm:w-auto">
                    {label && <span className="text-[9px] sm:text-[10px] text-muted-foreground/70 bg-muted/30 px-1.5 py-0.5 rounded">{label}</span>}
                    {statusBadge(log.status)}
                    <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                      {new Date(log.sent_at || log.created_at).toLocaleDateString('bg-BG', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <ArrowRight className={`w-3 h-3 text-muted-foreground transition-transform ml-auto sm:ml-0 ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-2.5 sm:px-4 pb-2.5 sm:pb-3 border-t border-border/10">
                    <p className="mt-2 text-[10px] sm:text-xs text-foreground/70 leading-relaxed break-words">
                      {(() => {
                        if (!log.body) return 'Няма съдържание';
                        const text = log.body.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
                        return text;
                      })()}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SetupPage;
