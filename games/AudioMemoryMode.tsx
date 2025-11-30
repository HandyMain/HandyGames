
import React, { useState, useCallback } from 'react';
import { Volume2, Music, Star } from 'lucide-react';
import { shuffleArray, speak } from '../utils';
import { Confetti } from '../components';

interface Card {
  id: number;
  content: string; // The word to speak
  emoji: string;   // The visual reveal
  isFlipped: boolean;
  isMatched: boolean;
}

const AUDIO_PAIRS = [
    { word: "Cat", emoji: "🐱" },
    { word: "Dog", emoji: "🐶" },
    { word: "Bird", emoji: "🐦" },
    { word: "Cow", emoji: "🐮" },
    { word: "Pig", emoji: "🐷" },
    { word: "Duck", emoji: "🦆" },
];

export const AudioMemoryMode = ({ pool }: { pool: string[] }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  const startNewGame = useCallback(() => {
    const selected = AUDIO_PAIRS.slice(0, 6); // Use 6 pairs
    const deck = [...selected, ...selected];
    
    const shuffled = shuffleArray(deck).map((item, index) => ({
      id: index,
      content: item.word,
      emoji: item.emoji,
      isFlipped: false,
      isMatched: false
    }));

    setCards(shuffled);
    setFlippedCards([]);
    setIsLocked(false);
    setGameWon(false);
    speak("Tap a card to hear the sound. Find the matching sounds!");
  }, []);

  // Init
  React.useEffect(() => { startNewGame(); }, [startNewGame]);

  const handleCardClick = (index: number) => {
    if (isLocked || cards[index].isFlipped || cards[index].isMatched) return;

    // Speak the content immediately
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
      setTimeout(() => {
        const matchedCards = [...currentCards];
        matchedCards[idx1].isMatched = true;
        matchedCards[idx2].isMatched = true;
        setCards(matchedCards);
        setFlippedCards([]);
        setIsLocked(false);
        speak(`You found the ${card1.content}!`);
        
        if (matchedCards.every(c => c.isMatched)) {
            setGameWon(true);
            speak("You have amazing ears! You won!");
        }
      }, 500);
    } else {
      setTimeout(() => {
        const resetCards = [...currentCards];
        resetCards[idx1].isFlipped = false;
        resetCards[idx2].isFlipped = false;
        setCards(resetCards);
        setFlippedCards([]);
        setIsLocked(false);
      }, 1000);
    }
  };

  return (
    <div className="w-full max-w-2xl flex flex-col items-center">
      {gameWon && <Confetti />}

      <div className="bg-rose-100 p-4 rounded-3xl w-full text-center shadow-lg border-4 border-rose-200 mb-6">
         <h1 className="text-2xl font-black text-rose-900 flex items-center justify-center gap-2"><Volume2 /> Listen & Match</h1>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 md:gap-4 w-full">
        {cards.map((card, index) => (
          <button
            key={index}
            onClick={() => handleCardClick(index)}
            className={`
              aspect-[3/4] rounded-2xl shadow-sm border-b-4 transition-all duration-300
              flex items-center justify-center transform
              ${card.isMatched 
                ? 'bg-white border-rose-200 scale-95 opacity-50' 
                : card.isFlipped 
                    ? 'bg-rose-100 border-rose-300' 
                    : 'bg-gradient-to-br from-rose-400 to-pink-600 border-rose-700 hover:scale-105'
              }
            `}
          >
             {card.isMatched ? (
                 <span className="text-4xl">{card.emoji}</span>
             ) : card.isFlipped ? (
                 <Music className="text-rose-400 animate-pulse" size={32} />
             ) : (
                 <Star className="text-white/30" size={24} />
             )}
          </button>
        ))}
      </div>
    </div>
  );
};
