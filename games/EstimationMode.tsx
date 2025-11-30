import React, { useState, useEffect, useRef } from 'react';
import { Eye, ArrowRight, RefreshCw, Vibrate } from 'lucide-react';
import { Confetti } from '../components';
import { speak } from '../utils';

interface Ball {
    x: number;
    y: number;
    r: number;
    color: string;
    id: number;
}

export const EstimationMode = () => {
    const [targetCount, setTargetCount] = useState(0);
    const [balls, setBalls] = useState<Ball[]>([]);
    const [userGuess, setUserGuess] = useState('');
    const [status, setStatus] = useState<'guessing' | 'result'>('guessing');
    const [score, setScore] = useState(0);
    
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const startRound = () => {
        const count = Math.floor(Math.random() * 40) + 10; // 10 to 50
        setTargetCount(count);
        setUserGuess('');
        setStatus('guessing');
        generateBalls(count);
        speak("Guess how many balls are in the jar?");
    };

    const generateBalls = (count: number) => {
        const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];
        const newBalls: Ball[] = [];
        
        // Simulating settling at bottom
        // We will fill from bottom up roughly
        for (let i = 0; i < count; i++) {
             newBalls.push({
                 id: i,
                 x: Math.random() * 200 + 20, // Canvas width approx 256
                 y: 300 - (i * 2) - Math.random() * 50, // Stack upwards
                 r: Math.random() * 8 + 8,
                 color: colors[Math.floor(Math.random() * colors.length)]
             });
        }
        setBalls(newBalls);
    };

    const drawJar = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        balls.forEach(ball => {
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
            ctx.fillStyle = ball.color;
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.stroke();
            
            // Shine
            ctx.beginPath();
            ctx.arc(ball.x - ball.r/3, ball.y - ball.r/3, ball.r/4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.fill();
        });
    };

    useEffect(() => {
        startRound();
    }, []);

    useEffect(() => {
        drawJar();
    }, [balls]);

    const shakeJar = () => {
        if (navigator.vibrate) navigator.vibrate(50);
        // Reshuffle positions slightly
        setBalls(prev => prev.map(b => ({
            ...b,
            x: Math.max(20, Math.min(236, b.x + (Math.random() - 0.5) * 40)),
            y: Math.max(50, Math.min(300, b.y + (Math.random() - 0.5) * 40))
        })));
    };

    const submitGuess = () => {
        const guess = parseInt(userGuess);
        if (isNaN(guess)) return;
        
        setStatus('result');
        const diff = Math.abs(guess - targetCount);
        const percentError = diff / targetCount;
        
        let msg = `There were ${targetCount}.`;
        if (percentError < 0.1) {
            setScore(s => s + 100);
            msg += " You are amazing! Very close!";
        } else if (percentError < 0.3) {
            setScore(s => s + 50);
            msg += " Good guess!";
        } else {
            msg += " Nice try!";
        }
        speak(msg);
    };

    const addDigit = (d: number) => {
        if (userGuess.length < 3) setUserGuess(prev => prev + d);
    };

    return (
        <div className="w-full max-w-2xl flex flex-col items-center">
            {status === 'result' && Math.abs(parseInt(userGuess) - targetCount) / targetCount < 0.1 && <Confetti />}

            <div className="bg-teal-100 px-6 py-3 rounded-full shadow-sm mb-6 flex items-center gap-2">
                 <Eye className="text-teal-600" />
                 <span className="font-bold text-teal-900">Score: {score}</span>
            </div>

            {/* Jar */}
            <div className="relative w-64 h-80 bg-white/50 border-x-8 border-b-8 border-t-2 border-teal-200 rounded-b-[3rem] rounded-t-xl shadow-inner mb-6 overflow-hidden backdrop-blur-sm">
                <canvas ref={canvasRef} width={256} height={320} className="w-full h-full" />
                
                {/* Glass Reflection */}
                <div className="absolute inset-0 rounded-b-[2.5rem] shadow-[inset_0_0_40px_rgba(20,184,166,0.2)] pointer-events-none">
                     <div className="absolute top-10 right-4 w-4 h-32 bg-white/20 rounded-full blur-sm"></div>
                </div>
                
                {status === 'result' && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center flex-col animate-in fade-in z-10">
                        <span className="text-6xl font-black text-teal-600">{targetCount}</span>
                        <span className="text-teal-800 font-bold uppercase tracking-widest text-sm">Actual</span>
                    </div>
                )}

                {/* Shake Button Overlay */}
                {status === 'guessing' && (
                    <button 
                        onClick={shakeJar}
                        className="absolute bottom-2 right-2 bg-teal-500 text-white p-2 rounded-full shadow-lg hover:bg-teal-600 active:rotate-12 transition-transform z-20"
                        title="Shake Jar"
                    >
                        <Vibrate size={20} />
                    </button>
                )}
            </div>

            {/* Controls */}
            {status === 'guessing' ? (
                <div className="w-full max-w-xs">
                    <div className="bg-white border-b-4 border-teal-100 rounded-2xl p-4 text-center mb-4 min-h-[4rem] flex items-center justify-center shadow-sm">
                        <span className="text-4xl font-mono font-bold text-gray-800 tracking-widest">{userGuess || "_"}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                        {[1,2,3,4,5,6,7,8,9].map(n => (
                            <button key={n} onClick={() => addDigit(n)} className="bg-white shadow-sm border-b-4 border-gray-100 p-4 rounded-xl text-xl font-bold text-teal-700 active:bg-teal-50 active:border-b-0 active:translate-y-1">
                                {n}
                            </button>
                        ))}
                        <button onClick={() => setUserGuess('')} className="bg-red-50 text-red-500 rounded-xl font-bold border-b-4 border-red-100 active:border-b-0 active:translate-y-1">C</button>
                        <button onClick={() => addDigit(0)} className="bg-white shadow-sm border-b-4 border-gray-100 p-4 rounded-xl text-xl font-bold text-teal-700 active:bg-teal-50 active:border-b-0 active:translate-y-1">0</button>
                        <button onClick={submitGuess} className="bg-teal-500 text-white rounded-xl flex items-center justify-center border-b-4 border-teal-700 active:border-b-0 active:translate-y-1 shadow-lg"><ArrowRight /></button>
                    </div>
                </div>
            ) : (
                <div className="text-center">
                    <p className="text-xl font-bold text-gray-700 mb-4">Your guess: <span className="text-teal-600">{userGuess}</span></p>
                    <button onClick={startRound} className="bg-teal-500 text-white px-8 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 hover:bg-teal-600 animate-bounce">
                        Next Jar <RefreshCw size={20} />
                    </button>
                </div>
            )}
        </div>
    );
};