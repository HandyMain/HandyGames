

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Star, Flame, Timer, Volume2 } from 'lucide-react';
import { getRandomItem, shuffleArray, speak, playSound } from '../utils';
import { Confetti } from '../components';

export const FindItMode = ({ pool }: { pool: string[] }) => {
  const [target, setTarget] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [status, setStatus] = useState<'playing' | 'correct' | 'wrong' | 'timeout'>('playing');
  const [wrongIndex, setWrongIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const timerRef = useRef<number | null>(null);

  const describeItem = (item: string) => {
    if (/[0-9]/.test(item)) return `number ${item}`;
    return `letter ${item}`;
  };

  const getItemType = (item: string) => {
      if (/[0-9]/.test(item)) return "Number";
      return "Letter";
  }

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(10);
    timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
            if (prev <= 1) {
                if(timerRef.current) clearInterval(timerRef.current);
                return 0;
            }
            return prev - 1;
        });
    }, 1000);
  }, []);

  useEffect(() => {
    if (timeLeft === 0 && status === 'playing') {
        setStatus('timeout');
        setStreak(0); // Reset streak on timeout
        playSound('error');
        speak(`Time's up! The answer was ${target}`);
        setTimeout(setupRound, 3000);
    }
  }, [timeLeft, status]);

  const setupRound = useCallback(() => {
    const newTarget = getRandomItem(pool);
    const distractors: string[] = [];
    const uniquePool = Array.from(new Set(pool));
    const needed = Math.min(3, uniquePool.length - 1); 

    if (uniquePool.length < 2) {
         setTarget(uniquePool[0] || '?');
         setOptions([uniquePool[0] || '?']);
         return;
    }

    while (distractors.length < needed) {
      const d = getRandomItem(uniquePool);
      if (d !== newTarget && !distractors.includes(d)) {
        distractors.push(d);
      }
    }

    const newOptions = shuffleArray([newTarget, ...distractors]);
    setTarget(newTarget);
    setOptions(newOptions);
    setStatus('playing');
    setWrongIndex(null);
    startTimer();
    
    setTimeout(() => speak(`Find the ${describeItem(newTarget)}`), 300);
  }, [pool]);

  useEffect(() => {
    setupRound();
    return () => { if(timerRef.current) clearInterval(timerRef.current); }
  }, []); 

  const handleOptionClick = (item: string, index: number) => {
    if (status !== 'playing') return;

    if (item === target) {
      if (timerRef.current) clearInterval(timerRef.current);
      setStatus('correct');
      setScore(s => s + 1);
      setStreak(s => s + 1);
      playSound('success');
      speak("Great job!");
      setTimeout(setupRound, 2000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current); 
      setStatus('wrong');
      setWrongIndex(index);
      setStreak(0); // Reset streak
      playSound('error');
      
      speak(`No, that is not it. That is the ${describeItem(item)}. You are looking for the ${describeItem(target)}.`);
      
      setTimeout(() => {
        setStatus('playing');
        setWrongIndex(null);
        startTimer(); 
      }, 4000);
    }
  };

  return (
    <div className="w-full max-w-2xl flex flex-col items-center">
      {status === 'correct' && <Confetti />}
      
      {/* Top Bar: Score, Streak and Timer */}
      <div className="w-full flex justify-between items-center mb-4 md:mb-6 px-2 gap-2">
        <div className="flex gap-2">
            <div className="flex items-center gap-1 md:gap-2 bg-white/50 backdrop-blur px-3 py-1 md:px-4 md:py-2 rounded-full shadow-sm">
                <Star size={16} className="text-yellow-500 fill-yellow-500" />
                <span className="font-bold text-base md:text-lg text-purple-900">{score}</span>
            </div>
            
            <div className={`flex items-center gap-1 md:gap-2 px-3 py-1 md:px-4 md:py-2 rounded-full shadow-sm border-2 transition-all duration-500 ${streak > 2 ? 'bg-orange-100 border-orange-300 scale-110' : 'bg-white/50 border-transparent'}`}>
                <Flame size={16} className={`${streak > 2 ? 'text-orange-500 fill-orange-500 animate-pulse' : 'text-gray-400'}`} />
                <span className={`font-bold text-base md:text-lg ${streak > 2 ? 'text-orange-800' : 'text-gray-500'}`}>{streak}</span>
            </div>
        </div>

        <div className={`flex items-center gap-1 md:gap-2 px-3 py-1 md:px-4 md:py-2 rounded-full shadow-sm font-mono text-lg md:text-xl font-bold transition-all ${timeLeft <= 3 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-white/50 text-purple-900'}`}>
            <Timer size={16} className={timeLeft <= 3 ? 'animate-bounce' : ''} />
            <span>{timeLeft}</span>
        </div>
      </div>

      {/* Target Instruction */}
      <div className="text-xl md:text-3xl font-bold text-purple-900 mb-4 md:mb-6 text-center bg-white/60 p-3 md:p-6 rounded-3xl shadow-lg backdrop-blur-sm flex items-center justify-center gap-3 md:gap-4 w-full">
        <span>Find the {getItemType(target)}</span>
        <button 
            onClick={() => speak(`Find the ${describeItem(target)}`)}
            className="bg-purple-100 hover:bg-purple-200 text-purple-600 p-2 rounded-full transition-colors"
        >
            <Volume2 size={20} className="md:w-8 md:h-8" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4 w-full">
        {options.map((item, index) => (
          <button
            key={index}
            onClick={() => handleOptionClick(item, index)}
            className={`
              h-32 md:h-40 rounded-3xl text-5xl md:text-6xl font-bold shadow-md border-b-8 transition-all active:border-b-0 active:translate-y-2
              flex items-center justify-center relative overflow-hidden
              ${status === 'correct' && item === target 
                ? 'bg-green-500 border-green-700 text-white scale-105 z-10' 
                : ''
              }
              ${status === 'wrong' && wrongIndex === index
                ? 'bg-red-500 border-red-700 text-white animate-shake'
                : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'
              }
              ${status === 'timeout' && item === target
                 ? 'bg-blue-200 border-blue-400 text-blue-800 ring-4 ring-blue-300'
                 : ''
              }
              ${status === 'timeout' && item !== target
                 ? 'opacity-50'
                 : ''
              }
            `}
          >
             <span className="z-10">{item}</span>
             <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-current" />
                <div className="absolute bottom-2 right-2 w-12 h-12 rounded-full bg-current" />
             </div>
          </button>
        ))}
      </div>
       <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px) rotate(-5deg); }
          75% { transform: translateX(5px) rotate(5deg); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
};