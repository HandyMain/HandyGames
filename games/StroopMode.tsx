
import React, { useState, useEffect, useRef } from 'react';
import { Gauge, Play, AlertTriangle } from 'lucide-react';
import { speak, getRandomItem, shuffleArray } from '../utils';

const COLORS = [
    { name: 'RED', hex: '#EF4444' },
    { name: 'BLUE', hex: '#3B82F6' },
    { name: 'GREEN', hex: '#22C55E' },
    { name: 'YELLOW', hex: '#EAB308' },
];

export const StroopMode = ({ difficulty = 'easy' }: { difficulty: 'easy' | 'medium' | 'hard' }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [word, setWord] = useState('');
    const [colorHex, setColorHex] = useState('');
    const [options, setOptions] = useState<typeof COLORS>([]);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);

    const timerRef = useRef<number | null>(null);

    const startGame = () => {
        setIsPlaying(true);
        setScore(0);
        
        // Adjust time based on difficulty
        let initialTime = 45; // Easy
        if (difficulty === 'medium') initialTime = 30;
        if (difficulty === 'hard') initialTime = 15;
        
        setTimeLeft(initialTime);
        speak("Click the color, not the word! Go!");
        nextRound();
        
        timerRef.current = window.setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    endGame();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const endGame = () => {
        if(timerRef.current) clearInterval(timerRef.current);
        setIsPlaying(false);
        speak(`Time's up! You got ${score} points.`);
    };

    const nextRound = () => {
        const textObj = getRandomItem(COLORS);
        
        // On hard, ensure text and color almost always mismatch to confuse user
        let colorObj = getRandomItem(COLORS);
        if (difficulty === 'hard' && Math.random() > 0.3) {
             while(colorObj.name === textObj.name) {
                 colorObj = getRandomItem(COLORS);
             }
        }
        
        setWord(textObj.name);
        setColorHex(colorObj.hex);
        setOptions(shuffleArray([...COLORS]));
    };

    const handleOptionClick = (option: typeof COLORS[number]) => {
        // Correct answer is the COLOR of the text, not the text itself
        if (option.hex === colorHex) {
            const points = difficulty === 'hard' ? 20 : 10;
            setScore(s => s + points);
        } else {
            const penalty = difficulty === 'hard' ? 20 : 10;
            setScore(s => Math.max(0, s - penalty));
            speak("Wrong!");
        }
        nextRound();
    };

    useEffect(() => {
        // Reset if difficulty changes while playing
        if (isPlaying) endGame();
        return () => { if(timerRef.current) clearInterval(timerRef.current); };
    }, [difficulty]);

    if (!isPlaying) {
        return (
            <div className="w-full max-w-md flex flex-col items-center bg-white p-8 rounded-3xl shadow-xl border-4 border-red-200 text-center">
                <Gauge size={64} className="text-red-500 mb-4" />
                <h1 className="text-3xl font-black text-red-900 mb-2">Reaction Racer</h1>
                <div className="inline-block bg-red-50 px-4 py-1 rounded-full text-red-800 font-bold mb-4 uppercase text-xs tracking-widest">
                    {difficulty} Mode
                </div>
                <p className="text-gray-600 mb-8 text-lg">
                    A word will appear. <br/>
                    <span className="font-bold text-red-500">Click the COLOR of the ink</span>.<br/>
                    <span className="text-sm">(Don't read the word!)</span>
                </p>
                {score > 0 && <p className="mb-6 font-bold text-xl text-green-600">Last Score: {score}</p>}
                
                <button onClick={startGame} className="w-full bg-red-500 text-white py-4 rounded-2xl font-bold text-xl shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2">
                    <Play fill="currentColor" /> Start Race
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-xl flex flex-col items-center">
            
            <div className="flex justify-between w-full mb-8 px-4">
                 <div className="text-2xl font-black text-gray-800">{score} pts</div>
                 <div className={`text-2xl font-black ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-gray-500'}`}>{timeLeft}s</div>
            </div>

            {/* The Trick Card */}
            <div className="bg-white w-full h-48 rounded-[3rem] shadow-2xl flex items-center justify-center border-8 border-gray-100 mb-8">
                 <span className="text-6xl md:text-8xl font-black tracking-wider" style={{ color: colorHex }}>
                     {word}
                 </span>
            </div>

            <p className="mb-4 text-gray-400 font-bold uppercase tracking-widest text-sm">Click the color:</p>

            <div className="grid grid-cols-2 gap-4 w-full">
                {options.map((opt) => (
                    <button
                        key={opt.name}
                        onClick={() => handleOptionClick(opt)}
                        className="h-24 rounded-2xl shadow-md border-b-4 border-gray-200 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center bg-white hover:bg-gray-50"
                    >
                        <div className="w-12 h-12 rounded-full border-2 border-black/10 shadow-inner" style={{ backgroundColor: opt.hex }}></div>
                    </button>
                ))}
            </div>
        </div>
    );
};
