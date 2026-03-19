import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Settings, CheckCircle, AlertCircle, Loader2, Clock, CalendarDays } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface CalendarSettings {
  id?: string;
  calendar_connected: boolean;
  calendar_email: string | null;
  calendar_enabled: boolean;
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
    calendar_connected: false,
    calendar_email: null,
    calendar_enabled: false,
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
    // Check for OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const calendarCallback = urlParams.get('calendar_callback');
    
    if (code && calendarCallback) {
      handleOAuthCallback(code);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      loadSettings();
    }
    loadBookings();
  }, []);

  const handleOAuthCallback = async (code: string) => {
    setLoading(true);
    try {
      const redirectUri = `${window.location.origin}/dashboard?calendar_callback=true`;
      
      const { data, error } = await supabase.functions.invoke('calendar-oauth', {
        body: { 
          action: 'exchange-code',
          code,
          redirectUri 
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: 'Google Calendar свързан успешно!',
          description: `Акаунтът ${data.email} е свързан.`,
        });
        setSettings(prev => ({
          ...prev,
          calendar_connected: true,
          calendar_email: data.email,
        }));
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      toast({
        title: 'Грешка',
        description: 'Неуспешно свързване с Google Calendar.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      loadSettings();
    }
  };

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
          calendar_connected: data.calendar_connected || false,
          calendar_email: data.calendar_email,
          calendar_enabled: data.calendar_enabled || false,
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
        .order('event_start', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading bookings:', error);
        return;
      }

      setBookings(data || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const settingsData = {
        user_id: user.id,
        calendar_connected: settings.calendar_connected,
        calendar_email: settings.calendar_email,
        calendar_enabled: settings.calendar_enabled,
        auto_book_after_conversation: settings.auto_book_after_conversation,
        default_meeting_duration: settings.default_meeting_duration,
        booking_buffer_minutes: settings.booking_buffer_minutes,
        working_hours_start: settings.working_hours_start,
        working_hours_end: settings.working_hours_end,
        working_days: settings.working_days,
        meeting_title_template: settings.meeting_title_template,
        meeting_description_template: settings.meeting_description_template,
      };

      const { error } = await supabase
        .from('calendar_settings')
        .upsert(settingsData, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: 'Настройките са запазени',
        description: 'Календарната автоматизация е конфигурирана успешно.',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Грешка',
        description: 'Неуспешно запазване на настройките.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const connectCalendar = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Грешка',
          description: 'Моля, влезте в акаунта си.',
          variant: 'destructive',
        });
        return;
      }

      const redirectUri = `${window.location.origin}/dashboard?calendar_callback=true`;
      
      const { data, error } = await supabase.functions.invoke('calendar-oauth', {
        body: { 
          action: 'get-auth-url',
          redirectUri 
        },
      });

      if (error) throw error;

      if (data?.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Error connecting Calendar:', error);
      toast({
        title: 'Грешка',
        description: 'Неуспешно свързване с Google Calendar. Моля, опитайте отново.',
        variant: 'destructive',
      });
    }
  };

  const disconnectCalendar = async () => {
    try {
      const { error } = await supabase.functions.invoke('calendar-oauth', {
        body: { action: 'disconnect' },
      });

      if (error) throw error;

      setSettings(prev => ({
        ...prev,
        calendar_connected: false,
        calendar_email: null,
        calendar_enabled: false,
      }));

      toast({
        title: 'Calendar изключен',
        description: 'Връзката с Google Calendar е прекъсната.',
      });
    } catch (error) {
      console.error('Error disconnecting Calendar:', error);
      toast({
        title: 'Грешка',
        description: 'Неуспешно прекъсване на връзката.',
        variant: 'destructive',
      });
    }
  };

  const toggleWorkingDay = (day: number) => {
    setSettings(prev => ({
      ...prev,
      working_days: prev.working_days.includes(day)
        ? prev.working_days.filter(d => d !== day)
        : [...prev.working_days, day].sort((a, b) => a - b),
    }));
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('bg-BG', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calendar Connection */}
      <Card className="neo-glass-subtle border-border/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Google Calendar акаунт
          </CardTitle>
          <CardDescription>
            Свържете Google Calendar акаунта си, за да може NEO да записва срещи автоматично
          </CardDescription>
        </CardHeader>
        <CardContent>
          {settings.calendar_connected ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-neo-success" />
                <div>
                  <p className="font-medium">{settings.calendar_email}</p>
                  <p className="text-sm text-muted-foreground">Свързан акаунт</p>
                </div>
              </div>
              <Button variant="outline" onClick={disconnectCalendar}>
                Прекъсни връзката
              </Button>
            </div>
          ) : (
            <Button onClick={connectCalendar} className="w-full sm:w-auto">
              <Calendar className="w-4 h-4 mr-2" />
              Свържи Google Calendar
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Automation Settings */}
      <Card className="neo-glass-subtle border-border/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Настройки за автоматизация
          </CardTitle>
          <CardDescription>
            Конфигурирайте как NEO да управлява календара ви
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Master Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              <CalendarDays className="w-5 h-5 text-neo-warning" />
              <div>
                <p className="font-medium">Активирай календарна автоматизация</p>
                <p className="text-sm text-muted-foreground">Включете, за да може NEO да записва срещи</p>
              </div>
            </div>
            <Switch
              checked={settings.calendar_enabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, calendar_enabled: checked }))}
              disabled={!settings.calendar_connected}
            />
          </div>

          {!settings.calendar_connected && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-neo-warning/10 text-neo-warning text-sm">
              <AlertCircle className="w-4 h-4" />
              Първо свържете Google Calendar акаунта си, за да активирате автоматизацията
            </div>
          )}

          {/* Auto-book Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>Автоматично записване след разговор</span>
            </div>
            <Switch
              checked={settings.auto_book_after_conversation}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, auto_book_after_conversation: checked }))}
              disabled={!settings.calendar_enabled}
            />
          </div>

          {/* Meeting Duration */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="duration">Продължителност на срещата (минути)</Label>
              <Input
                id="duration"
                type="number"
                value={settings.default_meeting_duration}
                onChange={(e) => setSettings(prev => ({ ...prev, default_meeting_duration: parseInt(e.target.value) || 30 }))}
                min={15}
                max={120}
                disabled={!settings.calendar_enabled}
              />
            </div>
            <div>
              <Label htmlFor="buffer">Буфер между срещите (минути)</Label>
              <Input
                id="buffer"
                type="number"
                value={settings.booking_buffer_minutes}
                onChange={(e) => setSettings(prev => ({ ...prev, booking_buffer_minutes: parseInt(e.target.value) || 15 }))}
                min={0}
                max={60}
                disabled={!settings.calendar_enabled}
              />
            </div>
          </div>

          {/* Working Hours */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="start-time">Начало на работния ден</Label>
              <Input
                id="start-time"
                type="time"
                value={settings.working_hours_start}
                onChange={(e) => setSettings(prev => ({ ...prev, working_hours_start: e.target.value }))}
                disabled={!settings.calendar_enabled}
              />
            </div>
            <div>
              <Label htmlFor="end-time">Край на работния ден</Label>
              <Input
                id="end-time"
                type="time"
                value={settings.working_hours_end}
                onChange={(e) => setSettings(prev => ({ ...prev, working_hours_end: e.target.value }))}
                disabled={!settings.calendar_enabled}
              />
            </div>
          </div>

          {/* Working Days */}
          <div>
            <Label className="mb-3 block">Работни дни</Label>
            <div className="flex flex-wrap gap-3">
              {WEEKDAYS.map((day) => (
                <label
                  key={day.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={settings.working_days.includes(day.value)}
                    onCheckedChange={() => toggleWorkingDay(day.value)}
                    disabled={!settings.calendar_enabled}
                  />
                  <span className="text-sm">{day.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Templates */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title-template">Заглавие на събитието</Label>
              <Input
                id="title-template"
                value={settings.meeting_title_template}
                onChange={(e) => setSettings(prev => ({ ...prev, meeting_title_template: e.target.value }))}
                placeholder="Среща с {{lead_name}} - {{company_name}}"
                disabled={!settings.calendar_enabled}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Използвайте {'{{lead_name}}'}, {'{{company_name}}'}, {'{{lead_email}}'} за персонализация
              </p>
            </div>
          </div>

          <Button onClick={saveSettings} disabled={saving} className="w-full">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Запази настройките
          </Button>
        </CardContent>
      </Card>

      {/* Recent Bookings */}
      <Card className="neo-glass-subtle border-border/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Последни записани срещи
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Все още няма записани срещи
            </p>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/20"
                >
                  <div>
                    <p className="font-medium">{booking.event_title}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.attendee_name || booking.attendee_email || 'Без участник'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{formatDateTime(booking.event_start)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      booking.status === 'scheduled' 
                        ? 'bg-neo-success/20 text-neo-success' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {booking.status === 'scheduled' ? 'Планирана' : booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarAutomation;
