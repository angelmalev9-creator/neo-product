import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Globe, CheckCircle2, Circle, CalendarDays, Mail, Database,
  ArrowRight, Loader2,
} from 'lucide-react';
import KnowledgeBaseEditor from '@/components/dashboard/KnowledgeBaseEditor';
import IntegrationsPanel from '@/components/dashboard/IntegrationsPanel';
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
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { id: 'website', label: 'Уебсайт', icon: Globe },
          { id: 'calendar', label: 'Календар', icon: CalendarDays },
          { id: 'email', label: 'Имейл', icon: Mail },
          { id: 'data', label: 'Данни от сайта', icon: Database },
        ].map((tab) => (
          <button
            key={tab.id}
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
        <div className="rounded-2xl border border-border/10 bg-card/50 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Календар</h2>
              <p className="text-xs text-muted-foreground">Свържете календар за автоматични резервации</p>
            </div>
            {calendarConnected && <CheckCircle2 className="w-4 h-4 text-[hsl(var(--neo-success))] ml-auto" />}
          </div>
          <IntegrationsPanel />
        </div>
      )}

      {activeSection === 'email' && (
        <div className="rounded-2xl border border-border/10 bg-card/50 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Имейл</h2>
              <p className="text-xs text-muted-foreground">Свържете имейл за автоматични известия</p>
            </div>
            {emailConnected && <CheckCircle2 className="w-4 h-4 text-[hsl(var(--neo-success))] ml-auto" />}
          </div>
          <IntegrationsPanel />
        </div>
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

export default SetupPage;
