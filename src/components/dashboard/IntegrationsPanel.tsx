import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Mail, Calendar, CheckCircle, Loader2, Clock, User, ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarBooking {
  id: string;
  event_title: string;
  event_start: string;
  event_end: string;
  attendee_name: string | null;
  attendee_email: string | null;
  status: string | null;
}

const IntegrationsPanel = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState<string | null>(null);
  const [emailEnabled, setEmailEnabled] = useState(false);

  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarEmail, setCalendarEmail] = useState<string | null>(null);
  const [calendarEnabled, setCalendarEnabled] = useState(false);

  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const gmailCb = urlParams.get('gmail_callback');
    const calCb = urlParams.get('calendar_callback');

    if (code && gmailCb) {
      handleGmailCallback(code);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (code && calCb) {
      handleCalendarCallback(code);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      loadAll();
    }
  }, []);

  useEffect(() => {
    if (calendarConnected) loadBookings();
  }, [calendarConnected, calendarMonth]);

  const loadAll = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [emailRes, calRes] = await Promise.all([
        supabase.from('email_settings').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('calendar_settings').select('*').eq('user_id', user.id).maybeSingle(),
      ]);

      if (emailRes.data) {
        setGmailConnected(emailRes.data.gmail_connected || false);
        setGmailEmail(emailRes.data.gmail_email);
        setEmailEnabled(emailRes.data.email_enabled || false);
      }
      if (calRes.data) {
        setCalendarConnected(calRes.data.calendar_connected || false);
        setCalendarEmail(calRes.data.calendar_email);
        setCalendarEnabled(calRes.data.calendar_enabled || false);
      }
    } catch (e) {
      console.error('Load integrations error:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
      const monthEnd = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0, 23, 59, 59);

      const { data } = await supabase
        .from('calendar_bookings')
        .select('*')
        .eq('user_id', user.id)
        .gte('event_start', monthStart.toISOString())
        .lte('event_start', monthEnd.toISOString())
        .order('event_start', { ascending: true });

      setBookings(data || []);
    } catch (e) {
      console.error('Load bookings error:', e);
    }
  };

  const handleGmailCallback = async (code: string) => {
    setLoading(true);
    try {
      const redirectUri = `${window.location.origin}/dashboard?gmail_callback=true`;
      const { data, error } = await supabase.functions.invoke('gmail-oauth', {
        body: { action: 'exchange-code', code, redirectUri },
      });
      if (error) throw error;
      if (data?.success) {
        setGmailConnected(true);
        setGmailEmail(data.email);
        toast({ title: 'Gmail свързан', description: data.email });
      }
    } catch {
      toast({ title: 'Грешка', description: 'Неуспешно свързване с Gmail', variant: 'destructive' });
    } finally {
      setLoading(false);
      loadAll();
    }
  };

  const handleCalendarCallback = async (code: string) => {
    setLoading(true);
    try {
      const redirectUri = `${window.location.origin}/dashboard?calendar_callback=true`;
      const { data, error } = await supabase.functions.invoke('calendar-oauth', {
        body: { action: 'exchange-code', code, redirectUri },
      });
      if (error) throw error;
      if (data?.success) {
        setCalendarConnected(true);
        setCalendarEmail(data.email);
        toast({ title: 'Google Calendar свързан', description: data.email });
      }
    } catch {
      toast({ title: 'Грешка', description: 'Неуспешно свързване', variant: 'destructive' });
    } finally {
      setLoading(false);
      loadAll();
    }
  };

  const connectGmail = async () => {
    try {
      const redirectUri = `${window.location.origin}/dashboard?gmail_callback=true`;
      const { data, error } = await supabase.functions.invoke('gmail-oauth', {
        body: { action: 'get-auth-url', redirectUri },
      });
      if (error) throw error;
      if (data?.authUrl) window.location.href = data.authUrl;
    } catch {
      toast({ title: 'Грешка', description: 'Опитайте отново', variant: 'destructive' });
    }
  };

  const disconnectGmail = async () => {
    try {
      await supabase.functions.invoke('gmail-oauth', { body: { action: 'disconnect' } });
      setGmailConnected(false);
      setGmailEmail(null);
      setEmailEnabled(false);
      toast({ title: 'Gmail изключен' });
    } catch {
      toast({ title: 'Грешка', variant: 'destructive' });
    }
  };

  const connectCalendar = async () => {
    try {
      const redirectUri = `${window.location.origin}/dashboard?calendar_callback=true`;
      const { data, error } = await supabase.functions.invoke('calendar-oauth', {
        body: { action: 'get-auth-url', redirectUri },
      });
      if (error) throw error;
      if (data?.authUrl) window.location.href = data.authUrl;
    } catch {
      toast({ title: 'Грешка', description: 'Опитайте отново', variant: 'destructive' });
    }
  };

  const disconnectCalendar = async () => {
    try {
      await supabase.functions.invoke('calendar-oauth', { body: { action: 'disconnect' } });
      setCalendarConnected(false);
      setCalendarEmail(null);
      setCalendarEnabled(false);
      setBookings([]);
      toast({ title: 'Calendar изключен' });
    } catch {
      toast({ title: 'Грешка', variant: 'destructive' });
    }
  };

  const toggleEmail = async (checked: boolean) => {
    setEmailEnabled(checked);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('email_settings').upsert({
      user_id: user.id,
      gmail_connected: gmailConnected,
      gmail_email: gmailEmail,
      email_enabled: checked,
      send_after_conversation: true,
      send_to_qualified_leads: true,
      use_ai_personalization: true,
    }, { onConflict: 'user_id' });
  };

  const toggleCalendar = async (checked: boolean) => {
    setCalendarEnabled(checked);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('calendar_settings').upsert({
      user_id: user.id,
      calendar_connected: calendarConnected,
      calendar_email: calendarEmail,
      calendar_enabled: checked,
      auto_book_after_conversation: true,
    }, { onConflict: 'user_id' });
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1; // Monday first
  };

  const getBookingsForDate = (day: number) => {
    return bookings.filter(b => {
      const d = new Date(b.event_start);
      return d.getDate() === day && d.getMonth() === calendarMonth.getMonth() && d.getFullYear() === calendarMonth.getFullYear();
    });
  };

  const isToday = (day: number) => {
    const now = new Date();
    return day === now.getDate() && calendarMonth.getMonth() === now.getMonth() && calendarMonth.getFullYear() === now.getFullYear();
  };

  const isSelected = (day: number) => {
    return day === selectedDate.getDate() && calendarMonth.getMonth() === selectedDate.getMonth() && calendarMonth.getFullYear() === selectedDate.getFullYear();
  };

  const prevMonth = () => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  const nextMonth = () => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));

  const selectedDayBookings = getBookingsForDate(selectedDate.getDate()).filter(() => {
    return selectedDate.getMonth() === calendarMonth.getMonth() && selectedDate.getFullYear() === calendarMonth.getFullYear();
  });

  const MONTH_NAMES = ['Януари', 'Февруари', 'Март', 'Април', 'Май', 'Юни', 'Юли', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември'];
  const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const daysInMonth = getDaysInMonth(calendarMonth);
  const firstDay = getFirstDayOfMonth(calendarMonth);

  return (
    <div className="space-y-4">
      {/* Email Integration */}
      <div className="rounded-xl border border-border/30 bg-card/30 overflow-hidden">
        <div className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-foreground">Имейл</h4>
            <p className="text-xs text-muted-foreground">
              {gmailConnected
                ? `NEO изпраща имейли от ${gmailEmail}`
                : 'Свържете Gmail за автоматични имейли след разговор'
              }
            </p>
          </div>
          {gmailConnected ? (
            <div className="flex items-center gap-3">
              <Switch checked={emailEnabled} onCheckedChange={toggleEmail} />
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
          ) : (
            <Button size="sm" onClick={connectGmail} className="shrink-0">
              Свържи
            </Button>
          )}
        </div>
        {gmailConnected && (
          <div className="px-4 pb-3 border-t border-border/20 pt-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {emailEnabled ? 'NEO ще изпраща AI имейли автоматично' : 'Автоматичните имейли са изключени'}
            </span>
            <Button variant="ghost" size="sm" onClick={disconnectGmail} className="text-xs text-muted-foreground h-7">
              Изключи
            </Button>
          </div>
        )}
      </div>

      {/* Calendar Integration */}
      <div className="rounded-xl border border-border/30 bg-card/30 overflow-hidden">
        <div className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-foreground">Календар</h4>
            <p className="text-xs text-muted-foreground">
              {calendarConnected
                ? `NEO записва срещи в ${calendarEmail}`
                : 'Свържете Google Calendar за автоматични резервации'
              }
            </p>
          </div>
          {calendarConnected ? (
            <div className="flex items-center gap-3">
              <Switch checked={calendarEnabled} onCheckedChange={toggleCalendar} />
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
          ) : (
            <Button size="sm" onClick={connectCalendar} className="shrink-0">
              Свържи
            </Button>
          )}
        </div>
        {calendarConnected && (
          <div className="px-4 pb-3 border-t border-border/20 pt-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {calendarEnabled ? 'NEO ще записва срещи автоматично' : 'Автоматичните резервации са изключени'}
            </span>
            <Button variant="ghost" size="sm" onClick={disconnectCalendar} className="text-xs text-muted-foreground h-7">
              Изключи
            </Button>
          </div>
        )}
      </div>

      {/* Calendar View */}
      {calendarConnected && (
        <div className="rounded-xl border border-border/30 bg-card/30 overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-sm text-foreground">Срещи и резервации</h4>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium text-foreground min-w-[140px] text-center">
                  {MONTH_NAMES[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-px mb-1">
              {DAY_NAMES.map(d => (
                <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-9" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayBookings = getBookingsForDate(day);
                const hasBookings = dayBookings.length > 0;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day))}
                    className={`h-9 rounded-lg text-xs font-medium relative transition-colors ${
                      isSelected(day)
                        ? 'bg-primary text-primary-foreground'
                        : isToday(day)
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-muted/50 text-foreground'
                    }`}
                  >
                    {day}
                    {hasBookings && (
                      <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                        isSelected(day) ? 'bg-primary-foreground' : 'bg-primary'
                      }`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected day bookings */}
            <div className="mt-4 border-t border-border/20 pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {selectedDate.toLocaleDateString('bg-BG', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              {selectedDayBookings.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 py-3 text-center">Няма срещи за този ден</p>
              ) : (
                <div className="space-y-2">
                  {selectedDayBookings.map(booking => (
                    <div key={booking.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/20">
                      <div className="shrink-0 pt-0.5">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground">{booking.event_title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {new Date(booking.event_start).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })}
                          {' - '}
                          {new Date(booking.event_end).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {(booking.attendee_name || booking.attendee_email) && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <User className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[11px] text-muted-foreground">
                              {booking.attendee_name || booking.attendee_email}
                            </span>
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {booking.status === 'scheduled' ? 'Планирана' : booking.status || 'Планирана'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationsPanel;
