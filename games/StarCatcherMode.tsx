
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Star, Rocket, Sparkles, XCircle, RotateCcw } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { speak, getRandomItem } from '../utils';
import { Confetti } from '../components';

interface SpaceItem {
    id: number;
    emoji: string;
    x: number; // Percent 0-100
    y: number; // Percent 0-100
    speed: number;
    type: 'star' | 'planet' | 'alien' | 'gold';
}

const ITEMS = [
    { emoji: '⭐', type: 'star' },
    { emoji: '🌟', type: 'star' },
    { emoji: '🌙', type: 'planet' },
    { emoji: '🪐', type: 'planet' },
    { emoji: '🌍', type: 'planet' },
    { emoji: '☄️', type: 'planet' },
    { emoji: '🚀', type: 'star' },
    { emoji: '🛸', type: 'alien' },
    { emoji: '👾', type: 'alien' },
];

export const StarCatcherMode = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [items, setItems] = useState<SpaceItem[]>([]);
    const [score, setScore] = useState(0);
    const [status, setStatus] = useState<'intro' | 'playing' | 'message' | 'error'>('intro');
    const [aiMessage, setAiMessage] = useState('');
    const [permissionError, setPermissionError] = useState(false);

    const gameLoopRef = useRef<number | null>(null);
    const spawnRef = useRef<number | null>(null);
    const nextId = useRef(0);

    // 1. Setup Camera
    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            const ms = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' } // Selfie mode for "Mirror" effect
            });
            setStream(ms);
            if (videoRef.current) {
                videoRef.current.srcObject = ms;
            }
            setPermissionError(false);
        } catch (e) {
            console.error("Camera error:", e);
            setPermissionError(true);
            setStatus('error');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        stopGameLoop();
    };

    // 2. Game Logic
    const startGame = () => {
        if (permissionError) return;
        setScore(0);
        setItems([]);
        setStatus('playing');
        speak("Catch the falling stars!");
        startGameLoop();
    };

    const stopGameLoop = () => {
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
        if (spawnRef.current) clearInterval(spawnRef.current);
    };

    const startGameLoop = () => {
        stopGameLoop();

        // Spawn Loop
        spawnRef.current = window.setInterval(() => {
            setItems(prev => {
                if (prev.length > 8) return prev; // Max items
                
                // 10% chance of Golden Star
                const isGold = Math.random() < 0.1;
                const template = getRandomItem(ITEMS);
                
                return [...prev, {
                    id: nextId.current++,
                    emoji: isGold ? '🏆' : template.emoji,
                    type: isGold ? 'gold' : template.type as any,
                    x: Math.random() * 80 + 10, // 10% to 90% width
                    y: -10, // Start above screen
                    speed: Math.random() * 0.5 + 0.3
                }];
            });
        }, 1000);

        // Movement Loop (60fps ish)
        gameLoopRef.current = window.setInterval(() => {
            setItems(prev => {
                // Move items down
                const nextItems = prev.map(item => ({
                    ...item,
                    y: item.y + item.speed
                })).filter(item => item.y < 110); // Remove if off screen
                
                return nextItems;
            });
        }, 16);
    };

    // 3. Interaction
    const handleCatch = async (id: number, type: string) => {
        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate(50);

        // Remove item
        setItems(prev => prev.filter(i => i.id !== id));
        setScore(s => s + 10);

        // Play sound/TTS based on type
        if (type === 'alien') speak("Zap!");
        else if (type === 'planet') speak("Pop!");
        else if (type === 'star') speak("Ting!");

        // Golden Item Event
        if (type === 'gold') {
            triggerGoldenEvent();
        }
    };

    const triggerGoldenEvent = async () => {
        stopGameLoop(); // Pause game
        setStatus('message');
        setAiMessage("Translating alien signal...");
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: "Generate a very short, funny space fact or a message from a friendly alien for a 5-year-old child. Max 1 sentence.",
            });
            const text = response.text || "Hello Earthling! You are a superstar!";
            setAiMessage(text);
            speak(text);
        } catch (e) {
            setAiMessage("You found a Super Star!");
            speak("You found a Super Star!");
        }
    };

    const resumeGame = () => {
        setAiMessage('');
        setStatus('playing');
        startGameLoop();
    };

    if (permissionError) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                <XCircle size={64} className="text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Camera Needed</h2>
                <p className="text-gray-500">We need your camera to find the stars! Please allow camera access in your browser settings.</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl flex flex-col items-center h-[80vh] relative overflow-hidden rounded-[2rem] border-4 border-indigo-200 shadow-2xl bg-black">
            
            {/* Background Video Feed */}
            <video 
                ref={videoRef}
                autoPlay 
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover opacity-80"
                style={{ transform: 'scaleX(-1)' }} // Mirror effect
            />
            
            {/* UI Overlay */}
            <div className="absolute top-4 left-4 z-20 flex gap-2">
                <div className="bg-white/90 backdrop-blur px-3 py-1 md:px-4 md:py-2 rounded-full shadow-lg flex items-center gap-2 border-2 border-yellow-400">
                    <Star className="text-yellow-500 fill-yellow-500 w-5 h-5 md:w-6 md:h-6" />
                    <span className="font-black text-yellow-900 text-lg md:text-xl">{score}</span>
                </div>
            </div>

            {/* Floating Items Layer */}
            {status === 'playing' && (
                <div className="absolute inset-0 z-10 overflow-hidden">
                    {items.map(item => (
                        <button
                            key={item.id}
                            onPointerDown={() => handleCatch(item.id, item.type)}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 active:scale-150 transition-transform cursor-pointer outline-none touch-manipulation"
                            style={{ 
                                left: `${item.x}%`, 
                                top: `${item.y}%`,
                                // Responsive font size via inline styles since we need dynamic logic or clamp
                                fontSize: item.type === 'planet' ? 'clamp(3rem, 10vw, 4rem)' : 'clamp(2.5rem, 8vw, 3rem)',
                                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))'
                            }}
                        >
                            <span className={item.type === 'alien' ? 'animate-bounce block' : item.type === 'gold' ? 'animate-spin-slow block' : ''}>
                                {item.emoji}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {/* Intro Screen */}
            {status === 'intro' && (
                <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-4 md:p-6 text-center animate-in fade-in">
                    <div className="bg-indigo-500 text-white p-6 rounded-3xl shadow-2xl max-w-sm w-full">
                        <Rocket size={48} className="mx-auto mb-4 animate-bounce md:w-16 md:h-16" />
                        <h1 className="text-2xl md:text-3xl font-black mb-2">Star Catcher AR</h1>
                        <p className="mb-6 opacity-90 text-sm md:text-base">Look at the screen! Tap the floating stars and aliens before they fall!</p>
                        <button 
                            onClick={startGame}
                            className="w-full bg-yellow-400 text-yellow-900 py-3 md:py-4 rounded-xl font-bold text-lg md:text-xl shadow-lg hover:bg-yellow-300 transition-colors flex items-center justify-center gap-2"
                        >
                            <Camera size={20} /> Start Camera
                        </button>
                    </div>
                </div>
            )}

            {/* Golden Message Modal */}
            {status === 'message' && (
                <div className="absolute inset-0 z-40 bg-indigo-900/90 backdrop-blur flex flex-col items-center justify-center p-6 text-center animate-in zoom-in">
                    <Confetti />
                    <Sparkles className="text-yellow-400 w-12 h-12 md:w-16 md:h-16 mb-4 animate-spin" />
                    <h2 className="text-yellow-300 font-bold uppercase tracking-widest mb-2 text-sm md:text-base">Rare Discovery!</h2>
                    <p className="text-xl md:text-3xl font-black text-white leading-tight mb-8 max-w-sm">
                        "{aiMessage}"
                    </p>
                    <button 
                        onClick={resumeGame}
                        className="bg-white text-indigo-900 px-6 py-3 md:px-8 md:py-4 rounded-full font-bold text-lg md:text-xl shadow-xl hover:scale-105 transition-transform flex items-center gap-2"
                    >
                        Keep Catching <RotateCcw />
                    </button>
                </div>
            )}

            {/* Error State */}
            {status === 'error' && (
                <div className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 text-center">
                    <XCircle size={64} className="text-red-500 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800">Oh no!</h2>
                    <p className="text-gray-600">We couldn't start the camera.</p>
                </div>
            )}
        </div>
    );
};
