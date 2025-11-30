
import React, { useState, useEffect, useRef } from 'react';
import { Anchor, ChefHat, Fish, Utensils, X } from 'lucide-react';
import { ITEMS, RECIPES, Recipe, ItemId } from './data';

interface DocksViewProps {
    inventory: Record<string, number>;
    onClose: () => void;
    onFishCatch: (fishId: ItemId) => void;
    onCook: (recipe: Recipe) => void;
    rodLevel: number; // 0 = Basic, 1 = Pro
}

export const DocksView = ({ inventory, onClose, onFishCatch, onCook, rodLevel }: DocksViewProps) => {
    const [fishingState, setFishingState] = useState<'idle' | 'waiting' | 'hooked'>('idle');
    const [tab, setTab] = useState<'fishing' | 'cooking'>('fishing');
    const waitTimer = useRef<number | null>(null);

    const startFishing = () => {
        if (fishingState !== 'idle') return;
        setFishingState('waiting');
        
        // Random wait time 2-5 seconds
        const waitTime = 2000 + Math.random() * 3000;
        
        waitTimer.current = window.setTimeout(() => {
            setFishingState('hooked');
            // Auto fail if not clicked in 1.5s
            waitTimer.current = window.setTimeout(() => {
                setFishingState('idle');
            }, 1500);
        }, waitTime);
    };

    const catchFish = () => {
        if (fishingState !== 'hooked') return;
        if (waitTimer.current) clearTimeout(waitTimer.current);
        
        // Determine catch
        const rand = Math.random();
        let catchId: ItemId = 'sardine';
        
        // Rod Pro increases rare chance
        const rareChance = rodLevel > 0 ? 0.4 : 0.1;
        const epicChance = rodLevel > 0 ? 0.1 : 0.02;

        if (rand < epicChance) catchId = 'lobster';
        else if (rand < rareChance) catchId = 'tuna';
        
        onFishCatch(catchId);
        setFishingState('idle');
    };

    useEffect(() => {
        return () => { if(waitTimer.current) clearTimeout(waitTimer.current); };
    }, []);

    const canCook = (recipe: Recipe) => {
        return Object.entries(recipe.ingredients).every(([id, needed]) => (inventory[id] || 0) >= (needed || 0));
    };

    return (
        <div className="fixed inset-0 z-50 bg-sky-900 flex flex-col animate-in slide-in-from-bottom">
            {/* Top Bar */}
            <div className="p-4 flex justify-between items-center bg-sky-800 shadow-md z-10">
                <h2 className="text-xl font-black text-sky-100 flex items-center gap-2">
                    <Anchor /> The Docks
                </h2>
                <button onClick={onClose} className="bg-sky-700 p-2 rounded-full text-white hover:bg-sky-600"><X /></button>
            </div>

            {/* Content */}
            <div className="flex-1 relative overflow-hidden flex flex-col">
                
                {/* Tabs */}
                <div className="flex justify-center gap-4 p-4 z-10">
                    <button 
                        onClick={() => setTab('fishing')}
                        className={`px-6 py-2 rounded-full font-bold flex items-center gap-2 transition-all ${tab === 'fishing' ? 'bg-blue-500 text-white shadow-lg scale-105' : 'bg-sky-800 text-sky-300'}`}
                    >
                        <Fish size={20} /> Fishing
                    </button>
                    <button 
                        onClick={() => setTab('cooking')}
                        className={`px-6 py-2 rounded-full font-bold flex items-center gap-2 transition-all ${tab === 'cooking' ? 'bg-orange-500 text-white shadow-lg scale-105' : 'bg-sky-800 text-sky-300'}`}
                    >
                        <Utensils size={20} /> Grill
                    </button>
                </div>

                {tab === 'fishing' ? (
                    <div className="flex-1 relative flex flex-col items-center justify-center">
                        {/* Sky/Ocean BG */}
                        <div className="absolute inset-0 bg-gradient-to-b from-sky-400 to-blue-600"></div>
                        <div className="absolute bottom-0 w-full h-1/2 bg-blue-700 opacity-50 animate-[pulse_4s_ease-in-out_infinite]"></div>
                        
                        {/* Pier */}
                        <div className="absolute bottom-0 left-0 w-full h-32 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] bg-[#8B4513] border-t-8 border-[#5D4037]"></div>

                        {/* Fishing Area */}
                        <button 
                            onClick={fishingState === 'idle' ? startFishing : catchFish}
                            className="z-20 relative active:scale-95 transition-transform"
                        >
                            {fishingState === 'idle' && (
                                <div className="bg-white/20 backdrop-blur-sm border-2 border-white/50 p-6 rounded-full text-white font-bold text-xl animate-bounce">
                                    Tap to Cast
                                </div>
                            )}
                            {fishingState === 'waiting' && (
                                <div className="text-6xl animate-pulse">🎣</div>
                            )}
                            {fishingState === 'hooked' && (
                                <div className="text-8xl animate-[shake_0.5s_linear_infinite] drop-shadow-2xl">
                                    ❗🐟❗
                                </div>
                            )}
                        </button>
                        
                        <div className="absolute bottom-8 text-white/50 font-bold uppercase tracking-widest text-sm pointer-events-none">
                            {fishingState === 'waiting' ? "Wait for it..." : fishingState === 'hooked' ? "PULL NOW!" : "Go Fishing"}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 bg-amber-50 p-4 overflow-y-auto">
                        <div className="max-w-2xl mx-auto grid grid-cols-1 gap-4">
                            {RECIPES.map(recipe => {
                                const cookable = canCook(recipe);
                                const dish = ITEMS[recipe.id];
                                return (
                                    <div key={recipe.id} className="bg-white p-4 rounded-2xl shadow-sm border-2 border-amber-100 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-amber-100 rounded-xl flex items-center justify-center text-4xl shadow-inner">
                                                {dish.emoji}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800">{dish.name}</h3>
                                                <div className="flex gap-2 mt-1">
                                                    {Object.entries(recipe.ingredients).map(([ingId, count]) => (
                                                        <span key={ingId} className={`text-xs px-2 py-0.5 rounded-md font-bold border ${inventory[ingId] >= (count||0) ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-50 text-red-400 border-red-100'}`}>
                                                            {ITEMS[ingId as ItemId].emoji} {inventory[ingId] || 0}/{count}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => onCook(recipe)}
                                            disabled={!cookable}
                                            className={`px-6 py-3 rounded-xl font-bold flex flex-col items-center ${cookable ? 'bg-orange-500 text-white shadow-lg hover:bg-orange-600 active:scale-95' : 'bg-slate-100 text-slate-400'}`}
                                        >
                                            <ChefHat size={20} />
                                            <span>Cook</span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
            
            <style>{`
                @keyframes shake {
                    0% { transform: rotate(0deg); }
                    25% { transform: rotate(10deg); }
                    75% { transform: rotate(-10deg); }
                    100% { transform: rotate(0deg); }
                }
            `}</style>
        </div>
    );
};
