import { useState, useRef, useCallback, useEffect } from 'react';
import { Volume2, Loader2, ChevronDown } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const VOICES = [
  { id: 'Enceladus', name: 'Александър', description: 'Ясен и неутрален', gender: 'male' },
  { id: 'Charon', name: 'Никола', description: 'Дълбок и авторитетен', gender: 'male' },
  { id: 'Puck', name: 'Мартин', description: 'Жизнерадостен и енергичен', gender: 'male' },
  { id: 'Orus', name: 'Борис', description: 'Топъл и спокоен', gender: 'male' },
  { id: 'Sadachbia', name: 'Стефан', description: 'Мек и внимателен', gender: 'male' },
  { id: 'Kore', name: 'Елена', description: 'Силен и уверен', gender: 'female' },
  { id: 'Aoede', name: 'Мария', description: 'Топъл и мелодичен', gender: 'female' },
  { id: 'Zephyr', name: 'Виктория', description: 'Ярък и ясен', gender: 'female' },
];

export { VOICES };

interface VoicePickerProps {
  selectedVoice: string;
  onVoiceChange: (voiceId: string) => void;
  voiceSpeed: number;
  onSpeedChange: (speed: number) => void;
  disabled?: boolean;
  compact?: boolean;
}

const VoicePicker = ({
  selectedVoice,
  onVoiceChange,
  voiceSpeed,
  onSpeedChange,
  disabled = false,
  compact = false,
}: VoicePickerProps) => {
  const [open, setOpen] = useState(false);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCacheRef = useRef<Record<string, string>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentVoice = VOICES.find(v => v.id === selectedVoice) || VOICES[0];

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Preload from storage on mount
  useEffect(() => {
    let cancelled = false;
    const preload = async () => {
      for (const voice of VOICES) {
        if (cancelled || audioCacheRef.current[voice.id]) continue;
        try {
          const { data } = await supabase.storage
            .from('voice-samples')
            .createSignedUrl(`previews/${voice.id}.wav`, 600);
          if (data?.signedUrl) {
            const head = await fetch(data.signedUrl, { method: 'HEAD' });
            if (head.ok) audioCacheRef.current[voice.id] = data.signedUrl;
          }
        } catch {}
      }
    };
    preload();
    return () => { cancelled = true; audioRef.current?.pause(); };
  }, []);

  const playPreview = useCallback(async (voiceId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (playingVoice === voiceId) {
      audioRef.current?.pause();
      setPlayingVoice(null);
      return;
    }

    audioRef.current?.pause();
    const audio = new Audio();
    audioRef.current = audio;
    audio.playbackRate = voiceSpeed;
    audio.onended = () => setPlayingVoice(null);

    if (audioCacheRef.current[voiceId]) {
      audio.src = audioCacheRef.current[voiceId];
      audio.play().catch(() => setPlayingVoice(null));
      setPlayingVoice(voiceId);
      return;
    }

    const voiceName = VOICES.find(v => v.id === voiceId)?.name || voiceId;
    setLoadingPreview(voiceId);
    try {
      const { data, error } = await supabase.functions.invoke('voice-preview', {
        body: { voice_id: voiceId, voice_name: voiceName },
      });
      if (error) throw error;
      if (data?.storageUrl) {
        audioCacheRef.current[voiceId] = data.storageUrl;
        audio.src = data.storageUrl;
      } else if (data?.audio) {
        const bin = atob(data.audio);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const url = URL.createObjectURL(new Blob([bytes], { type: data.mimeType || 'audio/wav' }));
        audioCacheRef.current[voiceId] = url;
        audio.src = url;
      } else {
        throw new Error('No audio');
      }
      await audio.play();
      setPlayingVoice(voiceId);
    } catch {
      setPlayingVoice(null);
    } finally {
      setLoadingPreview(null);
    }
  }, [playingVoice, voiceSpeed]);

  // Update playback rate when speed changes during playback
  useEffect(() => {
    if (audioRef.current && playingVoice) {
      audioRef.current.playbackRate = voiceSpeed;
    }
  }, [voiceSpeed, playingVoice]);

  const speedLabel = voiceSpeed < 0.9 ? 'Бавно' : voiceSpeed > 1.1 ? 'Бързо' : 'Нормално';

  return (
    <div className={cn("space-y-3", compact && "space-y-2")}>
      {/* Voice selector */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(!open)}
          className={cn(
            "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border transition-all text-sm",
            "bg-background/50 border-border/30 hover:border-border/50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold",
              currentVoice.gender === 'female' ? 'bg-accent/30 text-accent-foreground' : 'bg-primary/10 text-primary'
            )}>
              {currentVoice.name[0]}
            </div>
            <div className="text-left">
              <span className="font-medium text-foreground">{currentVoice.name}</span>
              <span className="text-[10px] text-muted-foreground ml-1.5">{currentVoice.description}</span>
            </div>
          </div>
         <div
className={cn(
"flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all",
"bg-[#2C65D8] text-white shadow-sm hover:opacity-95",
open && "scale-[0.98]"
)}
>
<span>Изберете глас</span>

<ChevronDown
className={cn(
"w-3.5 h-3.5 transition-transform",
open && "rotate-180"
)}
/>
</div>
        </button>

        {open && (
          <div className="absolute z-50 w-full mt-1 py-1 rounded-lg border border-border/30 bg-popover shadow-lg max-h-52 overflow-y-auto">
            {VOICES.map(voice => {
              const isSelected = selectedVoice === voice.id;
              const isPlaying = playingVoice === voice.id;
              const isLoading = loadingPreview === voice.id;

              return (
                <div
                  key={voice.id}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors",
                    isSelected && "bg-primary/5"
                  )}
                  onClick={() => { onVoiceChange(voice.id); setOpen(false); }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold",
                      voice.gender === 'female' ? 'bg-accent/30 text-accent-foreground' : 'bg-primary/10 text-primary'
                    )}>
                      {voice.name[0]}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-foreground">{voice.name}</span>
                      <span className="text-[10px] text-muted-foreground ml-1.5">{voice.description}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => playPreview(voice.id, e)}
                    disabled={isLoading}
                    className="p-1.5 rounded-md hover:bg-muted/70 transition-colors"
                  >
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                    ) : isPlaying ? (
                      <div className="flex items-end gap-[2px] h-3.5 px-0.5">
                        {[1,2,3].map(bar => (
                          <div key={bar} className="w-[2px] rounded-full bg-primary" style={{ animation: `voice-bar-pulse 0.6s ease-in-out ${bar * 0.1}s infinite alternate` }} />
                        ))}
                      </div>
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Speed / intonation slider */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] text-muted-foreground whitespace-nowrap min-w-[60px]">
          Темпо: {voiceSpeed.toFixed(2)}x
        </span>
        <Slider
          value={[voiceSpeed]}
          onValueChange={(v) => onSpeedChange(v[0])}
          min={0.7}
          max={1.3}
          step={0.05}
          disabled={disabled}
          className="flex-1"
        />
        <span className="text-[10px] text-muted-foreground/70 min-w-[50px] text-right">{speedLabel}</span>
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

export default VoicePicker;
