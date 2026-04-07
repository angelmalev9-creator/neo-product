import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Crown, Zap, ArrowRight,
  BarChart3,
  MessageCircle, UserCheck, CalendarCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
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
  const analysisSignals = [
    { label: 'Колко клиенти печелите', value: conversionRate, helper: `${totalLeads} от ${totalConversations} обаждания`, tone: 'primary' as const },
    { label: 'Колко резервации правите', value: bookingRate, helper: `${totalBookings} запазени часове`, tone: 'blue' as const },
    { label: 'Изразходвани минути', value: Math.min(Math.round(usagePercent), 100), helper: `${formatUsageMinutes(usedMinutes)} от ${planLimit} мин`, tone: 'success' as const },
  ];

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden overscroll-y-contain">
      <div className="p-3 sm:p-4 lg:p-5 space-y-3 sm:space-y-4">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-foreground">Добре дошли!</h1>
            <p className="text-[11px] sm:text-xs text-muted-foreground">Какво се случва с NEO</p>
          </div>
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold border ${isActive ? 'bg-[hsl(var(--neo-success))]/10 border-[hsl(var(--neo-success))]/25 text-[hsl(var(--neo-success))]' : 'bg-muted/50 border-border/20 text-muted-foreground'}`}
          >
            <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isActive ? 'bg-[hsl(var(--neo-success))] animate-pulse' : 'bg-muted-foreground/50'}`} />
            {isActive ? 'Online' : 'Offline'}
          </motion.span>
        </motion.div>

        {/* Stat cards — 2 cols mobile, 4 cols desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <StatCard i={0} icon={MessageCircle} label="Обаждания днес" value={statsLoading ? '—' : String(todayConversations)} subLabel={`${totalConversations} общо`} color="primary" />
          <StatCard i={1} icon={UserCheck} label="Нови клиенти" value={statsLoading ? '—' : String(todayClients)} subLabel={`${conversionRate}% конверсия`} color="success" />
          <StatCard i={2} icon={CalendarCheck} label="Резервации" value={statsLoading ? '—' : String(todayBookings)} subLabel={`${totalBookings} общо`} color="blue" />

          {/* Plan card */}
          <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp}>
            <div className="rounded-xl sm:rounded-2xl border border-border/10 bg-card/60 p-3 sm:p-4 flex flex-col justify-between relative overflow-hidden h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              <div className="relative flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                  <span className="text-[10px] sm:text-[11px] font-semibold text-primary">{tierName}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={onManageSubscription} disabled={portalLoading} className="text-[9px] sm:text-[10px] h-5 sm:h-6 px-1.5 sm:px-2">
                  {portalLoading ? '...' : 'Управление'}
                </Button>
              </div>
              <div className="relative">
                <Progress value={Math.min(usagePercent, 100)} className="h-1 sm:h-1.5" />
                <div className="flex justify-between mt-1">
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground">{formatUsageMinutes(usedMinutes)}/{planLimit} мин</p>
                  {usagePercent > 80 && (
                    <span className="text-[8px] sm:text-[9px] text-[hsl(var(--neo-warning))] font-medium animate-pulse">
                      {usagePercent >= 100 ? 'Лимит!' : 'Почти пълно'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Chart + Right panel — stacked on mobile, side-by-side on lg */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="lg:col-span-3 rounded-xl sm:rounded-2xl border border-border/10 bg-card/60 p-3 sm:p-4 flex flex-col relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent pointer-events-none" />
            {/* Chart header */}
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between mb-2 sm:mb-3 gap-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                <h2 className="text-[11px] sm:text-xs font-semibold text-foreground">Активност</h2>
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[8px] sm:text-[9px] text-primary font-medium">Live</span>
                </div>
              </div>
              <div className="flex items-center gap-0.5 sm:gap-1">
                {(Object.keys(TIME_FILTER_LABELS) as TimeFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => { setChartFilter(f); fetchChartData(f); }}
                    className={`text-[9px] sm:text-[10px] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full transition-all ${
                      chartFilter === f
                        ? 'bg-primary text-primary-foreground font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                    }`}
                  >
                    {TIME_FILTER_LABELS[f]}
                  </button>
                ))}
              </div>
            </div>
            {/* Legend */}
            <div className="relative flex items-center gap-3 mb-2">
              <div className="flex items-center gap-1 text-[8px] sm:text-[9px] text-muted-foreground">
                <div className="w-2 h-2 rounded-sm bg-primary" /> Обаждания
              </div>
              <div className="flex items-center gap-1 text-[8px] sm:text-[9px] text-muted-foreground">
                <div className="w-2 h-2 rounded-sm bg-[hsl(var(--neo-success))]" /> Клиенти
              </div>
            </div>
            {/* Chart area */}
            <div className="relative h-[180px] sm:h-[220px] lg:h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.15} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} interval={chartFilter === 'today' ? 3 : chartFilter === 'month' || chartFilter === 'last_month' ? 4 : 0} />
                  <YAxis hide allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 11, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number, name: string) => [value, name === 'conversations' ? 'Обаждания' : 'Нови клиенти']}
                    cursor={{ fill: 'hsl(var(--primary) / 0.05)' }}
                  />
                  <Bar dataKey="conversations" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={20} />
                  <Bar dataKey="clients" fill="hsl(var(--neo-success))" radius={[4, 4, 0, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Right panel */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="lg:col-span-2 flex flex-col gap-3"
          >
            {/* Score + Insights */}
            <div className="rounded-xl sm:rounded-2xl border border-border/10 bg-card/60 p-3 sm:p-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] via-transparent to-transparent pointer-events-none" />
              <div className="relative mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] sm:text-[11px] uppercase tracking-widest text-muted-foreground">Ефективност</p>
                  <h3 className="text-xs sm:text-sm font-semibold text-foreground">Как се справя NEO?</h3>
                </div>
                <div className="rounded-lg sm:rounded-xl border border-primary/20 bg-primary/10 px-2.5 sm:px-3 py-1.5 sm:py-2 text-right shrink-0">
                  <div className="text-base sm:text-lg font-black text-primary leading-none">{automationScore}</div>
                  <div className="mt-0.5 text-[8px] sm:text-[9px] uppercase tracking-widest text-primary/80">Score</div>
                </div>
              </div>
              <div className="relative space-y-2 sm:space-y-3">
                {analysisSignals.map((signal) => (
                  <InsightBar key={signal.label} label={signal.label} value={signal.value} helper={signal.helper} tone={signal.tone} />
                ))}
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  );
};

/* ── Sub-components ── */

function StatCard({ i, icon: Icon, label, value, subLabel }: {
  i: number; icon: React.ElementType; label: string; value: string; subLabel: string; color: 'primary' | 'success' | 'blue';
}) {
  return (
    <motion.div custom={i} initial="hidden" animate="visible" variants={fadeUp}>
      <div className="rounded-xl sm:rounded-2xl border border-border/10 bg-card/60 p-3 sm:p-4 relative overflow-hidden h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] to-transparent pointer-events-none" />
        <div className="relative flex items-center gap-2 mb-1.5 sm:mb-2">
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-primary/12 flex items-center justify-center border border-primary/10">
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          </div>
        </div>
        <p className="relative text-xl sm:text-2xl font-black text-foreground tracking-tight">{value}</p>
        <p className="relative text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">{label}</p>
        <p className="relative text-[8px] sm:text-[9px] text-muted-foreground/60 mt-0.5">{subLabel}</p>
      </div>
    </motion.div>
  );
}


function InsightBar({ label, value, helper, tone }: {
  label: string; value: number; helper: string; tone: 'primary' | 'success' | 'blue';
}) {
  const toneMap = {
    primary: 'bg-primary',
    success: 'bg-[hsl(var(--neo-success))]',
    blue: 'bg-[hsl(var(--neo-blue))]',
  };

  return (
    <div className="rounded-lg sm:rounded-xl border border-border/10 bg-background/25 p-2.5 sm:p-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[10px] sm:text-[11px] text-foreground">{label}</span>
        <span className="text-[10px] sm:text-[11px] text-muted-foreground">{value}%</span>
      </div>
      <div className="h-1.5 sm:h-2 overflow-hidden rounded-full bg-muted/60">
        <div className={`h-full rounded-full ${toneMap[tone]} transition-all duration-500`} style={{ width: `${Math.max(6, Math.min(value, 100))}%` }} />
      </div>
      <p className="mt-1 text-[9px] sm:text-[10px] text-muted-foreground">{helper}</p>
    </div>
  );
}

export default DashboardHome;
