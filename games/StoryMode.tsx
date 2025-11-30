
import React, { useState, useEffect } from 'react';
import { PenTool, Mic, MicOff, BookOpen, Sparkles, Volume2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { speak } from '../utils';
import { useSpeechRecognition } from '../hooks';

interface Message {
    role: 'ai' | 'user';
    text: string;
}

export const StoryMode = () => {
    const [history, setHistory] = useState<Message[]>([]);
    const [status, setStatus] = useState<'idle' | 'listening' | 'generating'>('idle');
    
    // We use the transcript from the hook, which updates live
    const { isListening, transcript, start, stop, setTranscript } = useSpeechRecognition({
        interimResults: true,
        onStart: () => setStatus('listening'),
        onEnd: () => {
            // Hook handles transcript state update, we check status in effect
        }
    });

    useEffect(() => {
        // Initial Prompt
        startStory();
    }, []);

    // Effect to handle end of speech when `isListening` toggles to false
    useEffect(() => {
        if (status === 'listening' && !isListening) {
             if (transcript.trim().length > 1) {
                // User finished speaking
                setStatus('generating');
                
                // Use functional state update to ensure we have latest history
                setHistory(prevHistory => {
                    const newHistory = [...prevHistory, { role: 'user', text: transcript } as Message];
                    
                    // Trigger AI response
                    generateAIResponse(transcript, newHistory).then(aiResponse => {
                        setHistory(h => [...h, { role: 'ai', text: aiResponse }]);
                        speak(aiResponse);
                        setStatus('idle');
                        setTranscript(''); // Clear for next turn
                    });

                    return newHistory;
                });
            } else {
                setStatus('idle');
            }
        }
    }, [isListening, status, transcript, setTranscript]);

    const startStory = async () => {
        setStatus('generating');
        const prompt = "Start a very short, fun story for a child about a magic animal. Max 2 sentences. End with 'What happened next?'.";
        const text = await generateAIResponse(prompt, []);
        setHistory([{ role: 'ai', text }]);
        speak(text);
        setStatus('idle');
    };

    const generateAIResponse = async (input: string, currentHistory: Message[]) => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            // Build simple context
            const context = currentHistory.map(m => `${m.role === 'ai' ? 'Storyteller' : 'Child'}: ${m.text}`).join('\n');
            const fullPrompt = `This is a collaborative story between a Storyteller and a Child.
${context}
Child: ${input}
Storyteller: (Continue the story in 1-2 fun, simple sentences. Accept the child's input no matter how silly.)`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: fullPrompt,
            });
            return response.text || "And then...";
        } catch (e) {
            return "The magic book is stuck! Try again.";
        }
    };

    const handleMicClick = () => {
        if (status === 'listening') {
            stop();
            return;
        }
        setTranscript('');
        window.speechSynthesis.cancel();
        start();
    };

    return (
        <div className="w-full max-w-2xl flex flex-col items-center h-[70vh]">
            <div className="bg-indigo-100 px-6 py-3 rounded-full shadow-sm mb-4 flex items-center gap-2">
                <PenTool className="text-indigo-600" />
                <span className="font-bold text-indigo-900">Story Weaver</span>
            </div>

            {/* Story Scroll Area */}
            <div className="flex-1 w-full bg-white rounded-[2rem] shadow-xl border-4 border-indigo-50 p-6 overflow-y-auto mb-4 space-y-4 scroll-smooth">
                {history.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[80%] p-4 rounded-2xl text-lg font-medium leading-relaxed
                            ${msg.role === 'ai' 
                                ? 'bg-indigo-50 text-indigo-900 rounded-tl-none' 
                                : 'bg-pink-100 text-pink-900 rounded-tr-none'
                            }
                        `}>
                            {msg.text}
                            {msg.role === 'ai' && (
                                <button onClick={() => speak(msg.text)} className="ml-2 inline-block opacity-50 hover:opacity-100">
                                    <Volume2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {status === 'generating' && (
                    <div className="flex justify-start">
                        <div className="bg-indigo-50 p-4 rounded-2xl rounded-tl-none flex gap-2">
                             <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                             <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></span>
                             <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="w-full flex flex-col items-center">
                {status === 'listening' && (
                    <div className="mb-4 text-xl font-bold text-gray-500 animate-pulse">
                        "{transcript}..."
                    </div>
                )}

                <button 
                    onClick={handleMicClick}
                    disabled={status === 'generating'}
                    className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all
                        ${status === 'listening' 
                            ? 'bg-red-500 text-white animate-pulse' 
                            : status === 'generating'
                                ? 'bg-gray-200 text-gray-400'
                                : 'bg-indigo-600 text-white hover:scale-105'
                        }
                    `}
                >
                    {status === 'listening' ? <MicOff size={32} /> : <Mic size={32} />}
                </button>
                <p className="text-gray-400 text-sm mt-2 font-medium">Tap to add to the story</p>
            </div>
        </div>
    );
};
