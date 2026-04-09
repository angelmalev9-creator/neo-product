import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail, Paintbrush, Type, Save, Loader2, Upload, X, ImageIcon, Palette } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
      // Create optimized version via canvas
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = url;
      });

      const canvas = document.createElement('canvas');
      const maxW = 400;
      const maxH = 80;
      let w = img.width;
      let h = img.height;

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

      const ext = 'png';
      const path = `${userId}/email-logo.${ext}`;
      
      const { error: uploadErr } = await supabase.storage
        .from('widget-avatars')
        .upload(path, blob, { upsert: true, contentType: 'image/png' });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from('widget-avatars').getPublicUrl(path);
      const logoUrl = `${urlData.publicUrl}?v=${Date.now()}`;
      
      setStyle(prev => ({ ...prev, logoUrl }));
      toast({ title: 'Логото е качено!', description: 'Автоматично оптимизирано за имейли' });
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
    <div className="space-y-6">
      {/* Live Preview */}
      <div>
        <Label className="text-sm font-medium mb-3 flex items-center gap-2">
          <Mail className="w-3.5 h-3.5 text-muted-foreground" />
          Преглед на имейл
        </Label>
        <div
          className="rounded-2xl border border-border/20 overflow-hidden shadow-sm"
          style={{ backgroundColor: style.backgroundColor }}
        >
          {/* Email Header */}
          <div className="px-6 py-4" style={{ backgroundColor: resolvedHeaderBg }}>
            <div className="flex items-center gap-3">
              {style.logoUrl ? (
                <img
                  src={style.logoUrl}
                  alt={displayName}
                  className="max-h-8 w-auto object-contain"
                  style={{ maxWidth: '160px' }}
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: style.accentColor, color: '#ffffff' }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <span
                className="text-sm font-semibold"
                style={{ color: headerTextColor, fontFamily: style.fontFamily }}
              >
                {displayName}
              </span>
            </div>
          </div>

          {/* Email Body */}
          <div className="px-6 py-5 space-y-3" style={{ fontFamily: style.fontFamily }}>
            <p className="text-sm" style={{ color: style.headerColor, fontWeight: style.fontWeight === 'bold' ? 'bold' : '600' }}>
              Благодарим ви за интереса!
            </p>
            <p className="text-xs leading-relaxed" style={{ color: style.fontColor || style.textColor, fontWeight: style.fontWeight }}>
              Здравейте, получихме Вашето запитване и ще се свържем с Вас възможно най-скоро. 
              Благодарим ви, че избрахте {displayName}.
            </p>
            <div className="pt-2">
              <div
                className="inline-block px-5 py-2 rounded-lg text-xs font-semibold"
                style={{
                  backgroundColor: style.buttonColor,
                  color: style.buttonTextColor,
                }}
              >
                Вижте детайлите
              </div>
            </div>
          </div>

          {/* Email Footer */}
          <div
            className="px-6 py-3 text-[10px]"
            style={{
              backgroundColor: resolvedFooterBg,
              color: style.footerTextColor || footerAutoColor,
              fontFamily: style.fontFamily,
            }}
          >
            {style.footerText || `© ${new Date().getFullYear()} ${displayName}. Всички права запазени.`}
          </div>
        </div>
      </div>

      {/* Header Text / Company Name */}
      <div className="space-y-2">
        <Label className="text-sm flex items-center gap-2">
          <Type className="w-3.5 h-3.5 text-muted-foreground" />
          Име на компанията (в хедъра)
        </Label>
        <Input
          value={style.headerText}
          onChange={(e) => setStyle({ ...style, headerText: e.target.value })}
          placeholder={companyName || 'Вашата компания'}
          className="bg-background/50 text-sm"
        />
      </div>

      {/* Logo Upload */}
      <div className="space-y-2">
        <Label className="text-sm flex items-center gap-2">
          <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
          Лого (замества иконата)
        </Label>
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
        <div className="flex items-center gap-2">
          {style.logoUrl ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <img src={style.logoUrl} alt="Logo" className="h-8 w-auto max-w-[120px] object-contain rounded border border-border/30 bg-muted/30 p-1" />
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-600 shrink-0"
                onClick={() => setStyle({ ...style, logoUrl: '' })}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {style.logoUrl ? 'Смени' : 'Качи лого'}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">Автоматично оптимизирано до макс. 400×80px</p>
      </div>

      {/* Header & Footer Background Color */}
      <div className="space-y-2">
        <Label className="text-sm flex items-center gap-2">
          <Palette className="w-3.5 h-3.5 text-muted-foreground" />
          Цвят на хедър / футър
        </Label>
        <div className="flex flex-wrap gap-2">
          {HEADER_BG_PRESETS.map((c) => {
            const resolved = c.value === '__accent__' ? style.accentColor : c.value;
            return (
              <button
                key={c.value}
                onClick={() => setStyle({ ...style, headerBgColor: c.value, footerBgColor: c.value })}
                className={`w-8 h-8 rounded-lg border-2 transition-all ${
                  style.headerBgColor === c.value ? 'border-foreground scale-110 ring-2 ring-primary/30' : 'border-border/40'
                }`}
                style={{ backgroundColor: resolved }}
                title={c.name}
              />
            );
          })}
          <Input
            type="color"
            value={resolvedHeaderBg}
            onChange={(e) => setStyle({ ...style, headerBgColor: e.target.value, footerBgColor: e.target.value })}
            className="w-8 h-8 p-0 border-0 cursor-pointer rounded-lg"
          />
        </div>
      </div>

      {/* Background Color */}
      <div className="space-y-2">
        <Label className="text-sm flex items-center gap-2">
          <Paintbrush className="w-3.5 h-3.5 text-muted-foreground" />
          Фон на имейла
        </Label>
        <div className="flex flex-wrap gap-2">
          {BG_PRESETS.map((c) => (
            <button
              key={c.value}
              onClick={() => setStyle({ ...style, backgroundColor: c.value })}
              className={`w-8 h-8 rounded-lg border-2 transition-all ${
                style.backgroundColor === c.value ? 'border-foreground scale-110 ring-2 ring-primary/30' : 'border-border/40'
              }`}
              style={{ backgroundColor: c.value }}
              title={c.name}
            />
          ))}
          <Input
            type="color"
            value={style.backgroundColor}
            onChange={(e) => setStyle({ ...style, backgroundColor: e.target.value })}
            className="w-8 h-8 p-0 border-0 cursor-pointer rounded-lg"
          />
        </div>
      </div>

      {/* Accent Color */}
      <div className="space-y-2">
        <Label className="text-sm">Акцентен цвят (бутон)</Label>
        <div className="flex flex-wrap gap-2">
          {ACCENT_PRESETS.map((c) => (
            <button
              key={c.value}
              onClick={() => setStyle({ ...style, accentColor: c.value, buttonColor: c.value })}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                style.accentColor === c.value ? 'border-foreground scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c.value }}
              title={c.name}
            />
          ))}
          <Input
            type="color"
            value={style.accentColor}
            onChange={(e) => setStyle({ ...style, accentColor: e.target.value, buttonColor: e.target.value })}
            className="w-8 h-8 p-0 border-0 cursor-pointer"
          />
        </div>
      </div>

      {/* Font Family & Weight */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-sm flex items-center gap-2">
            <Type className="w-3.5 h-3.5 text-muted-foreground" />
            Шрифт
          </Label>
          <Select value={style.fontFamily} onValueChange={(v) => setStyle({ ...style, fontFamily: v })}>
            <SelectTrigger className="bg-background/50">
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
          <Label className="text-sm">Стил на текста</Label>
          <Select value={style.fontWeight} onValueChange={(v) => setStyle({ ...style, fontWeight: v })}>
            <SelectTrigger className="bg-background/50">
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
      </div>

      {/* Font Color */}
      <div className="space-y-2">
        <Label className="text-sm">Цвят на текста</Label>
        <div className="flex items-center gap-2">
          <Input
            type="color"
            value={style.fontColor || style.textColor}
            onChange={(e) => setStyle({ ...style, fontColor: e.target.value, textColor: e.target.value })}
            className="w-8 h-8 p-0 border-0 cursor-pointer rounded-lg"
          />
          <span className="text-xs text-muted-foreground">{style.fontColor || style.textColor}</span>
        </div>
      </div>

      {/* Footer Text */}
      <div className="space-y-2">
        <Label className="text-sm">Текст за футър (по избор)</Label>
        <Input
          value={style.footerText}
          onChange={(e) => setStyle({ ...style, footerText: e.target.value })}
          placeholder={`© ${new Date().getFullYear()} ${displayName}`}
          className="bg-background/50 text-sm"
        />
      </div>

      {/* Save */}
      <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? 'Запазване...' : 'Запази стила'}
      </Button>
    </div>
  );
};

export default EmailStyleEditor;
