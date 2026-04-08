import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Volume2, Check, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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

const VoiceSelector = ({ userId, demoSession }: VoiceSelectorProps) => {
  const { toast } = useToast();
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCacheRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (demoSession?.voice_name) {
      setSelectedVoice(demoSession.voice_name);
      setLoading(false);
    } else if (demoSession) {
      setSelectedVoice('Enceladus');
      setLoading(false);
    }
  }, [demoSession]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      Object.values(audioCacheRef.current).forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const handleVoiceChange = async (voiceId: string) => {
    if (!demoSession?.id || saving) return;
    const previousVoice = selectedVoice;
    const voiceName = VOICES.find(v => v.id === voiceId)?.name;

    setSelectedVoice(voiceId);
    setSaving(true);

    try {
      const { error } = await supabase
        .from('demo_sessions')
        .update({ voice_name: voiceId } as any)
        .eq('id', demoSession.id);
      if (error) throw error;
      toast({ title: `Гласът е сменен на ${voiceName}` });
    } catch {
      setSelectedVoice(previousVoice);
      toast({ title: 'Грешка', description: 'Неуспешна промяна на гласа', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const playPreview = async (voiceId: string, voiceName: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // If already playing this voice, stop it
    if (playingVoice === voiceId) {
      audioRef.current?.pause();
      setPlayingVoice(null);
      return;
    }

    // Stop any current playback
    audioRef.current?.pause();

    // Create Audio object synchronously in click handler to satisfy browser autoplay policy
    const audio = new Audio();
    audioRef.current = audio;
    audio.onended = () => setPlayingVoice(null);

    // Check cache
    if (audioCacheRef.current[voiceId]) {
      audio.src = audioCacheRef.current[voiceId];
      audio.play().catch(() => setPlayingVoice(null));
      setPlayingVoice(voiceId);
      return;
    }

    // Fetch from edge function
    setLoadingPreview(voiceId);
    try {
      const { data, error } = await supabase.functions.invoke('voice-preview', {
        body: { voice_id: voiceId, voice_name: voiceName },
      });

      if (error || !data?.audio) throw new Error('No audio returned');

      const mimeType = data.mimeType || 'audio/wav';
      const binaryStr = atob(data.audio);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });
      const url = URL.createObjectURL(blob);

      audioCacheRef.current[voiceId] = url;

      audio.src = url;
      await audio.play();
      setPlayingVoice(voiceId);
    } catch (err) {
      console.error('Voice preview error:', err);
      toast({ title: 'Грешка', description: 'Не може да се зареди примерен запис', variant: 'destructive' });
      setPlayingVoice(null);
    } finally {
      setLoadingPreview(null);
    }
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain space-y-4">
      <div className="rounded-2xl border border-border/10 bg-card/60 backdrop-blur-sm p-5 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Volume2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Глас на асистента</h2>
            <p className="text-[11px] text-muted-foreground">Изберете как ще звучи NEO — натиснете 🔊 за да чуете гласа</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {VOICES.map((voice) => {
              const isSelected = selectedVoice === voice.id;
              const isPlaying = playingVoice === voice.id;
              const isLoading = loadingPreview === voice.id;

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

                    {/* Play preview button */}
                    <button
                      onClick={(e) => playPreview(voice.id, voice.name, e)}
                      disabled={isLoading}
                      className={cn(
                        'flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-md transition-all',
                        isPlaying
                          ? 'bg-primary/15 text-primary'
                          : 'bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                      )}
                    >
                      {isLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : isPlaying ? (
                        <>
                          <div className="flex items-end gap-[2px] h-3">
                            {[1, 2, 3, 4].map((bar) => (
                              <div
                                key={bar}
                                className="w-[2px] rounded-full bg-primary"
                                style={{
                                  animation: `voice-bar-pulse 0.6s ease-in-out ${bar * 0.1}s infinite alternate`,
                                }}
                              />
                            ))}
                          </div>
                          <span>Спри</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3" />
                          <span>Чуй гласа</span>
                        </>
                      )}
                    </button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes voice-bar-pulse {
          0% { height: 3px; }
          100% { height: 11px; }
        }
      `}</style>
    </div>
  );
};

export default VoiceSelector;
