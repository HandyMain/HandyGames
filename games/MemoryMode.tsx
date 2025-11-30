

import React, { useState, useCallback, useEffect } from 'react';
import { User, Users, RotateCcw, Star } from 'lucide-react';
import { shuffleArray, speak, playSound } from '../utils';
import { Confetti } from '../components';

interface Card {
  id: number;
  content: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export const MemoryMode = ({ pool, difficulty = 'easy' }: { pool: string[], difficulty: 'easy' | 'medium' | 'hard' }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matches, setMatches] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  
  // Multiplayer State
  const [numPlayers, setNumPlayers] = useState<1 | 2>(1);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [scores, setScores] = useState({ 1: 0, 2: 0 });

  const startNewGame = useCallback(() => {
    const selected: string[] = [];
    const poolCopy = [...pool];
    
    // Determine pair count based on difficulty
    let pairs = 6;
    if (difficulty === 'easy') pairs = 3; // 6 cards
    if (difficulty === 'hard') pairs = 10; // 20 cards
    
    // Ensure we have enough items
    if (poolCopy.length < pairs) {
        // Duplicate pool if not enough
        while (poolCopy.length < pairs) {
             poolCopy.push(...pool);
        }
    }
    
    for (let i = 0; i < pairs; i++) {
        const idx = Math.floor(Math.random() * poolCopy.length);
        selected.push(poolCopy[idx]);
        poolCopy.splice(idx, 1); 
    }

    const deck = [...selected, ...selected];
    const shuffled = shuffleArray(deck).map((content, index) => ({
      id: index,
      content,
      isFlipped: false,
      isMatched: false
    }));

    setCards(shuffled);
    setFlippedCards([]);
    setMatches(0);
    setScores({ 1: 0, 2: 0 });
    setCurrentPlayer(1);
    setGameWon(false);
    setIsLocked(false);
  }, [pool, difficulty]);

  // Restart when difficulty changes
  useEffect(() => {
      startNewGame();
  }, [startNewGame, difficulty]);

  const handleCardClick = (index: number) => {
    if (isLocked || cards[index].isFlipped || cards[index].isMatched) return;

    playSound('click');
    speak(cards[index].content);

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setIsLocked(true);
      checkForMatch(newFlipped, newCards);
    }
  };

  const checkForMatch = (currentFlipped: number[], currentCards: Card[]) => {
    const [idx1, idx2] = currentFlipped;
    const card1 = currentCards[idx1];
    const card2 = currentCards[idx2];

    if (card1.content === card2.content) {
      // MATCH
      setTimeout(() => {
        const matchedCards = [...currentCards];
        matchedCards[idx1].isMatched = true;
        matchedCards[idx2].isMatched = true;
        setCards(matchedCards);
        setFlippedCards([]);
        setIsLocked(false);
        setMatches(m => m + 1);
        
        // Update Score for current player
        setScores(prev => ({ ...prev, [currentPlayer]: prev[currentPlayer] + 1 }));
        
        playSound('success');
        speak("Match!");
        
        if (matches + 1 === currentCards.length / 2) {
          setGameWon(true);
          speak("Game Over!");
        }
      }, 500);
    } else {
      // NO MATCH
      setTimeout(() => {
        const resetCards = [...currentCards];
        resetCards[idx1].isFlipped = false;
        resetCards[idx2].isFlipped = false;
        setCards(resetCards);
        setFlippedCards([]);
        setIsLocked(false);
        
        // Switch Turn if 2 players
        if (numPlayers === 2) {
            setCurrentPlayer(prev => prev === 1 ? 2 : 1);
        }
      }, 1000);
    }
  };

  const gridClass = difficulty === 'hard' 
    ? 'grid-cols-4 sm:grid-cols-5' 
    : difficulty === 'easy'
      ? 'grid-cols-3'
      : 'grid-cols-3 sm:grid-cols-4';

  return (
    <div className="w-full max-w-2xl flex flex-col items-center">
      {gameWon && <Confetti />}
      
      {/* Turn Indicator Banner */}
      {numPlayers === 2 && !gameWon && (
          <div className={`mb-4 px-6 py-2 rounded-full font-bold text-white shadow-lg animate-in slide-in-from-top-2 transition-colors ${currentPlayer === 1 ? 'bg-purple-500' : 'bg-pink-500'}`}>
              {currentPlayer === 1 ? "Player 1's Turn" : "Player 2's Turn"}
          </div>
      )}

      <div className="flex justify-between w-full items-center mb-4 md:mb-6 px-2 md:px-4">
         {/* Score Display */}
         <div className="flex gap-2 md:gap-4">
            <div className={`flex items-center gap-2 px-3 py-1 md:px-4 md:py-2 rounded-xl backdrop-blur-sm shadow-sm transition-all border-2
                ${currentPlayer === 1 ? 'bg-white border-purple-500 scale-105 shadow-purple-200' : 'bg-white/60 border-transparent opacity-70'}
            `}>
                <div className="bg-purple-100 p-1 rounded-full"><User size={16} className="text-purple-600 md:w-5 md:h-5" /></div>
                <div className="flex flex-col">
                    <span className="text-[10px] md:text-xs font-bold uppercase text-purple-400">Player 1</span>
                    <span className="text-xl md:text-2xl font-black text-purple-900 leading-none">{scores[1]}</span>
                </div>
            </div>

            {numPlayers === 2 && (
                <div className={`flex items-center gap-2 px-3 py-1 md:px-4 md:py-2 rounded-xl backdrop-blur-sm shadow-sm transition-all border-2
                    ${currentPlayer === 2 ? 'bg-white border-pink-500 scale-105 shadow-pink-200' : 'bg-white/60 border-transparent opacity-70'}
                `}>
                    <div className="bg-pink-100 p-1 rounded-full"><User size={16} className="text-pink-600 md:w-5 md:h-5" /></div>
                    <div className="flex flex-col">
                        <span className="text-[10px] md:text-xs font-bold uppercase text-pink-400">Player 2</span>
                        <span className="text-xl md:text-2xl font-black text-pink-900 leading-none">{scores[2]}</span>
                    </div>
                </div>
            )}
         </div>

         {/* Player Toggle */}
         <button 
             onClick={() => setNumPlayers(n => n === 1 ? 2 : 1)} 
             className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md text-sm font-bold text-purple-600"
         >
             <Users size={16} /> {numPlayers === 1 ? '1 Player' : '2 Players'}
         </button>
      </div>

      <div className={`grid gap-2 md:gap-4 w-full ${gridClass}`}>
        {cards.map((card, index) => (
          <button
            key={index}
            onClick={() => handleCardClick(index)}
            className={`
              aspect-[3/4] rounded-xl md:rounded-2xl text-3xl md:text-5xl font-bold shadow-sm border-b-4 transition-all duration-300
              flex items-center justify-center transform
              ${card.isFlipped || card.isMatched
                ? 'bg-white border-purple-200 text-purple-900 rotate-y-180' 
                : 'bg-gradient-to-br from-purple-500 to-indigo-600 border-indigo-800 text-transparent'
              }
              ${card.isMatched ? 'opacity-50 scale-95' : ''}
              ${!card.isFlipped && !card.isMatched ? 'hover:scale-105' : ''}
            `}
          >
             {(card.isFlipped || card.isMatched) ? card.content : <Star size={24} className="text-white/30" />}
          </button>
        ))}
      </div>
      
      <button onClick={() => startNewGame()} className="mt-8 bg-purple-100 text-purple-600 px-6 py-2 rounded-full font-bold hover:bg-purple-200 transition-colors">
          Restart Game
      </button>
    </div>
  );
};