import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, Palette, Code2 } from 'lucide-react';
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
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground">Уиджет</h1>

      {/* Install code */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Code2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Инсталиране</h2>
            <p className="text-xs text-muted-foreground">Копирайте кода и го поставете преди &lt;/body&gt; тага</p>
          </div>
        </div>

        <div className="bg-background/80 rounded-xl p-3 font-mono text-[11px] text-muted-foreground break-all">
          {`<script src="${getWidgetScriptUrl()}"></script>`}
        </div>

        <Button onClick={copyEmbedCode} className="w-full gap-2">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Копирано!' : 'Копирай кода'}
        </Button>
      </div>

      {/* Avatar */}
      <div className="rounded-2xl border border-border/10 bg-card/50 p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Аватар на NEO</h3>
        <WidgetAvatarUpload userId={userId} currentAvatarUrl={logoUrl} onAvatarChange={setLogoUrl} />
      </div>

      {/* Customizer */}
      <div className="rounded-2xl border border-border/10 bg-card/50 p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Персонализиране</h3>
        <WidgetCustomizer userId={userId} companyName={companyName} initialConfig={null} />
      </div>
    </div>
  );
};

export default WidgetPage;
