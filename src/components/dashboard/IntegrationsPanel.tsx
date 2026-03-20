import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Mail, Calendar, CheckCircle, Loader2 } from 'lucide-react';
import CalendarAutomation from './CalendarAutomation';

const IntegrationsPanel = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState<string | null>(null);
  const [emailEnabled, setEmailEnabled] = useState(false);

  const [calendarEnabled, setCalendarEnabled] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const gmailCb = urlParams.get('gmail_callback');

    if (code && gmailCb) {
      handleGmailCallback(code);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      loadAll();
    }
  }, []);

  const loadAll = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [emailRes, calRes] = await Promise.all([
        supabase.from('email_settings').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('calendar_settings').select('calendar_enabled').eq('user_id', user.id).maybeSingle(),
      ]);

      if (emailRes.data) {
        setGmailConnected(emailRes.data.gmail_connected || false);
        setGmailEmail(emailRes.data.gmail_email);
        setEmailEnabled(emailRes.data.email_enabled || false);
      }
      if (calRes.data) {
        setCalendarEnabled(calRes.data.calendar_enabled || false);
      }
    } catch (e) {
      console.error('Load integrations error:', e);
    } finally {
      setLoading(false);
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
      calendar_connected: true,
      calendar_enabled: checked,
      auto_book_after_conversation: true,
    } as any, { onConflict: 'user_id' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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

      {/* Calendar Integration - Toggle style */}
      <div className="rounded-xl border border-border/30 bg-card/30 overflow-hidden">
        <div className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-foreground">Календар</h4>
            <p className="text-xs text-muted-foreground">
              {calendarEnabled
                ? 'NEO записва консултации / резервации / срещи автоматично'
                : 'Включете за да може NEO да записва клиенти в календара'
              }
            </p>
          </div>
          <Switch checked={calendarEnabled} onCheckedChange={toggleCalendar} />
        </div>
      </div>

      {/* Calendar Settings - shown when enabled */}
      {calendarEnabled && <CalendarAutomation />}
    </div>
  );
};

export default IntegrationsPanel;
