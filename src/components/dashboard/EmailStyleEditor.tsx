import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Mail, Paintbrush, Type, Save, Loader2, Upload, X, ImageIcon, Palette,
  ChevronDown,
} from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip, TooltipContent, TooltipTrigger, TooltipProvider,
} from "@/components/ui/tooltip";

interface EmailStyleConfig {
  backgroundColor: string;
  accentColor: string;
  fontFamily: string;
  fontColor: string;
  fontWeight: string;
  headerColor: string;
  headerBgColor: string;
  footerBgColor: string;
  footerTextColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  footerText: string;
  headerText: string;
  logoUrl: string;
}

const DEFAULT_STYLE: EmailStyleConfig = {
  backgroundColor: '#ffffff',
  accentColor: '#ea384c',
  fontFamily: 'Arial, sans-serif',
  fontColor: '#333333',
  fontWeight: 'normal',
  headerColor: '#1a1a2e',
  headerBgColor: '#1a1a2e',
  footerBgColor: '#1a1a2e',
  footerTextColor: '#999999',
  textColor: '#333333',
  buttonColor: '#ea384c',
  buttonTextColor: '#ffffff',
  footerText: '',
  headerText: '',
  logoUrl: '',
};

const BG_PRESETS = [
  { name: 'Бяло', value: '#ffffff' },
  { name: 'Кремаво', value: '#faf5ef' },
  { name: 'Светло сиво', value: '#f8f9fa' },
  { name: 'Светло синьо', value: '#f0f4ff' },
];

const ACCENT_PRESETS = [
  { name: 'NEO Червено', value: '#ea384c' },
  { name: 'Синьо', value: '#3b82f6' },
  { name: 'Зелено', value: '#22c55e' },
  { name: 'Лилаво', value: '#8b5cf6' },
  { name: 'Оранжево', value: '#f97316' },
  { name: 'Тъмно', value: '#1f2937' },
];

const HEADER_BG_PRESETS = [
  { name: 'Тъмно', value: '#1a1a2e' },
  { name: 'Черно', value: '#0a0a0a' },
  { name: 'Бяло', value: '#ffffff' },
  { name: 'Сиво', value: '#f3f4f6' },
  { name: 'Акцентен', value: '__accent__' },
];

const FONT_OPTIONS = [
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Verdana', value: 'Verdana, sans-serif' },
  { name: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
  { name: 'Tahoma', value: 'Tahoma, sans-serif' },
  { name: 'Times New Roman', value: '"Times New Roman", serif' },
  { name: 'Courier New', value: '"Courier New", monospace' },
];

const FONT_WEIGHT_OPTIONS = [
  { name: 'Нормален', value: 'normal' },
  { name: 'Удебелен', value: 'bold' },
  { name: 'Лек', value: '300' },
];

interface EmailStyleEditorProps {
  userId: string;
  companyName: string;
}

function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

/* ─── Toolbar icon button ─── */
const ToolBtn = ({
  icon: Icon,
  label,
  active,
  children,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  children: React.ReactNode;
}) => (
  <Popover>
    <Tooltip>
      <TooltipTrigger asChild>
        <PopoverTrigger asChild>
          <button
            className={`relative flex items-center justify-center w-9 h-9 rounded-lg border transition-all hover:bg-muted/60 ${
              active
                ? 'border-primary/50 bg-primary/10 text-primary'
                : 'border-border/30 text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-4 h-4" />
          </button>
        </PopoverTrigger>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
    </Tooltip>
    <PopoverContent align="start" className="w-72 p-3 space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      {children}
    </PopoverContent>
  </Popover>
);

/* ─── Color swatch row ─── */
const SwatchRow = ({
  presets,
  value,
  onChange,
  resolveValue,
}: {
  presets: { name: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
  resolveValue?: (v: string) => string;
}) => (
  <div className="flex flex-wrap gap-1.5 items-center">
    {presets.map((c) => {
      const resolved = resolveValue ? resolveValue(c.value) : c.value;
      return (
        <button
          key={c.value}
          onClick={() => onChange(c.value)}
          className={`w-7 h-7 rounded-md border-2 transition-all ${
            value === c.value ? 'border-foreground scale-110 ring-2 ring-primary/30' : 'border-border/40'
          }`}
          style={{ backgroundColor: resolved }}
          title={c.name}
        />
      );
    })}
    <Input
      type="color"
      value={resolveValue ? resolveValue(value) : value}
      onChange={(e) => onChange(e.target.value)}
      className="w-7 h-7 p-0 border-0 cursor-pointer rounded-md"
    />
  </div>
);

const EmailStyleEditor = ({ userId, companyName }: EmailStyleEditorProps) => {
  const { toast } = useToast();
  const [style, setStyle] = useState<EmailStyleConfig>(DEFAULT_STYLE);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('email_style_config')
        .eq('user_id', userId)
        .single();
      if (data?.email_style_config) {
        setStyle({ ...DEFAULT_STYLE, ...(data.email_style_config as unknown as Partial<EmailStyleConfig>) });
      }
      setLoaded(true);
    };
    load();
  }, [userId]);

  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Грешка', description: 'Моля, качете изображение', variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Грешка', description: 'Максимален размер: 2MB', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = url;
      });
      const canvas = document.createElement('canvas');
      const maxW = 400, maxH = 80;
      let w = img.width, h = img.height;
      if (w > maxW) { h = (h * maxW) / w; w = maxW; }
      if (h > maxH) { w = (w * maxH) / h; h = maxH; }
      canvas.width = Math.round(w);
      canvas.height = Math.round(h);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png', 0.9);
      });
      const path = `${userId}/email-logo.png`;
      const { error: uploadErr } = await supabase.storage
        .from('widget-avatars')
        .upload(path, blob, { upsert: true, contentType: 'image/png' });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from('widget-avatars').getPublicUrl(path);
      const logoUrl = `${urlData.publicUrl}?v=${Date.now()}`;
      setStyle(prev => ({ ...prev, logoUrl }));
      toast({ title: 'Логото е качено!' });
    } catch (err) {
      console.error('Logo upload error:', err);
      toast({ title: 'Грешка при качване', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ email_style_config: style as unknown as import('@/integrations/supabase/types').Json })
        .eq('user_id', userId);
      if (error) throw error;
      toast({ title: 'Запазено!', description: 'Стилът на имейлите е обновен' });
    } catch {
      toast({ title: 'Грешка', description: 'Неуспешно запазване', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return null;

  const displayName = style.headerText || companyName || 'Вашата компания';
  const resolvedHeaderBg = style.headerBgColor === '__accent__' ? style.accentColor : style.headerBgColor;
  const resolvedFooterBg = style.footerBgColor === '__accent__' ? style.accentColor : (style.footerBgColor || resolvedHeaderBg);
  const headerTextColor = isLightColor(resolvedHeaderBg) ? '#1a1a2e' : '#ffffff';
  const footerAutoColor = isLightColor(resolvedFooterBg) ? '#666666' : '#aaaaaa';

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        {/* ── Compact Icon Toolbar ── */}
        <div className="flex items-center gap-1.5 flex-wrap p-2 rounded-xl border border-border/20 bg-card/40">
          {/* Company name */}
          <ToolBtn icon={Type} label="Име на компанията">
            <Input
              value={style.headerText}
              onChange={(e) => setStyle({ ...style, headerText: e.target.value })}
              placeholder={companyName || 'Вашата компания'}
              className="bg-background/50 text-sm"
            />
          </ToolBtn>

          {/* Logo */}
          <ToolBtn icon={ImageIcon} label="Лого" active={!!style.logoUrl}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleLogoUpload(f);
              }}
            />
            {style.logoUrl && (
              <div className="flex items-center gap-2">
                <img src={style.logoUrl} alt="Logo" className="h-8 w-auto max-w-[120px] object-contain rounded border border-border/30 bg-muted/30 p-1" />
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 h-7 w-7 p-0" onClick={() => setStyle({ ...style, logoUrl: '' })}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
            <Button variant="outline" size="sm" className="gap-1.5 w-full" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {style.logoUrl ? 'Смени лого' : 'Качи лого'}
            </Button>
            <p className="text-[10px] text-muted-foreground">Макс. 400×80px, до 2MB</p>
          </ToolBtn>

          <div className="w-px h-6 bg-border/30 mx-0.5" />

          {/* Header/Footer color */}
          <ToolBtn icon={Palette} label="Цвят на хедър / футър">
            <SwatchRow
              presets={HEADER_BG_PRESETS}
              value={style.headerBgColor}
              onChange={(v) => setStyle({ ...style, headerBgColor: v, footerBgColor: v })}
              resolveValue={(v) => v === '__accent__' ? style.accentColor : v}
            />
          </ToolBtn>

          {/* Background color */}
          <ToolBtn icon={Paintbrush} label="Фон на имейла">
            <SwatchRow presets={BG_PRESETS} value={style.backgroundColor} onChange={(v) => setStyle({ ...style, backgroundColor: v })} />
          </ToolBtn>

          {/* Accent/button color */}
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button className="flex items-center justify-center w-9 h-9 rounded-lg border border-border/30 transition-all hover:bg-muted/60">
                    <div className="w-4 h-4 rounded-full border border-border/50" style={{ backgroundColor: style.accentColor }} />
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Акцентен цвят (бутон)</TooltipContent>
            </Tooltip>
            <PopoverContent align="start" className="w-72 p-3 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Акцентен цвят</p>
              <SwatchRow
                presets={ACCENT_PRESETS}
                value={style.accentColor}
                onChange={(v) => setStyle({ ...style, accentColor: v, buttonColor: v })}
              />
            </PopoverContent>
          </Popover>

          <div className="w-px h-6 bg-border/30 mx-0.5" />

          {/* Font family & weight */}
          <ToolBtn icon={Type} label="Шрифт и стил">
            <div className="space-y-2">
              <Label className="text-xs">Шрифт</Label>
              <Select value={style.fontFamily} onValueChange={(v) => setStyle({ ...style, fontFamily: v })}>
                <SelectTrigger className="bg-background/50 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      <span style={{ fontFamily: f.value }}>{f.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Стил</Label>
              <Select value={style.fontWeight} onValueChange={(v) => setStyle({ ...style, fontWeight: v })}>
                <SelectTrigger className="bg-background/50 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_WEIGHT_OPTIONS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      <span style={{ fontWeight: f.value }}>{f.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Цвят на текста</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={style.fontColor || style.textColor}
                  onChange={(e) => setStyle({ ...style, fontColor: e.target.value, textColor: e.target.value })}
                  className="w-7 h-7 p-0 border-0 cursor-pointer rounded-md"
                />
                <span className="text-[10px] text-muted-foreground">{style.fontColor || style.textColor}</span>
              </div>
            </div>
          </ToolBtn>

          {/* Footer text */}
          <ToolBtn icon={ChevronDown} label="Текст за футър">
            <Input
              value={style.footerText}
              onChange={(e) => setStyle({ ...style, footerText: e.target.value })}
              placeholder={`© ${new Date().getFullYear()} ${displayName}`}
              className="bg-background/50 text-sm"
            />
          </ToolBtn>

          <div className="flex-1" />

          {/* Save button */}
          <Button onClick={handleSave} disabled={saving} size="sm" className="gap-1.5 h-9">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Запази
          </Button>
        </div>

        {/* ── Live Preview ── */}
        <div>
          <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
            <Mail className="w-3 h-3" />
            Преглед
          </Label>
          <div
            className="rounded-xl border border-border/20 overflow-hidden shadow-sm"
            style={{ backgroundColor: style.backgroundColor }}
          >
            {/* Header */}
            <div className="px-5 py-3" style={{ backgroundColor: resolvedHeaderBg }}>
              <div className="flex items-center gap-2.5">
                {style.logoUrl ? (
                  <img src={style.logoUrl} alt={displayName} className="max-h-7 w-auto object-contain" style={{ maxWidth: '140px' }} />
                ) : (
                  <div className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: style.accentColor, color: '#ffffff' }}>
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-semibold" style={{ color: headerTextColor, fontFamily: style.fontFamily }}>
                  {displayName}
                </span>
              </div>
            </div>
            {/* Body */}
            <div className="px-5 py-4 space-y-2" style={{ fontFamily: style.fontFamily }}>
              <p className="text-xs font-semibold" style={{ color: style.headerColor }}>Благодарим ви за интереса!</p>
              <p className="text-[11px] leading-relaxed" style={{ color: style.fontColor || style.textColor, fontWeight: style.fontWeight }}>
                Здравейте, получихме Вашето запитване и ще се свържем с Вас възможно най-скоро.
              </p>
              <div className="pt-1">
                <div className="inline-block px-4 py-1.5 rounded-md text-[11px] font-semibold" style={{ backgroundColor: style.buttonColor, color: style.buttonTextColor }}>
                  Вижте детайлите
                </div>
              </div>
            </div>
            {/* Footer */}
            <div className="px-5 py-2 text-[9px]" style={{ backgroundColor: resolvedFooterBg, color: style.footerTextColor || footerAutoColor, fontFamily: style.fontFamily }}>
              {style.footerText || `© ${new Date().getFullYear()} ${displayName}. Всички права запазени.`}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default EmailStyleEditor;
