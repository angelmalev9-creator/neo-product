import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Settings, Save, Loader2, Brain } from 'lucide-react';
import VoiceTest from '@/components/dashboard/VoiceTest';
import VoiceSelector from '@/components/dashboard/VoiceSelector';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NeoPageProps {
  userId: string;
  section?: string;
  companyName: string;
  voiceSpeed: number;
  setVoiceSpeed: (speed: number) => void;
  demoSession: any;
  usedMinutes: number;
  planLimit: number;
  onUsageUpdate: (m: number) => void;
  subscriptionTier?: string;
}

const NeoPage = ({
  userId, section = 'behavior', companyName, voiceSpeed, setVoiceSpeed,
  demoSession, usedMinutes, planLimit, onUsageUpdate, subscriptionTier,
}: NeoPageProps) => {
  const { toast } = useToast();
  const [customPrompt, setCustomPrompt] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke('update-profile-config', {
        body: { voice_speed: voiceSpeed, custom_system_prompt: customPrompt },
      });
      if (error) throw error;
      toast({ title: 'Запазено', description: 'Настройките на NEO са актуализирани' });
    } catch {
      toast({ title: 'Грешка', description: 'Неуспешно запазване', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-4 lg:p-6 overflow-hidden overflow-x-hidden">
      <h1 className="text-lg font-bold text-foreground mb-3 shrink-0">NEO</h1>

      {section === 'behavior' && (
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain">
          <div className="rounded-2xl border border-border/10 bg-card/60 backdrop-blur-sm p-5 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Поведение на NEO</h2>
                <p className="text-[11px] text-muted-foreground">Контролирайте как NEO говори с клиентите ви</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Скорост на говорене: {voiceSpeed.toFixed(2)}x</Label>
                <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-muted/50">
                  {voiceSpeed < 0.9 ? 'Бавно' : voiceSpeed > 1.1 ? 'Бързо' : 'Нормално'}
                </span>
              </div>
              <Slider value={[voiceSpeed]} onValueChange={(v) => setVoiceSpeed(v[0])} min={0.7} max={1.3} step={0.05} />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Допълнителни инструкции</Label>
              <Textarea
                placeholder="Напр. 'Бъди учтив и предлагай консултация при всеки разговор'"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={3}
                className="bg-background/50 text-sm resize-none"
              />
            </div>

            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Запазване...' : 'Запази промените'}
            </Button>
          </div>
        </div>
      )}

      {section === 'voice' && (
        <VoiceSelector userId={userId} demoSession={demoSession} subscriptionTier={subscriptionTier} />
      )}

      {section === 'test' && (
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain">
          <div className="rounded-2xl border border-border/10 bg-card/60 backdrop-blur-sm p-5 min-h-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Mic className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Тест на NEO</h2>
                <p className="text-[11px] text-muted-foreground">Чуйте как NEO звучи и тествайте разговор</p>
              </div>
            </div>
            <VoiceTest
              companyName={companyName}
              customPrompt={customPrompt}
              promptTemplate="sales"
              voiceSpeed={voiceSpeed}
              demoSession={demoSession}
              usedMinutes={usedMinutes}
              planLimit={planLimit}
              onUsageUpdate={onUsageUpdate}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default NeoPage;
