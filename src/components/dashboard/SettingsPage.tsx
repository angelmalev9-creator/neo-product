import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Crown, User, CreditCard, Globe, Loader2, Save, Sparkles, Shield, Zap, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
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
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground">Настройки</h1>

      {section === 'plan' && (
        <div className="space-y-4">
          {/* Plan card - visual & friendly */}
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card/80 to-card/50 p-6 space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start justify-between relative">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">{subscribed ? tierName : 'Няма план'}</h2>
                  <p className="text-xs text-muted-foreground">
                    {subscribed
                      ? daysLeft !== null
                        ? `Остават ${daysLeft} дни`
                        : 'Активен абонамент'
                      : 'Изберете план, за да активирате NEO'}
                  </p>
                </div>
              </div>
              {subscribed && (
                <Button variant="outline" size="sm" onClick={onManageSubscription} disabled={portalLoading} className="text-xs gap-1.5 shrink-0">
                  <CreditCard className="w-3.5 h-3.5" />
                  {portalLoading ? '...' : 'Плащания'}
                </Button>
              )}
            </div>

            {subscribed && (
              <div className="space-y-3 relative">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-background/40 border border-border/10 p-3 text-center">
                    <p className="text-2xl font-black text-foreground">{usedMinutes.toFixed(0)}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">минути използвани</p>
                  </div>
                  <div className="rounded-xl bg-background/40 border border-border/10 p-3 text-center">
                    <p className="text-2xl font-black text-foreground">{remainingMinutes.toFixed(0)}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">минути оставащи</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Progress value={Math.min(usagePercent, 100)} className="h-2.5" />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{usedMinutes.toFixed(1)} от {planLimit} мин</span>
                    <span>{Math.round(usagePercent)}% изразходвани</span>
                  </div>
                </div>
                {usagePercent > 80 && (
                  <div className="flex items-center gap-2 rounded-lg bg-[hsl(var(--neo-warning))]/10 border border-[hsl(var(--neo-warning))]/20 p-2.5">
                    <Zap className="w-4 h-4 text-[hsl(var(--neo-warning))] shrink-0" />
                    <p className="text-xs text-[hsl(var(--neo-warning))]">Минутите ви свършват. Надградете плана за повече.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Plan benefits - what you get */}
          {subscribed && (
            <div className="rounded-2xl border border-border/10 bg-card/50 p-5">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Какво включва планът ви</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { icon: Sparkles, text: 'AI гласов асистент 24/7' },
                  { icon: Globe, text: 'Уиджет за вашия сайт' },
                  { icon: Shield, text: 'Автоматично събиране на контакти' },
                  { icon: ArrowUpRight, text: 'Дашборд с анализи в реално време' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-foreground/80 py-1.5">
                    <item.icon className="w-3.5 h-3.5 text-primary shrink-0" />
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {section === 'profile' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/10 bg-card/50 p-6 space-y-5">
            {/* User identity */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">{companyName || 'Вашият профил'}</h2>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
            </div>

            {/* Editable fields - clear labels */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-foreground">Как се казва бизнесът ви?</Label>
                <Input
                  placeholder="напр. Салон Белла, Дентал Клиник Пловдив..."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="bg-background/50 text-sm h-11"
                />
                <p className="text-[10px] text-muted-foreground">NEO ще се представя с това име пред клиентите ви.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-primary" /> Адрес на сайта ви
                </Label>
                <Input
                  type="url"
                  placeholder="https://моят-бизнес.bg"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="bg-background/50 text-sm h-11"
                />
                <p className="text-[10px] text-muted-foreground">NEO ще научи информацията от този сайт — услуги, цени, работно време.</p>
              </div>
            </div>

            <Button onClick={handleSaveProfile} disabled={saving} className="w-full sm:w-auto gap-2 h-10">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Запазване...' : 'Запази промените'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
