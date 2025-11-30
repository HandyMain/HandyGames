
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Zap, Brain, Play, Pause, AlertCircle } from 'lucide-react';
import { Confetti } from '../components';
import { getRandomItem, speak } from '../utils';

const ITEMS = ['🍎', '🍌', '🍇', '🍊', '🍉', '🍓'];

export const NBackMode = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [sequence, setSequence] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong' | 'missed'>('none');
  const [level, setLevel] = useState(1); // 1-back or 2-back

  const timerRef = useRef<number | null>(null);

  const startGame = () => {
    setSequence([]);
    setCurrentIndex(-1);
    setScore(0);
    setIsPlaying(true);
    setFeedback('none');
    speak(`Let's play! Tap the button if you see the same picture from ${level === 1 ? 'one' : 'two'} steps ago.`);
    nextStep();
  };

  const nextStep = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    setFeedback('none'); // Clear previous feedback visually

    // Add new item
    const newItem = getRandomItem(ITEMS);
    setSequence(prev => [...prev, newItem]);
    setCurrentIndex(prev => prev + 1);

    // Auto advance after 2.5 seconds
    timerRef.current = window.setTimeout(() => {
        nextStep();
    }, 2500);

  }, []);

  const checkMatch = () => {
      if (currentIndex < level) return; // Not enough history
      
      const currentItem = sequence[currentIndex];
      const targetItem = sequence[currentIndex - level];
      
      if (currentItem === targetItem) {
          setScore(s => s + 10);
          setFeedback('correct');
          speak("Match!");
      } else {
          setScore(s => Math.max(0, s - 5));
          setFeedback('wrong');
          speak("Oops, not a match.");
      }
  };

  useEffect(() => {
      return () => { if(timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  if (!isPlaying) {
      return (
          <div className="w-full max-w-md flex flex-col items-center bg-white p-8 rounded-3xl shadow-xl border-4 border-yellow-200">
              <Brain size={64} className="text-yellow-500 mb-4" />
              <h1 className="text-3xl font-black text-yellow-900 mb-2">Brain Trainer</h1>
              <p className="text-gray-600 text-center mb-6">
                  Watch the pictures. If you see the same picture from {level} step{level > 1 ? 's' : ''} ago, tap the button!
              </p>
              
              <div className="flex gap-4 mb-6">
                  <button onClick={() => setLevel(1)} className={`px-4 py-2 rounded-xl font-bold border-2 ${level === 1 ? 'bg-yellow-100 border-yellow-500 text-yellow-900' : 'bg-white border-gray-200'}`}>1-Step Back</button>
                  <button onClick={() => setLevel(2)} className={`px-4 py-2 rounded-xl font-bold border-2 ${level === 2 ? 'bg-yellow-100 border-yellow-500 text-yellow-900' : 'bg-white border-gray-200'}`}>2-Steps Back</button>
              </div>

              <button 
                  onClick={startGame}
                  className="w-full bg-yellow-500 text-white py-4 rounded-xl font-bold text-xl shadow-lg hover:bg-yellow-600 flex items-center justify-center gap-2"
              >
                  <Play fill="currentColor" /> Start
              </button>
          </div>
      );
  }

  const currentItem = sequence[currentIndex];

  return (
    <div className="w-full max-w-xl flex flex-col items-center">
        {feedback === 'correct' && <Confetti />}
        
        <div className="flex justify-between w-full mb-6 px-4">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                <Brain className="text-yellow-500" size={20} />
                <span className="font-bold text-yellow-900">Score: {score}</span>
            </div>
            <button onClick={() => { setIsPlaying(false); if(timerRef.current) clearTimeout(timerRef.current); }} className="p-2 bg-white rounded-full text-red-500">
                <Pause size={24} fill="currentColor" />
            </button>
        </div>

        <div className="relative w-64 h-64 md:w-80 md:h-80 bg-white rounded-[3rem] shadow-2xl flex items-center justify-center border-8 border-yellow-100 mb-8 overflow-hidden">
            <span className={`text-9xl transition-all duration-300 transform ${feedback === 'correct' ? 'scale-125' : 'scale-100'}`}>
                {currentItem}
            </span>
            
            {/* Feedback Overlay */}
            {feedback === 'correct' && (
                <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                    <Zap size={64} className="text-green-500 fill-green-500 animate-bounce" />
                </div>
            )}
            {feedback === 'wrong' && (
                <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                    <AlertCircle size={64} className="text-red-500 animate-pulse" />
                </div>
            )}
        </div>

        <button 
            onClick={checkMatch}
            className="w-full max-w-xs bg-yellow-400 text-yellow-900 text-2xl font-black py-6 rounded-3xl shadow-[0_8px_0_rgb(202,138,4)] active:shadow-none active:translate-y-2 transition-all border-2 border-yellow-500 uppercase tracking-wider"
        >
            Match!
        </button>
        
        <p className="mt-4 text-gray-500 font-medium">
            Does this match the one from <span className="font-bold text-gray-800">{level} step{level > 1 ? 's' : ''} ago</span>?
        </p>
    </div>
  );
};
