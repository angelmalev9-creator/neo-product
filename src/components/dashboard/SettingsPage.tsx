import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Crown, User, CreditCard, Globe, Loader2, Save } from 'lucide-react';
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

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke('update-profile-config', {
        body: { website_url: websiteUrl, company_name: companyName },
      });
      if (error) throw error;
      toast({ title: 'Запазено', description: 'Профилът е актуализиран' });
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
          <div className="rounded-2xl border border-border/10 bg-card/50 p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-semibold text-foreground">Вашият план</h2>
                <p className="text-xs text-muted-foreground">{subscribed ? tierName : 'Няма активен план'}</p>
              </div>
              {subscribed && (
                <Button variant="outline" size="sm" onClick={onManageSubscription} disabled={portalLoading} className="text-xs gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  {portalLoading ? '...' : 'Управление'}
                </Button>
              )}
            </div>

            {subscribed && (
              <>
                {subscriptionEnd && (
                  <p className="text-xs text-muted-foreground">
                    Активен до {new Date(subscriptionEnd).toLocaleDateString('bg-BG')}
                  </p>
                )}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Използвани минути</span>
                    <span className="font-medium text-foreground">{usedMinutes.toFixed(1)} / {planLimit}</span>
                  </div>
                  <Progress value={Math.min(usagePercent, 100)} className="h-2" />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {section === 'profile' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/10 bg-card/50 p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Профил</h2>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Име на компанията</Label>
                <Input
                  placeholder="Вашата компания"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="bg-background/50 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> Уебсайт
                </Label>
                <Input
                  type="url"
                  placeholder="https://your-website.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="bg-background/50 text-sm"
                />
              </div>
            </div>

            <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Запазване...' : 'Запази'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
