import React, { useState, useEffect, useCallback } from 'react';
import { Coins, Warehouse, Truck, ChevronDown, ChevronUp, Shovel, Droplets } from 'lucide-react';
import { speak } from '../utils';
import { 
    ITEMS, ANIMALS, ItemId, AnimalId, Plot, BarnSlot, Upgrades, 
    PlotState, ItemDef, AnimalDef
} from './garden/data';
import { FarmView } from './garden/FarmView';
import { BarnView } from './garden/BarnView';
import { MarketView } from './garden/MarketView';

interface Particle {
    id: number;
    x: number;
    y: number;
    content: string;
    type: 'drop' | 'float' | 'star' | 'gold';
}

export const GardenMode = ({ difficulty = 'easy' }: { difficulty: 'easy' | 'medium' | 'hard' }) => {
    // --- STATE ---
    const [coins, setCoins] = useState(200);
    const [inventory, setInventory] = useState<Record<string, number>>({});
    const [plots, setPlots] = useState<Plot[]>(Array.from({ length: 16 }, (_, i) => ({
        id: i, state: 'grass', isWet: false, crop: null, stage: 0, progress: 0
    })));
    const [barn, setBarn] = useState<BarnSlot[]>(Array.from({ length: 8 }, (_, i) => ({
        id: i, animal: null, isHungry: true, productReady: false, progress: 0
    })));
    const [upgrades, setUpgrades] = useState<Upgrades>({
        sprinkler: false, autofeeder: false, scarecrow: false, barnCapacity: 8, plotCount: 16
    });

    // UI
    const [activeView, setActiveView] = useState<'farm' | 'barn' | 'market'>('farm');
    const [selectedTool, setSelectedTool] = useState<string>('hoe'); 
    const [toolbeltOpen, setToolbeltOpen] = useState(true);
    const [particles, setParticles] = useState<Particle[]>([]);

    // --- GAME LOOP ---
    useEffect(() => {
        const growthMult = difficulty === 'easy' ? 3 : difficulty === 'hard' ? 0.8 : 1.5;
        const tickRate = 250; 

        const timer = setInterval(() => {
            // Farm Logic
            setPlots(curr => curr.map(plot => {
                // Sprinkler
                if (upgrades.sprinkler && plot.state === 'soil' && !plot.isWet && Math.random() > 0.8) {
                    return { ...plot, isWet: true };
                }

                if (plot.crop && plot.isWet && plot.stage < 3) {
                    const def = ITEMS[plot.crop];
                    const increment = (100 / (def.growthTime * 4)) * growthMult; 
                    
                    let newProgress = plot.progress + increment;
                    let newStage = plot.stage;
                    let newWet = plot.isWet;

                    if (newProgress >= 100) {
                        newProgress = 0;
                        newStage += 1;
                        if (!upgrades.sprinkler) newWet = false; // dries unless sprinkler
                    }
                    if (newStage > 3) newStage = 3;

                    return { ...plot, isWet: newWet, stage: newStage, progress: newProgress };
                }
                return plot;
            }));

            // Barn Logic
            setBarn(curr => curr.map(slot => {
                if (slot.animal && !slot.isHungry && !slot.productReady) {
                    const def = ANIMALS[slot.animal];
                    const increment = (100 / (def.productionTime * 4)) * growthMult;
                    let newProgress = slot.progress + increment;
                    let newReady = false;
                    let newHungry = false;

                    if (newProgress >= 100) {
                        newProgress = 0;
                        newReady = true;
                        newHungry = true; 
                    }
                    return { ...slot, progress: newProgress, productReady: newReady, isHungry: newHungry };
                }
                return slot;
            }));

        }, tickRate);

        return () => clearInterval(timer);
    }, [difficulty, upgrades, inventory]); 

    // --- HELPERS ---

    const updateInv = (id: string, delta: number) => {
        setInventory(prev => {
            const next = { ...prev };
            next[id] = (next[id] || 0) + delta;
            if (next[id] <= 0) delete next[id];
            return next;
        });
    };

    const spawnParticle = (content: string, x: number, y: number, type: Particle['type'] = 'float') => {
        const id = Math.random();
        setParticles(p => [...p, { id, x, y, content, type }]);
        setTimeout(() => setParticles(p => p.filter(part => part.id !== id)), 1500);
    };

    // --- ACTIONS ---

    const handlePlotClick = (idx: number, e: React.MouseEvent) => {
        const plot = plots[idx];
        const newPlots = [...plots];
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        
        // Harvest
        if (plot.crop && plot.stage === 3) {
            updateInv(plot.crop, 1);
            spawnParticle(ITEMS[plot.crop].emoji, rect.left + rect.width/2, rect.top, 'star');
            speak("Harvest!");
            newPlots[idx] = { ...plot, crop: null, stage: 0, progress: 0, state: 'exhausted', isWet: false };
            setPlots(newPlots);
            return;
        }

        // Tools
        if (selectedTool === 'hoe') {
            if (plot.state === 'grass' || plot.state === 'exhausted') {
                newPlots[idx] = { ...plot, state: 'soil' };
                spawnParticle("💨", rect.left + rect.width/2, rect.top);
                speak("Working soil");
            } else if (plot.crop) {
                newPlots[idx] = { ...plot, crop: null, stage: 0, progress: 0 };
                speak("Cleared");
            }
        } else if (selectedTool === 'water') {
            if (plot.state === 'soil' && !plot.isWet) {
                newPlots[idx] = { ...plot, isWet: true };
                spawnParticle("💧", rect.left + rect.width/2, rect.top, 'drop');
            }
        } else {
            // Planting
            const item = ITEMS[selectedTool as ItemId];
            if (item && item.type === 'crop') {
                if (plot.state !== 'soil') {
                    speak("Prepare soil first!");
                } else if (plot.crop) {
                    speak("Already planted!");
                } else {
                    if (coins >= item.cost) {
                        setCoins(c => c - item.cost);
                        newPlots[idx] = { ...plot, crop: item.id, stage: 0, progress: 0 };
                        spawnParticle(`-${item.cost}`, rect.left + rect.width/2, rect.top);
                    } else {
                        speak("Need more coins");
                    }
                }
            }
        }
        setPlots(newPlots);
    };

    const handleBarnClick = (idx: number, e: React.MouseEvent) => {
        const slot = barn[idx];
        const newBarn = [...barn];
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

        if (slot.productReady && slot.animal) {
            const prod = ANIMALS[slot.animal].produces;
            updateInv(prod, 1);
            newBarn[idx] = { ...slot, productReady: false };
            spawnParticle(ITEMS[prod].emoji, rect.left + rect.width/2, rect.top, 'star');
            setBarn(newBarn);
            return;
        }

        const animalDef = ANIMALS[selectedTool as AnimalId];
        if (animalDef) {
            if (slot.animal) speak("Full!");
            else if (coins >= animalDef.cost) {
                setCoins(c => c - animalDef.cost);
                newBarn[idx] = { ...slot, animal: animalDef.id, isHungry: true };
                speak(animalDef.name);
            }
            setBarn(newBarn);
            return;
        }

        if (slot.animal && slot.isHungry) {
            const food = ANIMALS[slot.animal].eats;
            if ((inventory[food] || 0) > 0) {
                updateInv(food, -1);
                newBarn[idx] = { ...slot, isHungry: false };
                spawnParticle("❤️", rect.left + rect.width/2, rect.top);
            } else {
                speak(`Need ${food}`);
            }
            setBarn(newBarn);
        }
    };

    const handleSell = (id: string) => {
        const amount = inventory[id];
        if (!amount) return;
        const item = ITEMS[id as ItemId];
        if (!item) return;
        
        setCoins(c => c + (item.sell * (amount || 0)));
        updateInv(id, -amount);
        speak("Sold!");
    };

    const handleUpgrade = (type: keyof Upgrades) => {
        const costs: any = { sprinkler: 500, autofeeder: 800, scarecrow: 300, plotCount: 1000, barnCapacity: 1000 };
        const cost = costs[type];
        
        if (type === 'plotCount' && upgrades.plotCount >= 32) return;
        if (type === 'barnCapacity' && upgrades.barnCapacity >= 16) return;

        if (coins >= cost) {
            setCoins(c => c - cost);
            if (type === 'plotCount') {
                const newPlots = Array.from({ length: 16 }, (_, i) => ({
                    id: plots.length + i, state: 'grass', isWet: false, crop: null, stage: 0, progress: 0
                } as Plot));
                setPlots(prev => [...prev, ...newPlots]);
                setUpgrades(u => ({ ...u, plotCount: 32 }));
            } else if (type === 'barnCapacity') {
                const newSlots = Array.from({ length: 8 }, (_, i) => ({
                    id: barn.length + i, animal: null, isHungry: true, productReady: false, progress: 0
                } as BarnSlot));
                setBarn(prev => [...prev, ...newSlots]);
                setUpgrades(u => ({ ...u, barnCapacity: 16 }));
            } else {
                setUpgrades(u => ({ ...u, [type]: true }));
            }
            speak("Upgraded!");
        } else {
            speak(`Need ${cost} coins`);
        }
    };

    const smartSellAll = () => {
        let totalSoldValue = 0;
        const newInv = { ...inventory };
        let soldAny = false;

        const needs: Record<string, number> = {};
        barn.forEach(slot => {
            if (slot.animal) {
                const food = ANIMALS[slot.animal].eats;
                needs[food] = (needs[food] || 0) + 1;
            }
        });

        Object.keys(newInv).forEach(itemId => {
            const item = ITEMS[itemId as ItemId];
            const amount = newInv[itemId];
            let keepAmount = 0;

            if (item.type === 'crop') {
                const needed = needs[itemId] || 0;
                keepAmount = needed * 2;
            }

            const sellAmount = Math.max(0, amount - keepAmount);
            
            if (sellAmount > 0) {
                totalSoldValue += sellAmount * item.sell;
                newInv[itemId] = amount - sellAmount;
                if (newInv[itemId] <= 0) delete newInv[itemId];
                soldAny = true;
            }
        });

        if (soldAny) {
            setInventory(newInv);
            setCoins(c => c + totalSoldValue);
            speak(`Smart sell complete! Earned ${totalSoldValue} coins.`);
            spawnParticle(`+${totalSoldValue}`, window.innerWidth/2, 100, 'gold');
        } else {
            speak("Nothing extra to sell! Animals need this food.");
        }
    };

    const totalValue = Object.entries(inventory).reduce((acc: number, [id, count]: [string, number]) => {
        const item = ITEMS[id as ItemId];
        return acc + ((item?.sell || 0) * count);
    }, 0);

    return (
        <div className="w-full h-full bg-gradient-to-b from-sky-300 via-sky-200 to-green-100 relative overflow-hidden select-none">
            
            {/* Background Atmosphere */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-10 left-10 text-6xl opacity-80 animate-[floatCloud_20s_linear_infinite]">☁️</div>
                <div className="absolute top-20 right-20 text-5xl opacity-60 animate-[floatCloud_25s_linear_infinite_reverse]">☁️</div>
                <div className="absolute top-40 left-1/3 text-4xl opacity-40 animate-[floatCloud_30s_linear_infinite]">☁️</div>
            </div>

            {/* 3D WORLD */}
            <FarmView 
                plots={plots} 
                activeView={activeView} 
                onPlotClick={handlePlotClick}
                onViewChange={setActiveView}
            />

            {/* PARTICLES */}
            {particles.map(p => (
                <div 
                    key={p.id}
                    className="fixed pointer-events-none text-2xl font-bold animate-[floatUp_1s_ease-out_forwards] z-50"
                    style={{ left: p.x, top: p.y, color: p.type === 'star' ? '#FBBF24' : p.type === 'drop' ? '#60A5FA' : '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                >
                    {p.content}
                </div>
            ))}

            {/* HUD */}
            <div className="fixed top-4 left-0 w-full flex justify-center z-40 pointer-events-none px-4">
                <div className="bg-white/90 backdrop-blur-md rounded-full px-4 py-2 flex gap-4 shadow-xl border-2 border-slate-100 pointer-events-auto items-center">
                    <div className="flex items-center gap-2 min-w-[80px]">
                        <Coins className="text-yellow-500" />
                        <span className="text-xl font-black text-slate-800">{coins}</span>
                    </div>
                    
                    <button 
                        onClick={() => setActiveView(activeView === 'farm' ? 'market' : 'farm')}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full font-bold text-sm transition-colors ${totalValue > 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}
                    >
                        <Warehouse size={16} />
                        <span className="hidden md:inline">Value:</span> {totalValue}
                    </button>

                    <div className="w-px h-6 bg-slate-300"></div>

                    <button 
                        onClick={smartSellAll}
                        className="flex items-center gap-2 px-3 py-1 rounded-full font-bold text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                        title="Sell Surplus Crops & All Products"
                    >
                        <Truck size={16} />
                        <span className="hidden md:inline">Smart Sell</span>
                    </button>
                </div>
            </div>

            {/* OVERLAYS */}
            {activeView === 'barn' && (
                <BarnView 
                    barn={barn} 
                    onBarnClick={handleBarnClick} 
                    onClose={() => setActiveView('farm')}
                    onExpand={() => handleUpgrade('barnCapacity')}
                />
            )}

            {activeView === 'market' && (
                <MarketView 
                    inventory={inventory}
                    coins={coins}
                    upgrades={upgrades}
                    onSell={handleSell}
                    onUpgrade={handleUpgrade}
                    onClose={() => setActiveView('farm')}
                />
            )}

            {/* TOOLBELT */}
            {activeView === 'farm' && (
                <div className={`fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-green-100 p-2 z-30 transition-transform duration-300 ${toolbeltOpen ? 'translate-y-0' : 'translate-y-[85%]'}`}>
                    <div className="flex justify-center -mt-6 mb-2">
                        <button onClick={() => setToolbeltOpen(!toolbeltOpen)} className="bg-white rounded-full p-2 text-green-600 shadow-lg hover:text-green-800">
                            {toolbeltOpen ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                        </button>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-6 px-4 no-scrollbar">
                        <button onClick={() => setSelectedTool('hoe')} className={`flex-shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center border-b-4 transition-all ${selectedTool === 'hoe' ? 'bg-amber-800 text-white border-amber-950 -translate-y-2' : 'bg-slate-100 text-slate-500 border-slate-300'}`}>
                            <Shovel size={24} />
                            <span className="text-[10px] font-bold mt-1">Hoe</span>
                        </button>
                        <button onClick={() => setSelectedTool('water')} className={`flex-shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center border-b-4 transition-all ${selectedTool === 'water' ? 'bg-blue-500 text-white border-blue-700 -translate-y-2' : 'bg-blue-50 text-blue-400 border-blue-200'}`}>
                            <Droplets size={24} />
                            <span className="text-[10px] font-bold mt-1">Water</span>
                        </button>
                        <div className="w-px bg-slate-300 mx-1"></div>
                        {(Object.values(ITEMS) as ItemDef[]).filter(i => i.type === 'crop').map((item: ItemDef) => (
                            <button key={item.id} onClick={() => setSelectedTool(item.id)} className={`flex-shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center border-b-4 transition-all relative ${selectedTool === item.id ? 'bg-green-100 border-green-400 -translate-y-2' : 'bg-white border-slate-200'}`}>
                                <span className="text-2xl">{item.emoji}</span>
                                <span className="absolute top-1 right-1 text-[9px] font-bold text-green-700 bg-green-100 px-1 rounded-full">{item.cost}</span>
                            </button>
                        ))}
                        <div className="w-px bg-slate-300 mx-1"></div>
                        {(Object.values(ANIMALS) as AnimalDef[]).map((anim: AnimalDef) => (
                            <button key={anim.id} onClick={() => setSelectedTool(anim.id)} className={`flex-shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center border-b-4 transition-all relative ${selectedTool === anim.id ? 'bg-orange-100 border-orange-400 -translate-y-2' : 'bg-white border-slate-200'}`}>
                                <span className="text-2xl">{anim.emoji}</span>
                                <span className="absolute top-1 right-1 text-[9px] font-bold text-orange-700 bg-orange-100 px-1 rounded-full">{anim.cost}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes floatUp {
                    0% { opacity: 1; transform: translateY(0) scale(1); }
                    100% { opacity: 0; transform: translateY(-50px) scale(1.5); }
                }
                @keyframes floatCloud {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100vw); }
                }
            `}</style>
        </div>
    );
};