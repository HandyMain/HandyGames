

import React, { useState, useEffect, useCallback } from 'react';
import { getRandomItem, shuffleArray, speak, playSound } from '../utils';
import { Confetti } from '../components';
import { Hand } from 'lucide-react';

export const CountingMode = ({ difficulty = 'easy' }: { difficulty: 'easy' | 'medium' | 'hard' }) => {
    const [target, setTarget] = useState(0);
    const [options, setOptions] = useState<number[]>([]);
    const [animal, setAnimal] = useState('🦁');
    const [status, setStatus] = useState<'counting' | 'picking' | 'correct' | 'wrong'>('counting');
    const [countProgress, setCountProgress] = useState(0);

    const animals = ['🦁', '🐯', '🐻', '🐶', '🐱', '🐸', '🐙', '🐵'];

    const setupRound = useCallback(() => {
        let max = 5;
        if (difficulty === 'medium') max = 10;
        if (difficulty === 'hard') max = 20;

        const newTarget = Math.floor(Math.random() * max) + 1;
        setTarget(newTarget);
        setAnimal(getRandomItem(animals));
        setCountProgress(0);
        
        // Generate options
        const opts = new Set<number>();
        opts.add(newTarget);
        while(opts.size < 3) {
            const r = Math.floor(Math.random() * max) + 1;
            if(r !== newTarget) opts.add(r);
        }
        setOptions(shuffleArray(Array.from(opts)));
        setStatus('counting');
        
        speak(`Tap the ${difficulty === 'easy' ? 'animals' : 'screen'} to count them!`);
    }, [difficulty]);

    useEffect(() => { setupRound(); }, [difficulty]);

    const handleAnimalClick = (index: number) => {
        if (status !== 'counting') return;
        
        // Increment count
        const next = countProgress + 1;
        setCountProgress(next);
        
        // Visual/Audio Feedback
        playSound('pop');
        speak(next.toString());

        if (next >= target) {
            setStatus('picking');
            setTimeout(() => speak("How many are there?"), 500);
        }
    };

    const handleOptionClick = (num: number) => {
        if (num === target) {
            setStatus('correct');
            playSound('success');
            speak(`That's right! There are ${target} animals.`);
            setTimeout(setupRound, 2000);
        } else {
            playSound('error');
            speak(`Not quite. Try counting again!`);
            setStatus('counting');
            setCountProgress(0);
        }
    }

    return (
        <div className="w-full max-w-2xl flex flex-col items-center">
            {status === 'correct' && <Confetti />}
            
            <h2 className="text-xl md:text-3xl font-bold text-pink-900 mb-4 md:mb-6 bg-white/60 px-6 py-2 rounded-full backdrop-blur-sm">
                {status === 'picking' ? "How many?" : "Tap to count!"}
            </h2>

            <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-4 md:p-8 shadow-xl mb-6 md:mb-8 min-h-[300px] flex items-center justify-center w-full border-b-8 border-pink-100 relative overflow-hidden">
                <div className="flex flex-wrap gap-4 md:gap-8 justify-center max-w-[500px]">
                    {Array.from({length: target}).map((_, i) => {
                        const isCounted = i < countProgress;
                        return (
                            <button 
                                key={i}
                                onClick={() => handleAnimalClick(i)}
                                disabled={isCounted}
                                className={`
                                    text-5xl md:text-7xl transform transition-all duration-300
                                    ${isCounted ? 'scale-110 opacity-100 filter drop-shadow-lg grayscale-0' : 'scale-100 opacity-60 grayscale'}
                                    ${status === 'correct' ? 'animate-bounce' : ''}
                                `}
                            >
                                {animal}
                                {isCounted && (
                                    <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
                                        {i + 1}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
                
                {status === 'counting' && countProgress < target && (
                    <div className="absolute bottom-4 animate-bounce text-pink-400 flex items-center gap-2 bg-white/80 px-4 py-1 rounded-full shadow-sm">
                        <Hand size={20} /> Tap animals
                    </div>
                )}
            </div>

            {status === 'picking' || status === 'correct' ? (
                <div className="flex gap-3 md:gap-4 w-full justify-center animate-in slide-in-from-bottom-4">
                    {options.map((num) => (
                        <button
                            key={num}
                            onClick={() => handleOptionClick(num)}
                            className={`w-20 h-20 md:w-28 md:h-28 rounded-2xl text-4xl md:text-5xl font-black shadow-lg border-b-8 active:border-b-0 active:translate-y-2 transition-all
                                ${status === 'correct' && num === target 
                                    ? 'bg-green-500 border-green-700 text-white scale-110' 
                                    : 'bg-white border-pink-200 text-pink-600 hover:bg-pink-50'
                                }
                            `}
                        >
                            {num}
                        </button>
                    ))}
                </div>
            ) : (
                <div className="h-28 flex items-center text-gray-400 font-bold text-lg">
                    Count them all to see the numbers!
                </div>
            )}
        </div>
    );
};