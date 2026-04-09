import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Mic, Square, Play, Pause, RotateCcw, Save, Lock, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface VoiceTrainingProps {
  userId: string;
  demoSession: any;
  subscriptionTier?: string;
  onVoiceSaved?: () => void;
}

const READING_TEXT = 'Здравейте, аз съм вашият асистент. Как мога да ви помогна днес? Разбирам, нека проверя какво можем да направим за вас.';
const MIN_SECONDS = 10;
const MAX_SECONDS = 30;

const VoiceTraining = ({ userId, demoSession, subscriptionTier, onVoiceSaved }: VoiceTrainingProps) => {
  const { toast } = useToast();
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [voiceName, setVoiceName] = useState('');
  const [saving, setSaving] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [trainingStatus, setTrainingStatus] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const timerRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const isAllowed = subscriptionTier === 'growth' || subscriptionTier === 'empire';

  useEffect(() => {
    if (demoSession?.voice_training_status) {
      setTrainingStatus(demoSession.voice_training_status);
    }
  }, [demoSession]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [audioUrl]);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = 'rgba(0, 0, 0, 0)';
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = 'hsl(var(--primary))';
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(t => t.stop());
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };

      mediaRecorder.start();
      setRecording(true);
      setSeconds(0);
      setAudioBlob(null);
      if (audioUrl) { URL.revokeObjectURL(audioUrl); setAudioUrl(null); }

      drawWaveform();

      timerRef.current = window.setInterval(() => {
        setSeconds(prev => {
          if (prev >= MAX_SECONDS - 1) {
            stopRecording();
            return MAX_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      toast({ title: 'Грешка', description: 'Не може да се достъпи микрофонът', variant: 'destructive' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = 0; }
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  };

  const playAudio = () => {
    if (!audioUrl) return;
    if (audioRef.current) { audioRef.current.pause(); }
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.onended = () => setPlaying(false);
    audio.play();
    setPlaying(true);
  };

  const stopPlayback = () => {
    audioRef.current?.pause();
    setPlaying(false);
  };

  const resetRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setSeconds(0);
  };

  const handleSave = async () => {
    if (!audioBlob || !demoSession?.id || !voiceName.trim()) return;
    setSaving(true);

    try {
      const filePath = `${demoSession.id}/custom-voice.webm`;
      const { error: uploadError } = await supabase.storage
        .from('voice-samples')
        .upload(filePath, audioBlob, { contentType: 'audio/webm', upsert: true });

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('demo_sessions')
        .update({
          voice_name: 'custom',
          custom_voice_name: voiceName.trim(),
          voice_training_status: 'processing',
          voice_training_submitted_at: new Date().toISOString(),
        } as any)
        .eq('id', demoSession.id);

      if (updateError) throw updateError;

      setTrainingStatus('processing');
      toast({ title: 'Гласът е записан!', description: 'Обработката отнема до 24 часа.' });
      onVoiceSaved?.();
    } catch (err) {
      console.error('Voice save error:', err);
      toast({ title: 'Грешка', description: 'Неуспешно запазване на гласа', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Plan gating
  if (!isAllowed) {
    return (
      <div className="rounded-xl border border-border/10 bg-card/40  px-4 py-3 flex items-center gap-3">
        <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-[11px] text-muted-foreground">Тренирайте НЕО с вашия глас — налично в план Растеж</span>
        <Button
          variant="outline"
          size="sm"
          className="text-[10px] h-7 px-2 shrink-0 ml-auto"
          onClick={() => window.location.href = '/#pricing'}
        >
          Надградете
        </Button>
      </div>
    );
  }

  // Processing state
  if (trainingStatus === 'processing') {
    return (
      <div className="rounded-xl border border-border/10 bg-card/40  px-4 py-4 space-y-3">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <div>
            <p className="text-sm font-medium text-foreground">Гласът ви се обработва</p>
            <p className="text-[11px] text-muted-foreground">Ще получите имейл когато е готов — обикновено до 24 часа.</p>
          </div>
          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 shrink-0 ml-auto">В обработка</Badge>
        </div>
      </div>
    );
  }

  // Ready state
  if (trainingStatus === 'ready') {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5  px-4 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
          <Mic className="w-4 h-4 text-emerald-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Вашият глас е готов!</p>
          <p className="text-[11px] text-muted-foreground">Изберете го от списъка с гласове по-горе</p>
        </div>
        <Badge className="bg-emerald-500/20 text-emerald-400 text-[9px] shrink-0 ml-auto">Готов</Badge>
      </div>
    );
  }

  // Failed state
  if (trainingStatus === 'failed') {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5  px-4 py-4 space-y-2">
        <p className="text-sm text-foreground">Възникна проблем при обработката.</p>
        <Button variant="outline" size="sm" onClick={() => { setTrainingStatus(null); resetRecording(); }}>
          <RotateCcw className="w-3 h-3 mr-1" /> Опитайте отново
        </Button>
      </div>
    );
  }

  // Recording wizard
  return (
    <div className="rounded-2xl border border-border/10 bg-card/60  p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Mic className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Говорете с вашия глас</h2>
          <p className="text-[11px] text-muted-foreground">Запишете 10-30 секунди четене на текста по-долу</p>
        </div>
      </div>

      {/* Reading text */}
      {!audioBlob && (
        <div className="rounded-xl bg-muted/30 border border-border/5 p-4">
          <p className="text-sm text-foreground leading-relaxed font-medium">{READING_TEXT}</p>
        </div>
      )}

      {/* Waveform canvas */}
      {recording && (
        <canvas
          ref={canvasRef}
          width={600}
          height={80}
          className="w-full h-16 rounded-lg bg-background/50"
        />
      )}

      {/* Progress */}
      {(recording || audioBlob) && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{seconds}s / {MAX_SECONDS}s</span>
            {seconds < MIN_SECONDS && recording && (
              <span className="text-amber-500">Минимум {MIN_SECONDS}s</span>
            )}
          </div>
          <Progress value={(seconds / MAX_SECONDS) * 100} className="h-1.5" />
        </div>
      )}

      {/* Record / Stop button */}
      {!audioBlob && (
        <Button
          onClick={recording ? stopRecording : startRecording}
          disabled={recording && seconds < MIN_SECONDS}
          className={cn(
            'gap-2 w-full',
            recording && 'bg-destructive hover:bg-destructive/90 animate-pulse'
          )}
        >
          {recording ? (
            <><Square className="w-4 h-4" /> Спри записа ({seconds}s)</>
          ) : (
            <><Mic className="w-4 h-4" /> Запишете гласа си</>
          )}
        </Button>
      )}

      {/* After recording */}
      {audioBlob && !saving && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={playing ? stopPlayback : playAudio}
              className="gap-1.5"
            >
              {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {playing ? 'Стоп' : 'Преслушай'}
            </Button>
            <Button variant="ghost" size="sm" onClick={resetRecording} className="gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> Презапиши
            </Button>
          </div>

          <Input
            placeholder="Име на гласа (напр. Ангел, Мария...)"
            value={voiceName}
            onChange={(e) => setVoiceName(e.target.value)}
            className="bg-background/50 text-sm"
          />

          <Button
            onClick={handleSave}
            disabled={!voiceName.trim() || saving}
            className="w-full gap-2"
          >
            <Save className="w-4 h-4" /> Запази гласа ми
          </Button>
        </div>
      )}

      {saving && (
        <div className="flex items-center justify-center py-4 gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Качване...
        </div>
      )}
    </div>
  );
};

export default VoiceTraining;
