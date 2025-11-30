import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, BookOpen, ArrowRight } from 'lucide-react';
import { getRandomItem, shuffleArray, speak } from '../utils';
import { Confetti } from '../components';
import { BIBLE_DATA, BibleQuestion } from '../data';

export const BibleMode = () => {
    const [current, setCurrent] = useState<BibleQuestion>(BIBLE_DATA[0]);
    const [options, setOptions] = useState<BibleQuestion[]>([]);
    const [status, setStatus] = useState<'playing' | 'correct' | 'wrong'>('playing');

    const setupRound = useCallback(() => {
        const next = getRandomItem(BIBLE_DATA);
        setCurrent(next);
        
        // Pick 2 distractors
        const distractors: BibleQuestion[] = [];
        while (distractors.length < 2) {
            const d = getRandomItem(BIBLE_DATA);
            if (d.id !== next.id && !distractors.find(x => x.id === d.id)) {
                distractors.push(d);
            }
        }
        
        setOptions(shuffleArray([next, ...distractors]));
        setStatus('playing');
        
        speak(next.q);
    }, []);

    useEffect(() => { setupRound(); }, []);

    const handleOptionClick = (item: BibleQuestion) => {
        if (status === 'correct') return; // Prevent clicking while celebrating

        if (item.id === current.id) {
            setStatus('correct');
            speak(`That's right! ${current.fact}`);
            // Wait for user to click next or read story, don't auto-advance instantly
        } else {
            setStatus('wrong');
            speak(`Not quite. Look for the ${current.e === '⛴️' ? 'Ark' : 'picture'}.`);
            setTimeout(() => setStatus('playing'), 1500);
        }
    }

    return (
        <div className="w-full max-w-xl flex flex-col items-center min-h-screen pb-20">
            {status === 'correct' && <Confetti />}
            
            <div className="bg-yellow-100 p-4 rounded-3xl shadow-xl w-full text-center border-4 border-yellow-200 mb-4 relative transition-all duration-500">
                 {status !== 'correct' ? (
                     <div className="py-4">
                        <h2 className="text-xl font-bold text-yellow-900 leading-tight mb-3">
                            {current.q}
                        </h2>
                        <button 
                            onClick={() => speak(current.q)}
                            className="bg-yellow-200 hover:bg-yellow-300 text-yellow-800 p-3 rounded-full transition-colors shadow-sm inline-flex mb-2"
                        >
                            <Volume2 size={24} />
                        </button>
                     </div>
                 ) : (
                     <div className="animate-in fade-in slide-in-from-bottom-2 py-2">
                         <div className="text-xs font-bold text-yellow-600 uppercase tracking-widest mb-1">{current.ref}</div>
                         <h2 className="text-lg font-bold text-green-700 leading-tight mb-4">
                            {current.fact}
                         </h2>
                         <div className="flex flex-wrap gap-2 justify-center">
                            <button
                                onClick={() => speak(current.story)}
                                className="bg-blue-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg hover:bg-blue-600 active:scale-95 transition-all flex items-center gap-2 text-sm"
                            >
                                <BookOpen size={16} />
                                Story Time
                            </button>
                            <button
                                onClick={setupRound}
                                className="bg-green-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg hover:bg-green-600 active:scale-95 transition-all flex items-center gap-2 text-sm"
                            >
                                Next <ArrowRight size={16} />
                            </button>
                         </div>
                     </div>
                 )}
            </div>

            <div className="grid grid-cols-2 gap-3 w-full">
                {options.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => handleOptionClick(item)}
                        className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 shadow-sm border-b-4 active:border-b-0 active:translate-y-1 transition-all p-2
                             ${status === 'correct' && item.id === current.id 
                                ? 'bg-green-500 border-green-700 text-white scale-105 ring-4 ring-green-300 z-10' 
                                : 'bg-white border-yellow-200 hover:bg-yellow-50'
                             }
                             ${status === 'wrong' && item.id !== current.id
                                ? 'opacity-30'
                                : ''
                             }
                             ${status === 'correct' && item.id !== current.id ? 'opacity-50' : ''}
                        `}
                    >
                        <span className="text-5xl filter drop-shadow-sm transition-transform duration-300 transform">{item.e}</span>
                        <span className={`font-black text-xs uppercase tracking-wide px-2 py-1 rounded-lg ${status === 'correct' && item.id === current.id ? 'bg-green-600 text-white' : 'bg-yellow-50 text-yellow-800'}`}>
                            {item.name}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};