
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Search, Volume2, ArrowRight, User, Timer, Trophy, Star, XCircle } from 'lucide-react';
import { speak, shuffleArray, getRandomItem } from '../utils';
import { Confetti } from '../components';

// Defined emotions by difficulty
const EMOTIONS_EASY = {
  'Happy': ['😄', '😊', '🥳', '😁', '🙂'],
  'Sad': ['😢', '😭', '😞', '🥺', '☹️'],
  'Angry': ['😠', '😡', '😤', '😒', '👿'],
  'Silly': ['🤪', '😜', '😝', '🤡', '👻'],
  'Sleepy': ['😴', '🥱', '😪', '💤', '🛌'],
};

const EMOTIONS_MEDIUM = {
  ...EMOTIONS_EASY,
  'Scared': ['😨', '😱', '😰', '🫣', '😖'],
  'Surprised': ['😲', '😮', '🙀', '😯', '🤯'],
  'Excited': ['🤩', '🙌', '🎉', '🤸', '💃'],
  'Confused': ['😕', '😵‍💫', '❓', '🤔', '🤷'],
  'Annoyed': ['🙄', '😑', '😤', '🤦', '😒'],
  'Sick': ['🤢', '🤮', '🤒', '🤕', '🤧'],
};

const EMOTIONS_HARD = {
  ...EMOTIONS_MEDIUM,
  'Bored': ['😐', '😶', '🫥', '🫠', '😒'],
  'Embarrassed': ['😳', '🫣', '🙈', '😖', '🥵'],
  'Love': ['🥰', '😍', '❤️', '🤗', '💝'],
  'Jealous': ['😒', '😠', '😑', '😤', '😒'],
  'Proud': ['😎', '😌', '🏆', '🥇', '💪'],
  'Nervous': ['😬', '😰', '😓', '😟', '🤏'],
};

const PRIZES = [
    { id: 'badge', icon: '📛', name: 'Rookie Badge' },
    { id: 'glass', icon: '🔍', name: 'Magnifying Glass' },
    { id: 'hat', icon: '🕵️', name: 'Detective Hat' },
    { id: 'notebook', icon: '📒', name: 'Clue Book' },
    { id: 'camera', icon: '📷', name: 'Spy Camera' },
    { id: 'walkie', icon: '📻', name: 'Walkie Talkie' },
    { id: 'medal', icon: '🥇', name: 'Gold Medal' },
    { id: 'trophy', icon: '🏆', name: 'Super Trophy' },
];

interface Scenario {
  text: string;
  emotion: string;
}

export const SocialMode = ({ difficulty = 'easy' }: { difficulty: 'easy' | 'medium' | 'hard' }) => {
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [status, setStatus] = useState<'loading' | 'playing' | 'correct' | 'wrong' | 'timeout'>('loading');
  const [score, setScore] = useState(0);
  
  // Features
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [prizes, setPrizes] = useState<typeof PRIZES>([]);
  const [justUnlocked, setJustUnlocked] = useState<typeof PRIZES[0] | null>(null);

  // Track seen scenarios to avoid repetition
  const historyRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<number | null>(null);

  // Get Emotion Set based on difficulty
  const getEmotions = () => {
      if (difficulty === 'hard') return EMOTIONS_HARD;
      if (difficulty === 'medium') return EMOTIONS_MEDIUM;
      return EMOTIONS_EASY;
  };

  const generateScenario = useCallback(async () => {
    setStatus('loading');
    setJustUnlocked(null);
    if(timerRef.current) clearInterval(timerRef.current);

    const emotionMap = getEmotions();
    const emotionKeys = Object.keys(emotionMap);
    
    // Convert history set to array for prompt
    const recentHistory = Array.from(historyRef.current).slice(-15); 

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate a short, simple social scenario for a child where someone feels a specific emotion.
                   Difficulty Level: ${difficulty} (Easy=Basic, Hard=Nuanced).
                   The emotion MUST be one of these exact words: ${emotionKeys.join(', ')}.
                   Keep the text under 20 words.
                   IMPORTANT: Do NOT use these previous scenarios: ${JSON.stringify(recentHistory)}.
                   Generate a NEW scenario.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              emotion: { type: Type.STRING, enum: emotionKeys }
            },
            required: ["text", "emotion"]
          }
        }
      });

      const data = JSON.parse(response.text || "{}") as Scenario;
      
      if (data.text && data.emotion && emotionMap[data.emotion as keyof typeof emotionMap]) {
        historyRef.current.add(data.text);
        setupRound(data);
      } else {
        throw new Error("Invalid format");
      }

    } catch (e) {
      console.error("AI Error, using fallback", e);
      const fallbackEmotion = getRandomItem(emotionKeys);
      setupRound({ text: `Someone felt ${fallbackEmotion} today.`, emotion: fallbackEmotion });
    }
  }, [difficulty]);

  const setupRound = (scenario: Scenario) => {
    setCurrentScenario(scenario);
    const emotionMap = getEmotions();
    const emotionKeys = Object.keys(emotionMap);
    
    // 1. Get correct emoji
    const correctEmojis = emotionMap[scenario.emotion as keyof typeof emotionMap];
    const correctEmoji = getRandomItem(correctEmojis);

    // 2. Get distractors (wrong emotions)
    const otherEmotions = emotionKeys.filter(e => e !== scenario.emotion);
    const shuffledOthers = shuffleArray(otherEmotions).slice(0, difficulty === 'easy' ? 2 : 5); // More options on hard
    
    const wrongEmojis = shuffledOthers.map(emotionName => getRandomItem(emotionMap[emotionName as keyof typeof emotionMap]));

    // 3. Shuffle options
    const allOptions = shuffleArray([correctEmoji, ...wrongEmojis]);
    setOptions(allOptions);
    
    // 4. Timer Setup
    setTimeLeft(15);
    setStatus('playing');
    speak(scenario.text);

    if (timerEnabled) {
        timerRef.current = window.setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    handleTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }
  };

  const handleTimeout = () => {
      if(timerRef.current) clearInterval(timerRef.current);
      setStatus('timeout');
      speak("Time's up! Let's see the answer.");
  };

  // Reset when difficulty changes
  useEffect(() => {
    setScore(0);
    setPrizes([]);
    generateScenario();
    return () => { if(timerRef.current) clearInterval(timerRef.current); }
  }, [difficulty, generateScenario]);

  // Clean up timer on unmount
  useEffect(() => {
      return () => { if(timerRef.current) clearInterval(timerRef.current); }
  }, []);

  const handleOptionClick = (emoji: string) => {
    if (status !== 'playing' || !currentScenario) return;

    const emotionMap = getEmotions();
    const isCorrect = emotionMap[currentScenario.emotion as keyof typeof emotionMap]?.includes(emoji);

    if (isCorrect) {
      if(timerRef.current) clearInterval(timerRef.current);
      
      // Scoring Logic
      const basePoints = 10;
      const timeBonus = timerEnabled ? timeLeft : 0;
      const newPoints = basePoints + timeBonus;
      const newTotal = score + newPoints;
      
      setStatus('correct');
      setScore(newTotal);
      speak(`That's right! They feel ${currentScenario.emotion}.`);

      // Prize Logic: Every 50 points
      const oldPrizeLevel = Math.floor(score / 50);
      const newPrizeLevel = Math.floor(newTotal / 50);
      
      if (newPrizeLevel > oldPrizeLevel) {
          const prizeIndex = (newPrizeLevel - 1) % PRIZES.length;
          const wonPrize = PRIZES[prizeIndex];
          setPrizes(prev => [...prev, wonPrize]);
          setTimeout(() => {
             setJustUnlocked(wonPrize);
             speak(`Wow! You unlocked the ${wonPrize.name}!`);
          }, 1000);
      }

    } else {
      setStatus('wrong');
      speak("Hmm, try again. How would they feel?");
      // Penalty? Maybe just visual feedback.
      setTimeout(() => setStatus('playing'), 1000);
    }
  };

  return (
    <div className="w-full max-w-2xl flex flex-col items-center">
      {status === 'correct' && <Confetti />}
      
      {/* Prize Overlay */}
      {justUnlocked && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
              <div className="bg-white rounded-[2rem] p-8 text-center shadow-2xl animate-in zoom-in duration-300 relative border-8 border-yellow-300">
                  <h2 className="text-3xl font-black text-yellow-500 mb-4">New Prize!</h2>
                  <div className="text-8xl mb-4 animate-bounce">{justUnlocked.icon}</div>
                  <p className="text-2xl font-bold text-gray-800">{justUnlocked.name}</p>
                  <button 
                    onClick={() => setJustUnlocked(null)}
                    className="mt-6 bg-yellow-400 text-yellow-900 px-8 py-3 rounded-full font-bold text-xl hover:bg-yellow-500"
                  >
                      Awesome!
                  </button>
              </div>
          </div>
      )}

      {/* Top Bar */}
      <div className="w-full flex flex-wrap gap-4 justify-between items-center mb-6 px-2">
        
        {/* Score & Prizes */}
        <div className="flex items-center gap-2">
           <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border-2 border-blue-100">
              <Star size={20} className="text-yellow-500 fill-yellow-500" />
              <span className="font-bold text-blue-900">{score}</span>
           </div>
           
           {/* Mini Trophy Case */}
           <div className="flex items-center -space-x-2">
               {prizes.slice(-3).map((p, i) => (
                   <div key={i} className="w-8 h-8 rounded-full bg-yellow-100 border-2 border-white flex items-center justify-center text-sm shadow-sm" title={p.name}>
                       {p.icon}
                   </div>
               ))}
               {prizes.length > 3 && <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">+{prizes.length - 3}</div>}
           </div>
        </div>

        {/* Timer Toggle */}
        <button 
           onClick={() => {
               setTimerEnabled(!timerEnabled);
               setScore(0); // Reset score on mode change
               generateScenario();
           }}
           className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all border-2
               ${timerEnabled ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-200 text-gray-400'}
           `}
        >
           <Timer size={16} />
           {timerEnabled ? 'Timer On' : 'Timer Off'}
        </button>
      </div>
      
      {/* Main Game Card */}
      <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-xl w-full text-center border-4 md:border-8 border-blue-100 mb-6 md:mb-8 relative min-h-[220px] flex flex-col items-center justify-center overflow-hidden">
          
          {/* Timer Bar */}
          {timerEnabled && status === 'playing' && (
              <div className="absolute top-0 left-0 h-2 bg-red-500 transition-all duration-1000 ease-linear" style={{ width: `${(timeLeft / 15) * 100}%` }}></div>
          )}

          {status === 'loading' ? (
              <div className="flex flex-col items-center gap-4 animate-pulse">
                  <Search size={48} className="text-blue-300" />
                  <p className="text-blue-400 font-bold">Looking for clues...</p>
              </div>
          ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 w-full">
                  <div className="bg-blue-100 text-blue-800 px-4 py-1 rounded-full text-xs md:text-sm font-bold uppercase tracking-widest mb-4 inline-block">
                      Case File #{prizes.length + 1}
                  </div>
                  
                  <h2 className="text-xl md:text-3xl font-bold text-gray-800 leading-snug mb-6">
                      "{currentScenario?.text}"
                  </h2>
                  
                  {status === 'correct' && (
                      <div className="text-green-600 font-black text-2xl animate-bounce mb-2">
                          {currentScenario?.emotion}! (+{10 + (timerEnabled ? timeLeft : 0)})
                      </div>
                  )}

                  {status === 'timeout' && (
                      <div className="text-red-500 font-bold text-xl mb-2 flex items-center justify-center gap-2">
                          <XCircle /> Time's Up! It was {currentScenario?.emotion}.
                      </div>
                  )}

                  {(status === 'playing' || status === 'wrong') && (
                    <button 
                        onClick={() => currentScenario && speak(currentScenario.text)}
                        className="bg-blue-50 text-blue-600 p-3 md:p-4 rounded-full hover:bg-blue-100 transition-colors shadow-sm mx-auto"
                    >
                        <Volume2 size={24} className="md:w-8 md:h-8" />
                    </button>
                  )}
              </div>
          )}
      </div>

      {(status === 'correct' || status === 'timeout') && (
          <button 
            onClick={generateScenario}
            className="mb-8 bg-green-500 text-white px-6 py-3 md:px-8 md:py-4 rounded-2xl font-bold text-lg md:text-xl shadow-lg hover:bg-green-600 active:scale-95 transition-all flex items-center gap-2 animate-in zoom-in"
          >
            Next Case <ArrowRight />
          </button>
      )}

      {status !== 'loading' && (
          <div className={`grid gap-4 md:gap-6 w-full ${difficulty === 'easy' ? 'grid-cols-3' : 'grid-cols-3 md:grid-cols-6'}`}>
            {options.map((emoji, idx) => {
                // Show Answer on Timeout
                const isTheAnswer = currentScenario && getEmotions()[currentScenario.emotion as keyof ReturnType<typeof getEmotions>]?.includes(emoji);
                const showReveal = status === 'timeout' && isTheAnswer;

                return (
                    <button
                        key={idx}
                        onClick={() => handleOptionClick(emoji)}
                        disabled={status === 'correct' || status === 'timeout'}
                        className={`aspect-square bg-white rounded-2xl md:rounded-3xl shadow-lg border-b-4 md:border-b-8 text-4xl md:text-6xl flex items-center justify-center transition-all active:border-b-0 active:translate-y-2
                            ${status === 'correct' && isTheAnswer
                                ? 'bg-green-100 border-green-400 ring-4 ring-green-200 scale-110 z-10' 
                                : 'border-gray-200 hover:bg-gray-50'
                            }
                            ${showReveal ? 'bg-yellow-100 border-yellow-400 opacity-50' : ''}
                        `}
                    >
                        {emoji}
                    </button>
                );
            })}
          </div>
      )}
      
      <div className="mt-8 text-center opacity-60 text-xs md:text-sm font-medium text-purple-900">
          Be a Social Detective! How do they feel?
      </div>
    </div>
  );
};
