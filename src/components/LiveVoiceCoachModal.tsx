import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, X, Send, Volume2, Square } from 'lucide-react';

interface LiveVoiceCoachModalProps {
  isOpen: boolean;
  initialPrompt?: string;
  onClose: () => void;
}

interface TranscriptEntry {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
}

function float32ToPcm16Base64(float32Array: Float32Array): string {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64Pcm16ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const view = new DataView(bytes.buffer);
  const sampleCount = Math.floor(bytes.byteLength / 2);
  const float32 = new Float32Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    float32[i] = view.getInt16(i * 2, true) / 32768.0;
  }
  return float32;
}

export const LiveVoiceCoachModal: React.FC<LiveVoiceCoachModalProps> = ({
  isOpen,
  initialPrompt,
  onClose,
}) => {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([
    {
      id: 'welcome',
      role: 'system',
      text: 'Gemini 3.8 Live Voice Session ready. Connect your microphone or send a voice topic prompt below to converse in real time.',
    },
  ]);
  const [textPrompt, setTextPrompt] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  const stopPlaybackQueue = useCallback(() => {
    for (const src of activeSourcesRef.current) {
      try {
        src.stop();
      } catch {
        // ignore already stopped
      }
    }
    activeSourcesRef.current = [];
    if (outputAudioCtxRef.current) {
      nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
    }
  }, []);

  const scheduleAudioChunk = useCallback((base64Pcm: string) => {
    try {
      if (!outputAudioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        outputAudioCtxRef.current = new AudioCtx({ sampleRate: 24000 });
      }
      const ctx = outputAudioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const float32Samples = base64Pcm16ToFloat32(base64Pcm);
      if (float32Samples.length === 0) return;

      const audioBuffer = ctx.createBuffer(1, float32Samples.length, 24000);
      audioBuffer.getChannelData(0).set(float32Samples);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      const now = ctx.currentTime;
      const startTime = Math.max(now, nextStartTimeRef.current);
      source.start(startTime);
      nextStartTimeRef.current = startTime + audioBuffer.duration;
      activeSourcesRef.current.push(source);

      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
      };
    } catch {
      // Ignore audio playback errors in headless environments without audio device
    }
  }, []);

  const stopMicrophone = useCallback(() => {
    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch {
        // ignore
      }
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      try {
        inputAudioCtxRef.current.close();
      } catch {
        // ignore
      }
      inputAudioCtxRef.current = null;
    }
    setIsMicActive(false);
  }, []);

  const disconnectLiveSession = useCallback(() => {
    stopMicrophone();
    stopPlaybackQueue();
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        // ignore
      }
      wsRef.current = null;
    }
    setConnectionStatus('disconnected');
  }, [stopMicrophone, stopPlaybackQueue]);

  const connectLiveSession = useCallback(
    (autoPrompt?: string) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        if (autoPrompt) {
          wsRef.current.send(JSON.stringify({ text: autoPrompt }));
          setTranscripts((prev) => [
            ...prev,
            { id: `${Date.now()}-u`, role: 'user', text: autoPrompt },
          ]);
        }
        return;
      }

      setConnectionStatus('connecting');
      setStatusMessage('Connecting to Gemini 3.8 Live WebSocket...');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/live`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'status' && msg.status === 'connected') {
            setConnectionStatus('connected');
            setStatusMessage('Connected to Gemini 3.8 Live (24kHz PCM Audio Stream)');
            if (autoPrompt && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ text: autoPrompt }));
              setTranscripts((prev) => [
                ...prev,
                { id: `${Date.now()}-u`, role: 'user', text: autoPrompt },
              ]);
            }
          } else if (msg.type === 'audio' && msg.audio) {
            scheduleAudioChunk(msg.audio);
          } else if (msg.type === 'transcript' && msg.text) {
            setTranscripts((prev) => [
              ...prev,
              {
                id: `${Date.now()}-${Math.random()}`,
                role: msg.role === 'user' ? 'user' : 'model',
                text: msg.text,
              },
            ]);
          } else if (msg.type === 'text' && msg.text) {
            setTranscripts((prev) => [
              ...prev,
              {
                id: `${Date.now()}-${Math.random()}`,
                role: 'model',
                text: msg.text,
              },
            ]);
          } else if (msg.type === 'interrupted') {
            stopPlaybackQueue();
          } else if (msg.type === 'error') {
            setConnectionStatus('error');
            setStatusMessage(msg.error || 'Gemini Live API reported an error.');
          }
        } catch {
          // ignore malformed frames
        }
      };

      ws.onerror = () => {
        setConnectionStatus('error');
        setStatusMessage('WebSocket connection error.');
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
      };
    },
    [scheduleAudioChunk, stopPlaybackQueue]
  );

  const toggleMicrophone = async () => {
    if (isMicActive) {
      stopMicrophone();
      return;
    }

    if (connectionStatus !== 'connected') {
      connectLiveSession();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioCtx({ sampleRate: 16000 });
      inputAudioCtxRef.current = inputCtx;

      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      source.connect(processor);
      processor.connect(inputCtx.destination);

      processor.onaudioprocess = (e) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const channelData = e.inputBuffer.getChannelData(0);
          const base64Audio = float32ToPcm16Base64(channelData);
          wsRef.current.send(JSON.stringify({ audio: base64Audio }));
        }
      };

      setIsMicActive(true);
      setStatusMessage('Streaming 16kHz PCM microphone audio to Gemini 3.8 Live...');
    } catch (err: any) {
      setStatusMessage(
        `Microphone access unavailable (${err?.message || 'permission denied'}). You can still send voice prompts via text below.`
      );
    }
  };

  const handleSendTextToLive = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = textPrompt.trim();
    if (!trimmed) return;
    setTextPrompt('');

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text: trimmed }));
      setTranscripts((prev) => [
        ...prev,
        { id: `${Date.now()}-u`, role: 'user', text: trimmed },
      ]);
    } else {
      connectLiveSession(trimmed);
    }
  };

  useEffect(() => {
    if (isOpen && initialPrompt) {
      setTextPrompt(initialPrompt);
      connectLiveSession(initialPrompt);
    }
  }, [isOpen, initialPrompt, connectLiveSession]);

  useEffect(() => {
    return () => {
      disconnectLiveSession();
    };
  }, [disconnectLiveSession]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="live-voice-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
    >
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 id="live-voice-modal-title" className="text-base font-bold text-slate-900">
              Gemini 3.8 Live Real-Time Voice Coach (gemini-3.8-live)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              Status: {connectionStatus.toUpperCase()} {statusMessage ? `· ${statusMessage}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              disconnectLiveSession();
              onClose();
            }}
            aria-label="Close Live Voice Coach modal"
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2">
            {connectionStatus !== 'connected' ? (
              <button
                type="button"
                onClick={() => connectLiveSession()}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
              >
                <Volume2 className="w-4 h-4" />
                <span>Connect Gemini 3.8 Live Session</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={disconnectLiveSession}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-rose-700 text-white rounded-lg hover:bg-rose-800 transition-colors whitespace-nowrap shrink-0"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Disconnect Session</span>
              </button>
            )}

            <button
              type="button"
              onClick={toggleMicrophone}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                isMicActive
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {isMicActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{isMicActive ? 'Stop 16kHz Mic Stream' : 'Start 16kHz Mic Stream'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={stopPlaybackQueue}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            Clear Audio Queue
          </button>
        </div>

        {/* Transcript Log */}
        <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-slate-50 min-h-[240px]">
          {transcripts.map((entry) => (
            <div
              key={entry.id}
              className={`p-3 rounded-lg text-xs sm:text-sm leading-relaxed ${
                entry.role === 'user'
                  ? 'bg-slate-900 text-white ml-8'
                  : entry.role === 'model'
                  ? 'bg-white border border-slate-200 text-slate-800 mr-8'
                  : 'bg-blue-50/80 border border-blue-200 text-blue-950'
              }`}
            >
              <div className="text-[11px] font-mono opacity-75 mb-1">
                {entry.role === 'user'
                  ? 'You (16kHz Audio / Prompt)'
                  : entry.role === 'model'
                  ? 'Gemini 3.8 Live (24kHz Voice + Transcript)'
                  : 'System Info'}
              </div>
              <div>{entry.text}</div>
            </div>
          ))}
        </div>

        {/* Text Prompt Fallback into Live Session */}
        <form
          onSubmit={handleSendTextToLive}
          className="p-4 bg-white border-t border-slate-200 flex items-center gap-2"
        >
          <label htmlFor="live-voice-prompt-input" className="sr-only">
            Send a prompt to Gemini 3.8 Live
          </label>
          <input
            id="live-voice-prompt-input"
            type="text"
            value={textPrompt}
            onChange={(e) => setTextPrompt(e.target.value)}
            placeholder="Speak into your mic or type a prompt to hear Gemini 3.8 Live respond out loud, eh..."
            className="flex-1 px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send to Live Voice</span>
          </button>
        </form>
      </div>
    </div>
  );
};
