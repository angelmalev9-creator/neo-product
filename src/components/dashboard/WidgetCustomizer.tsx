import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Phone, Eye, Crown, Paintbrush } from 'lucide-react';

interface WidgetConfig {
  position: string;
  color: string;
  backgroundColor: string;
  buttonText: string;
  autoGreet: boolean;
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
  userId, 
  companyName, 
  initialConfig,
  subscriptionTier,
  logoUrl,
  hideNeoBranding,
  onLogoChange,
  onBrandingChange,
}: WidgetCustomizerProps) => {
  const { toast } = useToast();
  const [config, setConfig] = useState<WidgetConfig>(initialConfig || DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [localHideBranding, setLocalHideBranding] = useState(hideNeoBranding || false);
  
  const canCustomizeBranding = subscriptionTier === 'growth' || subscriptionTier === 'empire';

  useEffect(() => {
    if (initialConfig) {
      setConfig({ ...DEFAULT_CONFIG, ...initialConfig });
    }
  }, [initialConfig]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ widget_config: config as unknown as import('@/integrations/supabase/types').Json })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Запазено!',
        description: 'Настройките на уиджета са актуализирани',
      });
    } catch (err) {
      toast({
        title: 'Грешка',
        description: 'Неуспешно запазване',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getPreviewSize = () => {
    switch (config.buttonSize) {
      case 'small': return { width: 40, height: 40, iconSize: 16 };
      case 'large': return { width: 56, height: 56, iconSize: 24 };
      default: return { width: 48, height: 48, iconSize: 20 };
    }
  };

  const previewSize = getPreviewSize();

  const hexToLuma = (hex: string) => {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  };
  const isLightBg = hexToLuma(config.backgroundColor || '#1a1a2e') > 0.5;

  return (
    <div className="space-y-6">
      {/* Always-visible Live Preview */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Преглед</Label>
        <div className="relative rounded-2xl border border-border/20 overflow-hidden" style={{ backgroundColor: config.backgroundColor, height: 280 }}>
          {/* Simulated chat window */}
          <div className="absolute inset-0 flex flex-col">
            {/* Chat header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b" style={{ borderColor: isLightBg ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)' }}>
              <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-xl flex items-center justify-center" style={{ backgroundColor: config.color }}>
                    <Phone className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: isLightBg ? '#1a1a2e' : '#ffffff' }}>{companyName || 'Вашата компания'}</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-[9px]" style={{ color: isLightBg ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)' }}>AI Асистент</span>
                </div>
              </div>
            </div>

            {/* Chat messages preview */}
            <div className="flex-1 px-4 py-3 space-y-2 overflow-hidden">
              {/* Assistant message */}
              <div className="flex gap-2">
                <div className="w-5 h-5 rounded-lg shrink-0 flex items-center justify-center" style={{ backgroundColor: `${config.color}20` }}>
                  <Phone className="w-2.5 h-2.5" style={{ color: config.color }} />
                </div>
                <div className="rounded-2xl rounded-tl-md px-3 py-2 max-w-[75%]" style={{ backgroundColor: isLightBg ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }}>
                  <p className="text-[10px]" style={{ color: isLightBg ? '#333' : '#ddd' }}>Здравейте! Как мога да Ви помогна днес?</p>
                </div>
              </div>
              {/* User message */}
              <div className="flex justify-end">
                <div className="rounded-2xl rounded-tr-md px-3 py-2 max-w-[75%]" style={{ backgroundColor: config.color }}>
                  <p className="text-[10px] text-white">Искам да запазя час</p>
                </div>
              </div>
              {/* Assistant response */}
              <div className="flex gap-2">
                <div className="w-5 h-5 rounded-lg shrink-0 flex items-center justify-center" style={{ backgroundColor: `${config.color}20` }}>
                  <Phone className="w-2.5 h-2.5" style={{ color: config.color }} />
                </div>
                <div className="rounded-2xl rounded-tl-md px-3 py-2 max-w-[75%]" style={{ backgroundColor: isLightBg ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }}>
                  <p className="text-[10px]" style={{ color: isLightBg ? '#333' : '#ddd' }}>Разбира се! Кога бихте желали?</p>
                </div>
              </div>
            </div>

            {/* Bottom call button preview */}
            <div className="px-4 py-3 border-t" style={{ borderColor: isLightBg ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }}>
              <div className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2" style={{ backgroundColor: config.color }}>
                <Phone className="w-3.5 h-3.5 text-white" />
                <span className="text-[11px] text-white font-medium">{config.buttonText}</span>
              </div>
            </div>
          </div>

          {/* Floating button preview (positioned) */}
          <div
            className={`absolute ${config.position === 'bottom-left' ? 'left-3' : 'right-3'} bottom-3 rounded-full flex items-center justify-center shadow-lg z-10`}
            style={{
              backgroundColor: config.color,
              width: previewSize.width * 0.8,
              height: previewSize.height * 0.8,
              display: 'none', // Hidden since we show the full chat preview
            }}
          >
            <Phone className="text-white" style={{ width: previewSize.iconSize * 0.8, height: previewSize.iconSize * 0.8 }} />
          </div>
        </div>
      </div>

      {/* Position */}
      <div className="space-y-2">
        <Label className="text-sm">Позиция</Label>
        <Select value={config.position} onValueChange={(v) => setConfig({ ...config, position: v })}>
          <SelectTrigger className="bg-background/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bottom-right">Долу вдясно</SelectItem>
            <SelectItem value="bottom-left">Долу вляво</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Color */}
      <div className="space-y-2">
        <Label className="text-sm">Цвят на бутона</Label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => setConfig({ ...config, color: c.value })}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                config.color === c.value ? 'border-foreground scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c.value }}
              title={c.name}
            />
          ))}
          <Input
            type="color"
            value={config.color}
            onChange={(e) => setConfig({ ...config, color: e.target.value })}
            className="w-8 h-8 p-0 border-0 cursor-pointer"
          />
        </div>
      </div>

      {/* Background Color */}
      <div className="space-y-2">
        <Label className="text-sm flex items-center gap-2">
          <Paintbrush className="w-3.5 h-3.5 text-muted-foreground" />
          Фон на уиджета
        </Label>
        <div className="flex flex-wrap gap-2">
          {BG_PRESET_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => setConfig({ ...config, backgroundColor: c.value })}
              className={`w-8 h-8 rounded-lg border-2 transition-all ${
                config.backgroundColor === c.value ? 'border-foreground scale-110 ring-2 ring-primary/30' : 'border-border/40'
              }`}
              style={{ backgroundColor: c.value }}
              title={c.name}
            />
          ))}
          <div className="relative">
            <Input
              type="color"
              value={config.backgroundColor || '#1a1a2e'}
              onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
              className="w-8 h-8 p-0 border-0 cursor-pointer rounded-lg"
            />
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">Изберете цвят за фона на чат прозореца</p>
      </div>

      {/* Button Size */}
      <div className="space-y-2">
        <Label className="text-sm">Размер на бутона</Label>
        <Select value={config.buttonSize} onValueChange={(v) => setConfig({ ...config, buttonSize: v })}>
          <SelectTrigger className="bg-background/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Малък</SelectItem>
            <SelectItem value="medium">Среден</SelectItem>
            <SelectItem value="large">Голям</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Button Text */}
      <div className="space-y-2">
        <Label className="text-sm">Текст при hover</Label>
        <Input
          value={config.buttonText}
          onChange={(e) => setConfig({ ...config, buttonText: e.target.value })}
          placeholder="Говори с NEO"
          className="bg-background/50"
        />
      </div>

      {/* Hide NEO Branding */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm flex items-center gap-2">
            Скрий NEO брандинг
            {!canCustomizeBranding && <Crown className="w-3.5 h-3.5 text-primary" />}
          </Label>
          <p className="text-xs text-muted-foreground">
            {canCustomizeBranding 
              ? 'Уиджетът ще показва само Вашия бранд'
              : 'Налично от план Растеж нагоре'
            }
          </p>
        </div>
        <Switch
          checked={localHideBranding}
          onCheckedChange={(v) => {
            if (!canCustomizeBranding) {
              toast({
                title: 'Надградете плана',
                description: 'Тази функция е налична от план Растеж',
              });
              return;
            }
            setLocalHideBranding(v);
            onBrandingChange?.(v);
          }}
          disabled={!canCustomizeBranding}
        />
      </div>

      {/* Auto Greet */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm">Автоматично приветствие</Label>
          <p className="text-xs text-muted-foreground">NEO ще започне разговора автоматично</p>
        </div>
        <Switch
          checked={config.autoGreet}
          onCheckedChange={(v) => setConfig({ ...config, autoGreet: v })}
        />
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-primary hover:bg-primary/90"
      >
        {saving ? 'Запазване...' : 'Запази настройките'}
      </Button>
    </div>
  );
};

export default WidgetCustomizer;
