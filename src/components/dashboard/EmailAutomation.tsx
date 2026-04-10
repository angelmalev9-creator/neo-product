import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Mail, Settings, Zap, Clock, Users, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface EmailSettings {
  id?: string;
  gmail_connected: boolean;
  gmail_email: string | null;
  email_enabled: boolean;
  send_after_conversation: boolean;
  send_to_qualified_leads: boolean;
  send_on_schedule: boolean;
  schedule_delay_minutes: number;
  email_subject_template: string;
  email_body_template: string;
  use_ai_personalization: boolean;
}

interface EmailLog {
  id: string;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  body: string;
  status: string;
  sent_at: string | null;
  created_at: string;
}

const getCompactEmailPreview = (value: string | null) => {
  const clean = String(value || '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/\*?\{[^}]*\}/g, '')
    .replace(/@media[^{]*\{[\s\S]*?\}\s*\}/gi, '')
    .replace(/@[a-z-]+[^;{]*[;{][^}]*/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/[a-z-]+\s*:\s*[^;,]{3,}[;!]\s*/gi, '')
    .replace(/!important/gi, '')
    .replace(/\.neo-[a-zA-Z0-9_-]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean || clean.length < 5) return 'Имейл изпратен към клиента';
  return clean.length > 110 ? `${clean.slice(0, 110).trim()}…` : clean;
};

const translateSubject = (subject: string) => {
  if (!subject) return 'Имейл от NEO';
  return subject
    .replace(/^NEO Lead Alert[:\s]*/i, 'Нов клиент: ')
    .replace(/New lead captured/i, 'Нов заинтересован клиент')
    .replace(/Lead notification/i, 'Уведомление за клиент')
    .replace(/Follow[\s-]?up/i, 'Последващ контакт')
    .replace(/Booking confirmation/i, 'Потвърждение на резервация')
    .replace(/through NEO/i, 'чрез NEO')
    .replace(/via NEO/i, 'чрез NEO');
};

const EmailAutomation = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<EmailSettings>({
    gmail_connected: false,
    gmail_email: null,
    email_enabled: false,
    send_after_conversation: true,
    send_to_qualified_leads: true,
    send_on_schedule: false,
    schedule_delay_minutes: 60,
    email_subject_template: 'Благодарим ви за интереса към {{company_name}}',
    email_body_template: 'Здравейте {{lead_name}},\n\nБлагодарим ви, че се свързахте с нас. Ще се радваме да отговорим на вашите въпроси.\n\nС уважение,\n{{company_name}}',
    use_ai_personalization: true,
  });
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);

  useEffect(() => {
    // Check for OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const gmailCallback = urlParams.get('gmail_callback');
    
    if (code && gmailCallback) {
      handleOAuthCallback(code);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      loadSettings();
    }
    loadEmailLogs();
  }, []);

  const handleOAuthCallback = async (code: string) => {
    setLoading(true);
    try {
      const redirectUri = `${window.location.origin}/dashboard?gmail_callback=true`;
      
      const { data, error } = await supabase.functions.invoke('gmail-oauth', {
        body: { 
          action: 'exchange-code',
          code,
          redirectUri 
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: 'Gmail свързан успешно!',
          description: `Имейлите ще се изпращат от ${data.email}.`,
        });
        setSettings(prev => ({
          ...prev,
          gmail_connected: true,
          gmail_email: data.email,
          email_enabled: true, // Auto-enable after connecting
        }));
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      toast({
        title: 'Грешка',
        description: 'Неуспешно свързване с Gmail.',
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
        .from('email_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading email settings:', error);
        return;
      }

      if (data) {
        setSettings({
          id: data.id,
          gmail_connected: data.gmail_connected || false,
          gmail_email: data.gmail_email,
          email_enabled: data.email_enabled || false,
          send_after_conversation: data.send_after_conversation ?? true,
          send_to_qualified_leads: data.send_to_qualified_leads ?? true,
          send_on_schedule: data.send_on_schedule || false,
          schedule_delay_minutes: data.schedule_delay_minutes || 60,
          email_subject_template: data.email_subject_template || settings.email_subject_template,
          email_body_template: data.email_body_template || settings.email_body_template,
          use_ai_personalization: data.use_ai_personalization ?? true,
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmailLogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading email logs:', error);
        return;
      }

      setEmailLogs(data || []);
    } catch (error) {
      console.error('Error loading email logs:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const settingsData = {
        user_id: user.id,
        gmail_connected: settings.gmail_connected,
        gmail_email: settings.gmail_email,
        email_enabled: settings.email_enabled,
        send_after_conversation: settings.send_after_conversation,
        send_to_qualified_leads: settings.send_to_qualified_leads,
        send_on_schedule: settings.send_on_schedule,
        schedule_delay_minutes: settings.schedule_delay_minutes,
        email_subject_template: settings.email_subject_template,
        email_body_template: settings.email_body_template,
        use_ai_personalization: settings.use_ai_personalization,
      };

      const { error } = await supabase
        .from('email_settings')
        .upsert(settingsData, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: 'Настройките са запазени',
        description: 'Имейл автоматизацията е конфигурирана успешно.',
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

  const connectGmail = async () => {
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

      // Get the OAuth URL from our edge function
      const redirectUri = `${window.location.origin}/dashboard?gmail_callback=true`;
      
      const { data, error } = await supabase.functions.invoke('gmail-oauth', {
        body: { 
          action: 'get-auth-url',
          redirectUri 
        },
      });

      if (error) throw error;

      if (data?.authUrl) {
        // Redirect to Google OAuth
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Error connecting Gmail:', error);
      toast({
        title: 'Грешка',
        description: 'Неуспешно свързване с Gmail. Моля, опитайте отново.',
        variant: 'destructive',
      });
    }
  };

  const disconnectGmail = async () => {
    try {
      const { error } = await supabase.functions.invoke('gmail-oauth', {
        body: { action: 'disconnect' },
      });

      if (error) throw error;

      setSettings(prev => ({
        ...prev,
        gmail_connected: false,
        gmail_email: null,
        email_enabled: false,
      }));

      toast({
        title: 'Gmail изключен',
        description: 'Връзката с Gmail акаунта е прекъсната.',
      });
    } catch (error) {
      console.error('Error disconnecting Gmail:', error);
      toast({
        title: 'Грешка',
        description: 'Неуспешно прекъсване на връзката.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Gmail Connection */}
      <Card className="neo-glass-subtle border-border/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Gmail акаунт
          </CardTitle>
          <CardDescription>
            Свържете Gmail акаунта си, за да може NEO да изпраща имейли от ваше име
          </CardDescription>
        </CardHeader>
        <CardContent>
          {settings.gmail_connected ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-neo-success" />
                <div>
                  <p className="font-medium">{settings.gmail_email}</p>
                  <p className="text-sm text-muted-foreground">Свързан акаунт</p>
                </div>
              </div>
              <Button variant="outline" onClick={disconnectGmail}>
                Прекъсни връзката
              </Button>
            </div>
          ) : (
            <Button onClick={connectGmail} className="w-full sm:w-auto">
              <Mail className="w-4 h-4 mr-2" />
              Свържи Gmail акаунт
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
            Конфигурирайте кога и как NEO да изпраща имейли
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Master Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-neo-warning" />
              <div>
                <p className="font-medium">Активирай имейл автоматизация</p>
                <p className="text-sm text-muted-foreground">Включете, за да започне NEO да изпраща имейли</p>
              </div>
            </div>
            <Switch
              checked={settings.email_enabled}
              onCheckedChange={(checked) => {
                if (checked && !settings.gmail_connected) {
                  // Auto-trigger Gmail connection when user tries to enable
                  connectGmail();
                  return;
                }
                setSettings(prev => ({ ...prev, email_enabled: checked }));
              }}
            />
          </div>

          {!settings.gmail_connected && (
            <button
              onClick={connectGmail}
              className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 text-primary text-sm w-full hover:bg-primary/15 transition-colors cursor-pointer border border-primary/20"
            >
              <Mail className="w-4 h-4" />
              Свържете Gmail акаунт, за да активирате автоматизацията
            </button>
          )}

          {/* Trigger Options */}
          <div className="space-y-4">
            <h4 className="font-medium">Кога да се изпращат имейли:</h4>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>След всеки разговор с потенциален клиент</span>
              </div>
              <Switch
                checked={settings.send_after_conversation}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, send_after_conversation: checked }))}
                disabled={!settings.email_enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-muted-foreground" />
                <span>Само на квалифицирани лийдове</span>
              </div>
              <Switch
                checked={settings.send_to_qualified_leads}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, send_to_qualified_leads: checked }))}
                disabled={!settings.email_enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>По график (с отложение)</span>
              </div>
              <Switch
                checked={settings.send_on_schedule}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, send_on_schedule: checked }))}
                disabled={!settings.email_enabled}
              />
            </div>

            {settings.send_on_schedule && (
              <div className="ml-7 flex items-center gap-2">
                <Label htmlFor="delay">Изчакай</Label>
                <Input
                  id="delay"
                  type="number"
                  value={settings.schedule_delay_minutes}
                  onChange={(e) => setSettings(prev => ({ ...prev, schedule_delay_minutes: parseInt(e.target.value) || 60 }))}
                  className="w-20"
                  disabled={!settings.email_enabled}
                />
                <span className="text-muted-foreground">минути след разговора</span>
              </div>
            )}
          </div>

          {/* AI Personalization */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5">
            <div>
              <p className="font-medium">AI персонализация</p>
              <p className="text-sm text-muted-foreground">NEO ще генерира уникален имейл за всеки клиент</p>
            </div>
            <Switch
              checked={settings.use_ai_personalization}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, use_ai_personalization: checked }))}
              disabled={!settings.email_enabled}
            />
          </div>

          {/* Email Templates */}
          {!settings.use_ai_personalization && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="subject">Тема на имейла</Label>
                <Input
                  id="subject"
                  value={settings.email_subject_template}
                  onChange={(e) => setSettings(prev => ({ ...prev, email_subject_template: e.target.value }))}
                  placeholder="Благодарим ви за интереса към {{company_name}}"
                  disabled={!settings.email_enabled}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Използвайте {'{{lead_name}}'}, {'{{company_name}}'}, {'{{service}}'} за персонализация
                </p>
              </div>

              <div>
                <Label htmlFor="body">Съдържание на имейла</Label>
                <Textarea
                  id="body"
                  value={settings.email_body_template}
                  onChange={(e) => setSettings(prev => ({ ...prev, email_body_template: e.target.value }))}
                  rows={6}
                  disabled={!settings.email_enabled}
                />
              </div>
            </div>
          )}

          <Button onClick={saveSettings} disabled={saving} className="w-full">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Запази настройките
          </Button>
        </CardContent>
      </Card>

      {/* Recent Emails */}
      <Card className="neo-glass-subtle border-border/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Последни изпратени имейли
          </CardTitle>
        </CardHeader>
        <CardContent>
          {emailLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Все още няма изпратени имейли
            </p>
          ) : (
            <div className="space-y-3">
              {emailLogs.map((log) => (
                <div key={log.id} className="flex items-start justify-between gap-3 p-4 rounded-lg bg-card/60 border border-border/30 overflow-hidden">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground truncate">{translateSubject(log.subject)}</p>
                    <p className="text-sm text-foreground/80 mt-0.5">{log.recipient_name || log.recipient_email}</p>
                    <p className="text-xs text-foreground/60 mt-1.5 leading-relaxed break-words">{getCompactEmailPreview(log.body)}</p>
                    <p className="text-[11px] text-muted-foreground mt-1.5">
                      {new Date(log.sent_at || log.created_at).toLocaleString('bg-BG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <Badge variant={log.status === 'sent' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'}
                    className={log.status === 'sent' ? 'bg-green-500/15 text-green-400 border-green-500/30' : ''}>
                    {log.status === 'sent' ? 'Изпратен' : log.status === 'failed' ? 'Неуспешен' : 'Изчакващ'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailAutomation;
