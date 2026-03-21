import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Slider } from '@/components/ui/slider';
import VoiceTest from '@/components/dashboard/VoiceTest';
import WidgetCustomizer from '@/components/dashboard/WidgetCustomizer';
import WidgetAvatarUpload from '@/components/dashboard/WidgetAvatarUpload';
import KnowledgeBaseEditor from '@/components/dashboard/KnowledgeBaseEditor';
import ActivityLog from '@/components/dashboard/ActivityLog';
import IntegrationsPanel from '@/components/dashboard/IntegrationsPanel';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardMobileNav from '@/components/dashboard/DashboardMobileNav';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import { Settings, Globe, Mic, Copy, Link2, Database, Palette } from 'lucide-react';

const TIER_NAMES: Record<string, string> = {
  starter: 'NEO Старт',
  growth: 'NEO Растеж',
  empire: 'NEO Империя',
};

const Dashboard = () => {
  const { user, subscription, signOut, loading, checkSubscription } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [usedMinutes, setUsedMinutes] = useState(0);
  const [planLimit, setPlanLimit] = useState(100);
  const [installingWidget, setInstallingWidget] = useState(false);

  const [demoSession, setDemoSession] = useState<{
    id: string; url: string; summary: string | null; language: string | null;
    status: string | null; created_at?: string; company_name?: string | null;
  } | null>(null);

  useEffect(() => { if (!loading && !user) navigate('/auth'); }, [user, loading, navigate]);

  useEffect(() => {
    if (user) { checkSubscription(); loadProfile(); loadUsage(); loadDemoSession(); }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('profile-usage-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `user_id=eq.${user.id}` }, (payload) => {
        const newMinutes = payload.new?.used_minutes;
        if (newMinutes !== undefined && newMinutes !== null) {
          const parsed = parseFloat(String(newMinutes));
          if (!isNaN(parsed)) setUsedMinutes(parsed);
        }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const loadDemoSession = async () => {
    if (!user) return;
    try {
      const { data } = await supabase.from('demo_sessions')
        .select('id, url, summary, language, status, created_at, company_name')
        .eq('user_id', user.id).eq('status', 'ready')
        .order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (data) {
        setDemoSession(data);
        if (data.url && !websiteUrl) setWebsiteUrl(data.url);
        if (data.company_name && !companyName) setCompanyName(data.company_name);
      }
    } catch (err) { console.error('Failed to load demo session:', err); }
  };

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
    if (data) {
      setWebsiteUrl(data.website_url || '');
      setCompanyName(data.company_name || '');
      setVoiceSpeed(data.voice_speed ? parseFloat(String(data.voice_speed)) : 1.0);
      setLogoUrl(data.logo_url || null);
    }
  };

  const loadUsage = async () => {
    if (!user) return;
    try {
      const { data } = await supabase.functions.invoke('track-usage', { body: { action: 'get_usage' } });
      if (data) { setUsedMinutes(data.used_minutes || 0); setPlanLimit(data.plan_limit || 100); }
    } catch (err) { console.error('Failed to load usage:', err); }
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke('update-profile-config', {
        body: { website_url: websiteUrl, company_name: companyName, voice_speed: voiceSpeed },
      });
      if (error) throw error;
      toast({ title: 'Запазено', description: 'Настройките са актуализирани' });
    } catch {
      toast({ title: 'Грешка', description: 'Неуспешно запазване', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error || !data?.url) throw new Error();
      window.open(data.url, '_blank');
    } catch {
      toast({ title: 'Грешка', variant: 'destructive' });
    } finally { setPortalLoading(false); }
  };

  const handleLogout = async () => { await signOut(); navigate('/'); };

  const getWidgetScriptUrl = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${supabaseUrl}/functions/v1/widget-script?userId=${user?.id}`;
  };

  const copyEmbedCode = () => {
    const embedCode = `<script src="${getWidgetScriptUrl()}"></script>`;
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Копирано', description: 'Кодът за вграждане е копиран' });
  };

  const handleOneClickInstall = async () => {
    if (!websiteUrl) {
      toast({ title: 'Въведете уебсайт', description: 'Моля въведете URL на вашия сайт в настройките', variant: 'destructive' });
      return;
    }
    setInstallingWidget(true);
    try {
      const embedCode = `<script src="${getWidgetScriptUrl()}"></script>`;
      await navigator.clipboard.writeText(embedCode);
      toast({ title: 'Кодът е копиран', description: 'Поставете го преди </body> тага на вашия сайт.' });
    } finally { setInstallingWidget(false); }
  };

  const tierName = TIER_NAMES[subscription.tier || 'starter'] || 'Активен';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary text-sm">Зареждане...</div>
      </div>
    );
  }

  const renderContent = () => {
    if (!subscription.subscribed && activeTab !== 'overview') {
      setActiveTab('overview');
      return null;
    }

    switch (activeTab) {
      case 'overview':
        return (
          <DashboardOverview
            subscribed={subscription.subscribed}
            tierName={tierName}
            subscriptionEnd={subscription.subscription_end}
            usedMinutes={usedMinutes}
            planLimit={planLimit}
            onManageSubscription={handleManageSubscription}
            portalLoading={portalLoading}
            onTabChange={setActiveTab}
          />
        );

      case 'diary':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">Дневник на активността</h2>
            <ActivityLog userId={user?.id || ''} />
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" /> Настройки
            </h2>
            <div className="rounded-xl border border-border/20 bg-card/30 p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Име на компанията</Label>
                  <Input placeholder="Вашата компания" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="bg-background/50 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Уебсайт</Label>
                  <Input type="url" placeholder="https://your-website.com" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className="bg-background/50 text-sm" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs flex items-center gap-1.5"><Mic className="w-3.5 h-3.5" /> Скорост: {voiceSpeed.toFixed(2)}x</Label>
                  <span className="text-[10px] text-muted-foreground">{voiceSpeed < 0.9 ? 'Бавно' : voiceSpeed > 1.1 ? 'Бързо' : 'Нормално'}</span>
                </div>
                <Slider value={[voiceSpeed]} onValueChange={(v) => setVoiceSpeed(v[0])} min={0.7} max={1.3} step={0.05} />
              </div>
              <Button onClick={handleSaveSettings} disabled={saving} size="sm" className="w-full">{saving ? 'Запазване...' : 'Запази'}</Button>
            </div>
          </div>
        );

      case 'integrations':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Link2 className="w-5 h-5 text-primary" /> Интеграции
            </h2>
            <IntegrationsPanel />
          </div>
        );

      case 'knowledge':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" /> База знания
            </h2>
            <KnowledgeBaseEditor
              userId={user?.id || ''} currentSession={demoSession}
              onSessionUpdate={(session) => { setDemoSession(session); if (session.url) setWebsiteUrl(session.url); if (session.company_name) setCompanyName(session.company_name); }}
              onCompanyNameExtracted={(name) => setCompanyName(name)}
            />
          </div>
        );

      case 'test':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Mic className="w-5 h-5 text-primary" /> Тест на NEO
            </h2>
            <VoiceTest companyName={companyName} customPrompt="" promptTemplate="sales" voiceSpeed={voiceSpeed} demoSession={demoSession} usedMinutes={usedMinutes} planLimit={planLimit} onUsageUpdate={setUsedMinutes} />
          </div>
        );

      case 'widget':
        return (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" /> Уиджет
            </h2>
            {/* Quick install */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <h4 className="text-xs font-semibold text-foreground mb-1">Инсталиране с един клик</h4>
              <p className="text-[10px] text-muted-foreground mb-2">Копирайте кода → поставете преди &lt;/body&gt;</p>
              <Button onClick={handleOneClickInstall} disabled={installingWidget} size="sm" className="w-full gap-1.5 text-xs">
                <Copy className="w-3.5 h-3.5" />
                {installingWidget ? 'Копиране...' : 'Копирай код'}
              </Button>
            </div>
            <WidgetAvatarUpload userId={user?.id || ''} currentAvatarUrl={logoUrl} onAvatarChange={setLogoUrl} />
            <WidgetCustomizer userId={user?.id || ''} companyName={companyName} initialConfig={null} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <DashboardSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogout={handleLogout}
          userEmail={user?.email}
          subscribed={subscription.subscribed}
          tierName={tierName}
        />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile nav */}
        <DashboardMobileNav activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
