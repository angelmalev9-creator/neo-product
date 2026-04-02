import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Crown, Globe, CalendarDays, Mic, Users, CalendarCheck,
  CheckCircle2, Zap, ArrowRight, TrendingUp, Clock, Activity,
  Sparkles, BarChart3, Target, PhoneCall, Timer, Star, Rocket,
  Shield, HeadphonesIcon, BrainCircuit, ArrowUpRight, X,
  MessageCircle, UserCheck, LineChart,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, AreaChart, Area } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardHomeProps {
  subscribed: boolean;
  tierName: string;
  subscriptionEnd: string | null;
  usedMinutes: number;
  planLimit: number;
  onManageSubscription: () => void;
  portalLoading: boolean;
  onTabChange: (tab: string) => void;
  websiteUrl: string;
  calendarConnected: boolean;
  hasTestedNeo: boolean;
  userId: string;
}

type TimeFilter = 'today' | 'week' | 'month' | 'last_month';

const TIME_FILTER_LABELS: Record<TimeFilter, string> = {
  today: 'Днес',
  week: 'Седмица',
  month: 'Месец',
  last_month: 'Мин. месец',
};

function getFilterRange(filter: TimeFilter): { start: string; end: string; bucketCount: number } {
  const now = new Date();
  if (filter === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start.getTime() + 86400000);
    return { start: start.toISOString(), end: end.toISOString(), bucketCount: 24 };
  }
  if (filter === 'week') {
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return { start: start.toISOString(), end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString(), bucketCount: 7 };
  }
  if (filter === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { start: start.toISOString(), end: end.toISOString(), bucketCount: now.getDate() };
  }
  // last_month
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 1);
  return { start: start.toISOString(), end: end.toISOString(), bucketCount: new Date(now.getFullYear(), now.getMonth(), 0).getDate() };
}

function getBucketLabels(filter: TimeFilter): string[] {
  const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
  if (filter === 'today') {
    return Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
  }
  if (filter === 'week') {
    const labels: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dow = d.getDay();
      labels.push(WEEKDAY_LABELS[dow === 0 ? 6 : dow - 1]);
    }
    return labels;
  }
  if (filter === 'month') {
    const now = new Date();
    return Array.from({ length: now.getDate() }, (_, i) => String(i + 1));
  }
  // last_month
  const now = new Date();
  const daysInLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  return Array.from({ length: daysInLastMonth }, (_, i) => String(i + 1));
}

function bucketIndex(createdAt: string, filter: TimeFilter, rangeStart: string): number {
  const d = new Date(createdAt);
  const s = new Date(rangeStart);
  if (filter === 'today') return d.getHours();
  if (filter === 'week') return Math.floor((d.getTime() - s.getTime()) / 86400000);
  // month or last_month
  return d.getDate() - 1;
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

// Tier upgrade info
const TIER_UPGRADES: Record<string, { nextTier: string; nextLabel: string; features: string[]; price: string }> = {
  'NEO Старт': {
    nextTier: 'growth',
    nextLabel: 'NEO Растеж',
    features: ['500 мин/месец', 'AI имейл автоматизация', 'Приоритетна поддръжка'],
    price: '149 лв/мес',
  },
  'NEO Растеж': {
    nextTier: 'empire',
    nextLabel: 'NEO Империя',
    features: ['2500 мин/месец', 'API достъп', 'Без брандиране', 'Персонален мениджър'],
    price: '349 лв/мес',
  },
};

const DashboardHome = ({
  subscribed, tierName, subscriptionEnd, usedMinutes, planLimit,
  onManageSubscription, portalLoading, onTabChange,
  websiteUrl, calendarConnected, hasTestedNeo, userId,
}: DashboardHomeProps) => {
  const navigate = useNavigate();
  const usagePercent = planLimit > 0 ? (usedMinutes / planLimit) * 100 : 0;
  const isActive = subscribed && websiteUrl;

  const [todayConversations, setTodayConversations] = useState(0);
  const [todayClients, setTodayClients] = useState(0);
  const [todayBookings, setTodayBookings] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);
  const [weekData, setWeekData] = useState<{ label: string; conversations: number; clients: number }[]>([]);
  const [totalConversations, setTotalConversations] = useState(0);
  const [totalLeads, setTotalLeads] = useState(0);
  const [avgDuration, setAvgDuration] = useState(0);
  const [showUpsell, setShowUpsell] = useState(true);
  const [totalBookings, setTotalBookings] = useState(0);

  const getTodayStart = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
  };

  const fetchTodayStats = async () => {
    if (!userId) return;
    const todayStart = getTodayStart();
    const [convRes, clientConvRes, bookingsRes, totalConvRes, totalClientConvRes, totalBookRes, avgDurRes] = await Promise.all([
      supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', todayStart),
      supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('lead_captured', true).gte('created_at', todayStart),
      supabase.from('calendar_bookings').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', todayStart),
      supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('lead_captured', true),
      supabase.from('calendar_bookings').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('conversations').select('duration_seconds').eq('user_id', userId).not('duration_seconds', 'is', null),
    ]);
    setTodayConversations(convRes.count ?? 0);
    setTodayClients(clientConvRes.count ?? 0);
    setTodayBookings(bookingsRes.count ?? 0);
    setTotalConversations(totalConvRes.count ?? 0);
    setTotalLeads(totalClientConvRes.count ?? 0);
    setTotalBookings(totalBookRes.count ?? 0);

    // Calculate avg duration
    if (avgDurRes.data && avgDurRes.data.length > 0) {
      const total = avgDurRes.data.reduce((sum: number, c: any) => sum + (c.duration_seconds || 0), 0);
      setAvgDuration(Math.round(total / avgDurRes.data.length));
    }

    setStatsLoading(false);
  };

  const fetchWeeklyStats = async () => {
    if (!userId) return;
    const days = getLast7Days();
    const weekStart = days[0].dayStart;
    const [convRes, clientConvRes] = await Promise.all([
      supabase.from('conversations').select('created_at').eq('user_id', userId).gte('created_at', weekStart),
      supabase.from('conversations').select('created_at').eq('user_id', userId).eq('lead_captured', true).gte('created_at', weekStart),
    ]);
    const convos = convRes.data || [];
    const clientConvos = clientConvRes.data || [];
    const result = days.map(day => ({
      label: day.label,
      conversations: convos.filter(c => c.created_at >= day.dayStart && c.created_at < day.dayEnd).length,
      clients: clientConvos.filter(c => c.created_at >= day.dayStart && c.created_at < day.dayEnd).length,
    }));
    setWeekData(result);
  };

  useEffect(() => {
    if (!userId || !subscribed) return;
    fetchTodayStats();
    fetchWeeklyStats();
    const channel = supabase.channel('today-stats-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversations', filter: `user_id=eq.${userId}` }, () => {
        setTodayConversations(prev => prev + 1);
        setTotalConversations(prev => prev + 1);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations', filter: `user_id=eq.${userId}` }, (payload) => {
        const newRow = payload.new as any;
        const oldRow = payload.old as any;
        if (newRow.lead_captured === true && oldRow.lead_captured !== true) {
          setTodayClients(prev => prev + 1);
          setTotalLeads(prev => prev + 1);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'calendar_bookings', filter: `user_id=eq.${userId}` }, () => {
        setTodayBookings(prev => prev + 1);
        setTotalBookings(prev => prev + 1);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, subscribed]);

  if (!subscribed) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center space-y-5 max-w-sm"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto neo-float">
            <Zap className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Активирайте NEO</h2>
          <p className="text-sm text-muted-foreground">
            Изберете план, за да получите AI асистент 24/7 на вашия сайт.
          </p>
          <Button onClick={() => navigate('/#pricing')} size="lg" className="gap-2">
            Разгледайте плановете <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    );
  }

  const conversionRate = totalConversations > 0 ? Math.round((totalLeads / totalConversations) * 100) : 0;
  const bookingRate = totalConversations > 0 ? Math.round((totalBookings / totalConversations) * 100) : 0;
  const avgDurationMin = avgDuration > 0 ? `${Math.floor(avgDuration / 60)}:${String(avgDuration % 60).padStart(2, '0')}` : '—';
  const upgradeInfo = TIER_UPGRADES[tierName];
  const automationScore = Math.min(99, Math.max(12, Math.round((conversionRate * 0.45) + (bookingRate * 0.35) + ((100 - Math.min(usagePercent, 100)) * 0.2))));
  const analysisSignals = [
    { label: 'Конверсия към клиент', value: conversionRate, helper: `${totalLeads} от ${totalConversations} разговора`, tone: 'primary' as const },
    { label: 'Резервации от разговор', value: bookingRate, helper: `${totalBookings} потвърдени резервации`, tone: 'blue' as const },
    { label: 'Използване на плана', value: Math.min(Math.round(usagePercent), 100), helper: `${usedMinutes.toFixed(0)} / ${planLimit} минути`, tone: 'success' as const },
  ];

  return (
    <div className="h-full flex flex-col p-4 lg:p-6 gap-3 overflow-y-auto lg:overflow-hidden">
      {/* Row 1: Header + Status */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between shrink-0"
      >
        <div>
          <h1 className="text-lg font-bold text-foreground">Начало</h1>
          <p className="text-xs text-muted-foreground">Преглед на активността в реално време</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border backdrop-blur-sm ${isActive ? 'bg-[hsl(var(--neo-success))]/10 border-[hsl(var(--neo-success))]/25 text-[hsl(var(--neo-success))] shadow-[0_0_20px_hsl(var(--neo-success)/0.15)]' : 'bg-muted/50 border-border/20 text-muted-foreground'}`}
          >
            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-[hsl(var(--neo-success))] animate-pulse' : 'bg-muted-foreground/50'}`} />
            {isActive ? 'Online' : 'Offline'}
          </motion.span>
        </div>
      </motion.div>

      {/* Row 2: Live Stats (4 cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        <StatCard i={0} icon={MessageCircle} label="Разговори днес" value={statsLoading ? '—' : String(todayConversations)} subLabel={`${totalConversations} общо`} color="primary" />
        <StatCard i={1} icon={UserCheck} label="Нови клиенти" value={statsLoading ? '—' : String(todayClients)} subLabel={`${conversionRate}% конверсия`} color="success" />
        <StatCard i={2} icon={CalendarCheck} label="Резервации" value={statsLoading ? '—' : String(todayBookings)} subLabel={`${totalBookings} общо`} color="blue" />
        <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp}
          className="rounded-2xl border border-border/10 bg-card/60 backdrop-blur-sm p-4 flex flex-col justify-between relative overflow-hidden group hover:border-border/30 transition-all duration-500"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] font-semibold text-primary">{tierName}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onManageSubscription} disabled={portalLoading} className="text-[10px] h-6 px-2">
              {portalLoading ? '...' : 'Управление'}
            </Button>
          </div>
          <div className="mt-2 relative">
            <Progress value={Math.min(usagePercent, 100)} className="h-1.5" />
            <div className="flex justify-between mt-1">
              <p className="text-[10px] text-muted-foreground">{usedMinutes.toFixed(0)}/{planLimit} мин</p>
              {usagePercent > 80 && (
                <span className="text-[9px] text-[hsl(var(--neo-warning))] font-medium animate-pulse">
                  {usagePercent >= 100 ? 'Лимит достигнат!' : 'Наближава лимит'}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Row 3: Chart + Right panel */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-3 min-h-0">
        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="lg:col-span-3 rounded-2xl border border-border/10 bg-card/60 backdrop-blur-sm p-4 flex flex-col min-h-[200px] relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent pointer-events-none" />
          <div className="relative flex items-center justify-between mb-3 shrink-0">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-xs font-semibold text-foreground">Седмичен преглед</h2>
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[9px] text-primary font-medium">Live</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                <div className="w-2 h-2 rounded-sm bg-primary" /> Разговори
              </div>
              <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                <div className="w-2 h-2 rounded-sm bg-[hsl(var(--neo-success))]" /> Клиенти
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.15} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis hide allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 11, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number, name: string) => [value, name === 'conversations' ? 'Разговори' : 'Нови клиенти']}
                  cursor={{ fill: 'hsl(var(--primary) / 0.05)' }}
                />
                <Bar dataKey="conversations" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={24} />
                <Bar dataKey="clients" fill="hsl(var(--neo-success))" radius={[6, 6, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Right panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="lg:col-span-2 flex flex-col gap-3 min-h-0"
        >
          <div className="rounded-2xl border border-border/10 bg-card/60 backdrop-blur-sm p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] via-transparent to-transparent pointer-events-none" />
            <div className="relative mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Анализи</p>
                <h3 className="text-sm font-semibold text-foreground">Състояние на AI канала Ви</h3>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-right">
                <div className="text-lg font-black text-primary leading-none">{automationScore}</div>
                <div className="mt-1 text-[9px] uppercase tracking-[0.18em] text-primary/80">Score</div>
              </div>
            </div>

            <div className="relative space-y-3">
              {analysisSignals.map((signal) => (
                <InsightBar
                  key={signal.label}
                  label={signal.label}
                  value={signal.value}
                  helper={signal.helper}
                  tone={signal.tone}
                />
              ))}
            </div>
          </div>

          {/* Performance metrics */}
          <div className="grid grid-cols-2 gap-2 shrink-0">
            <MiniStat icon={Activity} label="Общо разговори" value={String(totalConversations)} color="text-primary" />
            <MiniStat icon={Target} label="Конверсия" value={conversionRate > 0 ? `${conversionRate}%` : '—'} color="text-[hsl(var(--neo-purple))]" />
            <MiniStat icon={Timer} label="Ср. дължина" value={avgDurationMin} color="text-[hsl(var(--neo-blue))]" />
            <MiniStat icon={LineChart} label="Резерв. %"  value={bookingRate > 0 ? `${bookingRate}%` : '—'} color="text-[hsl(var(--neo-orange))]" />
          </div>

          {/* Upsell banner or Quick actions */}
          {upgradeInfo && showUpsell ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="flex-1 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card/80 to-[hsl(var(--neo-purple))]/5 backdrop-blur-sm p-4 flex flex-col relative overflow-hidden min-h-0"
            >
              <button onClick={() => setShowUpsell(false)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors z-10">
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full pointer-events-none" />
              <div className="flex items-center gap-2 mb-2 relative">
                <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
                  <Rocket className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-foreground">Надградете до {upgradeInfo.nextLabel}</p>
                  <p className="text-[9px] text-muted-foreground">{upgradeInfo.price}</p>
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-1 my-2 overflow-y-auto">
                {upgradeInfo.features.map(f => (
                  <div key={f} className="flex items-center gap-1.5">
                    <Star className="w-3 h-3 text-primary shrink-0" />
                    <span className="text-[10px] text-foreground/80">{f}</span>
                  </div>
                ))}
              </div>
              <Button
                size="sm"
                onClick={() => navigate('/#pricing')}
                className="gap-1.5 text-[11px] h-8 bg-primary hover:bg-primary/90 relative"
              >
                Надградете сега <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </motion.div>
          ) : (
            <div className="flex-1 rounded-2xl border border-border/10 bg-card/60 backdrop-blur-sm p-4 flex flex-col gap-1.5 min-h-0 overflow-y-auto relative">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent pointer-events-none rounded-2xl" />
              <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0 relative mb-1">Бързи действия</h3>
              <ActionRow icon={Globe} title="Добави сайт" done={!!websiteUrl} onClick={() => onTabChange('setup-website')} />
              <ActionRow icon={CalendarDays} title="Свържи календар" done={calendarConnected} onClick={() => onTabChange('setup-calendar')} />
              <ActionRow icon={Mic} title="Тествай NEO" done={hasTestedNeo} onClick={() => onTabChange('neo-test')} />
              <ActionRow icon={BrainCircuit} title="Персонализирай" done={false} onClick={() => onTabChange('neo-behavior')} />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

function StatCard({ i, icon: Icon, label, value, subLabel, color }: {
  i: number; icon: React.ElementType; label: string; value: string; subLabel: string; color: 'primary' | 'success' | 'blue';
}) {
  const colorMap = {
    primary: { gradient: 'from-primary/20 via-primary/8 to-transparent', iconColor: 'text-primary', glow: 'shadow-[0_0_30px_hsl(var(--primary)/0.12)]', iconBg: 'bg-primary/15' },
    success: { gradient: 'from-[hsl(var(--neo-success))]/20 via-[hsl(var(--neo-success))]/8 to-transparent', iconColor: 'text-[hsl(var(--neo-success))]', glow: 'shadow-[0_0_30px_hsl(var(--neo-success)/0.12)]', iconBg: 'bg-[hsl(var(--neo-success))]/15' },
    blue: { gradient: 'from-[hsl(var(--neo-blue))]/20 via-[hsl(var(--neo-blue))]/8 to-transparent', iconColor: 'text-[hsl(var(--neo-blue))]', glow: 'shadow-[0_0_30px_hsl(var(--neo-blue)/0.12)]', iconBg: 'bg-[hsl(var(--neo-blue))]/15' },
  };
  const c = colorMap[color];

  return (
    <motion.div custom={i} initial="hidden" animate="visible" variants={fadeUp}>
      <div className={`rounded-2xl border border-border/10 bg-gradient-to-br ${c.gradient} backdrop-blur-sm p-4 relative overflow-hidden group hover:border-border/30 transition-all duration-500 ${c.glow}`}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/[0.04] to-transparent rounded-bl-full pointer-events-none" />
        <div className="flex items-center gap-2 mb-2 relative">
          <div className={`w-9 h-9 rounded-xl ${c.iconBg} backdrop-blur-sm flex items-center justify-center border border-border/10 group-hover:scale-105 transition-transform duration-300`}>
            <Icon className={`w-4 h-4 ${c.iconColor}`} />
          </div>
        </div>
        <p className="text-2xl font-black text-foreground tracking-tight relative">{value}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5 relative">{label}</p>
        {subLabel && (
          <p className="text-[9px] text-muted-foreground/60 mt-0.5 relative">{subLabel}</p>
        )}
      </div>
    </motion.div>
  );
}

function MiniStat({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-border/10 bg-card/40 backdrop-blur-sm p-3 flex items-center gap-2.5 hover:bg-card/70 transition-all duration-300 group">
      <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-foreground leading-none">{value}</p>
        <p className="text-[9px] text-muted-foreground mt-0.5 truncate">{label}</p>
      </div>
    </div>
  );
}

function ActionRow({ icon: Icon, title, done, onClick }: {
  icon: React.ElementType; title: string; done: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/30 transition-all duration-300 group text-left w-full">
      <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 group-hover:bg-primary/15 group-hover:scale-105 transition-all duration-300">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <span className="text-xs font-medium text-foreground flex-1">{title}</span>
      {done ? (
        <CheckCircle2 className="w-4 h-4 text-[hsl(var(--neo-success))]" />
      ) : (
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-300" />
      )}
    </button>
  );
}

function InsightBar({ label, value, helper, tone }: {
  label: string;
  value: number;
  helper: string;
  tone: 'primary' | 'success' | 'blue';
}) {
  const toneMap = {
    primary: 'bg-primary',
    success: 'bg-[hsl(var(--neo-success))]',
    blue: 'bg-[hsl(var(--neo-blue))]',
  };

  return (
    <div className="rounded-xl border border-border/10 bg-background/25 p-3">
      <div className="mb-1 flex items-center justify-between gap-3">
        <span className="text-[11px] text-foreground">{label}</span>
        <span className="text-[11px] text-muted-foreground">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted/60">
        <div
          className={`h-full rounded-full ${toneMap[tone]} transition-all duration-500`}
          style={{ width: `${Math.max(6, Math.min(value, 100))}%` }}
        />
      </div>
      <p className="mt-1.5 text-[10px] text-muted-foreground">{helper}</p>
    </div>
  );
}

export default DashboardHome;
