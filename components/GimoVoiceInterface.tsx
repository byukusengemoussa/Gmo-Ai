
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { Language, SessionStatus } from '../types';
import { decode, decodeAudioData, createPcmBlob } from '../utils/audioHelper';
import RobotVisualizer from './RobotVisualizer';

interface GimoVoiceInterfaceProps {
  selectedLanguage: Language;
}

export const GimoVoiceInterface: React.FC<GimoVoiceInterfaceProps> = ({ selectedLanguage }) => {
  const [status, setStatus] = useState<SessionStatus>(SessionStatus.IDLE);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for audio handling to avoid re-renders or closures
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  const stopConversation = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    
    setStatus(SessionStatus.IDLE);
    setIsSpeaking(false);
    setIsListening(false);
  }, []);

  const startConversation = async () => {
    setError(null);
    setStatus(SessionStatus.CONNECTING);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Initialize audio contexts if needed
      if (!audioContextInRef.current) {
        audioContextInRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      }
      if (!audioContextOutRef.current) {
        audioContextOutRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const systemInstruction = `You are Gimo AI, a high-fidelity language learning robot. 
      Background: You were created by Moussa Byukusenge in Rwanda in 2025.
      Your mission: Help users improve their speaking skills in ${selectedLanguage.name}. 
      Strict Rule: You must speak ${selectedLanguage.name} with native-level fluency and perfectly natural accent. 
      Do NOT mix languages unless the user specifically asks for translation.
      Personality: Patient, encouraging, professional, and slightly futuristic. 
      If a user makes a mistake in ${selectedLanguage.name}, gently correct them after responding to their intent.`;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setStatus(SessionStatus.ACTIVE);
            setIsListening(true);
            
            // Start streaming microphone input
            const source = audioContextInRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextInRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextInRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            
            if (audioData) {
              setIsSpeaking(true);
              const ctx = audioContextOutRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) {
                  setIsSpeaking(false);
                }
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsSpeaking(false);
            }
          },
          onerror: (e) => {
            console.error('Gemini Live error:', e);
            setError('Connection failed. Please check your network.');
            stopConversation();
          },
          onclose: () => {
            stopConversation();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction,
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not start conversation');
      setStatus(SessionStatus.ERROR);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopConversation();
    };
  }, [stopConversation]);

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <RobotVisualizer 
        isActive={status === SessionStatus.ACTIVE} 
        isSpeaking={isSpeaking} 
        isListening={status === SessionStatus.ACTIVE && !isSpeaking} 
      />

      <div className="text-center space-y-2">
        <h2 className="text-xl font-medium text-slate-300">
          {status === SessionStatus.IDLE && `Start practicing ${selectedLanguage.name}`}
          {status === SessionStatus.CONNECTING && "Waking up Gimo AI..."}
          {status === SessionStatus.ACTIVE && `Gimo AI is listening in ${selectedLanguage.nativeName}...`}
          {status === SessionStatus.ERROR && "Oops! Something went wrong."}
        </h2>
        <p className="text-slate-500 text-sm max-w-sm mx-auto">
          {status === SessionStatus.IDLE && `Click the button below to start a voice conversation with Gimo AI. Speak naturally!`}
          {status === SessionStatus.ACTIVE && `You can speak now. Gimo AI will hear and respond to you instantly.`}
        </p>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        {status === SessionStatus.IDLE || status === SessionStatus.ERROR ? (
          <button
            onClick={startConversation}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-lg shadow-xl shadow-blue-500/20 transition-all flex items-center gap-3 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            Start Conversation
          </button>
        ) : (
          <button
            onClick={stopConversation}
            className="px-8 py-4 bg-slate-700 hover:bg-red-600 text-white rounded-full font-bold text-lg shadow-xl transition-all flex items-center gap-3 active:scale-95 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            End Session
          </button>
        )}
      </div>

      {/* Quick Instruction Hints */}
      <div className="grid grid-cols-2 gap-4 mt-8 w-full opacity-60 hover:opacity-100 transition-opacity">
        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
          <span className="text-blue-400 text-xs font-bold uppercase block mb-1">Try saying</span>
          <p className="text-slate-400 text-sm italic">"Muraho Gimo, amakuru? Mfasha gutyaza Ikinyarwanda cyanjye."</p>
        </div>
        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
          <span className="text-blue-400 text-xs font-bold uppercase block mb-1">Or in English</span>
          <p className="text-slate-400 text-sm italic">"Hi Gimo, can we discuss Rwandan culture today?"</p>
        </div>
      </div>
    </div>
  );
};
