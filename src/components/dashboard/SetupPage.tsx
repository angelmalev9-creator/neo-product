import { useState, useEffect, useRef } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { Lock } from 'lucide-react';

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
  subscriptionTier?: string;
}

const getCompactEmailPreview = (value: string | null) => {
  const clean = String(value || '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/\*?\{[^}]*\}/g, '')
    .replace(/@media[^{]*\{[\s\S]*?\}\s*\}/gi, '')
    .replace(/@[a-z-]+[^;{]*[;{][^}]*/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/[a-z-]+\s*:\s*[^;,]{3,}[;!]\s*/gi, '')
    .replace(/!important/gi, '')
    .replace(/\.neo-[a-zA-Z0-9_-]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean || clean.length < 5) return 'Имейл изпратен към клиента';
  return clean.length > 140 ? `${clean.slice(0, 140).trim()}…` : clean;
};

const INTENT_LABELS: Record<string, string> = {
  client_confirmation: 'Потвърждение за клиента',
  lead_notification: 'Уведомление за клиент',
  executor_notification: 'Уведомление за бизнеса',
  follow_up: 'Последващ контакт',
  booking_confirmation: 'Потвърждение на резервация',
  welcome: 'Добре дошли',
  inquiry_response: 'Отговор на запитване',
  thank_you: 'Благодарност',
};

const translateIntent = (intent: string | null) => {
  if (!intent) return null;
  return INTENT_LABELS[intent] || intent.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const translateSubject = (subject: string) => {
  if (!subject) return 'Имейл от NEO';
  return subject
    .replace(/^NEO Lead Alert[:\s]*/i, 'Нов клиент: ')
    .replace(/New lead captured/i, 'Нов заинтересован клиент')
    .replace(/Lead notification/i, 'Уведомление за клиент')
    .replace(/Follow[\s-]?up/i, 'Последващ контакт')
    .replace(/Booking confirmation/i, 'Потвърждение на резервация')
    .replace(/through NEO/i, 'чрез NEO')
    .replace(/via NEO/i, 'чрез NEO');
};

const SetupPage = ({
  userId, section, websiteUrl, setWebsiteUrl, companyName, setCompanyName,
  demoSession, setDemoSession, onTabChange, subscriptionTier,
}: SetupPageProps) => {
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [emailConnected, setEmailConnected] = useState(false);
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
    { label: 'Обучение', done: !!websiteUrl },
    { label: 'Календар', done: calendarConnected },
    { label: 'Имейл', done: emailConnected },
    { label: 'Тест', done: false },
  ];
  const completedSteps = steps.filter((s) => s.done).length;
  const activeSection = section || 'training';

  return (
    <div className="h-full flex flex-col p-4 lg:p-6 overflow-hidden overflow-x-hidden">
      <h1 className="text-lg font-bold text-foreground mb-3 shrink-0">Настройка</h1>

      {/* Progress + Tabs compact row */}
      <div className="shrink-0 mb-3 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5 flex-1">
            {steps.map((step, i) => (
              <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${step.done ? 'bg-primary' : 'bg-muted/50'}`} />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground shrink-0">{completedSteps}/{steps.length}</span>
        </div>

        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide" ref={tabsRef}>
          {[
            { id: 'training', label: 'Обучение', icon: Globe },
            { id: 'calendar', label: 'Календар', icon: CalendarDays },
            { id: 'email', label: 'Имейл', icon: Mail },
          ].map((tab) => (
            <button
              key={tab.id}
              ref={activeSection === tab.id ? activeTabRef : undefined}
              onClick={() => onTabChange(`setup-${tab.id}`)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap ${
                activeSection === tab.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Section content */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain space-y-4">
        {activeSection === 'training' && (
          <div className="space-y-4">
            {/* Website URL + Company */}
            <div className="rounded-2xl border border-border/10 bg-card/60  p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-sm font-semibold text-foreground">Уебсайт</h2>
                  <p className="text-[11px] text-muted-foreground">Въведете URL-а, за да обучим NEO</p>
                </div>
                {websiteUrl && <CheckCircle2 className="w-4 h-4 text-[hsl(var(--neo-success))]" />}
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">URL на сайта</Label>
                  <Input type="url" placeholder="https://your-website.com" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className="bg-background/50 text-sm h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Име на компанията</Label>
                  <Input placeholder="Вашата компания" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="bg-background/50 text-sm h-10" />
                </div>
              </div>
            </div>

            {/* Knowledge Base */}
            <div className="rounded-2xl border border-border/10 bg-card/60  p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Database className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-sm font-semibold text-foreground">Данни от сайта</h2>
                  <p className="text-[11px] text-muted-foreground">Информацията, която NEO знае за Вас</p>
                </div>
                {demoSession && <CheckCircle2 className="w-4 h-4 text-[hsl(var(--neo-success))]" />}
              </div>
              <KnowledgeBaseEditor
                userId={userId}
                currentSession={demoSession}
                externalUrl={websiteUrl}
                onSessionUpdate={(session) => {
                  setDemoSession(session);
                  if (session.url) setWebsiteUrl(session.url);
                  if (session.company_name) setCompanyName(session.company_name);
                }}
                onCompanyNameExtracted={(name) => setCompanyName(name)}
              />
            </div>

            {/* Next step CTA */}
            {demoSession && (
              <button
                onClick={() => onTabChange('neo-test')}
                className="w-full rounded-xl border border-primary/15 bg-primary/5 hover:bg-primary/10 p-4 flex items-center gap-3 transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                  <ArrowRight className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[13px] font-medium text-foreground group-hover:text-primary transition-colors">Следваща стъпка: Тествайте NEO</p>
                  <p className="text-[11px] text-muted-foreground">Чуйте как NEO отговаря на клиентите Ви</p>
                </div>
              </button>
            )}
          </div>
        )}

        {activeSection === 'calendar' && (
          <CalendarSection calendarConnected={calendarConnected} userId={userId} />
        )}

        {activeSection === 'email' && (
          <EmailLogsSection emailConnected={emailConnected} userId={userId} subscriptionTier={subscriptionTier} />
        )}
      </div>
    </div>
  );
};


/* ── Calendar section ── */
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
      user_id: userId, calendar_connected: true, calendar_enabled: checked, auto_book_after_conversation: true,
    } as any, { onConflict: 'user_id' });
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border/10 bg-card/60  p-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
          <CalendarDays className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-foreground">Календар</h2>
          <p className="text-[11px] text-muted-foreground">{calendarEnabled ? 'Автоматични резервации включени' : 'Включете за резервации'}</p>
        </div>
        <Switch checked={calendarEnabled} onCheckedChange={toggleCalendar} />
        {calendarConnected && <CheckCircle2 className="w-4 h-4 text-[hsl(var(--neo-success))]" />}
      </div>
      {calendarEnabled && <CalendarAutomation />}
    </div>
  );
};

/* ── Email logs section ── */
interface EmailLog {
  id: string; recipient_email: string; recipient_name: string | null;
  subject: string; body: string; status: string; intent: string | null;
  sent_at: string | null; created_at: string;
}

const EmailLogsSection = ({ emailConnected, userId, subscriptionTier }: { emailConnected: boolean; userId: string; subscriptionTier?: string }) => {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [gmailEmail, setGmailEmail] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const { toast } = useToast();

  const isGrowthOrAbove = subscriptionTier === 'growth' || subscriptionTier === 'empire';

  useEffect(() => {
    // Check for OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const gmailCallback = urlParams.get('gmail_callback');
    if (code && gmailCallback) {
      handleOAuthCallback(code);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      loadData();
    }
  }, [userId]);

  // Realtime email_logs updates
  useEffect(() => {
    if (!userId) return;
    const channel = supabase.channel(`setup-email-logs-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'email_logs', filter: `user_id=eq.${userId}` }, (payload) => {
        const newLog = payload.new as EmailLog;
        setLogs(prev => [newLog, ...prev].slice(0, 30));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'email_logs', filter: `user_id=eq.${userId}` }, (payload) => {
        const updated = payload.new as EmailLog;
        setLogs(prev => prev.map(l => l.id === updated.id ? updated : l));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const loadData = async () => {
    const [logsRes, settingsRes] = await Promise.all([
      supabase
        .from('email_logs')
        .select('id, recipient_email, recipient_name, subject, body, status, intent, sent_at, created_at')
        .eq('user_id', userId).order('created_at', { ascending: false }).limit(30),
      supabase
        .from('email_settings')
        .select('gmail_email, gmail_connected')
        .eq('user_id', userId).maybeSingle(),
    ]);
    setLogs((logsRes.data || []) as EmailLog[]);
    if (settingsRes.data?.gmail_connected) setGmailEmail(settingsRes.data.gmail_email);
    setLoading(false);
  };

  const handleOAuthCallback = async (code: string) => {
    setConnecting(true);
    try {
      const redirectUri = `${window.location.origin}/dashboard?gmail_callback=true`;
      const { data, error } = await supabase.functions.invoke('gmail-oauth', {
        body: { action: 'exchange-code', code, redirectUri },
      });
      if (error) throw error;
      if (data?.success) {
        setGmailEmail(data.email);
        toast({ title: 'Gmail свързан!', description: `Имейлите ще се изпращат от ${data.email}` });
      }
    } catch {
      toast({ title: 'Грешка', description: 'Неуспешно свързване с Gmail', variant: 'destructive' });
    } finally {
      setConnecting(false);
      loadData();
    }
  };

  const connectGmail = async () => {
    setConnecting(true);
    try {
      const redirectUri = `${window.location.origin}/dashboard?gmail_callback=true`;
      const { data, error } = await supabase.functions.invoke('gmail-oauth', {
        body: { action: 'get-auth-url', redirectUri },
      });
      if (error) throw error;
      if (data?.authUrl) window.location.href = data.authUrl;
    } catch {
      toast({ title: 'Грешка', description: 'Неуспешно свързване с Gmail', variant: 'destructive' });
      setConnecting(false);
    }
  };

  const disconnectGmail = async () => {
    try {
      await supabase.functions.invoke('gmail-oauth', { body: { action: 'disconnect' } });
      setGmailEmail(null);
      toast({ title: 'Gmail изключен' });
    } catch {
      toast({ title: 'Грешка', variant: 'destructive' });
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'sent') return <Badge variant="outline" className="text-[9px] border-green-500/30 text-green-400">Изпратен</Badge>;
    if (status === 'failed' || status === 'error') return <Badge variant="outline" className="text-[9px] border-destructive/30 text-destructive">Грешка</Badge>;
    return <Badge variant="outline" className="text-[9px]">{status}</Badge>;
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-3">
      {/* Gmail OAuth connection */}
      <div className="rounded-2xl border border-border/10 bg-card/60 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-semibold text-foreground">Gmail акаунт</h3>
          {!isGrowthOrAbove && (
            <Badge variant="outline" className="text-[9px] ml-auto gap-1">
              <Lock className="w-2.5 h-2.5" /> Растеж+
            </Badge>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground">
          {gmailEmail
            ? 'NEO изпраща имейли от свързания Gmail акаунт'
            : 'Свържете Gmail акаунт, от който NEO ще изпраща имейли на клиентите'}
        </p>
        {gmailEmail ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[hsl(var(--neo-success))]" />
              <span className="text-xs font-medium text-foreground">{gmailEmail}</span>
            </div>
            <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={disconnectGmail}>
              Прекъсни
            </Button>
          </div>
        ) : isGrowthOrAbove ? (
          <Button size="sm" className="h-8 text-[11px] gap-1.5 w-full" onClick={connectGmail} disabled={connecting}>
            {connecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
            Свържи Gmail акаунт
          </Button>
        ) : (
          <Button size="sm" disabled className="h-8 text-[11px] gap-1.5 w-full opacity-50">
            <Lock className="w-3 h-3" /> Свържи Gmail акаунт
          </Button>
        )}
      </div>

      {/* Email logs */}
      <div className="rounded-2xl border border-border/10 bg-card/60 p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-foreground">Изпратени имейли</h2>
            <p className="text-[11px] text-muted-foreground">Имейли от NEO</p>
          </div>
          {emailConnected && <CheckCircle className="w-4 h-4 text-[hsl(var(--neo-success))]" />}
        </div>

      {logs.length === 0 ? (
        <div className="text-center py-6">
          <Mail className="w-7 h-7 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Няма имейли все още</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {logs.map((log) => {
            const isExpanded = expandedId === log.id;
            return (
              <div key={log.id} className="rounded-xl border border-border/10 bg-background/30 overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  className="w-full flex items-center gap-2 p-2.5 text-left hover:bg-muted/20 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-foreground truncate">{translateSubject(log.subject)}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {log.recipient_name ? `${log.recipient_name}` : log.recipient_email}
                    </p>
                  </div>
                  {statusBadge(log.status)}
                  <span className="text-[9px] text-muted-foreground shrink-0">
                    {new Date(log.sent_at || log.created_at).toLocaleDateString('bg-BG', { day: '2-digit', month: '2-digit' })}
                  </span>
                  <ArrowRight className={`w-3 h-3 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </button>
                {isExpanded && (
                  <div className="px-3 pb-2.5 border-t border-border/10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-[10px]">
                      <div>
                        <p className="text-muted-foreground">До</p>
                        <p className="text-foreground break-all">{log.recipient_email}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Статус</p>
                        <p className="text-foreground">{log.status === 'sent' ? 'Изпратен' : log.status === 'failed' || log.status === 'error' ? 'Грешка' : log.status}</p>
                      </div>
                      {log.intent && (
                        <div>
                          <p className="text-muted-foreground">Тип</p>
                          <p className="text-foreground">{translateIntent(log.intent)}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-muted-foreground">Кога</p>
                        <p className="text-foreground">{new Date(log.sent_at || log.created_at).toLocaleString('bg-BG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-[10px] text-foreground/70 leading-relaxed break-words">
                      {getCompactEmailPreview(log.body)}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
};

export default SetupPage;
