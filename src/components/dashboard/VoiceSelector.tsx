import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Play, Pause, Mic, AudioLines, Volume2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface VoiceSelectorProps {
  userId: string;
  demoSession: any;
}

const VOICES = [
  { id: 'Enceladus', name: 'Александър', description: 'Ясен и неутрален, професионален тон', gender: 'male' },
  { id: 'Charon', name: 'Никола', description: 'Дълбок и авторитетен, вдъхва доверие', gender: 'male' },
  { id: 'Puck', name: 'Мартин', description: 'Жизнерадостен и енергичен', gender: 'male' },
  { id: 'Orus', name: 'Борис', description: 'Топъл и спокоен, разговорен стил', gender: 'male' },
  { id: 'Sadachbia', name: 'Стефан', description: 'Мек и внимателен, подходящ за медицина', gender: 'male' },
  { id: 'Kore', name: 'Елена', description: 'Силен и уверен женски глас', gender: 'female' },
  { id: 'Aoede', name: 'Мария', description: 'Топъл и мелодичен женски глас', gender: 'female' },
  { id: 'Zephyr', name: 'Виктория', description: 'Ярък и ясен женски глас', gender: 'female' },
];

const VoiceSelector = ({ userId, demoSession }: VoiceSelectorProps) => {
  const { toast } = useToast();
  const [selectedVoice, setSelectedVoice] = useState('Enceladus');
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (demoSession?.voice_name) {
      setSelectedVoice(demoSession.voice_name);
    }
  }, [demoSession]);

  const handleVoiceChange = async (voiceId: string) => {
    setSelectedVoice(voiceId);
    if (!demoSession?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('demo_sessions')
        .update({ voice_name: voiceId } as any)
        .eq('id', demoSession.id);

      if (error) throw error;
      toast({ title: 'Гласът е променен', description: `NEO вече ще говори с глас "${VOICES.find(v => v.id === voiceId)?.name}"` });
    } catch {
      toast({ title: 'Грешка', description: 'Неуспешна промяна на гласа', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const togglePreview = (voiceId: string) => {
    if (playingVoice === voiceId) {
      audioRef.current?.pause();
      setPlayingVoice(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(`/audio/voice-preview-${voiceId.toLowerCase()}.mp3`);
    audio.onended = () => setPlayingVoice(null);
    audio.onerror = () => {
      setPlayingVoice(null);
      toast({ title: 'Примерен запис', description: 'Примерният запис ще бъде наличен скоро', variant: 'default' });
    };
    audioRef.current = audio;
    audio.play().catch(() => setPlayingVoice(null));
    setPlayingVoice(voiceId);
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain space-y-6">
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

        <RadioGroup value={selectedVoice} onValueChange={handleVoiceChange}>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {VOICES.map((voice) => {
              const isSelected = selectedVoice === voice.id;
              return (
                <label key={voice.id} className="cursor-pointer">
                  <Card className={cn(
                    'relative transition-all duration-200 hover:shadow-md',
                    isSelected
                      ? 'border-primary/40 bg-primary/5 shadow-sm ring-1 ring-primary/20'
                      : 'border-border/15 bg-background/40 hover:border-border/30'
                  )}>
                    <CardContent className="p-4 space-y-3">
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
                        <RadioGroupItem value={voice.id} className="mt-1" />
                      </div>

                      <p className="text-[11px] text-muted-foreground leading-relaxed">{voice.description}</p>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full h-8 text-[11px] gap-1.5 text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          togglePreview(voice.id);
                        }}
                      >
                        {playingVoice === voice.id ? (
                          <><Pause className="w-3 h-3" /> Спри</>
                        ) : (
                          <><Play className="w-3 h-3" /> Чуй примерен запис</>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </label>
              );
            })}
          </div>
        </RadioGroup>
      </div>

      {/* Voice Clone Placeholder */}
      <div className="rounded-2xl border border-border/10 bg-card/60 backdrop-blur-sm p-5 opacity-60">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center">
            <Mic className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">Използвайте Вашия глас</h2>
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Очаквайте скоро</Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Запишете 30 секунди от гласа си и НЕО ще говори с Вашия глас
            </p>
          </div>
        </div>

        {/* Static waveform decoration */}
        <div className="flex items-center gap-0.5 h-8 px-2 mb-3">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="w-1 rounded-full bg-muted-foreground/20"
              style={{ height: `${Math.max(4, Math.sin(i * 0.4) * 16 + Math.random() * 8 + 8)}px` }}
            />
          ))}
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button disabled className="gap-2 w-full sm:w-auto" variant="outline">
              <Mic className="w-4 h-4" />
              Запиши гласа ми
            </Button>
          </TooltipTrigger>
          <TooltipContent>Тази функция предстои</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

export default VoiceSelector;
