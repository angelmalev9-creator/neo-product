import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Settings, CheckCircle, Loader2, Clock, CalendarDays, Trash2 } from 'lucide-react';
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
  { value: 1, label: 'Понеделник' },
  { value: 2, label: 'Вторник' },
  { value: 3, label: 'Сряда' },
  { value: 4, label: 'Четвъртък' },
  { value: 5, label: 'Петък' },
  { value: 6, label: 'Събота' },
  { value: 0, label: 'Неделя' },
];

const CalendarAutomation = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    meeting_description_template: 'Среща с потенциален клиент {{lead_name}}.\n\nКонтакт: {{lead_email}}\nТелефон: {{lead_phone}}',
  });
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);

  useEffect(() => {
    loadSettings();
    loadBookings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('calendar_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading calendar settings:', error);
        return;
      }

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
          meeting_description_template: data.meeting_description_template || settings.meeting_description_template,
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('calendar_bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('event_start', { ascending: true })
        .limit(20);

      if (!error && data) {
        setBookings(data as CalendarBooking[]);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
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
        calendar_connected: true, // Built-in calendar is always "connected"
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
    } catch (error) {
      console.error('Save error:', error);
      toast({ title: 'Грешка', description: 'Неуспешно запазване.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('calendar_bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('bg-BG', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const bookingLabel = settings.booking_type === 'reservation' ? 'Резервация' : settings.booking_type === 'meeting' ? 'Среща' : 'Консултация';
  const bookingLabelPlural = settings.booking_type === 'reservation' ? 'Резервации' : settings.booking_type === 'meeting' ? 'Срещи' : 'Консултации';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const upcomingBookings = bookings.filter(b => b.status !== 'cancelled' && new Date(b.event_start) >= new Date());
  const pastBookings = bookings.filter(b => b.status === 'cancelled' || new Date(b.event_start) < new Date());

  return (
    <div className="space-y-6">
      {/* Enable Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Вграден календар</CardTitle>
                <CardDescription className="text-xs">NEO автоматично записва {bookingLabelPlural.toLowerCase()} от разговори</CardDescription>
              </div>
            </div>
            <Switch
              checked={settings.calendar_enabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, calendar_enabled: checked }))}
            />
          </div>
        </CardHeader>
      </Card>

      {settings.calendar_enabled && (
        <>
          {/* Booking Type */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Настройки
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Тип записване</Label>
                <Select
                  value={settings.booking_type}
                  onValueChange={(v) => setSettings(prev => ({ ...prev, booking_type: v }))}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultation">Консултация</SelectItem>
                    <SelectItem value="reservation">Резервация</SelectItem>
                    <SelectItem value="meeting">Среща</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">NEO ще казва "{bookingLabel.toLowerCase()}" в разговорите</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Продължителност (мин)</Label>
                  <Input
                    type="number"
                    value={settings.default_meeting_duration}
                    onChange={(e) => setSettings(prev => ({ ...prev, default_meeting_duration: parseInt(e.target.value) || 30 }))}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Буфер между записи (мин)</Label>
                  <Input
                    type="number"
                    value={settings.booking_buffer_minutes}
                    onChange={(e) => setSettings(prev => ({ ...prev, booking_buffer_minutes: parseInt(e.target.value) || 15 }))}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Работно време от</Label>
                  <Input
                    type="time"
                    value={settings.working_hours_start}
                    onChange={(e) => setSettings(prev => ({ ...prev, working_hours_start: e.target.value }))}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Работно време до</Label>
                  <Input
                    type="time"
                    value={settings.working_hours_end}
                    onChange={(e) => setSettings(prev => ({ ...prev, working_hours_end: e.target.value }))}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Работни дни</Label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map(day => (
                    <label
                      key={day.value}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border cursor-pointer transition-colors text-xs ${
                        settings.working_days.includes(day.value)
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        checked={settings.working_days.includes(day.value)}
                        onCheckedChange={() => toggleWorkingDay(day.value)}
                        className="hidden"
                      />
                      {day.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="text-xs font-medium">Автоматично записване</Label>
                  <p className="text-[10px] text-muted-foreground">NEO предлага часове по време на разговор</p>
                </div>
                <Switch
                  checked={settings.auto_book_after_conversation}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, auto_book_after_conversation: checked }))}
                />
              </div>

              <Button onClick={saveSettings} disabled={saving} className="w-full">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Запази настройки
              </Button>
            </CardContent>
          </Card>

          {/* Upcoming Bookings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                Предстоящи {bookingLabelPlural.toLowerCase()} ({upcomingBookings.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingBookings.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Няма предстоящи {bookingLabelPlural.toLowerCase()}</p>
              ) : (
                <div className="space-y-2">
                  {upcomingBookings.map(b => (
                    <div key={b.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{b.event_title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{formatDateTime(b.event_start)}</span>
                        </div>
                        {b.attendee_name && (
                          <p className="text-xs text-muted-foreground mt-0.5">{b.attendee_name} {b.attendee_email ? `(${b.attendee_email})` : ''}</p>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 text-destructive hover:text-destructive" onClick={() => cancelBooking(b.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Past/Cancelled */}
          {pastBookings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Минали / Отменени ({pastBookings.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {pastBookings.slice(0, 5).map(b => (
                    <div key={b.id} className="flex items-center gap-2 p-2 rounded-md text-xs text-muted-foreground">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${b.status === 'cancelled' ? 'bg-destructive' : 'bg-muted-foreground/30'}`} />
                      <span className="truncate flex-1">{b.event_title}</span>
                      <span>{formatDateTime(b.event_start)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default CalendarAutomation;
