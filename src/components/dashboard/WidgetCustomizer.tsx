import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Phone, Crown, Paintbrush, Save, Loader2 } from 'lucide-react';

interface WidgetConfig {
  position: string;
  color: string;
  backgroundColor: string;
  buttonText: string;
  autoGreet: boolean;
  autoGreetMessage: string;
  buttonSize: string;
}

interface WidgetCustomizerProps {
  userId: string;
  companyName: string;
  initialConfig?: WidgetConfig | null;
  subscriptionTier?: string | null;
  logoUrl?: string | null;
  hideNeoBranding?: boolean;
  onLogoChange?: (url: string | null) => void;
  onBrandingChange?: (hide: boolean) => void;
}

const DEFAULT_CONFIG: WidgetConfig = {
  position: 'bottom-right',
  color: '#ea384c',
  backgroundColor: '#1a1a2e',
  buttonText: 'Говори с NEO',
  autoGreet: true,
  autoGreetMessage: 'Здравейте! Как мога да Ви помогна днес?',
  buttonSize: 'medium',
};

const PRESET_COLORS = [
  { name: 'NEO Червено', value: '#ea384c' },
  { name: 'Синьо', value: '#3b82f6' },
  { name: 'Зелено', value: '#22c55e' },
  { name: 'Лилаво', value: '#8b5cf6' },
  { name: 'Оранжево', value: '#f97316' },
  { name: 'Тъмно', value: '#1f2937' },
];

const BG_PRESET_COLORS = [
  { name: 'Тъмно синьо', value: '#1a1a2e' },
  { name: 'Антрацит', value: '#16213e' },
  { name: 'Графит', value: '#1f2937' },
  { name: 'Бяло', value: '#ffffff' },
  { name: 'Кремаво', value: '#faf5ef' },
  { name: 'Светло сиво', value: '#f1f5f9' },
  { name: 'Тъмно', value: '#0f0f0f' },
  { name: 'Морско', value: '#0d1b2a' },
];

const WidgetCustomizer = ({ 
  userId, companyName, initialConfig, subscriptionTier, logoUrl, hideNeoBranding, onBrandingChange,
}: WidgetCustomizerProps) => {
  const { toast } = useToast();
  const [config, setConfig] = useState<WidgetConfig>({ ...DEFAULT_CONFIG, ...initialConfig });
  const [saving, setSaving] = useState(false);
  const [localHideBranding, setLocalHideBranding] = useState(hideNeoBranding || false);
  const canCustomizeBranding = subscriptionTier === 'growth' || subscriptionTier === 'empire';

  useEffect(() => {
    if (initialConfig) setConfig({ ...DEFAULT_CONFIG, ...initialConfig });
  }, [initialConfig]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ widget_config: config as unknown as import('@/integrations/supabase/types').Json })
        .eq('user_id', userId);
      if (error) throw error;
      toast({ title: 'Запазено!', description: 'Настройките на уиджета са актуализирани' });
    } catch {
      toast({ title: 'Грешка', description: 'Неуспешно запазване', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const hexToLuma = (hex: string) => {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  };
  const isLightBg = hexToLuma(config.backgroundColor || '#1a1a2e') > 0.5;
  const greetMsg = config.autoGreetMessage || DEFAULT_CONFIG.autoGreetMessage;

  return (
    <div className="space-y-3">
      {/* Live Preview — compact */}
      <div>
        <Label className="text-[11px] text-muted-foreground mb-1.5 block">Преглед</Label>
        <div className="relative rounded-xl border border-border/20 overflow-hidden" style={{ backgroundColor: config.backgroundColor, height: 220 }}>
          <div className="absolute inset-0 flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: isLightBg ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)' }}>
              <div className="w-6 h-6 rounded-lg overflow-hidden shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-lg flex items-center justify-center" style={{ backgroundColor: config.color }}>
                    <Phone className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-[10px] font-semibold" style={{ color: isLightBg ? '#1a1a2e' : '#ffffff' }}>{companyName || 'Вашата компания'}</p>
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-green-500" />
                  <span className="text-[8px]" style={{ color: isLightBg ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)' }}>AI Асистент</span>
                </div>
              </div>
            </div>
            {/* Messages */}
            <div className="flex-1 px-3 py-2 space-y-1.5 overflow-hidden">
              <div className="flex gap-1.5">
                <div className="w-4 h-4 rounded shrink-0 flex items-center justify-center" style={{ backgroundColor: `${config.color}20` }}>
                  <Phone className="w-2 h-2" style={{ color: config.color }} />
                </div>
                <div className="rounded-xl rounded-tl-sm px-2.5 py-1.5 max-w-[75%]" style={{ backgroundColor: isLightBg ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }}>
                  <p className="text-[9px]" style={{ color: isLightBg ? '#333' : '#ddd' }}>{greetMsg}</p>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="rounded-xl rounded-tr-sm px-2.5 py-1.5 max-w-[75%]" style={{ backgroundColor: config.color }}>
                  <p className="text-[9px] text-white">Искам да запазя час</p>
                </div>
              </div>
            </div>
            {/* CTA */}
            <div className="px-3 py-2 border-t" style={{ borderColor: isLightBg ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }}>
              <div className="w-full py-2 rounded-lg flex items-center justify-center gap-1.5" style={{ backgroundColor: config.color }}>
                <Phone className="w-3 h-3 text-white" />
                <span className="text-[10px] text-white font-medium">{config.buttonText}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls — compact grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Position */}
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Позиция</Label>
          <Select value={config.position} onValueChange={(v) => setConfig({ ...config, position: v })}>
            <SelectTrigger className="bg-background/50 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="bottom-right">Долу вдясно</SelectItem>
              <SelectItem value="bottom-left">Долу вляво</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Size */}
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Размер</Label>
          <Select value={config.buttonSize} onValueChange={(v) => setConfig({ ...config, buttonSize: v })}>
            <SelectTrigger className="bg-background/50 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Малък</SelectItem>
              <SelectItem value="medium">Среден</SelectItem>
              <SelectItem value="large">Голям</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Hover text */}
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-[10px] text-muted-foreground">Текст при hover</Label>
          <Input value={config.buttonText} onChange={(e) => setConfig({ ...config, buttonText: e.target.value })} placeholder="Говори с NEO" className="bg-background/50 h-8 text-xs" />
        </div>
      </div>

      {/* Colors row */}
      <div className="space-y-1">
        <Label className="text-[10px] text-muted-foreground">Цвят на бутона</Label>
        <div className="flex flex-wrap gap-1.5 items-center">
          {PRESET_COLORS.map((c) => (
            <button key={c.value} onClick={() => setConfig({ ...config, color: c.value })}
              className={`w-7 h-7 rounded-md border-2 transition-all ${config.color === c.value ? 'border-foreground scale-110 ring-2 ring-primary/30' : 'border-border/40'}`}
              style={{ backgroundColor: c.value }} title={c.name} />
          ))}
          <Input type="color" value={config.color} onChange={(e) => setConfig({ ...config, color: e.target.value })} className="w-7 h-7 p-0 border-0 cursor-pointer rounded-md" />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Paintbrush className="w-3 h-3" /> Фон на уиджета
        </Label>
        <div className="flex flex-wrap gap-1.5 items-center">
          {BG_PRESET_COLORS.map((c) => (
            <button key={c.value} onClick={() => setConfig({ ...config, backgroundColor: c.value })}
              className={`w-7 h-7 rounded-md border-2 transition-all ${config.backgroundColor === c.value ? 'border-foreground scale-110 ring-2 ring-primary/30' : 'border-border/40'}`}
              style={{ backgroundColor: c.value }} title={c.name} />
          ))}
          <Input type="color" value={config.backgroundColor || '#1a1a2e'} onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })} className="w-7 h-7 p-0 border-0 cursor-pointer rounded-md" />
        </div>
      </div>

      {/* Branding + Auto greet toggles */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-[11px] flex items-center gap-1.5">
              Скрий NEO брандинг
              {!canCustomizeBranding && <Crown className="w-3 h-3 text-primary" />}
            </Label>
            <p className="text-[9px] text-muted-foreground">{canCustomizeBranding ? 'Само Вашият бранд' : 'Налично от план Растеж'}</p>
          </div>
          <Switch checked={localHideBranding} onCheckedChange={(v) => {
            if (!canCustomizeBranding) { toast({ title: 'Надградете плана', description: 'Налично от план Растеж' }); return; }
            setLocalHideBranding(v); onBrandingChange?.(v);
          }} disabled={!canCustomizeBranding} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-[11px]">Автоматично приветствие</Label>
            <p className="text-[9px] text-muted-foreground">NEO ще започне разговора автоматично</p>
          </div>
          <Switch checked={config.autoGreet} onCheckedChange={(v) => setConfig({ ...config, autoGreet: v })} />
        </div>

        {/* Greeting message — only when autoGreet is on */}
        {config.autoGreet && (
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Текст на приветствието</Label>
            <Textarea
              value={config.autoGreetMessage || ''}
              onChange={(e) => setConfig({ ...config, autoGreetMessage: e.target.value })}
              placeholder="Здравейте! Как мога да Ви помогна днес?"
              className="bg-background/50 text-xs min-h-[56px] resize-none"
              rows={2}
            />
          </div>
        )}
      </div>

      {/* Save */}
      <Button onClick={handleSave} disabled={saving} size="sm" className="w-full h-9 gap-1.5">
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        Запази настройките
      </Button>
    </div>
  );
};

export default WidgetCustomizer;
