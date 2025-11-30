import React, { useState, useEffect, useCallback } from 'react';
import { FlaskConical, RefreshCw, Check, ArrowRight, Info } from 'lucide-react';
import { Confetti } from '../components';
import { speak, getRandomItem } from '../utils';

interface ColorTarget {
  name: string;
  r: number;
  g: number;
  b: number; // 0-100 scale for simplicity
  hint: string;
}

const LEVELS: ColorTarget[] = [
  { name: 'Yellow', r: 100, g: 100, b: 0, hint: "Mix Red and Green!" },
  { name: 'Cyan', r: 0, g: 100, b: 100, hint: "Mix Green and Blue!" },
  { name: 'Magenta', r: 100, g: 0, b: 100, hint: "Mix Red and Blue!" },
  { name: 'White', r: 100, g: 100, b: 100, hint: "Mix everything together!" },
  { name: 'Orange', r: 100, g: 50, b: 0, hint: "Lots of Red, some Green." },
  { name: 'Purple', r: 50, g: 0, b: 100, hint: "Lots of Blue, some Red." },
  { name: 'Pink', r: 100, g: 50, b: 100, hint: "Red, Blue and a little Green." },
  { name: 'Lime', r: 50, g: 100, b: 0, hint: "Mostly Green with a little Red." },
];

export const ColorChemistMode = () => {
  const [target, setTarget] = useState<ColorTarget>(LEVELS[0]);
  const [red, setRed] = useState(0);
  const [green, setGreen] = useState(0);
  const [blue, setBlue] = useState(0);
  const [status, setStatus] = useState<'playing' | 'won'>('playing');

  const startRound = useCallback(() => {
    // Pick random level different from current
    let next = getRandomItem(LEVELS);
    while (next.name === target.name && LEVELS.length > 1) {
      next = getRandomItem(LEVELS);
    }
    
    setTarget(next);
    setRed(0);
    setGreen(0);
    setBlue(0);
    setStatus('playing');
    speak(`Make the color ${next.name}. ${next.hint}`);
  }, [target]);

  // Initial load
  useEffect(() => {
    // Don't auto-start here to avoid conflict with state init, just rely on initial state
    // but speak the first instruction
    speak(`Make the color ${LEVELS[0].name}`);
  }, []);

  // Check for win condition
  useEffect(() => {
    if (status === 'won') return;

    // Tolerance check (Euclidean distance-ish)
    const rDiff = Math.abs(red - target.r);
    const gDiff = Math.abs(green - target.g);
    const bDiff = Math.abs(blue - target.b);
    
    // Allow 15% tolerance per channel
    if (rDiff <= 15 && gDiff <= 15 && bDiff <= 15) {
      setStatus('won');
      speak(`Perfect! You made ${target.name}!`);
    }
  }, [red, green, blue, target, status]);

  // CSS Color Strings (Scale 0-100 to 0-255)
  const mixColor = `rgb(${red * 2.55}, ${green * 2.55}, ${blue * 2.55})`;
  const targetColor = `rgb(${target.r * 2.55}, ${target.g * 2.55}, ${target.b * 2.55})`;

  const BeakerControl = ({ 
    color, 
    value, 
    setValue, 
    label 
  }: { 
    color: string, 
    value: number, 
    setValue: (v: number) => void, 
    label: string 
  }) => {
    // Determine gradient colors based on prop
    const bgClass = color === 'red' ? 'bg-red-500' : color === 'green' ? 'bg-green-500' : 'bg-blue-500';
    const borderClass = color === 'red' ? 'border-red-200' : color === 'green' ? 'border-green-200' : 'border-blue-200';
    const textClass = color === 'red' ? 'text-red-600' : color === 'green' ? 'text-green-600' : 'text-blue-600';

    return (
      <div className="flex flex-col items-center gap-2 flex-1">
        <div className="relative w-16 h-48 md:w-20 md:h-64 bg-slate-100 rounded-b-3xl rounded-t-lg border-4 border-slate-300 overflow-hidden shadow-inner">
          {/* Liquid */}
          <div 
            className={`absolute bottom-0 w-full transition-all duration-300 ease-out ${bgClass} opacity-80`}
            style={{ height: `${value}%` }}
          >
            {/* Bubbles */}
            <div className="w-full h-2 bg-white/30 animate-pulse"></div>
          </div>
          
          {/* Measurement Lines */}
          <div className="absolute inset-0 flex flex-col justify-evenly pointer-events-none opacity-30">
            <div className="w-full h-px bg-slate-800"></div>
            <div className="w-full h-px bg-slate-800"></div>
            <div className="w-full h-px bg-slate-800"></div>
            <div className="w-full h-px bg-slate-800"></div>
          </div>

          {/* Invisible Range Input for Interaction */}
          <input 
            type="range" 
            min="0" 
            max="100" 
            step="5"
            value={value} 
            onChange={(e) => setValue(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }} // This hack often tricky, better to just overlay
            // Actually, vertical range inputs are messy cross-browser.
            // Let's use the container click/drag or just make the input fill the container vertically
          />
          {/* Fallback for better touch: Just a full overlay input */}
          <input
             type="range"
             min="0"
             max="100"
             step="10"
             value={value}
             onChange={(e) => setValue(Number(e.target.value))}
             className="absolute inset-0 w-full h-full opacity-0 cursor-ns-resize"
             // Standard vertical appearance where supported
             style={{ appearance: 'slider-vertical' } as any} 
          />
        </div>
        
        <div className={`font-bold ${textClass} text-lg`}>{value}%</div>
        <div className="text-xs font-bold uppercase tracking-widest text-gray-400">{label}</div>
        
        <div className="flex gap-1">
            <button onClick={() => setValue(Math.max(0, value - 10))} className={`w-8 h-8 rounded-full border-2 ${borderClass} flex items-center justify-center font-bold text-gray-500 active:bg-gray-100`}>-</button>
            <button onClick={() => setValue(Math.min(100, value + 10))} className={`w-8 h-8 rounded-full border-2 ${borderClass} flex items-center justify-center font-bold text-gray-500 active:bg-gray-100`}>+</button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-2xl flex flex-col items-center">
      {status === 'won' && <Confetti />}

      {/* Header / Target */}
      <div className="bg-slate-800 p-4 md:p-6 rounded-3xl w-full text-center shadow-xl border-4 border-slate-600 mb-6 relative overflow-hidden">
         <div className="flex items-center justify-between mb-4 z-10 relative">
             <div className="text-left">
                 <h2 className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest">Target Protocol</h2>
                 <h1 className="text-2xl md:text-3xl font-black text-white" style={{ color: targetColor }}>{target.name}</h1>
             </div>
             <FlaskConical className="text-white opacity-50 w-12 h-12" />
         </div>
         
         <div className="flex gap-4 items-center justify-center bg-slate-900/50 p-4 rounded-2xl backdrop-blur-sm">
             {/* Target Swatch */}
             <div className="flex flex-col items-center gap-2">
                 <span className="text-white text-xs font-bold uppercase">Match This</span>
                 <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white shadow-lg" style={{ backgroundColor: targetColor }}></div>
             </div>
             
             <ArrowRight className="text-slate-500 animate-pulse" />

             {/* User Swatch */}
             <div className="flex flex-col items-center gap-2">
                 <span className="text-white text-xs font-bold uppercase">Your Mix</span>
                 <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-colors duration-200" style={{ backgroundColor: mixColor }}></div>
             </div>
         </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-xl w-full border-2 border-slate-100">
         <div className="flex justify-between gap-2 md:gap-8 w-full mb-6">
            <BeakerControl color="red" value={red} setValue={setRed} label="Red" />
            <BeakerControl color="green" value={green} setValue={setGreen} label="Green" />
            <BeakerControl color="blue" value={blue} setValue={setBlue} label="Blue" />
         </div>

         <div className="flex justify-center gap-4">
             {status === 'playing' ? (
                 <button 
                    onClick={() => speak(target.hint)} 
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors"
                 >
                    <Info size={20} /> Hint
                 </button>
             ) : (
                 <button 
                    onClick={startRound}
                    className="flex items-center gap-2 px-8 py-4 rounded-full bg-green-500 text-white font-bold text-lg shadow-lg hover:bg-green-600 animate-bounce transition-colors"
                 >
                    Next Color <ArrowRight size={24} />
                 </button>
             )}
         </div>
      </div>

      <div className="mt-8 text-center text-slate-400 text-sm font-medium">
          Slide the beakers to mix the light!
      </div>
    </div>
  );
};