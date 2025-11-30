
import React, { useState, useEffect, useCallback } from 'react';
import { Circle, Square, Triangle, Hexagon, Star, HelpCircle, ArrowRight } from 'lucide-react';
import { speak, shuffleArray, getRandomItem } from '../utils';
import { Confetti } from '../components';

type ShapeType = 'circle' | 'square' | 'triangle' | 'star';
type ColorType = 'red' | 'blue' | 'green' | 'yellow';

interface GameItem {
  id: string;
  shape: ShapeType;
  color: ColorType;
}

const SHAPES: ShapeType[] = ['circle', 'square', 'triangle', 'star'];
const COLORS: ColorType[] = ['red', 'blue', 'green', 'yellow'];

const ShapeIcon = ({ shape, className }: { shape: ShapeType, className?: string }) => {
  switch (shape) {
    case 'circle': return <Circle className={className} fill="currentColor" />;
    case 'square': return <Square className={className} fill="currentColor" />;
    case 'triangle': return <Triangle className={className} fill="currentColor" />;
    case 'star': return <Star className={className} fill="currentColor" />;
    default: return <HelpCircle className={className} />;
  }
};

export const LogicMode = () => {
  const [items, setItems] = useState<GameItem[]>([]);
  const [prompt, setPrompt] = useState("");
  const [correctIds, setCorrectIds] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<'playing' | 'correct' | 'wrong'>('playing');

  const getColorClass = (color: ColorType) => {
    switch(color) {
      case 'red': return 'text-red-500';
      case 'blue': return 'text-blue-500';
      case 'green': return 'text-green-500';
      case 'yellow': return 'text-yellow-400';
    }
  };

  const setupRound = useCallback(() => {
    // 1. Generate random grid items (6 items)
    const newItems: GameItem[] = [];
    for(let i=0; i<6; i++) {
        newItems.push({
            id: `item-${i}-${Date.now()}`,
            shape: getRandomItem(SHAPES),
            color: getRandomItem(COLORS)
        });
    }
    setItems(newItems);
    setStatus('playing');

    // 2. Generate Logic Puzzle
    // Types: 
    // A: Touch NOT [Color]
    // B: Touch NOT [Shape]
    // C: Touch [Shape] that is NOT [Color]
    
    const type = Math.random();
    let question = "";
    let validIds: string[] = [];

    if (type < 0.4) {
        // NOT Color
        const targetColor = getRandomItem(COLORS);
        question = `Touch a shape that is NOT ${targetColor}`;
        validIds = newItems.filter(i => i.color !== targetColor).map(i => i.id);
    } else if (type < 0.7) {
        // NOT Shape
        const targetShape = getRandomItem(SHAPES);
        question = `Touch a shape that is NOT a ${targetShape}`;
        validIds = newItems.filter(i => i.shape !== targetShape).map(i => i.id);
    } else {
        // Complex: Shape + NOT Color
        // Find a valid shape first to ensure answer exists
        const possibleTargets = newItems;
        if (possibleTargets.length === 0) return setupRound(); // Retry if empty (unlikely)
        
        const targetItem = getRandomItem(possibleTargets);
        // "Touch the Square that is NOT Red"
        // We need to pick a constraint that makes sense.
        // Let's invert: "Touch the [Shape] that is NOT [Color]"
        
        // Ensure we request a shape that actually exists in the grid
        const shapePresent = targetItem.shape;
        
        // Pick a color to negate.
        // If we say "Touch the Circle that is not Red", we need to make sure there is a Circle that is not Red.
        // We know targetItem is a Circle. Let's say targetItem is Blue.
        // If we say "not Red", Blue Circle is valid.
        
        const avoidColor = getRandomItem(COLORS.filter(c => c !== targetItem.color));
        question = `Touch the ${targetItem.shape} that is NOT ${avoidColor}`;
        
        validIds = newItems.filter(i => i.shape === targetItem.shape && i.color !== avoidColor).map(i => i.id);
    }

    // Safety check: if rng made a question with no answers, retry
    if (validIds.length === 0) {
        setupRound();
        return;
    }

    setPrompt(question);
    setCorrectIds(validIds);
    speak(question);

  }, []);

  useEffect(() => {
    setupRound();
  }, []);

  const handleItemClick = (id: string) => {
      if (status !== 'playing') return;

      if (correctIds.includes(id)) {
          setStatus('correct');
          setScore(s => s + 1);
          speak("Correct!");
          setTimeout(setupRound, 1500);
      } else {
          setStatus('wrong');
          speak("Oops! That one doesn't follow the rule.");
          setTimeout(() => {
              setStatus('playing');
              speak(prompt); // Remind them
          }, 1000);
      }
  };

  return (
    <div className="w-full max-w-2xl flex flex-col items-center">
        {status === 'correct' && <Confetti />}

        <div className="bg-cyan-100 p-4 md:p-6 rounded-3xl w-full text-center shadow-lg border-4 border-cyan-200 mb-8">
            <h2 className="text-sm md:text-base font-bold text-cyan-600 uppercase tracking-widest mb-2">The "Not" Game</h2>
            <p className="text-2xl md:text-3xl font-black text-cyan-900 leading-tight">
                {prompt}
            </p>
            <button 
                onClick={() => speak(prompt)} 
                className="mt-4 bg-white/50 hover:bg-white text-cyan-700 px-4 py-2 rounded-full font-bold text-sm transition-colors"
            >
                Repeat Rule 🔊
            </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
            {items.map((item) => (
                <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`
                        aspect-square rounded-2xl bg-white shadow-md border-b-4 flex items-center justify-center transition-all active:border-b-0 active:translate-y-1
                        ${status === 'wrong' && !correctIds.includes(item.id) ? 'opacity-50' : ''}
                        ${status === 'correct' && correctIds.includes(item.id) ? 'ring-4 ring-green-400 bg-green-50' : ''}
                    `}
                >
                    <ShapeIcon shape={item.shape} className={`w-20 h-20 md:w-24 md:h-24 ${getColorClass(item.color)}`} />
                </button>
            ))}
        </div>

        <div className="mt-8 bg-white px-6 py-2 rounded-full shadow-sm font-bold text-gray-400">
            Score: <span className="text-cyan-600">{score}</span>
        </div>
    </div>
  );
};
