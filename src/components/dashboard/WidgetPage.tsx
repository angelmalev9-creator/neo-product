import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, Code2 } from 'lucide-react';
import WidgetAvatarUpload from '@/components/dashboard/WidgetAvatarUpload';
import WidgetCustomizer from '@/components/dashboard/WidgetCustomizer';
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
    <div className="h-full flex flex-col p-4 lg:p-6 overflow-hidden">
      <h1 className="text-lg font-bold text-foreground mb-3 shrink-0">Уиджет</h1>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-4">
        {/* Install code - compact */}
        <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/8 to-card/60 backdrop-blur-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Code2 className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground">Код за вграждане</p>
            <p className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">
              {`<script src="${getWidgetScriptUrl()}"></script>`}
            </p>
          </div>
          <Button onClick={copyEmbedCode} size="sm" variant="outline" className="gap-1.5 shrink-0 h-8 text-xs">
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Копирано' : 'Копирай'}
          </Button>
        </div>

        {/* Avatar + Customizer side by side on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-border/10 bg-card/60 backdrop-blur-sm p-5">
            <h3 className="text-xs font-semibold text-foreground mb-3">Аватар на NEO</h3>
            <WidgetAvatarUpload userId={userId} currentAvatarUrl={logoUrl} onAvatarChange={setLogoUrl} />
          </div>
          <div className="lg:col-span-2 rounded-2xl border border-border/10 bg-card/60 backdrop-blur-sm p-5">
            <h3 className="text-xs font-semibold text-foreground mb-3">Персонализиране</h3>
            <WidgetCustomizer userId={userId} companyName={companyName} initialConfig={null} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WidgetPage;
