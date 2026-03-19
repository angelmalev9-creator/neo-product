import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import VoiceTest from '@/components/dashboard/VoiceTest';
import WidgetCustomizer from '@/components/dashboard/WidgetCustomizer';
import WidgetAvatarUpload from '@/components/dashboard/WidgetAvatarUpload';
import KnowledgeBaseEditor from '@/components/dashboard/KnowledgeBaseEditor';
import ActivityLog from '@/components/dashboard/ActivityLog';
import IntegrationsPanel from '@/components/dashboard/IntegrationsPanel';
import {
  LogOut, Settings, CreditCard, Globe, Mic, ExternalLink, Copy, Check,
  Crown, AlertCircle, FileText, Clock, Palette, Database, Link2,
} from 'lucide-react';
import NeoLogo from '@/components/ui/NeoLogo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TIER_NAMES: Record<string, string> = {
  starter: 'NEO Старт',
  growth: 'NEO Растеж',
  empire: 'NEO Империя',
};

const PLAN_LIMITS: Record<string, number> = {
  starter: 500,
  growth: 2500,
  empire: 10000,
};

const Dashboard = () => {
  const { user, subscription, signOut, loading, checkSubscription } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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
      toast({ title: 'Кодът е копиран', description: 'Поставете го преди </body> тага на вашия сайт. Това е единственото нещо, което трябва да направите.' });
    } finally { setInstallingWidget(false); }
  };

  const usagePercent = planLimit > 0 ? (usedMinutes / planLimit) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Зареждане...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <NeoLogo size="sm" />
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:block truncate max-w-[150px]">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5 text-xs">
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Изход</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Plan & Usage */}
          <div className="rounded-2xl border border-border/30 bg-card/30 backdrop-blur-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${subscription.subscribed ? 'bg-primary/15' : 'bg-muted'}`}>
                  {subscription.subscribed ? <Crown className="w-5 h-5 text-primary" /> : <AlertCircle className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    {subscription.subscribed ? TIER_NAMES[subscription.tier || 'starter'] || 'Активен' : 'Няма план'}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {subscription.subscribed && subscription.subscription_end
                      ? `Валиден до: ${new Date(subscription.subscription_end).toLocaleDateString('bg-BG')}`
                      : 'Изберете план за достъп'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {subscription.subscribed ? (
                  <Button variant="outline" size="sm" onClick={handleManageSubscription} disabled={portalLoading} className="text-xs">
                    <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                    {portalLoading ? '...' : 'Управление'}
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => navigate('/#pricing')} className="text-xs">Избери план</Button>
                )}
              </div>
            </div>
            {subscription.subscribed && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Използвани минути
                  </span>
                  <span className="font-medium">{usedMinutes.toFixed(1)} / {planLimit}</span>
                </div>
                <Progress value={Math.min(usagePercent, 100)} className="h-2" />
              </div>
            )}
          </div>

          {/* Main Content */}
          {subscription.subscribed && (
            <Tabs defaultValue="diary" className="space-y-4">
              <TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full h-auto p-1 gap-1 bg-card/30 backdrop-blur-sm border border-border/20 rounded-xl">
                <TabsTrigger value="diary" className="gap-1.5 py-2.5 text-xs rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  <FileText className="w-4 h-4" /><span className="hidden sm:inline">Дневник</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-1.5 py-2.5 text-xs rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  <Settings className="w-4 h-4" /><span className="hidden sm:inline">Настройки</span>
                </TabsTrigger>
                <TabsTrigger value="integrations" className="gap-1.5 py-2.5 text-xs rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  <Link2 className="w-4 h-4" /><span className="hidden sm:inline">Интеграции</span>
                </TabsTrigger>
                <TabsTrigger value="knowledge" className="gap-1.5 py-2.5 text-xs rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  <Database className="w-4 h-4" /><span className="hidden sm:inline">Знания</span>
                </TabsTrigger>
                <TabsTrigger value="test" className="gap-1.5 py-2.5 text-xs rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  <Mic className="w-4 h-4" /><span className="hidden sm:inline">Тест</span>
                </TabsTrigger>
                <TabsTrigger value="widget" className="gap-1.5 py-2.5 text-xs rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  <Palette className="w-4 h-4" /><span className="hidden sm:inline">Уиджет</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="diary">
                <div className="rounded-2xl border border-border/20 bg-card/20 backdrop-blur-sm p-5">
                  <ActivityLog userId={user?.id || ''} />
                </div>
              </TabsContent>

              <TabsContent value="settings">
                <div className="rounded-2xl border border-border/20 bg-card/20 backdrop-blur-sm p-5 space-y-5">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" /> Основни настройки
                  </h3>
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
                      <Label className="text-xs flex items-center gap-1.5"><Mic className="w-3.5 h-3.5" /> Скорост на гласа: {voiceSpeed.toFixed(2)}x</Label>
                      <span className="text-xs text-muted-foreground">{voiceSpeed < 0.9 ? 'Бавно' : voiceSpeed > 1.1 ? 'Бързо' : 'Нормално'}</span>
                    </div>
                    <Slider value={[voiceSpeed]} onValueChange={(v) => setVoiceSpeed(v[0])} min={0.7} max={1.3} step={0.05} />
                  </div>
                  <Button onClick={handleSaveSettings} disabled={saving} className="w-full">{saving ? 'Запазване...' : 'Запази настройките'}</Button>
                </div>
              </TabsContent>

              <TabsContent value="integrations">
                <div className="rounded-2xl border border-border/20 bg-card/20 backdrop-blur-sm p-5">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2 mb-4">
                    <Link2 className="w-5 h-5 text-primary" /> Интеграции
                  </h3>
                  <IntegrationsPanel />
                </div>
              </TabsContent>

              <TabsContent value="knowledge">
                <div className="rounded-2xl border border-border/20 bg-card/20 backdrop-blur-sm p-5">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2 mb-4">
                    <Database className="w-5 h-5 text-primary" /> База знания
                  </h3>
                  <KnowledgeBaseEditor
                    userId={user?.id || ''} currentSession={demoSession}
                    onSessionUpdate={(session) => { setDemoSession(session); if (session.url) setWebsiteUrl(session.url); if (session.company_name) setCompanyName(session.company_name); }}
                    onCompanyNameExtracted={(name) => setCompanyName(name)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="test">
                <div className="rounded-2xl border border-border/20 bg-card/20 backdrop-blur-sm p-5">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2 mb-4">
                    <Mic className="w-5 h-5 text-primary" /> Тест на NEO
                  </h3>
                  <VoiceTest companyName={companyName} customPrompt="" promptTemplate="sales" voiceSpeed={voiceSpeed} demoSession={demoSession} usedMinutes={usedMinutes} planLimit={planLimit} onUsageUpdate={setUsedMinutes} />
                </div>
              </TabsContent>

              <TabsContent value="widget">
                <div className="rounded-2xl border border-border/20 bg-card/20 backdrop-blur-sm p-5 space-y-6">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Palette className="w-5 h-5 text-primary" /> Уиджет за сайта
                  </h3>

                  {/* One-click install */}
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <h4 className="text-sm font-semibold text-foreground mb-1">Инсталиране с един клик</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Копирайте кода и го поставете преди затварящия &lt;/body&gt; таг на вашия сайт. Това е всичко.
                    </p>
                    <Button onClick={handleOneClickInstall} disabled={installingWidget} className="w-full gap-2">
                      <Copy className="w-4 h-4" />
                      {installingWidget ? 'Копиране...' : 'Копирай кода за инсталиране'}
                    </Button>
                  </div>

                  <WidgetAvatarUpload userId={user?.id || ''} currentAvatarUrl={logoUrl} onAvatarChange={setLogoUrl} />
                  <WidgetCustomizer userId={user?.id || ''} companyName={companyName} initialConfig={null} />
                </div>
              </TabsContent>
            </Tabs>
          )}

          {!subscription.subscribed && (
            <div className="text-center py-16">
              <NeoLogo size="lg" showText={false} className="mx-auto mb-4 justify-center" />
              <h3 className="text-xl font-bold text-foreground mb-2">Активирайте NEO</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">Изберете план, за да получите достъп до AI асистента и всички функции.</p>
              <Button onClick={() => navigate('/#pricing')} className="bg-primary hover:bg-primary/90">Разгледайте плановете</Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
