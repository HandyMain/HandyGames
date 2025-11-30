
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Palette, Scissors, Camera, Sparkles, Check, RefreshCw, Eraser, Shirt, ArrowRight, Brush, Star } from 'lucide-react';
import { speak, getRandomItem } from '../utils';
import { Confetti } from '../components';

// --- ASSETS (SVG PATHS) ---

const HAIRSTYLES = [
    { name: 'Bald', path: null },
    { name: 'Spiky', path: "M30,30 Q50,10 70,30 L80,20 L90,40 L100,20 L110,40 Q130,10 150,30 L150,60 Q100,50 30,60 Z", color: '#FCD34D' },
    { name: 'Bob', path: "M30,80 Q30,10 90,10 Q150,10 150,80 L150,110 Q90,100 30,110 Z", color: '#8B4513' },
    { name: 'Buns', path: "M20,40 A20,20 0 1,1 20,80 M160,40 A20,20 0 1,0 160,80 M30,60 Q90,20 150,60", color: '#000000' },
    { name: 'Long', path: "M30,60 Q90,10 150,60 L160,150 Q90,140 20,150 Z", color: '#A855F7' }
];

const OUTFITS = [
    { name: 'T-Shirt', path: "M50,140 L50,180 L130,180 L130,140 L160,160 L170,140 L130,110 Q90,130 50,110 L10,140 L20,160 Z" },
    { name: 'Dress', path: "M60,120 L120,120 L140,250 Q90,260 40,250 Z" },
    { name: 'Overalls', path: "M60,140 L60,250 L85,250 L85,200 L95,200 L95,250 L120,250 L120,140 L110,110 L70,110 Z" }
];

const EYES = [
    { name: 'Dots', l: <circle cx="70" cy="80" r="5" fill="black" />, r: <circle cx="110" cy="80" r="5" fill="black" /> },
    { name: 'Happy', l: <path d="M60,80 Q70,70 80,80" fill="none" stroke="black" strokeWidth="3" />, r: <path d="M100,80 Q110,70 120,80" fill="none" stroke="black" strokeWidth="3" /> },
    { name: 'Big', l: <ellipse cx="70" cy="80" rx="8" ry="10" fill="black" />, r: <ellipse cx="110" cy="80" rx="8" ry="10" fill="black" /> },
    { name: 'Sunglasses', l: <rect x="55" y="70" width="30" height="20" rx="5" fill="#333" />, r: <rect x="95" y="70" width="30" height="20" rx="5" fill="#333" />, bridge: <line x1="85" y1="80" x2="95" y2="80" stroke="#333" strokeWidth="3" /> }
];

const MOUTHS = [
    { name: 'Smile', el: <path d="M70,110 Q90,130 110,110" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" /> },
    { name: 'O', el: <circle cx="90" cy="115" r="8" fill="none" stroke="black" strokeWidth="3" /> },
    { name: 'Laugh', el: <path d="M70,110 Q90,140 110,110 Z" fill="#FF9999" stroke="black" strokeWidth="1" /> },
    { name: 'Straight', el: <line x1="75" y1="115" x2="105" y2="115" stroke="black" strokeWidth="3" strokeLinecap="round" /> }
];

const ACCESSORIES = [
    { name: 'None', el: null },
    { name: 'Crown', el: <path d="M60,40 L70,10 L90,40 L110,10 L120,40 Z" fill="gold" stroke="#B8860B" strokeWidth="2" /> },
    { name: 'Bow', el: <path d="M90,30 L70,20 L70,40 Z M90,30 L110,20 L110,40 Z" fill="#EC4899" /> },
    { name: 'Chain', el: <path d="M60,140 Q90,180 120,140" fill="none" stroke="gold" strokeWidth="4" strokeDasharray="4,2" /> }
];

// --- MAIN COMPONENT ---

export const StyleStudioMode = () => {
    // Character State
    const [config, setConfig] = useState({
        hair: 1,
        outfit: 0,
        eyes: 0,
        mouth: 0,
        acc: 0
    });
    
    // Texture State
    const [customTexture, setCustomTexture] = useState<string | null>(null);
    const [isPainting, setIsPainting] = useState(false); // Mode toggle
    const [brushColor, setBrushColor] = useState('#EF4444');
    
    // AI State
    const [theme, setTheme] = useState("Freestyle");
    const [status, setStatus] = useState<'designing' | 'judging' | 'result'>('designing');
    const [score, setScore] = useState(0);
    const [critique, setCritique] = useState("");

    // Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);

    // --- CANVAS LOGIC ---
    const startDrawing = (e: React.PointerEvent) => {
        isDrawing.current = true;
        draw(e);
    };
    
    const draw = (e: React.PointerEvent) => {
        if (!isDrawing.current || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        ctx.fillStyle = brushColor;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2); // Simple circle brush
        ctx.fill();
    };

    const stopDrawing = () => {
        isDrawing.current = false;
    };

    const clearCanvas = () => {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, 100, 100);
        }
    };

    const applyTexture = () => {
        if (canvasRef.current) {
            const data = canvasRef.current.toDataURL();
            setCustomTexture(data);
            setIsPainting(false);
            speak("Looking stylish!");
        }
    };

    // Initialize blank canvas
    useEffect(() => {
        if (isPainting) clearCanvas();
    }, [isPainting]);

    // --- AI LOGIC ---
    const generateTheme = async () => {
        setTheme("Thinking...");
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: "Generate a fun, wacky, creative 3-word fashion theme for a kids game. Example: 'Neon Space Disco'. Just the words.",
            });
            const text = response.text || "Super Cool Party";
            setTheme(text);
            speak(`Today's theme is: ${text}`);
        } catch (e) {
            setTheme("Rainbow Dance Party");
        }
    };

    const judgeLook = async () => {
        setStatus('judging');
        speak("Let me see...");
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const description = `
                Theme: ${theme}.
                Hair: ${HAIRSTYLES[config.hair].name}.
                Outfit: ${OUTFITS[config.outfit].name} with ${customTexture ? 'custom painted fabric' : 'standard fabric'}.
                Accessory: ${ACCESSORIES[config.acc].name}.
            `;

            const prompt = `
                You are a kind, enthusiastic fashion judge for a kids game.
                Context: ${description}
                Task: Give a score out of 10 and a 1-sentence funny/nice critique.
                Format: JSON { "score": number, "comment": "string" }
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });

            const result = JSON.parse(response.text || "{}");
            setScore(result.score || 10);
            setCritique(result.comment || "You look amazing!");
            setStatus('result');
            speak(result.comment || "Wow! 10 out of 10!");

        } catch (e) {
            setScore(10);
            setCritique("You look absolutely stellar! A true masterpiece.");
            setStatus('result');
        }
    };

    // --- RENDER CHARACTER ---
    const renderCharacter = () => {
        const hair = HAIRSTYLES[config.hair];
        const outfit = OUTFITS[config.outfit];
        const eye = EYES[config.eyes];
        const mouth = MOUTHS[config.mouth];
        const acc = ACCESSORIES[config.acc];

        return (
            <svg viewBox="0 0 180 300" className="w-full h-full drop-shadow-xl">
                <defs>
                    {customTexture && (
                        <pattern id="userFabric" patternUnits="userSpaceOnUse" width="50" height="50">
                            <image href={customTexture} x="0" y="0" width="50" height="50" preserveAspectRatio="none" />
                        </pattern>
                    )}
                </defs>

                {/* Body Base */}
                <path d="M60,100 L60,200 L50,280 L80,280 L80,220 L100,220 L100,280 L130,280 L120,200 L120,100 Z" fill="#FFCCAA" /> {/* Legs/Torso Base */}
                <ellipse cx="90" cy="90" rx="45" ry="50" fill="#FFCCAA" /> {/* Head */}
                <path d="M40,110 Q20,150 30,170" fill="none" stroke="#FFCCAA" strokeWidth="15" strokeLinecap="round" /> {/* L Arm */}
                <path d="M140,110 Q160,150 150,170" fill="none" stroke="#FFCCAA" strokeWidth="15" strokeLinecap="round" /> {/* R Arm */}

                {/* Outfit */}
                <path 
                    d={outfit.path} 
                    fill={customTexture ? "url(#userFabric)" : "#60A5FA"} 
                    stroke="rgba(0,0,0,0.1)" 
                    strokeWidth="2"
                />

                {/* Face */}
                {eye.l} {eye.r} {eye.bridge && eye.bridge}
                {mouth.el}

                {/* Hair (Behind & Front logic simplified to just top layer for cartoon style) */}
                {hair.path && <path d={hair.path} fill={hair.color} stroke="none" />}

                {/* Accessory */}
                {acc.el}
            </svg>
        );
    };

    return (
        <div className="w-full h-full flex flex-col items-center bg-fuchsia-50 relative overflow-hidden">
            {status === 'result' && <Confetti />}

            {/* Top Bar */}
            <div className="w-full bg-white p-4 shadow-sm flex justify-between items-center z-10">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Theme</span>
                    <h2 className="text-lg font-black text-fuchsia-600 leading-none">{theme}</h2>
                </div>
                <div className="flex gap-2">
                    <button onClick={generateTheme} className="p-2 bg-fuchsia-100 rounded-full text-fuchsia-600 hover:bg-fuchsia-200">
                        <RefreshCw size={20} />
                    </button>
                    {status === 'designing' && (
                        <button 
                            onClick={judgeLook} 
                            className="bg-fuchsia-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg hover:bg-fuchsia-700 flex items-center gap-2"
                        >
                            <Camera size={16} /> Judge Me
                        </button>
                    )}
                    {status === 'result' && (
                        <button 
                            onClick={() => { setStatus('designing'); setScore(0); }} 
                            className="bg-green-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg hover:bg-green-600"
                        >
                            Keep Playing
                        </button>
                    )}
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 w-full max-w-4xl flex flex-col md:flex-row items-center justify-center p-4 gap-8">
                
                {/* 1. Character Stage */}
                <div className="relative w-64 h-96 bg-white rounded-[3rem] shadow-2xl border-8 border-white flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-100 to-pink-100 opacity-50"></div>
                    
                    {status === 'result' && (
                        <div className="absolute inset-0 z-20 bg-black/60 flex flex-col items-center justify-center text-center p-4 animate-in fade-in">
                            <Star size={64} className="text-yellow-400 fill-yellow-400 animate-bounce mb-4" />
                            <div className="text-6xl font-black text-white mb-2">{score}/10</div>
                            <p className="text-white font-medium text-lg leading-tight">{critique}</p>
                        </div>
                    )}

                    {renderCharacter()}
                </div>

                {/* 2. Controls / Fabric Studio */}
                <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 flex flex-col gap-6">
                    
                    {isPainting ? (
                        /* Fabric Studio View */
                        <div className="animate-in slide-in-from-right">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-700 flex items-center gap-2"><Brush size={20} /> Fabric Designer</h3>
                                <button onClick={() => setIsPainting(false)} className="text-gray-400 hover:text-gray-600">Cancel</button>
                            </div>
                            
                            <div className="flex gap-4 items-start">
                                <canvas 
                                    ref={canvasRef}
                                    width={100}
                                    height={100}
                                    className="w-32 h-32 border-4 border-dashed border-gray-300 rounded-xl bg-white touch-none cursor-crosshair shadow-inner"
                                    onPointerDown={startDrawing}
                                    onPointerMove={draw}
                                    onPointerUp={stopDrawing}
                                    onPointerLeave={stopDrawing}
                                />
                                <div className="flex flex-col gap-2">
                                    <div className="flex flex-wrap gap-2 max-w-[150px]">
                                        {['#EF4444', '#3B82F6', '#22C55E', '#EAB308', '#000000'].map(c => (
                                            <button 
                                                key={c}
                                                onClick={() => setBrushColor(c)}
                                                className={`w-8 h-8 rounded-full border-2 ${brushColor === c ? 'border-gray-800 scale-110' : 'border-gray-200'}`}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                    <button onClick={clearCanvas} className="text-xs text-red-500 font-bold flex items-center gap-1 mt-2">
                                        <Eraser size={14} /> Clear
                                    </button>
                                </div>
                            </div>

                            <button 
                                onClick={applyTexture}
                                className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-md hover:bg-indigo-700 flex items-center justify-center gap-2"
                            >
                                <Shirt size={20} /> Make Fabric
                            </button>
                        </div>
                    ) : (
                        /* Dress Up Controls View */
                        <div className="animate-in slide-in-from-left space-y-6">
                            {/* Toggle Groups */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-gray-500 text-sm uppercase">Hairstyle</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => setConfig(c => ({...c, hair: (c.hair + 1) % HAIRSTYLES.length}))} className="bg-gray-100 p-2 rounded-lg hover:bg-gray-200"><ArrowRight size={16} /></button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-gray-500 text-sm uppercase">Outfit</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => setConfig(c => ({...c, outfit: (c.outfit + 1) % OUTFITS.length}))} className="bg-gray-100 p-2 rounded-lg hover:bg-gray-200"><ArrowRight size={16} /></button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-gray-500 text-sm uppercase">Accessories</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => setConfig(c => ({...c, acc: (c.acc + 1) % ACCESSORIES.length}))} className="bg-gray-100 p-2 rounded-lg hover:bg-gray-200"><ArrowRight size={16} /></button>
                                    </div>
                                </div>
                                {/* Face Controls (Mini) */}
                                <div className="flex gap-2 justify-center pt-2">
                                    <button onClick={() => setConfig(c => ({...c, eyes: (c.eyes + 1) % EYES.length}))} className="px-3 py-1 bg-gray-50 rounded-full text-xs font-bold text-gray-500 border">Change Eyes</button>
                                    <button onClick={() => setConfig(c => ({...c, mouth: (c.mouth + 1) % MOUTHS.length}))} className="px-3 py-1 bg-gray-50 rounded-full text-xs font-bold text-gray-500 border">Change Mouth</button>
                                </div>
                            </div>

                            {/* Paint Button */}
                            <button 
                                onClick={() => setIsPainting(true)}
                                className="w-full bg-gradient-to-r from-pink-500 to-orange-400 text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
                            >
                                <Palette /> Design Fabric
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
