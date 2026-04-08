import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail, Paintbrush, Type, Save, Loader2 } from 'lucide-react';
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
  headerColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  footerText: string;
}

const DEFAULT_STYLE: EmailStyleConfig = {
  backgroundColor: '#ffffff',
  accentColor: '#ea384c',
  fontFamily: 'Arial, sans-serif',
  headerColor: '#1a1a2e',
  textColor: '#333333',
  buttonColor: '#ea384c',
  buttonTextColor: '#ffffff',
  footerText: '',
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

const FONT_OPTIONS = [
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Verdana', value: 'Verdana, sans-serif' },
  { name: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
  { name: 'Tahoma', value: 'Tahoma, sans-serif' },
];

interface EmailStyleEditorProps {
  userId: string;
  companyName: string;
}

const EmailStyleEditor = ({ userId, companyName }: EmailStyleEditorProps) => {
  const { toast } = useToast();
  const [style, setStyle] = useState<EmailStyleConfig>(DEFAULT_STYLE);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

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

  const displayName = companyName || 'Вашата компания';

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
          <div className="px-6 py-4 border-b" style={{ borderColor: `${style.accentColor}20` }}>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: style.accentColor }}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span
                className="text-sm font-semibold"
                style={{ color: style.headerColor, fontFamily: style.fontFamily }}
              >
                {displayName}
              </span>
            </div>
          </div>

          {/* Email Body */}
          <div className="px-6 py-5 space-y-3" style={{ fontFamily: style.fontFamily }}>
            <p className="text-sm font-semibold" style={{ color: style.headerColor }}>
              Благодарим ви за интереса!
            </p>
            <p className="text-xs leading-relaxed" style={{ color: style.textColor }}>
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
            className="px-6 py-3 border-t text-[10px]"
            style={{
              borderColor: `${style.accentColor}10`,
              color: `${style.textColor}80`,
              fontFamily: style.fontFamily,
            }}
          >
            {style.footerText || `© ${new Date().getFullYear()} ${displayName}. Всички права запазени.`}
          </div>
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
        <Label className="text-sm">Акцентен цвят</Label>
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

      {/* Font */}
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
