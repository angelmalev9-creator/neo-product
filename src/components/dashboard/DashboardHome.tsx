import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Crown, Zap, ArrowRight,
  MessageCircle, UserCheck, CalendarCheck, TrendingUp, Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';

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
  week: '7 дни',
  month: '30 дни',
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
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 1);
  return { start: start.toISOString(), end: end.toISOString(), bucketCount: new Date(now.getFullYear(), now.getMonth(), 0).getDate() };
}

function getBucketLabels(filter: TimeFilter): string[] {
  const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
  if (filter === 'today') return Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
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
  const now = new Date();
  const daysInLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  return Array.from({ length: daysInLastMonth }, (_, i) => String(i + 1));
}

function bucketIndex(createdAt: string, filter: TimeFilter, rangeStart: string): number {
  const d = new Date(createdAt);
  const s = new Date(rangeStart);
  if (filter === 'today') return d.getHours();
  if (filter === 'week') return Math.floor((d.getTime() - s.getTime()) / 86400000);
  return d.getDate() - 1;
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" as const },
  }),
};

const formatUsageMinutes = (value: number) => {
  if (value <= 0) return '0';
  return value < 10 ? value.toFixed(1) : value.toFixed(0);
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
  const [totalConversations, setTotalConversations] = useState(0);
  const [totalLeads, setTotalLeads] = useState(0);
  const [avgDuration, setAvgDuration] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [chartFilter, setChartFilter] = useState<TimeFilter>('week');
  const [chartData, setChartData] = useState<{ label: string; conversations: number; clients: number }[]>([]);

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
    if (avgDurRes.data && avgDurRes.data.length > 0) {
      const total = avgDurRes.data.reduce((sum: number, c: any) => sum + (c.duration_seconds || 0), 0);
      setAvgDuration(Math.round(total / avgDurRes.data.length));
    }
    setStatsLoading(false);
  };

  const fetchChartData = async (filter: TimeFilter) => {
    if (!userId) return;
    const { start, end } = getFilterRange(filter);
    const labels = getBucketLabels(filter);
    const [convRes, clientConvRes] = await Promise.all([
      supabase.from('conversations').select('created_at').eq('user_id', userId).gte('created_at', start).lt('created_at', end),
      supabase.from('conversations').select('created_at').eq('user_id', userId).eq('lead_captured', true).gte('created_at', start).lt('created_at', end),
    ]);
    const convos = convRes.data || [];
    const clientConvos = clientConvRes.data || [];
    const result = labels.map((lbl, i) => ({
      label: lbl,
      conversations: convos.filter(c => bucketIndex(c.created_at, filter, start) === i).length,
      clients: clientConvos.filter(c => bucketIndex(c.created_at, filter, start) === i).length,
    }));
    setChartData(result);
  };

  useEffect(() => {
    if (!userId || !subscribed) return;
    fetchTodayStats();
    fetchChartData(chartFilter);
    const channel = supabase.channel('today-stats-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversations', filter: `user_id=eq.${userId}` }, () => {
        setTodayConversations(prev => prev + 1);
        setTotalConversations(prev => prev + 1);
        fetchChartData(chartFilter);
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
  }, [userId, subscribed, chartFilter]);

  if (!subscribed) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="text-center space-y-5 max-w-sm">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto">
            <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-foreground">Активирайте NEO</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Изберете план, за да получите AI асистент 24/7.</p>
          <Button onClick={() => navigate('/#pricing')} size="lg" className="gap-2">
            Разгледайте плановете <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    );
  }

  const conversionRate = totalConversations > 0 ? Math.round((totalLeads / totalConversations) * 100) : 0;
  const bookingRate = totalConversations > 0 ? Math.round((totalBookings / totalConversations) * 100) : 0;
  const automationScore = Math.min(99, Math.max(12, Math.round((conversionRate * 0.45) + (bookingRate * 0.35) + ((100 - Math.min(usagePercent, 100)) * 0.2))));

  const formatDuration = (s: number) => {
    if (s < 60) return `${s}с`;
    return `${Math.floor(s / 60)}м ${s % 60}с`;
  };

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden overscroll-y-contain">
      <div className="p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-5">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-foreground">Анализи</h1>
            <p className="text-[11px] sm:text-xs text-muted-foreground/70">Преглед на активността на NEO</p>
          </div>
          <div className="flex items-center gap-2">
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold border ${isActive ? 'bg-[hsl(var(--neo-success))]/10 border-[hsl(var(--neo-success))]/25 text-[hsl(var(--neo-success))]' : 'bg-muted/50 border-border/20 text-muted-foreground'}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[hsl(var(--neo-success))] animate-pulse' : 'bg-muted-foreground/50'}`} />
              {isActive ? 'Online' : 'Offline'}
            </motion.span>
          </div>
        </motion.div>

        {/* Stat cards row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <StatCard i={0} icon={MessageCircle} label="Обаждания" value={statsLoading ? '—' : String(totalConversations)} change={todayConversations > 0 ? `+${todayConversations} днес` : 'днес'} positive={todayConversations > 0} />
          <StatCard i={1} icon={UserCheck} label="Клиенти" value={statsLoading ? '—' : String(totalLeads)} change={`${conversionRate}% конверсия`} positive={conversionRate > 0} />
          <StatCard i={2} icon={CalendarCheck} label="Резервации" value={statsLoading ? '—' : String(totalBookings)} change={todayBookings > 0 ? `+${todayBookings} днес` : 'днес'} positive={todayBookings > 0} />
          <StatCard i={3} icon={Clock} label="Ср. продължителност" value={statsLoading ? '—' : formatDuration(avgDuration)} change={`${formatUsageMinutes(usedMinutes)}/${planLimit} мин`} positive={usagePercent < 80} />
        </div>

        {/* Chart + Side panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Main Chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="lg:col-span-2 rounded-2xl border border-border/10 bg-card/60 p-4 sm:p-5 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent pointer-events-none" />
            {/* Chart header */}
            <div className="relative flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Обаждания</h2>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">Общо за периода</p>
              </div>
              <div className="flex items-center gap-0.5 bg-muted/20 rounded-lg p-0.5">
                {(Object.keys(TIME_FILTER_LABELS) as TimeFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => { setChartFilter(f); fetchChartData(f); }}
                    className={`text-[10px] px-2.5 py-1 rounded-md transition-all ${
                      chartFilter === f
                        ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {TIME_FILTER_LABELS[f]}
                  </button>
                ))}
              </div>
            </div>
            {/* Legend */}
            <div className="relative flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" /> Обаждания
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--neo-success))]" /> Клиенти
              </div>
            </div>
            {/* Chart */}
            <div className="relative h-[200px] sm:h-[240px] lg:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gradConv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradClients" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--neo-success))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--neo-success))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.1} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} interval={chartFilter === 'today' ? 3 : chartFilter === 'month' || chartFilter === 'last_month' ? 4 : 0} />
                  <YAxis hide allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border)/0.2)', borderRadius: 12, fontSize: 11, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number, name: string) => [value, name === 'conversations' ? 'Обаждания' : 'Нови клиенти']}
                  />
                  <Area type="monotone" dataKey="conversations" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#gradConv)" dot={false} activeDot={{ r: 4, strokeWidth: 2 }} />
                  <Area type="monotone" dataKey="clients" stroke="hsl(var(--neo-success))" strokeWidth={2} fill="url(#gradClients)" dot={false} activeDot={{ r: 4, strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Right panels */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="flex flex-col gap-3"
          >
            {/* Efficiency score */}
            <div className="rounded-2xl border border-border/10 bg-card/60 p-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] to-transparent pointer-events-none" />
              <div className="relative flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Ефективност</p>
                  <p className="text-2xl font-black text-foreground mt-0.5">{automationScore}<span className="text-xs font-normal text-muted-foreground/60">/100</span></p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="relative space-y-2.5">
                <MiniBar label="Конверсия" value={conversionRate} color="primary" />
                <MiniBar label="Резервации" value={bookingRate} color="success" />
                <MiniBar label="Използване" value={Math.min(Math.round(usagePercent), 100)} color="blue" />
              </div>
            </div>

            {/* Plan card */}
            <div className="rounded-2xl border border-border/10 bg-card/60 p-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent pointer-events-none" />
              <div className="relative flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground">{tierName}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={onManageSubscription} disabled={portalLoading} className="text-[10px] h-7 px-2 text-muted-foreground hover:text-foreground">
                  {portalLoading ? '...' : 'Управление'}
                </Button>
              </div>
              <div className="relative">
                <div className="flex justify-between mb-1.5">
                  <span className="text-[10px] text-muted-foreground">{formatUsageMinutes(usedMinutes)} мин</span>
                  <span className="text-[10px] text-muted-foreground">{planLimit} мин</span>
                </div>
                <Progress value={Math.min(usagePercent, 100)} className="h-2" />
                {usagePercent > 80 && (
                  <p className="text-[9px] text-[hsl(var(--neo-warning))] font-medium mt-1 animate-pulse">
                    {usagePercent >= 100 ? 'Лимитът е достигнат' : 'Почти пълно'}
                  </p>
                )}
              </div>
              {subscriptionEnd && (
                <p className="relative text-[9px] text-muted-foreground/60 mt-2">
                  Активен до {new Date(subscriptionEnd).toLocaleDateString('bg-BG')}
                </p>
              )}
            </div>
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
    <motion.div custom={i} initial="hidden" animate="visible" variants={fadeUp}>
      <div className="rounded-2xl border border-border/10 bg-card/60 p-3.5 sm:p-4 relative overflow-hidden h-full group hover:border-primary/15 transition-colors">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent pointer-events-none" />
        <div className="relative flex items-center justify-between mb-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/8 flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <span className={`text-[9px] sm:text-[10px] font-medium px-1.5 py-0.5 rounded-md ${positive ? 'text-[hsl(var(--neo-success))] bg-[hsl(var(--neo-success))]/10' : 'text-muted-foreground bg-muted/30'}`}>
            {change}
          </span>
        </div>
        <p className="relative text-xl sm:text-2xl font-black text-foreground tracking-tight leading-none">{value}</p>
        <p className="relative text-[10px] sm:text-[11px] text-muted-foreground/70 mt-1">{label}</p>
      </div>
    </motion.div>
  );
}

function MiniBar({ label, value, color }: { label: string; value: number; color: 'primary' | 'success' | 'blue' }) {
  const colorMap = {
    primary: 'bg-primary',
    success: 'bg-[hsl(var(--neo-success))]',
    blue: 'bg-[hsl(var(--neo-blue))]',
  };
  const pillColorMap = {
    primary: 'bg-primary/15 text-primary',
    success: 'bg-[hsl(var(--neo-success))]/15 text-[hsl(var(--neo-success))]',
    blue: 'bg-[hsl(var(--neo-blue))]/15 text-[hsl(var(--neo-blue))]',
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pillColorMap[color]}`}>{value}%</span>
      </div>
      <div className="h-2.5 rounded-lg bg-muted/20 overflow-hidden flex">
        <div className={`h-full rounded-lg ${colorMap[color]} transition-all duration-700`} style={{ width: `${Math.max(4, Math.min(value, 100))}%` }} />
      </div>
    </div>
  );
}

export default DashboardHome;
