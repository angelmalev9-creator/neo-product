import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Crown, Globe, CalendarDays, Mic, MessageSquare, Users, CalendarCheck,
  CheckCircle2, Circle, Zap, ArrowRight, TrendingUp, Clock, Activity,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Area, AreaChart } from 'recharts';

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

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

function getLast7Days() {
  const days: { date: string; label: string; dayStart: string; dayEnd: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
    const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).toISOString();
    const dow = d.getDay();
    const label = WEEKDAY_LABELS[dow === 0 ? 6 : dow - 1];
    days.push({ date: dateStr, label, dayStart, dayEnd });
  }
  return days;
}

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

  const getTodayStart = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
  };

  const fetchTodayStats = async () => {
    if (!userId) return;
    const todayStart = getTodayStart();

    const [convRes, clientConvRes, bookingsRes, totalConvRes, totalClientConvRes] = await Promise.all([
      supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', todayStart),
      // Нови клиенти = разговори с lead_captured=true (всеки разговор = макс 1 клиент)
      supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('lead_captured', true).gte('created_at', todayStart),
      supabase.from('calendar_bookings').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', todayStart),
      supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('lead_captured', true),
    ]);

    setTodayConversations(convRes.count ?? 0);
    setTodayClients(clientConvRes.count ?? 0);
    setTodayBookings(bookingsRes.count ?? 0);
    setTotalConversations(totalConvRes.count ?? 0);
    setTotalLeads(totalClientConvRes.count ?? 0);
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

    const result = days.map(day => {
      const convCount = convos.filter(c => c.created_at >= day.dayStart && c.created_at < day.dayEnd).length;
      const clientCount = clientConvos.filter(c => c.created_at >= day.dayStart && c.created_at < day.dayEnd).length;
      return { label: day.label, conversations: convCount, clients: clientCount };
    });

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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'captured_leads', filter: `user_id=eq.${userId}` }, () => {
        setTodayClients(prev => prev + 1);
        setTotalLeads(prev => prev + 1);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'calendar_bookings', filter: `user_id=eq.${userId}` }, () => {
        setTodayClients(prev => prev + 1);
        setTodayBookings(prev => prev + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, subscribed]);

  if (!subscribed) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-foreground">Добре дошли в NEO</h1>
        <div className="rounded-2xl border border-border/10 bg-card/50 p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Активирайте NEO</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Изберете план, за да получите достъп до AI асистента, който работи 24/7 на вашия сайт.
          </p>
          <Button onClick={() => navigate('/#pricing')} className="gap-2">
            Разгледайте плановете <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Начало</h1>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-neo-success/10 text-[hsl(var(--neo-success))]' : 'bg-muted text-muted-foreground'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[hsl(var(--neo-success))]' : 'bg-muted-foreground'}`} />
            {isActive ? 'NEO активен' : 'NEO неактивен'}
          </span>
        </div>
      </div>

      {/* Plan + Usage row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border/10 bg-card/50 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">{tierName}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onManageSubscription} disabled={portalLoading} className="text-xs h-7">
              {portalLoading ? '...' : 'Управление'}
            </Button>
          </div>
          {subscriptionEnd && (
            <p className="text-xs text-muted-foreground">
              Активен до {new Date(subscriptionEnd).toLocaleDateString('bg-BG')}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-border/10 bg-card/50 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Използвани минути</span>
            <span className="text-sm font-bold text-foreground">{usedMinutes.toFixed(1)} / {planLimit}</span>
          </div>
          <Progress value={Math.min(usagePercent, 100)} className="h-2" />
          {usagePercent > 80 && (
            <p className="text-[11px] text-[hsl(var(--neo-warning))]">Остават малко минути</p>
          )}
        </div>
      </div>

      {/* Live stats */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Днешни резултати</h2>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] text-primary font-medium">Live</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <LiveStatCard icon={MessageSquare} label="Разговори" value={statsLoading ? '—' : String(todayConversations)} color="text-primary" />
          <LiveStatCard icon={Users} label="Нови клиенти" value={statsLoading ? '—' : String(todayClients)} color="text-[hsl(var(--neo-success))]" subtitle="Запитвания + Резервации" />
          <LiveStatCard icon={CalendarCheck} label="Резервации" value={statsLoading ? '—' : String(todayBookings)} color="text-[hsl(var(--neo-blue))]" />
        </div>
      </div>

      {/* Totals row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStat icon={Activity} label="Общо разговори" value={String(totalConversations)} />
        <MiniStat icon={Users} label="Общо клиенти" value={String(totalLeads)} />
        <MiniStat icon={Clock} label="Минути" value={`${usedMinutes.toFixed(0)}`} />
        <MiniStat icon={TrendingUp} label="Конверсия" value={totalConversations > 0 ? `${Math.round((totalLeads / totalConversations) * 100)}%` : '—'} />
      </div>

      {/* Weekly bar chart */}
      {weekData.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">Седмичен преглед</h2>
          <div className="rounded-2xl border border-border/10 bg-card/50 p-4">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weekData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis hide allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number, name: string) => [value, name === 'conversations' ? 'Разговори' : 'Нови клиенти']}
                />
                <Bar dataKey="conversations" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={28} />
                <Bar dataKey="clients" fill="hsl(var(--neo-success, 142 71% 45%))" radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-sm bg-primary" /> Разговори
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-sm bg-[hsl(142,71%,45%)]" /> Нови клиенти
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action cards */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">Бързи действия</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ActionCard icon={Globe} title="Добави сайт" description={websiteUrl ? `Свързан: ${websiteUrl}` : 'Въведи URL на сайта си'} done={!!websiteUrl} onClick={() => onTabChange('setup-website')} />
          <ActionCard icon={CalendarDays} title="Свържи календар" description={calendarConnected ? 'Календарът е свързан' : 'Автоматични резервации'} done={calendarConnected} onClick={() => onTabChange('setup-calendar')} />
          <ActionCard icon={Mic} title="Тествай NEO" description={hasTestedNeo ? 'Тестван е' : 'Чуй как звучи NEO'} done={hasTestedNeo} onClick={() => onTabChange('neo-test')} />
        </div>
      </div>
    </div>
  );
};

function LiveStatCard({ icon: Icon, label, value, color, subtitle }: { icon: React.ElementType; label: string; value: string; color: string; subtitle?: string }) {
  return (
    <div className="rounded-2xl border border-border/10 bg-card/50 p-4 space-y-2 relative overflow-hidden group hover:border-border/30 transition-colors">
      <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-primary/3 blur-2xl group-hover:bg-primary/5 transition-colors" />
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
      </div>
      <p className="text-2xl font-black text-foreground tracking-tight">{value}</p>
      {subtitle && <p className="text-[9px] text-muted-foreground/60">{subtitle}</p>}
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/10 bg-card/30 p-3 flex items-center gap-3">
      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-bold text-foreground">{value}</p>
        <p className="text-[10px] text-muted-foreground truncate">{label}</p>
      </div>
    </div>
  );
}

function ActionCard({ icon: Icon, title, description, done, onClick }: {
  icon: React.ElementType; title: string; description: string; done: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className="group rounded-2xl border border-border/10 bg-card/50 p-5 text-left hover:bg-card/80 hover:border-primary/20 transition-all duration-200 space-y-3">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        {done ? <CheckCircle2 className="w-4 h-4 text-[hsl(var(--neo-success))]" /> : <Circle className="w-4 h-4 text-muted-foreground/30" />}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{description}</p>
      </div>
    </button>
  );
}

export default DashboardHome;
