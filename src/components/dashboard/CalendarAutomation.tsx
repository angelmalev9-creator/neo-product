import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { Settings, CheckCircle, Loader2, Clock, ChevronDown, ChevronLeft, ChevronRight, Trash2, User } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface CalendarSettings {
  id?: string;
  calendar_enabled: boolean;
  booking_type: string;
  auto_book_after_conversation: boolean;
  default_meeting_duration: number;
  booking_buffer_minutes: number;
  working_hours_start: string;
  working_hours_end: string;
  working_days: number[];
  meeting_title_template: string;
  meeting_description_template: string;
}

interface CalendarBooking {
  id: string;
  event_title: string;
  event_start: string;
  event_end: string;
  attendee_email: string | null;
  attendee_name: string | null;
  status: string;
  created_at: string;
}

const WEEKDAYS = [
  { value: 1, label: 'Пн' },
  { value: 2, label: 'Вт' },
  { value: 3, label: 'Ср' },
  { value: 4, label: 'Чт' },
  { value: 5, label: 'Пт' },
  { value: 6, label: 'Сб' },
  { value: 0, label: 'Нд' },
];

const MONTH_NAMES = ['Януари', 'Февруари', 'Март', 'Април', 'Май', 'Юни', 'Юли', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември'];
const DAY_HEADERS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

const CalendarAutomation = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<CalendarSettings>({
    calendar_enabled: false,
    booking_type: 'consultation',
    auto_book_after_conversation: true,
    default_meeting_duration: 30,
    booking_buffer_minutes: 15,
    working_hours_start: '09:00',
    working_hours_end: '18:00',
    working_days: [1, 2, 3, 4, 5],
    meeting_title_template: 'Среща с {{lead_name}} - {{company_name}}',
    meeting_description_template: '',
  });
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadSettings();
    loadBookings();
  }, []);

  useEffect(() => {
    loadBookings();
  }, [calendarMonth]);

  // Real-time subscription for new bookings
  useEffect(() => {
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const channel = supabase
        .channel('calendar-bookings-realtime')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'calendar_bookings',
          filter: `user_id=eq.${user.id}`,
        }, () => {
          loadBookings();
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    };
    const cleanup = setupRealtime();
    return () => { cleanup.then(fn => fn?.()); };
  }, [calendarMonth]);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('calendar_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setSettings({
          id: data.id,
          calendar_enabled: data.calendar_enabled || false,
          booking_type: (data as any).booking_type || 'consultation',
          auto_book_after_conversation: data.auto_book_after_conversation ?? true,
          default_meeting_duration: data.default_meeting_duration || 30,
          booking_buffer_minutes: data.booking_buffer_minutes || 15,
          working_hours_start: data.working_hours_start || '09:00',
          working_hours_end: data.working_hours_end || '18:00',
          working_days: data.working_days || [1, 2, 3, 4, 5],
          meeting_title_template: data.meeting_title_template || settings.meeting_title_template,
          meeting_description_template: data.meeting_description_template || '',
        });
      }
    } catch (e) {
      console.error('Error loading settings:', e);
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
      setBookings((data || []) as CalendarBooking[]);
    } catch (e) {
      console.error('Error loading bookings:', e);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from('calendar_settings').upsert({
        user_id: user.id,
        calendar_enabled: settings.calendar_enabled,
        booking_type: settings.booking_type,
        calendar_connected: true,
        auto_book_after_conversation: settings.auto_book_after_conversation,
        default_meeting_duration: settings.default_meeting_duration,
        booking_buffer_minutes: settings.booking_buffer_minutes,
        working_hours_start: settings.working_hours_start,
        working_hours_end: settings.working_hours_end,
        working_days: settings.working_days,
        meeting_title_template: settings.meeting_title_template,
        meeting_description_template: settings.meeting_description_template,
      } as any, { onConflict: 'user_id' });
      if (error) throw error;
      toast({ title: 'Настройките са запазени!' });
      setSettingsOpen(false);
    } catch {
      toast({ title: 'Грешка', description: 'Неуспешно запазване.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase.from('calendar_bookings').update({ status: 'cancelled' }).eq('id', bookingId);
      if (error) throw error;
      toast({ title: 'Записът е отменен.' });
      loadBookings();
    } catch {
      toast({ title: 'Грешка', variant: 'destructive' });
    }
  };

  const toggleWorkingDay = (day: number) => {
    setSettings(prev => ({
      ...prev,
      working_days: prev.working_days.includes(day)
        ? prev.working_days.filter(d => d !== day)
        : [...prev.working_days, day].sort(),
    }));
  };

  const bookingLabel = settings.booking_type === 'reservation' ? 'Резервация' : settings.booking_type === 'meeting' ? 'Среща' : 'Консултация';
  const bookingLabelPlural = settings.booking_type === 'reservation' ? 'Резервации' : settings.booking_type === 'meeting' ? 'Срещи' : 'Консултации';

  // Calendar helpers
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1;
  };
  const getBookingsForDate = (day: number) => {
    return bookings.filter(b => {
      const d = new Date(b.event_start);
      return d.getDate() === day && d.getMonth() === calendarMonth.getMonth() && d.getFullYear() === calendarMonth.getFullYear() && b.status !== 'cancelled';
    });
  };
  const isToday = (day: number) => {
    const now = new Date();
    return day === now.getDate() && calendarMonth.getMonth() === now.getMonth() && calendarMonth.getFullYear() === now.getFullYear();
  };
  const isSelected = (day: number) => {
    return day === selectedDate.getDate() && calendarMonth.getMonth() === selectedDate.getMonth() && calendarMonth.getFullYear() === selectedDate.getFullYear();
  };

  const selectedDayBookings = getBookingsForDate(selectedDate.getDate()).filter(() => {
    return selectedDate.getMonth() === calendarMonth.getMonth() && selectedDate.getFullYear() === calendarMonth.getFullYear();
  });

  const upcomingBookings = bookings.filter(b => b.status !== 'cancelled' && new Date(b.event_start) >= new Date());

  if (loading) {
    return <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  const daysInMonth = getDaysInMonth(calendarMonth);
  const firstDay = getFirstDayOfMonth(calendarMonth);

  return (
    <div className="space-y-4">
      {/* Collapsible Settings */}
      <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-4 rounded-xl border border-border/30 bg-card/30 hover:bg-card/50 transition-colors">
            <div className="flex items-center gap-3">
              <Settings className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Настройки на календара</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${settingsOpen ? 'rotate-180' : ''}`} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 p-4 rounded-xl border border-border/30 bg-card/30 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Тип записване</Label>
              <Select value={settings.booking_type} onValueChange={(v) => setSettings(prev => ({ ...prev, booking_type: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation">Консултация</SelectItem>
                  <SelectItem value="reservation">Резервация</SelectItem>
                  <SelectItem value="meeting">Среща</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">NEO ще казва &quot;{bookingLabel.toLowerCase()}&quot; в разговорите</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Продължителност (мин)</Label>
                <Input type="number" value={settings.default_meeting_duration} onChange={(e) => setSettings(prev => ({ ...prev, default_meeting_duration: parseInt(e.target.value) || 30 }))} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Буфер (мин)</Label>
                <Input type="number" value={settings.booking_buffer_minutes} onChange={(e) => setSettings(prev => ({ ...prev, booking_buffer_minutes: parseInt(e.target.value) || 15 }))} className="h-9 text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Работно време от</Label>
                <Input type="time" value={settings.working_hours_start} onChange={(e) => setSettings(prev => ({ ...prev, working_hours_start: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Работно време до</Label>
                <Input type="time" value={settings.working_hours_end} onChange={(e) => setSettings(prev => ({ ...prev, working_hours_end: e.target.value }))} className="h-9 text-sm" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Работни дни</Label>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAYS.map(day => (
                  <button
                    key={day.value}
                    onClick={() => toggleWorkingDay(day.value)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      settings.working_days.includes(day.value)
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'border-border text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <Label className="text-xs font-medium">Автоматично записване</Label>
                <p className="text-[10px] text-muted-foreground">NEO предлага часове по време на разговор</p>
              </div>
              <Switch checked={settings.auto_book_after_conversation} onCheckedChange={(checked) => setSettings(prev => ({ ...prev, auto_book_after_conversation: checked }))} />
            </div>

            <Button onClick={saveSettings} disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Запази настройки
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Calendar Grid */}
      <div className="rounded-xl border border-border/30 bg-card/30 overflow-hidden">
        <div className="p-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-semibold text-foreground">
              {MONTH_NAMES[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_HEADERS.map(d => (
              <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1.5">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e-${i}`} className="h-10" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayBookings = getBookingsForDate(day);
              const hasBookings = dayBookings.length > 0;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day))}
                  className={`h-10 rounded-lg text-xs font-medium relative transition-all ${
                    isSelected(day)
                      ? 'bg-primary text-primary-foreground shadow-sm'
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

          {/* Selected day detail */}
          <div className="mt-4 pt-4 border-t border-border/20">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              {selectedDate.toLocaleDateString('bg-BG', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            {selectedDayBookings.length === 0 ? (
              <p className="text-xs text-muted-foreground/50 py-3 text-center">Няма записи за този ден</p>
            ) : (
              <div className="space-y-2">
                {selectedDayBookings.map(b => (
                  <div key={b.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/20">
                    <Clock className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">{b.event_title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {new Date(b.event_start).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })}
                        {' – '}
                        {new Date(b.event_end).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {b.attendee_name && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3" /> {b.attendee_name}
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive shrink-0" onClick={() => cancelBooking(b.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming bookings list */}
      <div className="rounded-xl border border-border/30 bg-card/30 p-4">
        <h4 className="text-sm font-semibold text-foreground mb-3">
          Предстоящи {bookingLabelPlural.toLowerCase()} ({upcomingBookings.length})
        </h4>
        {upcomingBookings.length === 0 ? (
          <p className="text-xs text-muted-foreground/50 text-center py-4">Няма предстоящи {bookingLabelPlural.toLowerCase()}</p>
        ) : (
          <div className="space-y-2">
            {upcomingBookings.map(b => (
              <div key={b.id} className="flex items-center justify-between p-3 rounded-lg border border-border/30 bg-card/20">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{b.event_title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {new Date(b.event_start).toLocaleString('bg-BG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {b.attendee_name && (
                    <p className="text-xs text-muted-foreground mt-0.5">{b.attendee_name}{b.attendee_email ? ` · ${b.attendee_email}` : ''}</p>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 text-destructive hover:text-destructive" onClick={() => cancelBooking(b.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarAutomation;
