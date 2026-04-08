import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Volume2, Check, Mic } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import VoiceTraining from './VoiceTraining';

interface VoiceSelectorProps {
  userId: string;
  demoSession: any;
  subscriptionTier?: string;
}

const VOICES = [
  { id: 'Enceladus', name: 'Александър', description: 'Ясен и неутрален, професионален тон', gender: 'male', hint: 'Най-ясна артикулация на български' },
  { id: 'Charon', name: 'Никола', description: 'Дълбок и авторитетен, вдъхва доверие', gender: 'male', hint: 'Препоръчан за авторитетен тон' },
  { id: 'Puck', name: 'Мартин', description: 'Жизнерадостен и енергичен', gender: 'male', hint: 'Идеален за млада аудитория' },
  { id: 'Orus', name: 'Борис', description: 'Топъл и спокоен, разговорен стил', gender: 'male', hint: 'Оптимизиран за български език' },
  { id: 'Sadachbia', name: 'Стефан', description: 'Мек и внимателен, подходящ за медицина', gender: 'male', hint: 'Оптимизиран за български език' },
  { id: 'Kore', name: 'Елена', description: 'Силен и уверен женски глас', gender: 'female', hint: 'Прецизно женско произношение' },
  { id: 'Aoede', name: 'Мария', description: 'Топъл и мелодичен женски глас', gender: 'female', hint: 'Оптимизиран за български език' },
  { id: 'Zephyr', name: 'Виктория', description: 'Ярък и ясен женски глас', gender: 'female', hint: 'Оптимизиран за български език' },
];

const VoiceSelector = ({ userId, demoSession, subscriptionTier }: VoiceSelectorProps) => {
  const { toast } = useToast();
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customVoiceName, setCustomVoiceName] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (demoSession?.voice_name) {
      setSelectedVoice(demoSession.voice_name);
      setCustomVoiceName((demoSession as any).custom_voice_name || null);
      setLoading(false);
    } else if (demoSession) {
      setSelectedVoice('Enceladus');
      setLoading(false);
    }
  }, [demoSession, refreshKey]);

  const handleVoiceChange = async (voiceId: string) => {
    if (!demoSession?.id || saving) return;
    const previousVoice = selectedVoice;

    setSelectedVoice(voiceId);
    setSaving(true);

    const displayName = voiceId === 'custom'
      ? (customVoiceName || 'Моят глас')
      : VOICES.find(v => v.id === voiceId)?.name;

    try {
      const { error } = await supabase
        .from('demo_sessions')
        .update({ voice_name: voiceId } as any)
        .eq('id', demoSession.id);

      if (error) throw error;
      toast({ title: `Гласът е сменен на ${displayName}` });
    } catch {
      setSelectedVoice(previousVoice);
      toast({ title: 'Грешка', description: 'Неуспешна промяна на гласа', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const hasCustomVoice = (demoSession as any)?.voice_training_status === 'ready';

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain space-y-4">
      {/* Voice Selection */}
      <div className="rounded-2xl border border-border/10 bg-card/60 backdrop-blur-sm p-5 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Volume2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Глас на асистента</h2>
            <p className="text-[11px] text-muted-foreground">Изберете как ще звучи NEO при разговор с клиентите Ви</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {/* Custom voice card */}
            {hasCustomVoice && (
              <Card
                onClick={() => handleVoiceChange('custom')}
                className={cn(
                  'group relative cursor-pointer transition-all duration-200 hover:shadow-md',
                  selectedVoice === 'custom'
                    ? 'border-emerald-500/50 bg-emerald-500/5 shadow-sm ring-1 ring-emerald-500/20'
                    : 'border-border/15 bg-background/40 hover:border-border/30'
                )}
              >
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10">
                        <Mic className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground leading-tight">
                          {customVoiceName || 'Моят глас'}
                        </p>
                        <Badge className="bg-primary/10 text-primary text-[9px] px-1.5 py-0 mt-0.5">
                          Моят глас
                        </Badge>
                      </div>
                    </div>
                    {selectedVoice === 'custom' && (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">Вашият персонализиран глас</p>
                </CardContent>
              </Card>
            )}

            {/* Preset voices */}
            {VOICES.map((voice) => {
              const isSelected = selectedVoice === voice.id;
              return (
                <Card
                  key={voice.id}
                  onClick={() => handleVoiceChange(voice.id)}
                  className={cn(
                    'group relative cursor-pointer transition-all duration-200 hover:shadow-md',
                    isSelected
                      ? 'border-emerald-500/50 bg-emerald-500/5 shadow-sm ring-1 ring-emerald-500/20'
                      : 'border-border/15 bg-background/40 hover:border-border/30'
                  )}
                >
                  <CardContent className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          'w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold',
                          voice.gender === 'female'
                            ? 'bg-accent/30 text-accent-foreground'
                            : 'bg-primary/10 text-primary'
                        )}>
                          {voice.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground leading-tight">{voice.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {voice.gender === 'female' ? 'Женски' : 'Мъжки'}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-muted-foreground leading-relaxed">{voice.description}</p>
                    <p className="text-[10px] text-muted-foreground/60 italic">{voice.hint}</p>

                    {/* Hover wave animation */}
                    <div className="flex items-end gap-[3px] h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {[1, 2, 3, 4].map((bar) => (
                        <div
                          key={bar}
                          className="w-[3px] rounded-full bg-primary/40"
                          style={{
                            animation: `voice-bar-pulse 0.8s ease-in-out ${bar * 0.15}s infinite alternate`,
                          }}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Voice Training */}
      <VoiceTraining
        userId={userId}
        demoSession={demoSession}
        subscriptionTier={subscriptionTier}
        onVoiceSaved={() => setRefreshKey(k => k + 1)}
      />

      {/* CSS animation for wave bars */}
      <style>{`
        @keyframes voice-bar-pulse {
          0% { height: 4px; }
          100% { height: 14px; }
        }
      `}</style>
    </div>
  );
};

export default VoiceSelector;
