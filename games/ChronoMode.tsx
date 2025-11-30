
import React, { useState, useEffect, useCallback } from 'react';
import { Confetti } from '../components';
import { shuffleArray, speak, getRandomItem } from '../utils';
import { ArrowRight, RotateCcw } from 'lucide-react';

interface Step {
  id: string;
  emoji: string;
  label: string;
  order: number;
}

interface Sequence {
  name: string;
  steps: Step[];
}

const SEQUENCES: Sequence[] = [
  {
    name: "Butterfly",
    steps: [
      { id: 'egg', emoji: '🥚', label: 'Egg', order: 1 },
      { id: 'caterpillar', emoji: '🐛', label: 'Caterpillar', order: 2 },
      { id: 'cocoon', emoji: '🧶', label: 'Cocoon', order: 3 },
      { id: 'butterfly', emoji: '🦋', label: 'Butterfly', order: 4 },
    ]
  },
  {
    name: "Plant",
    steps: [
      { id: 'seed', emoji: '🟤', label: 'Seed', order: 1 },
      { id: 'sprout', emoji: '🌱', label: 'Sprout', order: 2 },
      { id: 'plant', emoji: '🌿', label: 'Plant', order: 3 },
      { id: 'flower', emoji: '🌻', label: 'Flower', order: 4 },
    ]
  },
  {
    name: "Day",
    steps: [
      { id: 'morning', emoji: '🌅', label: 'Sunrise', order: 1 },
      { id: 'noon', emoji: '☀️', label: 'Noon', order: 2 },
      { id: 'evening', emoji: '🌇', label: 'Sunset', order: 3 },
      { id: 'night', emoji: '🌙', label: 'Night', order: 4 },
    ]
  },
  {
    name: "Chicken",
    steps: [
      { id: 'egg', emoji: '🥚', label: 'Egg', order: 1 },
      { id: 'crack', emoji: '🐣', label: 'Hatching', order: 2 },
      { id: 'chick', emoji: '🐥', label: 'Chick', order: 3 },
      { id: 'hen', emoji: '🐔', label: 'Chicken', order: 4 },
    ]
  }
];

export const ChronoMode = () => {
  const [currentSeq, setCurrentSeq] = useState<Sequence | null>(null);
  const [items, setItems] = useState<Step[]>([]);
  const [nextExpected, setNextExpected] = useState(1);
  const [status, setStatus] = useState<'playing' | 'won'>('playing');

  const startRound = useCallback(() => {
    const seq = getRandomItem(SEQUENCES);
    setCurrentSeq(seq);
    setItems(shuffleArray([...seq.steps]));
    setNextExpected(1);
    setStatus('playing');
    speak(`What happens first in the ${seq.name} story?`);
  }, []);

  useEffect(() => {
    startRound();
  }, [startRound]);

  const handleItemClick = (step: Step) => {
    if (status === 'won') return;

    if (step.order === nextExpected) {
      // Correct!
      if (nextExpected === 4) {
        setStatus('won');
        speak("You did it! That is the correct order.");
      } else {
        speak("Yes! What happens next?");
        setNextExpected(n => n + 1);
      }
    } else {
      speak(`Not quite. Try finding step number ${nextExpected}.`);
    }
  };

  return (
    <div className="w-full max-w-2xl flex flex-col items-center">
      {status === 'won' && <Confetti />}

      <div className="bg-amber-100 p-6 rounded-3xl w-full text-center shadow-lg border-4 border-amber-200 mb-8">
         <h2 className="text-sm font-bold text-amber-600 uppercase tracking-widest mb-2">Time Detective</h2>
         <h1 className="text-3xl font-black text-amber-900">{currentSeq?.name} Story</h1>
         <p className="text-amber-700 mt-2">Tap the pictures in the right order!</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
         {items.map((item) => {
             const isDone = item.order < nextExpected;
             const isCurrent = item.order === nextExpected;
             
             return (
               <button
                 key={item.id}
                 onClick={() => handleItemClick(item)}
                 disabled={isDone}
                 className={`
                    aspect-square rounded-2xl flex flex-col items-center justify-center p-2 shadow-md transition-all
                    ${isDone ? 'bg-green-100 border-4 border-green-400 opacity-50' : 'bg-white border-b-4 border-gray-200 active:border-b-0 active:translate-y-1'}
                    ${status === 'won' ? 'bg-green-100 border-green-400' : ''}
                 `}
               >
                  <span className="text-6xl md:text-7xl mb-2">{item.emoji}</span>
                  <span className="font-bold text-gray-600 text-sm md:text-base">{item.label}</span>
                  
                  {isDone && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                          {item.order}
                      </div>
                  )}
               </button>
             );
         })}
      </div>
      
      {status === 'won' && (
          <button 
             onClick={startRound}
             className="mt-8 bg-amber-500 text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-amber-600 shadow-lg flex items-center gap-2 animate-bounce"
          >
             Play Again <RotateCcw size={20} />
          </button>
      )}

      <div className="flex gap-2 mt-8">
          {Array.from({length: 4}).map((_, i) => (
              <div 
                key={i} 
                className={`w-4 h-4 rounded-full transition-colors ${i + 1 < nextExpected || status === 'won' ? 'bg-green-500' : 'bg-gray-300'}`} 
              />
          ))}
      </div>
    </div>
  );
};
