
import React, { useState, useEffect, useCallback } from 'react';
import { getRandomItem, shuffleArray, speak } from '../utils';
import { Confetti } from '../components';

export const PatternMode = ({ difficulty = 'easy' }: { difficulty: 'easy' | 'medium' | 'hard' }) => {
    const [sequence, setSequence] = useState<string[]>([]);
    const [answer, setAnswer] = useState<string>('');
    const [options, setOptions] = useState<string[]>([]);
    const [status, setStatus] = useState<'playing' | 'correct' | 'wrong'>('playing');

    const items = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟧'];

    const setupRound = useCallback(() => {
        let type = 'ABAB';
        if (difficulty === 'easy') {
            type = 'ABAB';
        } else if (difficulty === 'medium') {
            type = Math.random() > 0.5 ? 'AABB' : 'ABAB';
        } else {
            // Hard
            type = Math.random() > 0.5 ? 'ABC' : 'AAB';
        }

        const a = getRandomItem(items);
        let b = getRandomItem(items);
        while(b === a) b = getRandomItem(items);
        
        let seq: string[] = [];
        let ans = '';

        if (type === 'ABAB') {
            seq = [a, b, a];
            ans = b;
        } else if (type === 'AABB') {
            seq = [a, a, b];
            ans = b;
        } else if (type === 'AAB') {
             seq = [a, a, b];
             ans = b; // Actually this is AABB but shorter? Let's do AAB -> A
             seq = [a, a, b];
             // Pattern is AAB AAB. So next is A
             ans = a; 
        } else {
             // ABC
             let c = getRandomItem(items);
             while(c === a || c === b) c = getRandomItem(items);
             seq = [a, b, c];
             ans = a; // Cycles back to A
        }

        setSequence(seq);
        setAnswer(ans);

        // Options
        const opts = new Set<string>();
        opts.add(ans);
        while(opts.size < 3) {
            const r = getRandomItem(items);
            if(r !== ans) opts.add(r);
        }
        setOptions(shuffleArray(Array.from(opts)));
        setStatus('playing');
        speak("What comes next to complete the pattern?");
    }, [difficulty]);

    useEffect(() => { setupRound(); }, [difficulty]);

    const handleOptionClick = (item: string) => {
        if (item === answer) {
            setStatus('correct');
            speak("Good job! The train is leaving!");
            setTimeout(setupRound, 3000);
        } else {
            speak("Not quite. Try again!");
        }
    }

    return (
        <div className="w-full max-w-2xl flex flex-col items-center">
            {status === 'correct' && <Confetti />}
            
            <h2 className="text-xl md:text-3xl font-bold text-indigo-900 mb-6 md:mb-8 bg-white/60 px-6 py-2 rounded-full backdrop-blur-sm text-center">
                Complete the Pattern
            </h2>

            {/* Train Track - Scrollable for mobile */}
            <div className="w-full overflow-x-auto pb-4 mb-6 md:mb-12 no-scrollbar">
                <div className="relative h-28 md:h-40 flex items-end justify-center min-w-max px-4">
                    <div className="absolute bottom-2 left-0 right-0 h-2 bg-gray-400 rounded-full"></div>
                    <div className={`flex gap-1 md:gap-2 transition-transform duration-1000 ease-in ${status === 'correct' ? 'translate-x-[200%]' : ''}`}>
                        {/* Engine */}
                        <div className="w-16 h-16 md:w-24 md:h-24 bg-indigo-500 rounded-xl relative flex items-center justify-center text-2xl md:text-4xl shadow-lg mb-2 md:mb-4 shrink-0">
                            🚂
                            <div className="absolute -bottom-2 md:-bottom-3 -left-1 md:-left-2 w-5 h-5 md:w-8 md:h-8 bg-gray-800 rounded-full border-2 md:border-4 border-gray-300"></div>
                            <div className="absolute -bottom-2 md:-bottom-3 -right-1 md:-right-2 w-5 h-5 md:w-8 md:h-8 bg-gray-800 rounded-full border-2 md:border-4 border-gray-300"></div>
                        </div>

                        {/* Cars */}
                        {sequence.map((item, i) => (
                            <div key={i} className="w-16 h-16 md:w-24 md:h-24 bg-blue-100 border-2 md:border-4 border-blue-300 rounded-xl relative flex items-center justify-center text-3xl md:text-5xl shadow-lg mb-2 md:mb-4 shrink-0">
                                {item}
                                <div className="absolute -bottom-2 md:-bottom-3 left-2 md:left-4 w-4 h-4 md:w-6 md:h-6 bg-gray-800 rounded-full border-2 md:border-4 border-gray-300"></div>
                                <div className="absolute -bottom-2 md:-bottom-3 right-2 md:right-4 w-4 h-4 md:w-6 md:h-6 bg-gray-800 rounded-full border-2 md:border-4 border-gray-300"></div>
                                {/* Connector */}
                                <div className="absolute top-1/2 -left-2 md:-left-3 w-2 md:w-4 h-1 md:h-2 bg-gray-600"></div>
                            </div>
                        ))}

                        {/* Mystery Car */}
                        <div className="w-16 h-16 md:w-24 md:h-24 bg-indigo-50 border-2 md:border-4 border-dashed border-indigo-300 rounded-xl relative flex items-center justify-center text-3xl md:text-5xl shadow-lg mb-2 md:mb-4 shrink-0">
                            {status === 'correct' ? answer : '?'}
                            <div className="absolute -bottom-2 md:-bottom-3 left-2 md:left-4 w-4 h-4 md:w-6 md:h-6 bg-gray-800 rounded-full border-2 md:border-4 border-gray-300"></div>
                            <div className="absolute -bottom-2 md:-bottom-3 right-2 md:right-4 w-4 h-4 md:w-6 md:h-6 bg-gray-800 rounded-full border-2 md:border-4 border-gray-300"></div>
                            <div className="absolute top-1/2 -left-2 md:-left-3 w-2 md:w-4 h-1 md:h-2 bg-gray-600"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-3 md:gap-4 w-full justify-center">
                {options.map((item, index) => (
                    <button
                        key={index}
                        onClick={() => handleOptionClick(item)}
                        className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl text-4xl md:text-5xl font-black shadow-lg border-b-4 active:border-b-0 active:translate-y-1 transition-all
                            ${status === 'correct' && item === answer ? 'bg-green-500 border-green-700 text-white' : 'bg-white border-indigo-200 hover:bg-indigo-50'}
                        `}
                    >
                        {item}
                    </button>
                ))}
            </div>
        </div>
    );
};
