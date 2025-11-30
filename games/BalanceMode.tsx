
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Scale, RefreshCw, Check, ArrowRight } from 'lucide-react';
import { Confetti } from '../components';
import { speak, getRandomItem } from '../utils';

// --- Physics Constants ---
const GRAVITY = 0.5;
const DAMPING = 0.92;
const SPRING_STRENGTH = 0.05;

interface Item {
    id: string;
    emoji: string;
    weight: number;
    name: string;
}

const ITEMS_DB = [
    { emoji: '🪶', weight: 1, name: 'Feather' },
    { emoji: '✏️', weight: 2, name: 'Pencil' },
    { emoji: '🍊', weight: 5, name: 'Orange' },
    { emoji: '🧱', weight: 10, name: 'Brick' },
    { emoji: '🐱', weight: 15, name: 'Cat' },
    { emoji: '🎒', weight: 20, name: 'Backpack' },
    { emoji: '🐶', weight: 25, name: 'Dog' },
    { emoji: '🗿', weight: 50, name: 'Statue' },
];

export const BalanceMode = ({ difficulty = 'easy' }: { difficulty: 'easy' | 'medium' | 'hard' }) => {
   const [leftItems, setLeftItems] = useState<Item[]>([]);
   const [rightItems, setRightItems] = useState<Item[]>([]);
   const [angle, setAngle] = useState(0);
   const [angularVelocity, setAngularVelocity] = useState(0);
   const [status, setStatus] = useState<'playing' | 'balanced'>('playing');

   const angleRef = useRef(0);
   const velocityRef = useRef(0);
   const frameRef = useRef<number | null>(null);

   const startRound = useCallback(() => {
       // Target weight based on difficulty
       let minWeight = 5;
       let maxWeight = 20;
       
       if (difficulty === 'medium') { minWeight = 20; maxWeight = 50; }
       if (difficulty === 'hard') { minWeight = 40; maxWeight = 100; }

       // Create a "Target" bundle
       const targetItem = getRandomItem(ITEMS_DB.filter(i => i.weight >= 10)); // Base large item
       
       let targetWeight = targetItem.weight;
       // Add random noise for harder levels
       if (difficulty !== 'easy') {
           targetWeight += Math.floor(Math.random() * 5); 
       }

       setLeftItems([{ ...targetItem, weight: targetWeight, id: 'target' }]);
       setRightItems([]);
       setAngle(-20); // Start tipped to left
       angleRef.current = -20;
       velocityRef.current = 0;
       setStatus('playing');
       speak(`Balance the scale! The ${targetItem.name} weighs ${targetWeight} pounds.`);
   }, [difficulty]);

   useEffect(() => {
       startRound();
       return () => { if(frameRef.current) cancelAnimationFrame(frameRef.current); };
   }, [difficulty]); // Restart on diff change

   // --- Physics Loop ---
   useEffect(() => {
       const loop = () => {
           const leftMass = leftItems.reduce((acc, i) => acc + i.weight, 0);
           const rightMass = rightItems.reduce((acc, i) => acc + i.weight, 0);

           const netTorque = (rightMass - leftMass) * 0.5;
           const currentAngle = angleRef.current;
           let restoringTorque = -currentAngle * SPRING_STRENGTH; 
           
           const acceleration = (netTorque + restoringTorque) * 0.1;

           velocityRef.current += acceleration;
           velocityRef.current *= DAMPING;

           angleRef.current += velocityRef.current;

           if (angleRef.current > 30) {
               angleRef.current = 30;
               velocityRef.current = 0;
           } else if (angleRef.current < -30) {
               angleRef.current = -30;
               velocityRef.current = 0;
           }

           setAngle(angleRef.current);
           
           frameRef.current = requestAnimationFrame(loop);
       };

       frameRef.current = requestAnimationFrame(loop);
       return () => { if(frameRef.current) cancelAnimationFrame(frameRef.current); };
   }, [leftItems, rightItems]);

   // Win Check
   useEffect(() => {
       if (status === 'balanced') return;
       
       const leftMass = leftItems.reduce((acc, i) => acc + i.weight, 0);
       const rightMass = rightItems.reduce((acc, i) => acc + i.weight, 0);
       
       if (leftMass > 0 && leftMass === rightMass && Math.abs(angle) < 5) {
           setStatus('balanced');
           speak("Perfect balance! You did it!");
       }
   }, [angle, leftItems, rightItems, status]);

   const addToRight = (item: typeof ITEMS_DB[0]) => {
       if (status === 'balanced') return;
       setRightItems(prev => [...prev, { ...item, id: Math.random().toString() }]);
   };

   const removeFromRight = (index: number) => {
       if (status === 'balanced') return;
       setRightItems(prev => prev.filter((_, i) => i !== index));
   };

   // Calculations
   const leftTotal = leftItems.reduce((acc, i) => acc + i.weight, 0);
   const rightTotal = rightItems.reduce((acc, i) => acc + i.weight, 0);
   const remaining = Math.max(0, leftTotal - rightTotal);

   const availableItems = ITEMS_DB.filter(
       dbItem => !leftItems.some(leftItem => leftItem.name === dbItem.name)
   );

   return (
     <div className="w-full max-w-2xl flex flex-col items-center">
         {status === 'balanced' && <Confetti />}

         <div className="bg-slate-100 px-6 py-3 rounded-full shadow-sm mb-4 flex items-center gap-2">
             <Scale className="text-slate-600" />
             <span className="font-bold text-slate-900">Weight & Balance</span>
         </div>

         {/* Math Helper Display */}
         <div className="flex w-full justify-between px-8 mb-4">
             <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-xl text-center shadow-sm">
                 <div className="text-xs font-bold uppercase">Goal</div>
                 <div className="text-2xl font-black">{leftTotal} <span className="text-sm">lbs</span></div>
             </div>

             <div className="flex items-center text-slate-400">
                 <ArrowRight />
             </div>

             <div className={`px-4 py-2 rounded-xl text-center shadow-sm transition-colors ${remaining === 0 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                 <div className="text-xs font-bold uppercase">{remaining === 0 ? 'Balanced' : 'Needed'}</div>
                 <div className="text-2xl font-black">
                     {remaining === 0 ? <Check size={24} /> : <span>{remaining} <span className="text-sm">lbs</span></span>}
                 </div>
             </div>
         </div>

         {/* Scale Visualization */}
         <div className="relative w-full h-64 mb-8 flex flex-col items-center justify-end">
             
             {/* The Beam Group */}
             <div 
                className="relative w-64 md:w-80 h-2 bg-slate-700 rounded-full transition-transform duration-75 ease-linear"
                style={{ transform: `rotate(${angle}deg)` }}
             >
                 {/* Pivot Point */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-slate-400 rounded-full border-2 border-slate-600 z-10"></div>

                 {/* Left Pan String */}
                 <div className="absolute left-0 top-1 h-24 w-0.5 bg-slate-400 origin-top" style={{ transform: `rotate(${-angle}deg)` }}>
                     {/* Left Pan */}
                     <div className="absolute bottom-0 -left-10 w-20 h-16 border-b-4 border-l-4 border-r-4 border-slate-400 rounded-b-3xl bg-slate-50/50 flex flex-wrap-reverse justify-center items-end p-1 gap-1 content-end">
                        {leftItems.map(item => (
                            <div key={item.id} className="text-3xl animate-in zoom-in" title={item.name}>
                                {item.emoji}
                            </div>
                        ))}
                     </div>
                 </div>

                 {/* Right Pan String */}
                 <div className="absolute right-0 top-1 h-24 w-0.5 bg-slate-400 origin-top" style={{ transform: `rotate(${-angle}deg)` }}>
                      {/* Right Pan */}
                      <div className="absolute bottom-0 -left-10 w-20 h-16 border-b-4 border-l-4 border-r-4 border-slate-400 rounded-b-3xl bg-slate-50/50 flex flex-wrap-reverse justify-center items-end p-1 gap-1 content-end">
                        {rightItems.map((item, idx) => (
                            <button key={item.id} onClick={() => removeFromRight(idx)} className="text-3xl animate-in zoom-in hover:scale-110 transition-transform">
                                {item.emoji}
                            </button>
                        ))}
                      </div>
                 </div>
             </div>

             {/* Base Stand */}
             <div className="w-4 h-32 bg-slate-800 rounded-t-full mt-[-4px] z-0"></div>
             <div className="w-32 h-4 bg-slate-800 rounded-full"></div>

             {status === 'balanced' && (
                 <div className="absolute top-0 bg-green-500 text-white px-4 py-1 rounded-full font-bold animate-bounce shadow-lg">
                     Balanced!
                 </div>
             )}
         </div>

         {/* Inventory */}
         <div className="w-full bg-white p-4 rounded-3xl shadow-xl border-4 border-slate-200">
             <p className="text-center text-slate-500 font-bold uppercase text-xs tracking-widest mb-4">Add items to balance</p>
             <div className="flex flex-wrap justify-center gap-3 md:gap-4">
                 {availableItems.map((item) => (
                     <button
                        key={item.name}
                        onClick={() => addToRight(item)}
                        disabled={status === 'balanced'}
                        className="flex flex-col items-center bg-slate-50 p-2 rounded-xl border-2 border-slate-100 hover:border-slate-300 active:scale-95 transition-all w-20"
                     >
                         <span className="text-4xl mb-1">{item.emoji}</span>
                         <span className="text-[10px] font-bold text-slate-600 uppercase">{item.name}</span>
                         <span className="text-[10px] bg-slate-200 px-2 rounded-full text-slate-500 font-mono mt-1">{item.weight}lbs</span>
                     </button>
                 ))}
             </div>
         </div>

         {status === 'balanced' && (
             <button 
                onClick={startRound}
                className="mt-6 bg-green-500 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-green-600 flex items-center gap-2"
             >
                Next Puzzle <RefreshCw size={20} />
             </button>
         )}
     </div>
   );
};
