import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, Code2 } from 'lucide-react';
import WidgetAvatarUpload from '@/components/dashboard/WidgetAvatarUpload';
import WidgetCustomizer from '@/components/dashboard/WidgetCustomizer';
import EmailStyleEditor from '@/components/dashboard/EmailStyleEditor';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WidgetPageProps {
  userId: string;
  companyName: string;
  logoUrl: string | null;
  setLogoUrl: (url: string | null) => void;
}

const WidgetPage = ({ userId, companyName, logoUrl, setLogoUrl }: WidgetPageProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [widgetConfig, setWidgetConfig] = useState<Record<string, unknown> | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [hideNeoBranding, setHideNeoBranding] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('widget_config, subscription_tier, hide_neo_branding')
        .eq('user_id', userId)
        .single();
      if (data) {
        setWidgetConfig(data.widget_config as Record<string, unknown> | null);
        setSubscriptionTier(data.subscription_tier ?? null);
        setHideNeoBranding(data.hide_neo_branding ?? false);
      }
    };
    load();
  }, [userId]);

  const handleBrandingChange = async (hide: boolean) => {
    setHideNeoBranding(hide);
    await supabase.from('profiles').update({ hide_neo_branding: hide }).eq('user_id', userId);
  };

  const getWidgetScriptUrl = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${supabaseUrl}/functions/v1/widget-script?userId=${userId}`;
  };

  const copyEmbedCode = () => {
    const embedCode = `<script src="${getWidgetScriptUrl()}"></script>`;
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Копирано!', description: 'Поставете кода преди </body> тага на сайта' });
  };

  return (
    <div className="h-full flex flex-col p-4 lg:p-6 overflow-hidden overflow-x-hidden">
      <h1 className="text-lg font-bold text-foreground mb-3 shrink-0">Уиджет</h1>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain space-y-3">
        {/* Install code */}
        <div className="rounded-xl border border-primary/15 bg-gradient-to-br from-primary/8 to-card/60 p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Code2 className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-foreground">Код за вграждане</p>
            <p className="text-[9px] text-muted-foreground font-mono truncate mt-0.5">
              {`<script src="${getWidgetScriptUrl()}"></script>`}
            </p>
          </div>
          <Button onClick={copyEmbedCode} size="sm" variant="outline" className="gap-1.5 shrink-0 h-7 text-[11px]">
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Копирано' : 'Копирай'}
          </Button>
        </div>

        {/* Avatar + Customizer */}
        <div className="rounded-xl border border-border/10 bg-card/60 p-4">
          <div className="flex items-center gap-4 mb-4">
            <WidgetAvatarUpload userId={userId} currentAvatarUrl={logoUrl} onAvatarChange={setLogoUrl} />
          </div>
          <WidgetCustomizer
            userId={userId}
            companyName={companyName}
            initialConfig={widgetConfig as any}
            subscriptionTier={subscriptionTier}
            logoUrl={logoUrl}
            hideNeoBranding={hideNeoBranding}
            onBrandingChange={handleBrandingChange}
          />
        </div>

        {/* Email Style Editor */}
        <div className="rounded-xl border border-border/10 bg-card/60 p-4">
          <h3 className="text-[11px] font-semibold text-foreground mb-2">Стил на имейлите от NEO</h3>
          <EmailStyleEditor userId={userId} companyName={companyName} />
        </div>
      </div>
    </div>
  );
};

export default WidgetPage;
