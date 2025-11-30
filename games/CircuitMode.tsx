
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Zap, Play, CheckCircle2, RefreshCw, CarFront, Power, PowerOff } from 'lucide-react';
import { Confetti } from '../components';
import { speak, getRandomItem } from '../utils';

type GateType = 'AND' | 'OR' | 'NOT';

interface Level {
  gate: GateType;
  hint: string;
}

const LEVELS: Level[] = [
  { gate: 'OR', hint: "Press Button A OR Button B to lower the bridge." },
  { gate: 'AND', hint: "Press Button A AND Button B together!" },
  { gate: 'NOT', hint: "The bridge is OPEN when the button is OFF. Turn it OFF." },
];

export const CircuitMode = ({ difficulty = 'easy' }: { difficulty: 'easy' | 'medium' | 'hard' }) => {
  const [level, setLevel] = useState<Level>(LEVELS[0]);
  const [inputA, setInputA] = useState(false);
  const [inputB, setInputB] = useState(false);
  const [output, setOutput] = useState(false);
  const [carState, setCarState] = useState<'waiting' | 'driving' | 'arrived'>('waiting');
  
  // Lock checks during transitions
  const isTransitioning = useRef(false);

  const startRound = useCallback(() => {
    isTransitioning.current = true;
    
    // Pick level based on difficulty
    let pool: Level[] = [];
    if (difficulty === 'easy') {
        pool = LEVELS.filter(l => l.gate === 'OR');
    } else if (difficulty === 'medium') {
        pool = LEVELS.filter(l => l.gate === 'AND');
    } else {
        // Hard has NOT and mix
        pool = LEVELS;
    }
    
    const next = getRandomItem(pool);
    
    setLevel(next);
    setCarState('waiting');

    // Force safe initial state
    if (next.gate === 'NOT') {
        setInputA(true);
        setInputB(false);
    } else {
        setInputA(false);
        setInputB(false);
    }

    setTimeout(() => {
        isTransitioning.current = false;
        speak(`Logic Level ${next.gate}. ${next.hint}`);
    }, 500);
  }, [difficulty]);

  useEffect(() => {
    startRound();
  }, [difficulty]); // Restart on diff change

  // Calculate Logic Output
  useEffect(() => {
    let result = false;
    if (level.gate === 'AND') result = inputA && inputB;
    if (level.gate === 'OR') result = inputA || inputB;
    if (level.gate === 'NOT') result = !inputA; // NOT only uses A

    setOutput(result);
  }, [inputA, inputB, level]);

  // Handle Win Condition
  useEffect(() => {
    if (isTransitioning.current) return;

    if (output && carState === 'waiting') {
      // Bridge activated!
      setCarState('driving');
      speak("Bridge Activated! Go car go!");
      
      setTimeout(() => {
        setCarState('arrived');
        speak("You made it home!");
      }, 2000);
    } 
  }, [output, carState]);

  const toggleA = () => { if (carState === 'waiting') setInputA(!inputA); };
  const toggleB = () => { if (carState === 'waiting') setInputB(!inputB); };

  return (
    <div className="w-full max-w-2xl flex flex-col items-center">
      {carState === 'arrived' && <Confetti />}

      {/* Header */}
      <div className="flex items-center gap-2 bg-cyan-100 text-cyan-800 px-6 py-2 rounded-full mb-6 font-bold shadow-sm">
          <Zap className="fill-cyan-600" />
          <span>Circuit City: {level.gate} GATE</span>
      </div>

      {/* Visual Scene */}
      <div className="relative w-full h-48 bg-sky-100 rounded-3xl border-4 border-sky-200 overflow-hidden mb-8 shadow-inner">
          {/* Background Elements */}
          <div className="absolute bottom-0 w-full h-12 bg-green-300 border-t-4 border-green-500"></div>
          <div className="absolute top-4 right-8 text-4xl">🏠</div>
          <div className="absolute top-8 right-20 text-yellow-400 animate-spin-slow text-5xl opacity-50">☀️</div>

          {/* River */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-16 bg-blue-400 border-x-4 border-blue-500 z-0"></div>

          {/* Bridge */}
          <div 
             className={`absolute bottom-12 left-1/2 -translate-x-1/2 w-28 h-4 bg-gray-700 rounded-full transition-transform duration-700 origin-left border-2 border-gray-600 z-10 ${output ? 'rotate-0' : '-rotate-45'}`}
          >
              {/* Bridge detail */}
              <div className="w-full h-full border-t-2 border-dashed border-gray-400 opacity-50"></div>
          </div>

          {/* Car */}
          <div 
             className={`absolute bottom-12 z-20 transition-all duration-2000 ease-in-out`}
             style={{ 
                 left: carState === 'waiting' ? '10%' : carState === 'arrived' ? '80%' : '80%',
             }}
          >
              <CarFront size={48} className={`text-red-500 fill-red-500 transition-transform ${carState === 'driving' ? 'animate-bounce' : ''}`} />
          </div>
      </div>

      {/* Circuit Diagram */}
      <div className="w-full bg-slate-800 p-6 rounded-3xl shadow-2xl flex flex-col items-center mb-6 border-4 border-slate-600 relative">
          
          <div className="text-slate-400 font-mono text-xs absolute top-2 left-4">LOGIC BOARD 5000</div>

          <div className="flex items-center gap-4 md:gap-12 w-full justify-center">
              
              {/* Inputs */}
              <div className="flex flex-col gap-4 md:gap-8">
                  <button 
                    onClick={toggleA}
                    className={`w-16 h-16 rounded-2xl border-b-4 active:border-b-0 active:translate-y-1 transition-all flex flex-col items-center justify-center gap-1 ${inputA ? 'bg-green-500 border-green-700 text-white shadow-[0_0_15px_rgba(34,197,94,0.6)]' : 'bg-slate-200 border-slate-400 text-slate-500'}`}
                  >
                      <Power size={24} />
                      <span className="text-xs font-bold">A</span>
                  </button>

                  {level.gate !== 'NOT' && (
                      <button 
                        onClick={toggleB}
                        className={`w-16 h-16 rounded-2xl border-b-4 active:border-b-0 active:translate-y-1 transition-all flex flex-col items-center justify-center gap-1 ${inputB ? 'bg-green-500 border-green-700 text-white shadow-[0_0_15px_rgba(34,197,94,0.6)]' : 'bg-slate-200 border-slate-400 text-slate-500'}`}
                      >
                          <Power size={24} />
                          <span className="text-xs font-bold">B</span>
                      </button>
                  )}
              </div>

              {/* Wires & Gate Visual */}
              <div className="flex-1 h-32 relative flex items-center justify-center">
                  {/* Wires from Buttons */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      {/* Wire A */}
                      <path d="M0,20 C50,20 50,50 100,50" fill="none" stroke={inputA ? '#22C55E' : '#475569'} strokeWidth="4" className="transition-colors" />
                      
                      {/* Wire B (if needed) */}
                      {level.gate !== 'NOT' && (
                           <path d="M0,80 C50,80 50,50 100,50" fill="none" stroke={inputB ? '#22C55E' : '#475569'} strokeWidth="4" className="transition-colors" />
                      )}

                      {/* Output Wire */}
                      <path d="M160,50 L250,50" fill="none" stroke={output ? '#22C55E' : '#475569'} strokeWidth="4" className="transition-colors" />
                  </svg>

                  {/* The Gate Chip */}
                  <div className={`w-20 h-20 bg-slate-700 rounded-xl border-2 border-slate-500 flex items-center justify-center z-10 shadow-lg ${output ? 'shadow-[0_0_20px_rgba(34,197,94,0.4)]' : ''}`}>
                      <span className={`text-xl font-black ${output ? 'text-green-400' : 'text-slate-500'}`}>{level.gate}</span>
                  </div>
              </div>

              {/* Output Indicator */}
              <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all ${output ? 'bg-green-500 border-green-400 shadow-[0_0_30px_rgba(34,197,94,0.8)]' : 'bg-slate-900 border-slate-700'}`}>
                  {output ? <CheckCircle2 className="text-white w-8 h-8 animate-pulse" /> : <PowerOff className="text-slate-600 w-8 h-8" />}
              </div>
          </div>
      </div>

      <div className="bg-white px-6 py-4 rounded-2xl shadow-md text-center max-w-sm">
          <p className="text-slate-600 font-medium mb-1">{level.hint}</p>
      </div>

      {carState === 'arrived' && (
          <button 
            onClick={startRound}
            className="mt-6 bg-cyan-500 text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg hover:bg-cyan-600 flex items-center gap-2 animate-bounce"
          >
             Next Level <RefreshCw />
          </button>
      )}
    </div>
  );
};
