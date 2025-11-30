
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Zap, Trophy, Play, RotateCcw, Music, MicOff } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { speak, getRandomItem } from '../utils';
import { Confetti } from '../components';
import { useSpeechRecognition } from '../hooks';

const WORDS_EASY = ["Cat", "Dog", "Pen", "Box", "Sun", "Hat", "Pig", "Bed", "Car", "Tree"];
const WORDS_MEDIUM = ["Star", "Moon", "Cake", "Fish", "Ball", "House", "Book", "Chair", "Spoon"];
const WORDS_HARD = ["Flower", "Table", "Water", "Purple", "Monster", "Rabbit", "Window", "Dragon"];

export const RhymeMode = ({ difficulty = 'easy' }: { difficulty: 'easy' | 'medium' | 'hard' }) => {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'verifying' | 'result'>('intro');
  const [currentWord, setCurrentWord] = useState('');
  const [userRhyme, setUserRhyme] = useState('');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5);
  const [feedback, setFeedback] = useState('');
  
  const timerRef = useRef<number | null>(null);

  // Hook setup
  const { isListening, start, stop, abort } = useSpeechRecognition({
      interimResults: false,
      onResult: (transcript) => {
          if (transcript.trim()) {
            stopTimer();
            stop();
            verifyRhyme(currentWord, transcript);
          }
      },
      onError: () => {
          // Silent fail or retry?
      }
  });

  useEffect(() => {
    return () => {
        stopTimer();
        abort();
    };
  }, [abort]);

  const stopTimer = () => {
    if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
    }
  };

  const startGame = () => {
    setScore(0);
    setStreak(0);
    nextRound(0);
  };

  const nextRound = (currentStreak: number) => {
    stopTimer();
    stop(); // Ensure clean state
    
    // Pick word based on difficulty and streak
    let pool = WORDS_EASY;
    let time = 10; 

    if (difficulty === 'medium') { pool = [...WORDS_EASY, ...WORDS_MEDIUM]; time = 7; }
    if (difficulty === 'hard') { pool = [...WORDS_MEDIUM, ...WORDS_HARD]; time = 5; }
    
    // Streak makes it slightly harder even on easy
    if (currentStreak > 5) time = Math.max(3, time - 2);
    
    const word = getRandomItem(pool);
    setCurrentWord(word);
    setGameState('playing');
    setTimeLeft(time);
    setUserRhyme('');
    setFeedback('');

    speak(`What rhymes with ${word}?`);

    // Start Timer
    timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
            if (prev <= 1) {
                stopTimer();
                stop();
                handleTimeout(word);
                return 0;
            }
            return prev - 1;
        });
    }, 1000);

    // Start Listening after small delay
    setTimeout(() => {
         // Only start if still in playing state
         setGameState(prev => {
             if (prev === 'playing') start();
             return prev;
         });
    }, 1000);
  };

  const handleManualMicClick = () => {
      if (isListening) {
          stop();
      } else {
          start();
      }
  };

  const handleTimeout = (word: string) => {
      setGameState('result');
      setFeedback(`Time's up! A rhyme for ${word} is... ${getFallbackRhyme(word)}`);
      setStreak(0);
      speak(`Time's up!`);
  };

  const getFallbackRhyme = (word: string) => {
      // Simple fallback map for common words
      const map: Record<string, string> = {
          "Cat": "Hat", "Dog": "Frog", "Pen": "Hen", "Box": "Fox", "Sun": "Run",
          "Hat": "Bat", "Pig": "Wig", "Bed": "Red", "Car": "Star", "Tree": "Bee",
          "Moon": "Spoon", "Cake": "Snake", "Fish": "Dish", "Ball": "Call",
          "Flower": "Power", "Table": "Cable", "Water": "Daughter"
      };
      return map[word] || "something else!";
  };

  const verifyRhyme = async (target: string, input: string) => {
    setUserRhyme(input);
    setGameState('verifying');

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Does "${input}" rhyme with "${target}"? Answer with JSON only: { "rhymes": boolean, "comment": "short kid friendly comment" }`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        rhymes: { type: Type.BOOLEAN },
                        comment: { type: Type.STRING }
                    }
                }
            }
        });

        const result = JSON.parse(response.text || "{}");
        
        if (result.rhymes) {
            setScore(s => s + 100 + (streak * 10));
            setStreak(s => s + 1);
            setFeedback(result.comment || "Great rhyme!");
            speak("Correct! " + (result.comment || ""));
            setTimeout(() => nextRound(streak + 1), 2000); // Auto advance
        } else {
            setGameState('result'); // Game over state for this round
            setStreak(0);
            setFeedback(`Not quite! ${input} doesn't rhyme with ${target}.`);
            speak(`Not quite! ${input} does not rhyme.`);
        }

    } catch (e) {
        console.error(e);
        setGameState('result');
        setFeedback("I couldn't check that rhyme. Let's try another!");
        speak("I got confused. Let's try again.");
    }
  };

  return (
    <div className="w-full max-w-2xl flex flex-col items-center">
        {gameState === 'playing' && streak > 5 && <Confetti />}

        {/* Header / Score */}
        <div className="flex justify-between w-full mb-6 px-4 items-center">
            <div className="flex gap-2 items-center bg-white px-4 py-2 rounded-full shadow-sm border-2 border-fuchsia-100">
                <Trophy className="text-yellow-500" size={20} />
                <span className="font-bold text-fuchsia-900">{score} pts</span>
            </div>
            <div className="flex gap-1">
                {Array.from({length: Math.min(5, streak)}).map((_, i) => (
                    <Zap key={i} size={20} className="text-yellow-400 fill-yellow-400 animate-pulse" />
                ))}
            </div>
        </div>

        {/* Intro Screen */}
        {gameState === 'intro' && (
            <div className="bg-white p-8 rounded-[3rem] shadow-xl text-center border-8 border-fuchsia-100 animate-in zoom-in">
                <div className="bg-fuchsia-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Music size={48} className="text-fuchsia-600" />
                </div>
                <h2 className="text-4xl font-black text-fuchsia-900 mb-4">Rhyme Battle</h2>
                <div className="inline-block bg-fuchsia-50 px-4 py-1 rounded-full text-fuchsia-800 font-bold mb-4 uppercase text-xs tracking-widest">
                    {difficulty} Mode
                </div>
                <p className="text-lg text-gray-600 mb-8">I say a word, you say a rhyme!<br/>Be quick!</p>
                <button 
                    onClick={startGame}
                    className="bg-fuchsia-600 text-white px-8 py-4 rounded-2xl font-bold text-xl shadow-lg hover:bg-fuchsia-700 hover:scale-105 transition-all flex items-center gap-2 mx-auto"
                >
                    <Play fill="currentColor" /> Start Game
                </button>
            </div>
        )}

        {/* Game Area */}
        {gameState !== 'intro' && (
            <div className="w-full flex flex-col items-center gap-6">
                
                {/* Timer Bar */}
                <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-1000 ease-linear ${timeLeft < 3 ? 'bg-red-500' : 'bg-fuchsia-500'}`}
                        style={{ width: `${(timeLeft / (difficulty === 'hard' ? 5 : 10)) * 100}%` }}
                    />
                </div>

                {/* Main Card */}
                <div className="bg-white w-full aspect-square md:aspect-video rounded-[3rem] shadow-2xl border-8 border-fuchsia-200 flex flex-col items-center justify-center relative overflow-hidden p-6">
                    
                    {gameState === 'playing' && (
                        <>
                            <p className="text-gray-400 font-bold uppercase tracking-widest mb-2">What rhymes with...</p>
                            <h1 className="text-6xl md:text-8xl font-black text-fuchsia-600 mb-8 animate-bounce">{currentWord}</h1>
                            
                            <button 
                                onClick={handleManualMicClick}
                                className={`flex flex-col items-center gap-2 transition-transform active:scale-95 ${isListening ? 'scale-110' : 'scale-100'}`}
                            >
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all border-4 
                                    ${isListening 
                                        ? 'bg-red-500 border-red-200 ring-4 ring-red-100 animate-pulse' 
                                        : 'bg-fuchsia-500 border-white hover:bg-fuchsia-600'
                                    }`}
                                >
                                    {isListening ? <Mic className="text-white w-8 h-8" /> : <MicOff className="text-white w-8 h-8" />}
                                </div>
                                <p className={`font-bold text-sm ${isListening ? 'text-red-500' : 'text-gray-400'}`}>
                                    {isListening ? "Listening..." : "Tap to Speak"}
                                </p>
                            </button>
                        </>
                    )}

                    {gameState === 'verifying' && (
                        <div className="flex flex-col items-center">
                            <h2 className="text-3xl font-bold text-gray-800 mb-4">"{userRhyme}"?</h2>
                            <div className="flex gap-2">
                                <div className="w-4 h-4 bg-fuchsia-400 rounded-full animate-bounce"></div>
                                <div className="w-4 h-4 bg-fuchsia-400 rounded-full animate-bounce delay-100"></div>
                                <div className="w-4 h-4 bg-fuchsia-400 rounded-full animate-bounce delay-200"></div>
                            </div>
                            <p className="text-gray-400 mt-4">Checking the beat...</p>
                        </div>
                    )}

                    {gameState === 'result' && (
                        <div className="text-center animate-in zoom-in">
                            <h2 className="text-3xl md:text-4xl font-black text-gray-800 mb-4 leading-tight">{feedback}</h2>
                            <button 
                                onClick={() => nextRound(0)}
                                className="mt-4 bg-fuchsia-100 text-fuchsia-700 px-6 py-3 rounded-full font-bold hover:bg-fuchsia-200 transition-colors flex items-center gap-2 mx-auto"
                            >
                                <RotateCcw size={20} /> Try Again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};
