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
      {/* Live Preview */}
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <Label className="text-sm font-medium">Преглед</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="gap-1.5 text-xs"
          >
            <Eye className="w-3.5 h-3.5" />
            {showPreview ? 'Скрий' : 'Покажи'} преглед
          </Button>
        </div>
        
        {showPreview && (
          <div className="relative h-48 rounded-lg border border-border/30 overflow-hidden" style={{ backgroundColor: config.backgroundColor }}>
            <div className="absolute inset-0 p-4">
              <div className="h-4 rounded w-3/4 mb-2" style={{ backgroundColor: isLightBg ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)' }} />
              <div className="h-3 rounded w-1/2 mb-4" style={{ backgroundColor: isLightBg ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.07)' }} />
              <div className="h-16 rounded" style={{ backgroundColor: isLightBg ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)' }} />
            </div>
            
            <div
              className={`absolute ${config.position === 'bottom-left' ? 'left-4' : 'right-4'} bottom-4 rounded-full flex items-center justify-center shadow-lg transition-all`}
              style={{
                backgroundColor: config.color,
                width: previewSize.width,
                height: previewSize.height,
              }}
            >
              <Phone className="text-white" style={{ width: previewSize.iconSize, height: previewSize.iconSize }} />
            </div>

            <div
              className={`absolute ${config.position === 'bottom-left' ? 'left-16' : 'right-16'} bottom-6 bg-background text-foreground text-xs px-2 py-1 rounded shadow-lg border border-border/30`}
            >
              {config.buttonText}
            </div>
          </div>
        )}
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
