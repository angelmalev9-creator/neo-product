import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Crown, User, CreditCard, Globe, Loader2, Save, Sparkles, Shield, Zap, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SettingsPageProps {
  userId: string;
  section?: string;
  subscribed: boolean;
  tierName: string;
  subscriptionEnd: string | null;
  usedMinutes: number;
  planLimit: number;
  onManageSubscription: () => void;
  portalLoading: boolean;
  websiteUrl: string;
  setWebsiteUrl: (url: string) => void;
  companyName: string;
  setCompanyName: (name: string) => void;
  userEmail?: string;
}

const formatUsageMinutes = (value: number) => {
  if (value <= 0) return '0';
  return value < 10 ? value.toFixed(1) : value.toFixed(0);
};

const SettingsPage = ({
  userId, section = 'plan', subscribed, tierName, subscriptionEnd,
  usedMinutes, planLimit, onManageSubscription, portalLoading,
  websiteUrl, setWebsiteUrl, companyName, setCompanyName, userEmail,
}: SettingsPageProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const usagePercent = planLimit > 0 ? (usedMinutes / planLimit) * 100 : 0;
  const remainingMinutes = Math.max(0, planLimit - usedMinutes);
  const daysLeft = subscriptionEnd
    ? Math.max(0, Math.ceil((new Date(subscriptionEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke('update-profile-config', {
        body: { website_url: websiteUrl, company_name: companyName },
      });
      if (error) throw error;
      toast({ title: '✓ Запазено', description: 'Промените са приложени' });
    } catch {
      toast({ title: 'Грешка', description: 'Неуспешно запазване', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-4 lg:p-6 overflow-hidden">
      <motion.h1
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-lg font-bold text-foreground mb-3 shrink-0"
      >
        Настройки
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain space-y-4"
      >
        {section === 'plan' && (
          <>
            {/* Plan card */}
            <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/8 via-card/80 to-card/50 backdrop-blur-sm p-5 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-28 h-28 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-start justify-between relative">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">{subscribed ? tierName : 'Няма план'}</h2>
                    <p className="text-[11px] text-muted-foreground">
                      {subscribed
                        ? daysLeft !== null ? `Остават ${daysLeft} дни` : 'Активен абонамент'
                        : 'Изберете план'}
                    </p>
                  </div>
                </div>
                {subscribed && (
                  <Button variant="outline" size="sm" onClick={onManageSubscription} disabled={portalLoading} className="text-xs gap-1 h-8 shrink-0">
                    <CreditCard className="w-3.5 h-3.5" />
                    {portalLoading ? '...' : 'Плащания'}
                  </Button>
                )}
              </div>

              {subscribed && (
                <div className="space-y-3 relative">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-background/40 border border-border/10 p-3 text-center">
                      <p className="text-xl font-black text-foreground">{formatUsageMinutes(usedMinutes)}</p>
                      <p className="text-[9px] text-muted-foreground">използвани мин</p>
                    </div>
                    <div className="rounded-xl bg-background/40 border border-border/10 p-3 text-center">
                      <p className="text-xl font-black text-foreground">{formatUsageMinutes(remainingMinutes)}</p>
                      <p className="text-[9px] text-muted-foreground">оставащи мин</p>
                    </div>
                  </div>
                  <Progress value={Math.min(usagePercent, 100)} className="h-2" />
                  {usagePercent > 80 && (
                    <div className="flex items-center gap-2 rounded-lg bg-[hsl(var(--neo-warning))]/10 border border-[hsl(var(--neo-warning))]/20 p-2">
                      <Zap className="w-3.5 h-3.5 text-[hsl(var(--neo-warning))] shrink-0" />
                      <p className="text-[11px] text-[hsl(var(--neo-warning))]">Минутите ви свършват.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {subscribed && (
              <div className="rounded-2xl border border-border/10 bg-card/60 backdrop-blur-sm p-4">
                <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Какво включва</h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { icon: Sparkles, text: 'AI асистент 24/7' },
                    { icon: Globe, text: 'Уиджет за сайта' },
                    { icon: Shield, text: 'Автоматични контакти' },
                    { icon: ArrowUpRight, text: 'Live дашборд' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] text-foreground/80 py-1">
                      <item.icon className="w-3 h-3 text-primary shrink-0" />
                      {item.text}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {section === 'profile' && (
          <div className="rounded-2xl border border-border/10 bg-card/60 backdrop-blur-sm p-5 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">{companyName || 'Вашият профил'}</h2>
                <p className="text-[11px] text-muted-foreground">{userEmail}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Как се казва бизнесът ви?</Label>
                <Input
                  placeholder="напр. Салон Белла, Дентал Клиник..."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="bg-background/50 text-sm h-10"
                />
                <p className="text-[9px] text-muted-foreground">NEO ще се представя с това име.</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-primary" /> Адрес на сайта
                </Label>
                <Input
                  type="url"
                  placeholder="https://моят-бизнес.bg"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="bg-background/50 text-sm h-10"
                />
                <p className="text-[9px] text-muted-foreground">NEO ще научи услуги, цени и работно време от сайта.</p>
              </div>
            </div>

            <Button onClick={handleSaveProfile} disabled={saving} className="gap-2 h-9">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Запазване...' : 'Запази промените'}
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SettingsPage;
