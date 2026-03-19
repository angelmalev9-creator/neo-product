import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface UseRealtimeVoiceProps {
  onMessage?: (message: Message) => void;
  onError?: (error: string) => void;
  onSpeakingChange?: (speaking: boolean) => void;
  onListeningChange?: (listening: boolean) => void;
}

export const useRealtimeVoice = ({ onMessage, onError, onSpeakingChange, onListeningChange }: UseRealtimeVoiceProps = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const updateSpeaking = useCallback((speaking: boolean) => { setIsSpeaking(speaking); onSpeakingChange?.(speaking); }, [onSpeakingChange]);
  const updateListening = useCallback((listening: boolean) => { setIsListening(listening); onListeningChange?.(listening); }, [onListeningChange]);

  const connect = useCallback(async (systemPrompt: string, sessionId?: string) => {
    if (isConnected || isConnecting) return;
    setIsConnecting(true);
    try {
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke('realtime-session', {
        body: { systemPrompt, voice: 'alloy', sessionId },
      });
      if (tokenError || !tokenData?.client_secret?.value) throw new Error(tokenError?.message || 'Failed to get session token');
      const ephemeralKey = tokenData.client_secret.value;
      if (!audioElRef.current) { audioElRef.current = document.createElement('audio'); audioElRef.current.autoplay = true; }
      const pc = new RTCPeerConnection();
      pcRef.current = pc;
      pc.ontrack = (e) => { if (audioElRef.current) audioElRef.current.srcObject = e.streams[0]; };
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      streamRef.current = stream;
      pc.addTrack(stream.getTracks()[0]);
      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;
      dc.onopen = () => updateListening(true);
      dc.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data);
          switch (event.type) {
            case 'response.audio.delta': updateSpeaking(true); updateListening(false); break;
            case 'response.audio.done': updateSpeaking(false); updateListening(true); break;
            case 'response.audio_transcript.done': if (event.transcript) onMessage?.({ role: 'assistant', content: event.transcript }); break;
            case 'conversation.item.input_audio_transcription.completed': if (event.transcript) onMessage?.({ role: 'user', content: event.transcript }); break;
            case 'input_audio_buffer.speech_started': updateListening(true); updateSpeaking(false); break;
            case 'error': onError?.(event.error?.message || 'Unknown error'); break;
          }
        } catch {}
      };
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const sdpResponse = await fetch(`https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${ephemeralKey}`, 'Content-Type': 'application/sdp' },
        body: offer.sdp,
      });
      if (!sdpResponse.ok) throw new Error(`SDP exchange failed: ${sdpResponse.status}`);
      const answerSdp = await sdpResponse.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
      setIsConnected(true);
      setIsConnecting(false);
    } catch (error) {
      setIsConnecting(false);
      onError?.(error instanceof Error ? error.message : 'Connection failed');
      disconnect();
    }
  }, [isConnected, isConnecting, onMessage, onError, updateSpeaking, updateListening]);

  const disconnect = useCallback(() => {
    if (dcRef.current) { dcRef.current.close(); dcRef.current = null; }
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
    if (audioElRef.current) audioElRef.current.srcObject = null;
    setIsConnected(false); setIsSpeaking(false); setIsListening(false);
    updateSpeaking(false); updateListening(false);
  }, [updateSpeaking, updateListening]);

  const sendTextMessage = useCallback((text: string) => {
    if (!dcRef.current || dcRef.current.readyState !== 'open') return;
    dcRef.current.send(JSON.stringify({ type: 'conversation.item.create', item: { type: 'message', role: 'user', content: [{ type: 'input_text', text }] } }));
    dcRef.current.send(JSON.stringify({ type: 'response.create' }));
  }, []);

  return { isConnected, isConnecting, isSpeaking, isListening, connect, disconnect, sendTextMessage };
};
