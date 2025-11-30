
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles, AlertCircle, RotateCcw } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { speak, SpeechRecognition } from '../utils';

export const WonderMode = () => {
  const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'answering' | 'error'>('idle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';
      setRecognition(rec);
    }
    return () => {
        window.speechSynthesis.cancel();
    }
  }, []);

  const handleMicClick = () => {
    if (!recognition) {
        alert("Speech recognition not supported");
        return;
    }

    if (status === 'listening') {
        recognition.stop();
        return;
    }

    setTranscript('');
    setResponse('');
    setStatus('listening');
    window.speechSynthesis.cancel();

    recognition.onresult = (event) => {
        const current = event.results[event.results.length - 1][0].transcript;
        setTranscript(current);
    };

    recognition.onerror = () => {
        setStatus('error');
    };

    recognition.onend = () => {
        if (transcript.length > 2) {
             askGemini(transcript);
        } else {
             setStatus('idle');
        }
    };

    try {
        recognition.start();
    } catch(e) {
        setStatus('error');
    }
  };

  const askGemini = async (query: string) => {
      setStatus('thinking');
      
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const result = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: query,
              config: {
                  systemInstruction: "You are a gentle, enthusiastic kindergarten teacher. Provide a very short, simple, and fun answer (max 2-3 sentences) suitable for a 5-year-old child. Use emojis.",
              }
          });
          
          const text = result.text || "I'm not sure about that, but let's wonder together!";
          setResponse(text);
          setStatus('answering');
          speak(text);
      } catch (e) {
          console.error(e);
          setStatus('error');
      }
  };

  return (
    <div className="w-full max-w-2xl flex flex-col items-center">
        
        <div className="mb-4 md:mb-8 text-center animate-in slide-in-from-top-4">
             <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-800 px-4 py-1 md:px-6 md:py-2 rounded-full font-bold shadow-sm mb-2 md:mb-4 text-sm md:text-base">
                <Sparkles size={16} className="md:w-5 md:h-5" />
                <span>I Wonder...</span>
             </div>
             <h2 className="text-2xl md:text-3xl font-bold text-violet-900 leading-tight">
                 {status === 'idle' && "What do you wonder about?"}
                 {status === 'listening' && "I'm listening..."}
                 {status === 'thinking' && "Let me think..."}
                 {status === 'answering' && "Here is what I found!"}
                 {status === 'error' && "Oops, try again!"}
             </h2>
        </div>

        {/* Main Interaction Area */}
        <div className="w-full min-h-[250px] md:min-h-[300px] bg-white rounded-[2rem] md:rounded-[3rem] shadow-xl border-4 md:border-8 border-violet-100 relative overflow-hidden flex flex-col items-center justify-center p-4 md:p-8 transition-all">
             
             {status === 'idle' && (
                 <button 
                    onClick={handleMicClick}
                    className="w-24 h-24 md:w-32 md:h-32 bg-violet-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-violet-600 hover:scale-110 transition-all group"
                 >
                     <Mic size={32} className="md:w-12 md:h-12 group-hover:animate-bounce" />
                 </button>
             )}

             {status === 'listening' && (
                 <div className="flex flex-col items-center gap-6 w-full">
                     <div className="w-24 h-24 md:w-32 md:h-32 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg animate-pulse cursor-pointer" onClick={() => recognition?.stop()}>
                         <MicOff size={32} className="md:w-12 md:h-12" />
                     </div>
                     <p className="text-xl md:text-2xl font-medium text-gray-500 text-center max-w-lg">
                         "{transcript}"
                     </p>
                 </div>
             )}

             {status === 'thinking' && (
                 <div className="flex flex-col items-center gap-4">
                     <div className="flex gap-2">
                         <div className="w-3 h-3 md:w-4 md:h-4 bg-violet-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                         <div className="w-3 h-3 md:w-4 md:h-4 bg-violet-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                         <div className="w-3 h-3 md:w-4 md:h-4 bg-violet-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                     </div>
                     <p className="text-violet-400 font-bold">Thinking...</p>
                 </div>
             )}

             {status === 'answering' && (
                 <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
                     <p className="text-xl md:text-3xl font-medium text-center text-gray-700 leading-relaxed">
                         {response}
                     </p>
                     <button 
                        onClick={() => speak(response)}
                        className="bg-violet-100 text-violet-700 p-3 rounded-full hover:bg-violet-200"
                     >
                         <Mic size={24} />
                     </button>
                 </div>
             )}

             {status === 'error' && (
                 <div className="flex flex-col items-center gap-4">
                     <AlertCircle size={48} className="text-red-400 md:w-16 md:h-16" />
                     <p className="text-lg text-red-500 font-medium text-center">Something went wrong. Let's try again!</p>
                 </div>
             )}
        </div>

        {/* Footer Actions */}
        {(status === 'answering' || status === 'error') && (
            <button
                onClick={() => {
                    setStatus('idle');
                    setTranscript('');
                    setResponse('');
                }}
                className="mt-6 md:mt-8 bg-violet-600 text-white px-6 py-3 md:px-8 md:py-4 rounded-2xl font-bold text-lg md:text-xl shadow-lg hover:bg-violet-700 active:scale-95 transition-all flex items-center gap-2"
            >
                <RotateCcw /> Ask Another Question
            </button>
        )}
    </div>
  );
};
