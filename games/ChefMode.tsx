
import React, { useState, useEffect, useRef } from 'react';
import { ChefHat, CheckCircle, Utensils, Play, RotateCcw } from 'lucide-react';
import { Confetti } from '../components';
import { speak, getRandomItem } from '../utils';

interface Task {
    id: string;
    name: string;
    emoji: string;
    duration: number; // in seconds
    color: string;
}

interface Arm {
    id: number;
    currentTask: Task | null;
    timeLeft: number;
}

const TASKS_DB: Task[] = [
    { id: 'egg', name: 'Fry Egg', emoji: '🍳', duration: 3, color: 'bg-yellow-100 border-yellow-300' },
    { id: 'chop', name: 'Chop Veg', emoji: '🥕', duration: 5, color: 'bg-orange-100 border-orange-300' },
    { id: 'boil', name: 'Boil Pasta', emoji: '🍝', duration: 8, color: 'bg-red-100 border-red-300' },
    { id: 'bake', name: 'Bake Cake', emoji: '🎂', duration: 10, color: 'bg-pink-100 border-pink-300' },
    { id: 'toast', name: 'Toast', emoji: '🍞', duration: 2, color: 'bg-amber-100 border-amber-300' },
    { id: 'soup', name: 'Stir Soup', emoji: '🍲', duration: 6, color: 'bg-green-100 border-green-300' },
];

export const ChefMode = () => {
    const [queue, setQueue] = useState<Task[]>([]);
    const [arms, setArms] = useState<Arm[]>([
        { id: 1, currentTask: null, timeLeft: 0 },
        { id: 2, currentTask: null, timeLeft: 0 },
        { id: 3, currentTask: null, timeLeft: 0 },
        { id: 4, currentTask: null, timeLeft: 0 },
    ]);
    const [score, setScore] = useState(0);
    const [selectedTaskIndex, setSelectedTaskIndex] = useState<number | null>(null);
    const [status, setStatus] = useState<'idle' | 'playing' | 'gameover'>('idle');
    const [timeLeft, setTimeLeft] = useState(60); // Total game time

    const gameLoopRef = useRef<number | null>(null);
    const orderIntervalRef = useRef<number | null>(null);

    const startGame = () => {
        setQueue([]);
        setArms(arms.map(a => ({ ...a, currentTask: null, timeLeft: 0 })));
        setScore(0);
        setStatus('playing');
        setTimeLeft(60);
        speak("Chef! Orders are coming in. Assign them to your arms quickly!");
        
        // Initial orders
        addOrder();
        addOrder();
        addOrder();
    };

    const addOrder = () => {
        const t = getRandomItem(TASKS_DB);
        setQueue(prev => {
            if (prev.length >= 6) return prev; // Max queue size
            return [...prev, { ...t, id: Math.random().toString() }];
        });
    };

    // Game Loop
    useEffect(() => {
        if (status !== 'playing') return;

        // Timer for game end
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setStatus('gameover');
                    speak(`Time's up! You finished ${score} orders.`);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Timer for incoming orders
        orderIntervalRef.current = window.setInterval(() => {
            addOrder();
        }, 4000); // New order every 4 seconds

        // High frequency loop for task progress
        const tickRate = 100; // ms
        gameLoopRef.current = window.setInterval(() => {
            setArms(prevArms => {
                let completedCount = 0;
                const newArms = prevArms.map(arm => {
                    if (arm.currentTask) {
                        const newTime = Math.max(0, arm.timeLeft - (tickRate / 1000));
                        if (newTime === 0) {
                            completedCount++;
                            return { ...arm, currentTask: null, timeLeft: 0 };
                        }
                        return { ...arm, timeLeft: newTime };
                    }
                    return arm;
                });
                
                if (completedCount > 0) {
                    setScore(s => s + completedCount);
                    // Optional: sound effect
                }
                return newArms;
            });
        }, tickRate);

        return () => {
            clearInterval(timer);
            if (orderIntervalRef.current) clearInterval(orderIntervalRef.current);
            if (gameLoopRef.current) clearInterval(gameLoopRef.current);
        };
    }, [status]);

    const handleArmClick = (armId: number) => {
        if (status !== 'playing' || selectedTaskIndex === null) return;
        
        const arm = arms.find(a => a.id === armId);
        if (arm?.currentTask) {
            speak("That arm is busy!");
            return;
        }

        // Assign task
        const task = queue[selectedTaskIndex];
        setArms(prev => prev.map(a => a.id === armId ? { ...a, currentTask: task, timeLeft: task.duration } : a));
        
        // Remove from queue
        setQueue(prev => prev.filter((_, i) => i !== selectedTaskIndex));
        setSelectedTaskIndex(null);
    };

    return (
        <div className="w-full max-w-2xl flex flex-col items-center">
            {status === 'gameover' && score > 10 && <Confetti />}

            <div className="w-full flex justify-between items-center mb-4 bg-white p-4 rounded-3xl shadow-sm border-2 border-slate-100">
                <div className="flex items-center gap-2">
                    <ChefHat className="text-orange-500" />
                    <span className="font-bold text-slate-700 text-lg">{score} Served</span>
                </div>
                <div className={`font-mono text-xl font-black ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-slate-700'}`}>
                    {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </div>
            </div>

            {status === 'idle' || status === 'gameover' ? (
                <div className="bg-white p-8 rounded-[3rem] text-center shadow-xl border-8 border-orange-100">
                    <Utensils size={64} className="mx-auto text-orange-400 mb-4" />
                    <h1 className="text-3xl font-black text-slate-800 mb-2">Instruction Chef</h1>
                    <p className="text-slate-500 mb-8 max-w-xs mx-auto">
                        You have 4 arms. Assign orders to free arms to cook them as fast as possible!
                    </p>
                    <button 
                        onClick={startGame}
                        className="bg-orange-500 text-white px-8 py-4 rounded-2xl font-bold text-xl shadow-lg hover:scale-105 transition-all flex items-center gap-2 mx-auto"
                    >
                        {status === 'gameover' ? <RotateCcw /> : <Play fill="currentColor" />}
                        {status === 'gameover' ? 'Play Again' : 'Start Cooking'}
                    </button>
                </div>
            ) : (
                <div className="w-full flex flex-col gap-6">
                    {/* Incoming Queue */}
                    <div className="bg-slate-100 p-4 rounded-3xl border-4 border-slate-200 min-h-[140px]">
                        <div className="flex justify-between items-center mb-2 px-2">
                            <h3 className="font-bold text-slate-500 uppercase tracking-widest text-sm">Incoming Orders</h3>
                            <span className="text-xs bg-slate-200 px-2 py-1 rounded text-slate-600">{queue.length}/6</span>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {queue.map((task, idx) => (
                                <button
                                    key={task.id}
                                    onClick={() => setSelectedTaskIndex(idx)}
                                    className={`
                                        flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-2xl flex flex-col items-center justify-center shadow-sm border-b-4 transition-all
                                        ${task.color}
                                        ${selectedTaskIndex === idx ? 'ring-4 ring-blue-400 scale-105 z-10' : 'opacity-90'}
                                    `}
                                >
                                    <span className="text-2xl md:text-3xl mb-1">{task.emoji}</span>
                                    <span className="text-[9px] md:text-[10px] font-bold text-slate-700 leading-tight px-1 text-center truncate w-full">{task.name}</span>
                                    <span className="text-[10px] md:text-xs font-mono bg-white/50 px-1 rounded mt-0.5">{task.duration}s</span>
                                </button>
                            ))}
                            {queue.length === 0 && (
                                <div className="w-full text-center py-8 text-slate-400 font-medium italic">
                                    Waiting for orders...
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Processor Cores (Arms) */}
                    <div>
                        <h3 className="font-bold text-slate-500 uppercase tracking-widest text-sm mb-2 px-2">Chef Arms (CPUs)</h3>
                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                            {arms.map((arm) => (
                                <button
                                    key={arm.id}
                                    onClick={() => handleArmClick(arm.id)}
                                    className={`
                                        h-28 md:h-32 rounded-3xl relative overflow-hidden transition-all border-4
                                        ${arm.currentTask 
                                            ? 'bg-white border-slate-200' 
                                            : selectedTaskIndex !== null 
                                                ? 'bg-blue-50 border-blue-300 border-dashed animate-pulse' 
                                                : 'bg-slate-50 border-slate-100'
                                        }
                                    `}
                                >
                                    <div className="absolute top-2 left-3 text-[10px] md:text-xs font-bold text-slate-400">ARM {arm.id}</div>
                                    
                                    {arm.currentTask ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center z-10 relative">
                                            <span className="text-3xl md:text-4xl mb-1 animate-bounce">{arm.currentTask.emoji}</span>
                                            <span className="font-bold text-slate-700 text-xs md:text-sm">{arm.currentTask.name}</span>
                                            
                                            {/* Progress Bar */}
                                            <div className="absolute bottom-0 left-0 h-2 bg-green-500 transition-all duration-100 ease-linear"
                                                 style={{ width: `${(arm.timeLeft / arm.currentTask.duration) * 100}%` }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <CheckCircle size={32} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
