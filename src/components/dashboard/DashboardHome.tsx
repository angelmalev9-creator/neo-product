import { useEffect, useState, useCallback } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Crown, Zap, ArrowRight, CheckCircle2, Circle,
  MessageCircle, UserCheck, CalendarCheck, TrendingUp, Clock,
  Globe, Brain, Mic, Palette, Phone,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUsage } from '@/pages/Dashboard';

interface DashboardHomeProps {
  subscribed: boolean;
  tierName: string;
  subscriptionEnd: string | null;
  usedMinutes: number;       // kept for backward compat — IGNORED, reads from context
  planLimit: number;          // kept for backward compat — IGNORED, reads from context
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
  week: '7 дни',
  month: '30 дни',
  last_month: 'Мин. месец',
};

function getFilterRange(filter: TimeFilter) {
  const now = new Date();
  if (filter === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { start: start.toISOString(), end: new Date(start.getTime() + 86400000).toISOString(), bucketCount: 24 };
  }
  if (filter === 'week') {
    const start = new Date(now); start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0);
    return { start: start.toISOString(), end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString(), bucketCount: 7 };
  }
  if (filter === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: start.toISOString(), end: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(), bucketCount: now.getDate() };
  }
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { start: start.toISOString(), end: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), bucketCount: new Date(now.getFullYear(), now.getMonth(), 0).getDate() };
}

function getBucketLabels(filter: TimeFilter) {
  const WD = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
  if (filter === 'today') return Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
  if (filter === 'week') {
    const labels: string[] = [];
    for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const dow = d.getDay(); labels.push(WD[dow === 0 ? 6 : dow - 1]); }
    return labels;
  }
  if (filter === 'month') return Array.from({ length: new Date().getDate() }, (_, i) => String(i + 1));
  const daysInLastMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 0).getDate();
  return Array.from({ length: daysInLastMonth }, (_, i) => String(i + 1));
}

function bucketIndex(createdAt: string, filter: TimeFilter, rangeStart: string) {
  const d = new Date(createdAt);
  const s = new Date(rangeStart);
  if (filter === 'today') return d.getHours();
  if (filter === 'week') return Math.floor((d.getTime() - s.getTime()) / 86400000);
  return d.getDate() - 1;
}

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.35, ease: "easeOut" as const } }),
};

const formatUsageMinutes = (v: number) => v <= 0 ? '0' : v < 10 ? v.toFixed(1) : v.toFixed(0);

const DashboardHome = ({
  subscribed, tierName, subscriptionEnd,
  // usedMinutes & planLimit props IGNORED — single source of truth is UsageContext
  onManageSubscription, portalLoading, onTabChange,
  websiteUrl, calendarConnected, hasTestedNeo, userId,
}: DashboardHomeProps) => {
  const navigate = useNavigate();

  // ═══ FIX: Single source of truth from UsageContext ═══
  const { usedMinutes, planLimit } = useUsage();

  const usagePercent = planLimit > 0 ? (usedMinutes / planLimit) * 100 : 0;
  const isActive = subscribed && websiteUrl;

  const [todayConversations, setTodayConversations] = useState(0);
  const [todayClients, setTodayClients] = useState(0);
  const [todayBookings, setTodayBookings] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);
  const [totalConversations, setTotalConversations] = useState(0);
  const [totalLeads, setTotalLeads] = useState(0);
  const [avgDuration, setAvgDuration] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [chartFilter, setChartFilter] = useState<TimeFilter>('week');
  const [chartData, setChartData] = useState<{ label: string; conversations: number; clients: number }[]>([]);
  const [hasSession, setHasSession] = useState(false);
  const [hasWidget, setHasWidget] = useState(false);

  const getTodayStart = () => { const n = new Date(); n.setHours(0, 0, 0, 0); return n.toISOString(); };

  useEffect(() => {
    if (!userId || !subscribed) return;
    // Check setup state
    (async () => {
      const [sessionRes, profileRes] = await Promise.all([
        supabase.from('demo_sessions').select('id').eq('user_id', userId).eq('status', 'ready').limit(1),
        supabase.from('profiles').select('widget_installed_at').eq('user_id', userId).single(),
      ]);
      setHasSession((sessionRes.data?.length ?? 0) > 0);
      setHasWidget(!!profileRes.data?.widget_installed_at);
    })();
  }, [userId, subscribed]);

  const fetchTodayStats = useCallback(async () => {
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
    if (avgDurRes.data && avgDurRes.data.length > 0) {
      const total = avgDurRes.data.reduce((sum: number, c: any) => sum + (c.duration_seconds || 0), 0);
      setAvgDuration(Math.round(total / avgDurRes.data.length));
    }
    setStatsLoading(false);
  }, [userId]);

  const fetchChartData = useCallback(async (filter: TimeFilter) => {
    if (!userId) return;
    const { start, end } = getFilterRange(filter);
    const labels = getBucketLabels(filter);
    const [convRes, clientConvRes] = await Promise.all([
      supabase.from('conversations').select('created_at').eq('user_id', userId).gte('created_at', start).lt('created_at', end),
      supabase.from('conversations').select('created_at').eq('user_id', userId).eq('lead_captured', true).gte('created_at', start).lt('created_at', end),
    ]);
    const convos = convRes.data || [];
    const clientConvos = clientConvRes.data || [];
    setChartData(labels.map((lbl, i) => ({
      label: lbl,
      conversations: convos.filter(c => bucketIndex(c.created_at, filter, start) === i).length,
      clients: clientConvos.filter(c => bucketIndex(c.created_at, filter, start) === i).length,
    })));
  }, [userId]);

  useEffect(() => {
    if (!userId || !subscribed) return;
    fetchTodayStats();
    fetchChartData(chartFilter);
  }, [userId, subscribed, fetchTodayStats, fetchChartData, chartFilter]);

  // ═══ FIX: Слушай neo-conversations-updated от Dashboard.tsx realtime ═══
  // Вместо собствен realtime канал — ползваме единния от Dashboard
  // Това елиминира дублиращи се subscription-и
  useEffect(() => {
    if (!userId || !subscribed) return;

    const handleConversationsUpdated = () => {
      fetchTodayStats();
      fetchChartData(chartFilter);
    };

    const handleLeadsUpdated = () => {
      fetchTodayStats();
    };

    window.addEventListener('neo-conversations-updated', handleConversationsUpdated);
    window.addEventListener('neo-leads-updated', handleLeadsUpdated);

    return () => {
      window.removeEventListener('neo-conversations-updated', handleConversationsUpdated);
      window.removeEventListener('neo-leads-updated', handleLeadsUpdated);
    };
  }, [userId, subscribed, chartFilter, fetchTodayStats, fetchChartData]);

  if (!subscribed) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="text-center space-y-5 max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-[hsl(0_0%_100%/0.92)]">Активирайте NEO</h2>
          <p className="text-[13px] text-[hsl(0_0%_100%/0.5)]">Изберете план, за да получите AI асистент 24/7.</p>
          <Button onClick={() => navigate('/#pricing')} size="lg" className="gap-2">
            Разгледайте плановете <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    );
  }

  const steps = [
    { id: 'train', label: 'Обучете NEO', description: 'Добавете сайт и база знания', done: !!websiteUrl && hasSession, tab: 'setup' },
    { id: 'test', label: 'Тествайте', description: 'Пробвайте гласовия асистент', done: hasTestedNeo, tab: 'neo-test' },
    { id: 'widget', label: 'Добавете на сайта', description: 'Вградете уиджета', done: hasWidget, tab: 'channels-widget' },
  ];
  const completedSteps = steps.filter(s => s.done).length;
  const showOnboarding = completedSteps < steps.length;
  const nextStep = steps.find(s => !s.done);

  const conversionRate = totalConversations > 0 ? Math.round((totalLeads / totalConversations) * 100) : 0;
  const bookingRate = totalConversations > 0 ? Math.round((totalBookings / totalConversations) * 100) : 0;
  const automationScore = Math.min(100, Math.round(
    (conversionRate * 0.4) + (bookingRate * 0.3) + (Math.min(usagePercent, 100) * 0.3)
  ));

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0с';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}с`;
    return `${m}м ${s}с`;
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain p-4 lg:p-6 space-y-3">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-[hsl(0_0%_100%/0.92)]">Анализи</h1>
            <p className="text-[11px] text-[hsl(0_0%_100%/0.35)]">Преглед на активността на NEO</p>
          </div>
          {isActive && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#10b981]/10 border border-[#10b981]/20">
              <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
              <span className="text-[10px] text-[#10b981] font-medium">Online</span>
            </div>
          )}
        </motion.div>

        {/* Onboarding */}
        {showOnboarding && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="glass-card p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.1em] text-[hsl(0_0%_100%/0.28)] font-medium">Настройка</p>
              <span className="text-[10px] text-primary font-medium">{completedSteps}/{steps.length}</span>
            </div>
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <div key={i} className={cn('flex-1 h-2 rounded-full transition-all duration-500', steps[i].done ? 'bg-primary' : 'bg-[hsl(0_0%_100%/0.06)]')} />
              ))}
            </div>
            <div className="space-y-1">
              {steps.map((step) => {
                const Icon = step.done ? CheckCircle2 : Circle;
                return (
                  <motion.button
                    key={step.id}
                    whileHover={{ x: 2 }}
                    onClick={() => !step.done && onTabChange(step.tab)}
                    className={cn(
                      'w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl text-left transition-all duration-200',
                      step.done ? 'opacity-50 cursor-default' : 'hover:bg-[hsl(0_0%_100%/0.03)] cursor-pointer'
                    )}
                  >
                    <Icon className={cn('w-4 h-4 shrink-0', step.done ? 'text-primary' : 'text-[hsl(0_0%_100%/0.15)]')} />
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-[13px] font-medium', step.done ? 'text-[hsl(0_0%_100%/0.4)] line-through' : 'text-[hsl(0_0%_100%/0.85)]')}>
                        {step.label}
                      </p>
                      <p className="text-[10px] text-[hsl(0_0%_100%/0.3)] truncate">{step.description}</p>
                    </div>
                    {!step.done && <ArrowRight className="w-3.5 h-3.5 text-[hsl(0_0%_100%/0.15)]" />}
                  </motion.button>
                );
              })}
            </div>

            {/* CTA */}
            {nextStep && (
              <Button onClick={() => onTabChange(nextStep.tab)} className="w-full sm:w-auto gap-2 h-10">
                {nextStep.id === 'train' ? 'Започнете обучението' : nextStep.id === 'test' ? 'Тествайте NEO' : 'Добавете NEO към сайта'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </motion.div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <StatCard i={0} icon={MessageCircle} label="Обаждания" value={statsLoading ? '—' : String(totalConversations)} change={todayConversations > 0 ? `+${todayConversations} днес` : 'днес'} positive={todayConversations > 0} />
          <StatCard i={1} icon={UserCheck} label="Клиенти" value={statsLoading ? '—' : String(totalLeads)} change={`${conversionRate}% конверсия`} positive={conversionRate > 0} />
          <StatCard i={2} icon={CalendarCheck} label="Резервации" value={statsLoading ? '—' : String(totalBookings)} change={todayBookings > 0 ? `+${todayBookings} днес` : 'днес'} positive={todayBookings > 0} />
          <StatCard i={3} icon={Clock} label="Ср. продължителност" value={statsLoading ? '—' : formatDuration(avgDuration)} change={`${formatUsageMinutes(usedMinutes)}/${planLimit} мин`} positive={usagePercent < 80} />
        </div>

        {/* Chart + Side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Chart */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="lg:col-span-2 glass-card p-4"
          >
            <div className="flex items-center justify-between mb-1">
              <div>
                <h3 className="text-[13px] font-semibold text-[hsl(0_0%_100%/0.85)]">Обаждания</h3>
                <p className="text-[10px] text-[hsl(0_0%_100%/0.35)]">Общо за периода</p>
              </div>
              <div className="flex gap-0.5 bg-[hsl(0_0%_100%/0.04)] rounded-lg p-0.5">
                {(Object.keys(TIME_FILTER_LABELS) as TimeFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => { setChartFilter(f); fetchChartData(f); }}
                    className={cn(
                      'px-2 py-1 text-[10px] font-medium rounded-md transition-all',
                      chartFilter === f
                        ? 'bg-primary/15 text-primary'
                        : 'text-[hsl(0_0%_100%/0.3)] hover:text-[hsl(0_0%_100%/0.6)]'
                    )}
                  >
                    {TIME_FILTER_LABELS[f]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1.5 text-[10px] text-[hsl(0_0%_100%/0.45)]">
                <div className="w-2 h-2 rounded-full bg-primary" /> Обаждания
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-[hsl(0_0%_100%/0.45)]">
                <div className="w-2 h-2 rounded-full bg-[#10b981]" /> Клиенти
              </div>
            </div>
            <div className="h-[200px] sm:h-[240px] lg:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gradConv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradClients" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.04)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(0 0% 100% / 0.3)' }} axisLine={false} tickLine={false} interval={chartFilter === 'today' ? 3 : chartFilter === 'month' || chartFilter === 'last_month' ? 4 : 0} />
                  <YAxis hide allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(240 32% 10%)', border: '1px solid hsl(0 0% 100% / 0.08)', borderRadius: 10, fontSize: 11, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                    labelStyle={{ color: 'hsl(0 0% 100% / 0.7)' }}
                    formatter={(value: number, name: string) => [value, name === 'conversations' ? 'Обаждания' : 'Нови клиенти']}
                  />
                  <Area type="monotone" dataKey="conversations" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#gradConv)" dot={false} activeDot={{ r: 4, strokeWidth: 2 }} />
                  <Area type="monotone" dataKey="clients" stroke="#10b981" strokeWidth={2} fill="url(#gradClients)" dot={false} activeDot={{ r: 4, strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Right side */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="flex flex-col gap-3"
          >
            {/* Efficiency */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.1em] text-[hsl(0_0%_100%/0.28)] font-medium">Ефективност</p>
                  <p className="text-[24px] font-bold text-[hsl(0_0%_100%/0.92)] mt-0.5 leading-none">{automationScore}<span className="text-[12px] font-normal text-[hsl(0_0%_100%/0.3)]">/100</span></p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="space-y-2.5">
                <MiniBar label="Конверсия" value={conversionRate} color="primary" />
                <MiniBar label="Резервации" value={bookingRate} color="success" />
                <MiniBar label="Използване" value={Math.min(Math.round(usagePercent), 100)} color="blue" />
              </div>
            </div>

            {/* Plan */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Crown className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[12px] font-medium text-[hsl(0_0%_100%/0.85)]">{tierName}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={onManageSubscription} disabled={portalLoading} className="text-[10px] h-6 px-2 text-[hsl(0_0%_100%/0.35)] hover:text-[hsl(0_0%_100%/0.7)]">
                  {portalLoading ? '...' : 'Управление'}
                </Button>
              </div>
              <div className="flex justify-between mb-1.5">
                <span className="text-[10px] text-[hsl(0_0%_100%/0.4)]">{formatUsageMinutes(usedMinutes)} мин</span>
                <span className="text-[10px] text-[hsl(0_0%_100%/0.4)]">{planLimit} мин</span>
              </div>
              <Progress value={Math.min(usagePercent, 100)} className="h-1.5" />
              {usagePercent > 80 && (
                <p className="text-[9px] text-[#f59e0b] font-medium mt-1.5">
                  {usagePercent >= 100 ? 'Лимитът е достигнат' : 'Почти пълно'}
                </p>
              )}
              {subscriptionEnd && (
                <p className="text-[9px] text-[hsl(0_0%_100%/0.25)] mt-2">
                  Активен до {new Date(subscriptionEnd).toLocaleDateString('bg-BG')}
                </p>
              )}
            </div>

            {/* Quick actions when onboarding */}
            {showOnboarding && nextStep && (
              <button
                onClick={() => onTabChange(nextStep.tab)}
                className="glass-card p-4 text-left hover:border-primary/20 transition-all group"
              >
                <p className="text-[10px] uppercase tracking-[0.1em] text-primary/60 font-medium mb-1">Следваща стъпка</p>
                <p className="text-[13px] font-medium text-[hsl(0_0%_100%/0.85)] group-hover:text-primary transition-colors">
                  {nextStep.label}
                </p>
                <p className="text-[10px] text-[hsl(0_0%_100%/0.35)] mt-0.5">{nextStep.description}</p>
              </button>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

/* ── Sub-components ── */

function StatCard({ i, icon: Icon, label, value, change, positive }: {
  i: number; icon: React.ElementType; label: string; value: string; change: string; positive: boolean;
}) {
  return (
    <motion.div custom={i} initial="hidden" animate="visible" variants={fadeUp} whileHover={{ y: -1, transition: { duration: 0.15 } }}>
      <div className="glass-card p-3 sm:p-3.5 h-full group hover:border-[hsl(0_0%_100%/0.1)] transition-all duration-200">
        <div className="flex items-center justify-between mb-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-md ${positive ? 'text-[#10b981] bg-[#10b981]/10' : 'text-[hsl(0_0%_100%/0.35)] bg-[hsl(0_0%_100%/0.04)]'}`}>
            {change}
          </span>
        </div>
        <p className="text-[20px] sm:text-[22px] font-bold text-[hsl(0_0%_100%/0.92)] tracking-tight leading-none">{value}</p>
        <p className="text-[10px] text-[hsl(0_0%_100%/0.35)] mt-1">{label}</p>
      </div>
    </motion.div>
  );
}

function MiniBar({ label, value, color }: { label: string; value: number; color: 'primary' | 'success' | 'blue' }) {
  const colorMap = { primary: 'bg-primary', success: 'bg-[#10b981]', blue: 'bg-[#3b82f6]' };
  const pillMap = { primary: 'bg-primary/15 text-primary', success: 'bg-[#10b981]/15 text-[#10b981]', blue: 'bg-[#3b82f6]/15 text-[#3b82f6]' };
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-[hsl(0_0%_100%/0.45)] font-medium">{label}</span>
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${pillMap[color]}`}>{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-[hsl(0_0%_100%/0.04)] overflow-hidden">
        <div className={`h-full rounded-full ${colorMap[color]} transition-all duration-700`} style={{ width: `${Math.max(4, Math.min(value, 100))}%` }} />
      </div>
    </div>
  );
}

export default DashboardHome;