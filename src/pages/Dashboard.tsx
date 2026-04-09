import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardMobileNav from '@/components/dashboard/DashboardMobileNav';
import DashboardHome from '@/components/dashboard/DashboardHome';
import SetupPage from '@/components/dashboard/SetupPage';
import ConversationsPage from '@/components/dashboard/ConversationsPage';
import NeoPage from '@/components/dashboard/NeoPage';
import SettingsPage from '@/components/dashboard/SettingsPage';
import ChannelsPage from '@/components/dashboard/ChannelsPage';

const TIER_NAMES: Record<string, string> = {
  starter: 'NEO Старт',
  growth: 'NEO Растеж',
  empire: 'NEO Империя',
};

const Dashboard = () => {
  const { user, subscription, signOut, loading, checkSubscription } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('home');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [portalLoading, setPortalLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [usedMinutes, setUsedMinutes] = useState(0);
  const [planLimit, setPlanLimit] = useState(100);

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
        .select('id, url, summary, language, status, created_at, company_name, voice_name, custom_voice_name, voice_training_status')
        .eq('user_id', user.id).eq('status', 'ready')
        .order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (data) {
        setDemoSession(data);
        if (data.url && !websiteUrl) setWebsiteUrl(data.url);
        if (data.company_name && !companyName) setCompanyName(data.company_name);
      }
    } catch (err) { /* silent */ }
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

  const loadUsage = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase.functions.invoke('track-usage', { body: { action: 'get_usage' } });
      if (data) { setUsedMinutes(data.used_minutes || 0); setPlanLimit(data.plan_limit || 100); }
    } catch { /* silent */ }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const refreshUsage = () => { void loadUsage(); };
    const intervalId = window.setInterval(refreshUsage, 20000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshUsage();
    };
    window.addEventListener('focus', refreshUsage);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshUsage);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, loadUsage]);

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

  const tierName = TIER_NAMES[subscription.tier || 'starter'] || 'Активен';

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(252_100%_4%)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <span className="text-[12px] text-[hsl(0_0%_100%/0.4)]">Зареждане...</span>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (!subscription.subscribed && activeTab !== 'home') {
      setActiveTab('home');
      return null;
    }

    if (activeTab === 'home') {
      return (
        <DashboardHome
          subscribed={subscription.subscribed}
          tierName={tierName}
          subscriptionEnd={subscription.subscription_end}
          usedMinutes={usedMinutes}
          planLimit={planLimit}
          onManageSubscription={handleManageSubscription}
          portalLoading={portalLoading}
          onTabChange={setActiveTab}
          websiteUrl={websiteUrl}
          calendarConnected={false}
          hasTestedNeo={false}
          userId={user?.id || ''}
        />
      );
    }

    if (activeTab.startsWith('setup')) {
      const sectionMap: Record<string, string> = {
        'setup-training': 'training',
        'setup-calendar': 'calendar',
        'setup-email': 'email',
      };
      return (
        <SetupPage
          userId={user?.id || ''}
          section={sectionMap[activeTab] || 'website'}
          websiteUrl={websiteUrl}
          setWebsiteUrl={setWebsiteUrl}
          companyName={companyName}
          setCompanyName={setCompanyName}
          demoSession={demoSession}
          setDemoSession={setDemoSession}
          onTabChange={setActiveTab}
        />
      );
    }

    if (activeTab.startsWith('conv')) {
      const section = activeTab === 'conv-stats' ? 'stats' : 'log';
      return <ConversationsPage userId={user?.id || ''} section={section} />;
    }

    if (activeTab.startsWith('neo')) {
      const sectionMap: Record<string, string> = {
        'neo-behavior': 'behavior',
        'neo-voice': 'voice',
        'neo-test': 'test',
      };
      return (
        <NeoPage
          userId={user?.id || ''}
          section={sectionMap[activeTab] || 'behavior'}
          companyName={companyName}
          voiceSpeed={voiceSpeed}
          setVoiceSpeed={setVoiceSpeed}
          demoSession={demoSession}
          usedMinutes={usedMinutes}
          planLimit={planLimit}
          onUsageUpdate={setUsedMinutes}
          subscriptionTier={subscription.tier || undefined}
        />
      );
    }

    if (activeTab.startsWith('channels')) {
      return (
        <ChannelsPage
          userId={user?.id || ''}
          companyName={companyName}
          logoUrl={logoUrl}
          setLogoUrl={setLogoUrl}
          sessionId={demoSession?.id}
          section={activeTab === 'channels-phone' ? 'phone' : 'widget'}
        />
      );
    }

    if (activeTab.startsWith('settings')) {
      const sectionMap: Record<string, string> = {
        'settings-plan': 'plan',
        'settings-profile': 'profile',
      };
      return (
        <SettingsPage
          userId={user?.id || ''}
          section={sectionMap[activeTab] || 'plan'}
          subscribed={subscription.subscribed}
          tierName={tierName}
          subscriptionEnd={subscription.subscription_end}
          usedMinutes={usedMinutes}
          planLimit={planLimit}
          onManageSubscription={handleManageSubscription}
          portalLoading={portalLoading}
          websiteUrl={websiteUrl}
          setWebsiteUrl={setWebsiteUrl}
          companyName={companyName}
          setCompanyName={setCompanyName}
          userEmail={user?.email}
        />
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen h-screen bg-[hsl(252_100%_4%)] flex overflow-hidden">
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

      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <DashboardMobileNav activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 min-h-0 overflow-hidden overflow-x-hidden overscroll-y-none pb-[4.25rem] lg:pb-0">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
