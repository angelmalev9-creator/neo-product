import { useRef, useCallback, useEffect } from 'react';

interface AudioEffectsOptions {
  ambientVolume?: number;
  effectsVolume?: number;
}

export const useAudioEffects = (options: AudioEffectsOptions = {}) => {
  const { ambientVolume = 0.08, effectsVolume = 0.3 } = options;
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
    }
    return audioContextRef.current;
  }, []);

  const createTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine', fadeOut = true) => {
    const ctx = initAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    gainNode.gain.setValueAtTime(effectsVolume * 0.5, ctx.currentTime);
    if (fadeOut) gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }, [initAudioContext, effectsVolume]);

  const playConnectSound = useCallback(() => {
    const ctx = initAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    setTimeout(() => createTone(440, 0.15, 'sine'), 0);
    setTimeout(() => createTone(554, 0.15, 'sine'), 80);
    setTimeout(() => createTone(659, 0.2, 'sine'), 160);
  }, [initAudioContext, createTone]);

  const playDisconnectSound = useCallback(() => {
    const ctx = initAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    setTimeout(() => createTone(659, 0.15, 'sine'), 0);
    setTimeout(() => createTone(554, 0.15, 'sine'), 80);
    setTimeout(() => createTone(440, 0.2, 'sine'), 160);
  }, [initAudioContext, createTone]);

  const playSpeakingStart = useCallback(() => {
    const ctx = initAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    createTone(523, 0.1, 'sine');
  }, [initAudioContext, createTone]);

  const playListeningStart = useCallback(() => {
    const ctx = initAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    createTone(880, 0.05, 'sine');
  }, [initAudioContext, createTone]);

  const startAmbient = useCallback(() => {
    const ctx = initAudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    const createSoftPad = (freq: number, detune: number, vol: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.detune.setValueAtTime(detune, ctx.currentTime);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(150, ctx.currentTime);
      filter.Q.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(vol * ambientVolume * 0.3, ctx.currentTime + 4);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      return { osc, gain };
    };

    const createWarmHum = (volume: number) => {
      const bufferSize = 4 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(100, ctx.currentTime);
      filter.Q.setValueAtTime(0.3, ctx.currentTime);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume * ambientVolume * 0.15, ctx.currentTime + 5);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
      return { noise, gain };
    };

    const drones = [createSoftPad(65, 0, 0.15), createSoftPad(98, 3, 0.1), createSoftPad(130, -2, 0.08)];
    const noises = [createWarmHum(0.05)];
    (window as any).__ambientDrones = drones;
    (window as any).__ambientNoises = noises;
  }, [initAudioContext, ambientVolume]);

  const stopAmbient = useCallback(() => {
    const ctx = audioContextRef.current;
    const drones = (window as any).__ambientDrones;
    if (drones && ctx) {
      drones.forEach(({ osc, gain }: { osc: OscillatorNode; gain: GainNode }) => {
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
        setTimeout(() => { try { osc.stop(); } catch {} }, 1100);
      });
      (window as any).__ambientDrones = null;
    }
    const noises = (window as any).__ambientNoises;
    if (noises && ctx) {
      noises.forEach(({ noise, gain }: { noise: AudioBufferSourceNode; gain: GainNode }) => {
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
        setTimeout(() => { try { noise.stop(); } catch {} }, 1100);
      });
      (window as any).__ambientNoises = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopAmbient();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [stopAmbient]);

  return { playConnectSound, playDisconnectSound, playSpeakingStart, playListeningStart, startAmbient, stopAmbient, initAudioContext };
};
