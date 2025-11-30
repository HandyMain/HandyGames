import React, { useState, useEffect, useRef } from 'react';
import { 
  Sprout, Droplets, Shovel, ShoppingBag, Coins, 
  ArrowRight, Warehouse, Tractor, Egg, Milk, Scissors, 
  Settings2, ChevronUp, ChevronDown, RefreshCw, Sun, CheckCircle, Store, Home, AlertCircle
} from 'lucide-react';
import { Confetti } from '../components';
import { speak } from '../utils';

// --- CONFIGURATION ---

type ItemId = 'corn' | 'wheat' | 'carrot' | 'tomato' | 'strawberry' | 'pumpkin' | 'egg' | 'milk' | 'wool';
type AnimalId = 'chicken' | 'cow' | 'sheep';
type Tab = 'farm' | 'barn' | 'silo';

interface ItemDef {
    id: ItemId;
    name: string;
    emoji: string;
    type: 'crop' | 'product';
    cost: number; // Seed cost
    sell: number; // Sell price
    growthTime: number; // Base seconds
    foodFor?: AnimalId;
}

const ITEMS: Record<ItemId, ItemDef> = {
    // Crops
    corn: { id: 'corn', name: 'Corn', emoji: '🌽', type: 'crop', cost: 2, sell: 5, growthTime: 3, foodFor: 'chicken' },
    wheat: { id: 'wheat', name: 'Wheat', emoji: '🌾', type: 'crop', cost: 4, sell: 8, growthTime: 4, foodFor: 'cow' },
    carrot: { id: 'carrot', name: 'Carrot', emoji: '🥕', type: 'crop', cost: 6, sell: 12, growthTime: 5, foodFor: 'sheep' },
    tomato: { id: 'tomato', name: 'Tomato', emoji: '🍅', type: 'crop', cost: 10, sell: 20, growthTime: 6 },
    strawberry: { id: 'strawberry', name: 'Berry', emoji: '🍓', type: 'crop', cost: 20, sell: 45, growthTime: 8 },
    pumpkin: { id: 'pumpkin', name: 'Pumpkin', emoji: '🎃', type: 'crop', cost: 40, sell: 100, growthTime: 12 },
    // Products
    egg: { id: 'egg', name: 'Egg', emoji: '🥚', type: 'product', cost: 0, sell: 25, growthTime: 0 },
    milk: { id: 'milk', name: 'Milk', emoji: '🥛', type: 'product', cost: 0, sell: 60, growthTime: 0 },
    wool: { id: 'wool', name: 'Wool', emoji: '🧶', type: 'product', cost: 0, sell: 120, growthTime: 0 },
};

interface AnimalDef {
    id: AnimalId;
    name: string;
    emoji: string;
    cost: number;
    produces: ItemId;
    eats: ItemId;
    productionTime: number; 
}

const ANIMALS: Record<AnimalId, AnimalDef> = {
    chicken: { id: 'chicken', name: 'Chicken', emoji: '🐔', cost: 50, produces: 'egg', eats: 'corn', productionTime: 10 },
    cow: { id: 'cow', name: 'Cow', emoji: '🐮', cost: 200, produces: 'milk', eats: 'wheat', productionTime: 20 },
    sheep: { id: 'sheep', name: 'Sheep', emoji: '🐑', cost: 350, produces: 'wool', eats: 'carrot', productionTime: 30 },
};

// --- STATE TYPES ---

interface Plot {
    id: number;
    state: 'grass' | 'soil';
    isWet: boolean;
    crop: ItemId | null;
    stage: number; // 0=Seed, 1=Sprout, 2=Plant, 3=Ripe
    progress: number;
}

interface BarnSlot {
    id: number;
    animal: AnimalId | null;
    isHungry: boolean;
    productReady: boolean;
    progress: number;
}

interface Floater {
    id: number;
    text: string;
    x: number;
    y: number;
}

export const GardenMode = ({ difficulty = 'easy' }: { difficulty: 'easy' | 'medium' | 'hard' }) => {
    // Resources
    const [coins, setCoins] = useState(50); 
    const [inventory, setInventory] = useState<Record<string, number>>({});
    const [activeTab, setActiveTab] = useState<Tab>('farm');

    // World State
    const [grid, setGrid] = useState<Plot[]>(Array.from({ length: 9 }, (_, i) => ({
        id: i, state: 'grass', isWet: false, crop: null, stage: 0, progress: 0
    })));
    
    const [barn, setBarn] = useState<BarnSlot[]>(Array.from({ length: 3 }, (_, i) => ({
        id: i, animal: null, isHungry: true, productReady: false, progress: 0
    })));

    // Tech
    const [hasSprinkler, setHasSprinkler] = useState(false);

    // Selection
    const [selectedTool, setSelectedTool] = useState<string>('hoe'); // 'hoe', 'water', or ItemId/AnimalId
    
    // UI Effects
    const [floaters, setFloaters] = useState<Floater[]>([]);

    const spawnFloater = (text: string, x: number, y: number) => {
        const id = Date.now() + Math.random();
        setFloaters(prev => [...prev, { id, text, x, y }]);
        setTimeout(() => setFloaters(prev => prev.filter(f => f.id !== id)), 1000);
    };

    // --- GAME LOOP ---
    useEffect(() => {
        // Difficulty Config
        const growthMult = difficulty === 'easy' ? 2 : difficulty === 'hard' ? 0.5 : 1;
        
        const tickRate = 200; 
        const timer = setInterval(() => {
            
            // 1. FARM LOGIC
            setGrid(curr => curr.map(plot => {
                let newWet: boolean = plot.isWet;
                let newProgress = plot.progress;
                let newStage = plot.stage;

                // Sprinkler Override
                if (hasSprinkler && plot.state === 'soil') newWet = true;

                if (plot.crop && newWet && plot.stage < 3) {
                    const def = ITEMS[plot.crop];
                    const increment = (100 / (def.growthTime * 10)) * growthMult;
                    
                    newProgress += increment;
                    
                    if (newProgress >= 100) {
                        newProgress = 0;
                        newStage += 1;
                        
                        // DRYING LOGIC:
                        // If no sprinkler, soil dries IMMEDIATELY after a stage is complete.
                        // This prevents "Auto Watering" perception.
                        if (!hasSprinkler) newWet = false; 
                    }
                    
                    // Cap at Ripe
                    if (newStage >= 3) { newStage = 3; newProgress = 0; }

                    return { ...plot, isWet: newWet, stage: newStage, progress: newProgress };
                }
                
                return { ...plot, isWet: newWet };
            }));

            // 2. BARN LOGIC
            setBarn(curr => curr.map(slot => {
                if (slot.animal && !slot.isHungry && !slot.productReady) {
                    const def = ANIMALS[slot.animal];
                    const increment = (100 / (def.productionTime * 10)) * growthMult;
                    
                    let newProgress = slot.progress + increment;
                    let newReady = slot.productReady;
                    let newHungry = slot.isHungry;

                    if (newProgress >= 100) {
                        newProgress = 0;
                        newReady = true;
                        newHungry = true; // Needs food again
                    }

                    return { ...slot, progress: newProgress, productReady: newReady, isHungry: newHungry };
                }
                return slot;
            }));

        }, tickRate);

        return () => clearInterval(timer);
    }, [difficulty, hasSprinkler]);

    // --- ACTIONS ---

    const invCount = (id: string) => inventory[id] || 0;
    const inventoryTotalValue = Object.keys(inventory).reduce((acc, key) => {
        const item = ITEMS[key as ItemId];
        return acc + (item.sell * (inventory[key] || 0));
    }, 0);
    
    const updateInv = (id: string, delta: number) => {
        setInventory(prev => {
            const next = { ...prev };
            next[id] = (next[id] || 0) + delta;
            if (next[id] <= 0) delete next[id];
            return next;
        });
    };

    const handleFarmClick = (idx: number, e: React.MouseEvent) => {
        const plot = grid[idx];
        const newGrid = [...grid];
        
        // Approx coordinates for floater
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top;

        // 1. Harvest Ripe
        if (plot.crop && plot.stage === 3) {
            updateInv(plot.crop, 1);
            spawnFloater(`+1 ${ITEMS[plot.crop].emoji}`, x, y);
            speak(`Harvested!`);
            newGrid[idx] = { ...plot, crop: null, stage: 0, progress: 0, isWet: hasSprinkler };
            setGrid(newGrid);
            return;
        }

        // 2. Tools
        if (selectedTool === 'hoe') {
            if (plot.state === 'grass') {
                newGrid[idx] = { ...plot, state: 'soil' };
                speak("Tilled soil");
            } else if (plot.crop) {
                newGrid[idx] = { ...plot, crop: null, stage: 0, progress: 0 };
                speak("Cleared plot");
            }
        } else if (selectedTool === 'water') {
            if (plot.state === 'soil' && !plot.isWet) {
                newGrid[idx] = { ...plot, isWet: true };
                // Sound effect
            }
        } else {
            // 3. Planting
            const item = ITEMS[selectedTool as ItemId];
            if (item && item.type === 'crop') {
                if (plot.state === 'grass') speak("Till soil first!");
                else if (plot.crop) speak("Already planted!");
                else {
                    if (coins >= item.cost) {
                        setCoins(c => c - item.cost);
                        newGrid[idx] = { ...plot, crop: item.id, stage: 0, progress: 0, isWet: hasSprinkler };
                        spawnFloater(`-${item.cost}💰`, x, y);
                    } else {
                        speak("Need more coins! Sell crops.");
                    }
                }
            }
        }
        setGrid(newGrid);
    };

    const handleBarnClick = (idx: number) => {
        const slot = barn[idx];
        const newBarn = [...barn];

        // 1. Collect Product
        if (slot.productReady && slot.animal) {
            const prod = ANIMALS[slot.animal].produces;
            updateInv(prod, 1);
            newBarn[idx] = { ...slot, productReady: false };
            speak(`Collected ${ITEMS[prod].name}`);
            setBarn(newBarn);
            return;
        }

        // 2. Buy Animal
        const animalDef = ANIMALS[selectedTool as AnimalId];
        if (animalDef) {
            if (slot.animal) speak("Stall occupied!");
            else if (coins >= animalDef.cost) {
                setCoins(c => c - animalDef.cost);
                newBarn[idx] = { ...slot, animal: animalDef.id, isHungry: true, productReady: false, progress: 0 };
                speak(`Bought a ${animalDef.name}`);
            } else {
                speak("Too expensive!");
            }
            setBarn(newBarn);
            return;
        }

        // 3. Feed Animal
        if (slot.animal && slot.isHungry) {
            const requiredFood = ANIMALS[slot.animal].eats;
            if (selectedTool === requiredFood) {
                if (invCount(requiredFood) > 0) {
                    updateInv(requiredFood, -1);
                    newBarn[idx] = { ...slot, isHungry: false };
                    speak("Yum!");
                } else {
                    speak(`Need ${ITEMS[requiredFood].name}!`);
                }
            } else {
                 if (invCount(requiredFood) > 0) {
                      updateInv(requiredFood, -1);
                      newBarn[idx] = { ...slot, isHungry: false };
                      speak("Yum!");
                 } else {
                      speak(`${ANIMALS[slot.animal].name} eats ${ITEMS[requiredFood].name}`);
                 }
            }
            setBarn(newBarn);
        }
    };

    const quickSellAll = () => {
        if (inventoryTotalValue > 0) {
            setCoins(c => c + inventoryTotalValue);
            setInventory({});
            speak(`Sold everything for ${inventoryTotalValue} coins!`);
            spawnFloater(`+${inventoryTotalValue}💰`, window.innerWidth/2, window.innerHeight/2);
        }
    };

    const buySprinkler = () => {
        if (coins >= 500 && !hasSprinkler) {
            setCoins(c => c - 500);
            setHasSprinkler(true);
            speak("Sprinkler System Installed!");
        }
    };

    // --- RENDERERS ---

    const renderCrop = (plot: Plot) => {
        if (!plot.crop) return null;
        const item = ITEMS[plot.crop];
        const scale = 0.4 + (plot.stage * 0.2);
        const icon = plot.stage === 0 ? '🌰' : plot.stage === 1 ? '🌱' : plot.stage === 2 ? '🌿' : item.emoji;
        
        return (
            <div className={`absolute flex flex-col items-center justify-center transition-transform duration-500 ${plot.stage === 3 ? 'animate-bounce' : ''}`} style={{ transform: `scale(${scale})` }}>
                <span className="text-5xl md:text-6xl filter drop-shadow-md">{icon}</span>
            </div>
        );
    };

    return (
        <div className="w-full flex flex-col items-center h-[calc(100vh-100px)] relative overflow-hidden">
            
            {/* Floaters Layer */}
            {floaters.map(f => (
                <div 
                    key={f.id} 
                    className="fixed text-2xl font-bold text-white text-stroke-2 pointer-events-none animate-bounce z-50 drop-shadow-md"
                    style={{ left: f.x, top: f.y, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                >
                    {f.text}
                </div>
            ))}

            {/* --- TOP HUD --- */}
            <div className="w-full max-w-xl bg-white rounded-3xl shadow-sm border border-green-100 p-2 mb-2 flex justify-between items-center relative z-20 shrink-0">
                <div className={`flex items-center gap-2 px-3 py-1 md:px-4 md:py-2 rounded-full border ${coins < 5 ? 'bg-red-100 border-red-200 animate-pulse' : 'bg-yellow-100 border-yellow-200'}`}>
                    <Coins className={coins < 5 ? 'text-red-500 w-4 h-4' : 'text-yellow-600 w-5 h-5'} />
                    <span className={`text-lg md:text-xl font-black ${coins < 5 ? 'text-red-700' : 'text-yellow-700'}`}>{coins}</span>
                </div>

                {/* Quick Sell Button (Visible if items in inventory) */}
                {inventoryTotalValue > 0 && activeTab === 'farm' && (
                    <button 
                        onClick={quickSellAll}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 md:px-4 md:py-2 rounded-full font-bold text-xs md:text-sm shadow-md animate-in zoom-in flex items-center gap-1"
                    >
                        Sell All (+{inventoryTotalValue})
                    </button>
                )}

                <div className="flex gap-1">
                    <button onClick={() => setActiveTab('farm')} className={`p-2 rounded-xl transition-all ${activeTab === 'farm' ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}><Tractor size={20} /></button>
                    <button onClick={() => setActiveTab('barn')} className={`p-2 rounded-xl transition-all ${activeTab === 'barn' ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}><Home size={20} /></button>
                    <button onClick={() => setActiveTab('silo')} className={`p-2 rounded-xl transition-all relative ${activeTab === 'silo' ? 'bg-blue-500 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>
                        <Warehouse size={20} />
                        {inventoryTotalValue > 0 && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>}
                    </button>
                </div>
            </div>

            {/* --- MAIN VIEWS --- */}
            <div className="flex-1 w-full max-w-xl bg-green-50/50 rounded-3xl border-4 border-green-100 overflow-hidden relative">
                
                {/* VIEW: FARM */}
                {activeTab === 'farm' && (
                    <div className="w-full h-full p-2 flex flex-col items-center justify-center pb-24 overflow-y-auto no-scrollbar">
                        <div className="grid grid-cols-3 gap-2 w-full aspect-square">
                            {grid.map((plot, i) => (
                                <button
                                    key={i}
                                    onClick={(e) => handleFarmClick(i, e)}
                                    className={`
                                        relative rounded-xl border-b-4 active:border-b-0 active:translate-y-1 transition-all overflow-hidden w-full h-full
                                        ${plot.state === 'grass' ? 'bg-green-400 border-green-600' : 
                                          plot.isWet ? 'bg-[#5D4037] border-[#3E2723]' : 'bg-[#eecfa1] border-[#d2b48c]'} 
                                    `}
                                >
                                    {plot.state === 'grass' && <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/grass.png')]"></div>}
                                    
                                    {/* Crop */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        {renderCrop(plot)}
                                    </div>

                                    {/* Status Icons */}
                                    {plot.crop && plot.stage < 3 && !plot.isWet && (
                                        <div className="absolute top-1 right-1 bg-white/90 p-1 rounded-full animate-bounce shadow-md z-10">
                                            <Droplets size={12} className="text-blue-500 fill-blue-500" />
                                        </div>
                                    )}
                                    {plot.crop && plot.stage < 3 && plot.isWet && (
                                        <div className="absolute bottom-2 left-2 right-2 h-1.5 bg-black/30 rounded-full overflow-hidden">
                                            <div className="h-full bg-green-400 transition-all duration-300" style={{ width: `${plot.progress}%` }}></div>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* VIEW: BARN */}
                {activeTab === 'barn' && (
                    <div className="w-full h-full p-4 flex flex-col items-center bg-orange-50 overflow-y-auto no-scrollbar pb-24">
                        <div className="grid grid-cols-1 gap-3 w-full">
                            {barn.map((slot, i) => (
                                <button 
                                    key={i}
                                    onClick={() => handleBarnClick(i)}
                                    className="h-24 bg-white rounded-2xl shadow-sm border-b-4 border-orange-200 active:border-b-0 active:translate-y-1 flex items-center p-4 relative"
                                >
                                    {slot.animal ? (
                                        <>
                                            <div className="text-5xl mr-4">{ANIMALS[slot.animal].emoji}</div>
                                            <div className="flex-1 text-left">
                                                <div className="font-bold text-slate-700 text-base">{ANIMALS[slot.animal].name}</div>
                                                
                                                {!slot.productReady && !slot.isHungry && (
                                                    <div className="w-full h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
                                                        <div className="h-full bg-orange-400 transition-all duration-300" style={{ width: `${slot.progress}%` }}></div>
                                                    </div>
                                                )}

                                                {slot.isHungry && (
                                                    <div className="text-xs font-bold text-orange-500 bg-orange-100 px-2 py-1 rounded inline-block mt-1 animate-pulse">
                                                        Needs {ITEMS[ANIMALS[slot.animal].eats].emoji}
                                                    </div>
                                                )}
                                                
                                                {slot.productReady && (
                                                    <div className="text-xs font-bold text-green-500 bg-green-100 px-2 py-1 rounded inline-block mt-1 animate-bounce">
                                                        {ITEMS[ANIMALS[slot.animal].produces].name} Ready!
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full text-center text-gray-300 font-bold uppercase tracking-widest text-xs">
                                            Empty Stall
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* VIEW: SILO (MARKET) */}
                {activeTab === 'silo' && (
                    <div className="w-full h-full p-4 overflow-y-auto no-scrollbar pb-24">
                        <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                            <Store /> Market
                        </h2>
                        
                        {Object.keys(inventory).length === 0 ? (
                            <div className="text-center text-gray-400 mt-12 flex flex-col items-center">
                                <AlertCircle size={48} className="mb-4 opacity-50" />
                                <p>Silo is empty!</p>
                                <p className="text-sm mt-2">Harvest crops or collect products to sell here.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {Object.keys(inventory).map(key => {
                                    const item = ITEMS[key as ItemId];
                                    const count = inventory[key];
                                    const price = difficulty === 'easy' ? item.sell : Math.floor(item.sell * 0.8);

                                    return (
                                        <div key={key} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-3xl">{item.emoji}</span>
                                                <div>
                                                    <div className="font-bold text-slate-700 text-sm">{item.name}</div>
                                                    <div className="text-xs text-slate-400">x{count}</div>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    setCoins(c => c + (price * count));
                                                    setInventory(prev => { const n = {...prev}; delete n[key]; return n; });
                                                    speak("Sold!");
                                                    spawnFloater(`+${price * count}💰`, window.innerWidth/2, window.innerHeight/2);
                                                }}
                                                className="bg-green-500 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md hover:scale-105 transition-transform"
                                            >
                                                Sell (+{price * count})
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        
                        <div className="mt-8 border-t pt-6 mb-8">
                            <h3 className="font-bold text-slate-400 uppercase tracking-widest text-xs mb-4">Farm Upgrades</h3>
                            <button 
                                onClick={buySprinkler}
                                disabled={hasSprinkler}
                                className={`w-full p-4 rounded-2xl flex items-center justify-between border-2 ${hasSprinkler ? 'bg-blue-50 border-blue-200 text-blue-400' : 'bg-white border-blue-100 text-blue-600'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-100 p-2 rounded-lg"><Droplets size={20} /></div>
                                    <div className="text-left">
                                        <div className="font-bold text-sm">Auto-Sprinklers</div>
                                        <div className="text-xs opacity-70">Keeps crops watered</div>
                                    </div>
                                </div>
                                {hasSprinkler ? <CheckCircle /> : <div className="font-bold bg-blue-100 px-3 py-1 rounded-lg text-sm">500 🪙</div>}
                            </button>
                        </div>
                    </div>
                )}

                {/* --- BOTTOM TOOLBAR (Absolute) --- */}
                <div className="absolute bottom-0 w-full bg-white border-t border-gray-100 p-2 z-20 shadow-lg">
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {/* Basic Tools */}
                        {['hoe', 'water'].map(t => (
                            <button
                                key={t}
                                onClick={() => setSelectedTool(t)}
                                className={`
                                    flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center border-2 transition-all
                                    ${selectedTool === t ? 'bg-slate-800 border-slate-900 text-white scale-105' : 'bg-white border-slate-200 text-slate-400'}
                                `}
                            >
                                {t === 'hoe' ? <Shovel size={20} /> : <Droplets size={20} />}
                                <span className="text-[9px] font-bold uppercase mt-1">{t}</span>
                            </button>
                        ))}

                        <div className="w-px bg-gray-200 mx-1"></div>

                        {/* Seeds */}
                        {Object.values(ITEMS).filter(i => i.type === 'crop').map(item => (
                            <button
                                key={item.id}
                                onClick={() => setSelectedTool(item.id)}
                                className={`
                                    flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center border-2 transition-all relative
                                    ${selectedTool === item.id ? 'bg-green-100 border-green-500 scale-105' : 'bg-white border-gray-200 grayscale opacity-80'}
                                `}
                            >
                                <span className="text-2xl">{item.emoji}</span>
                                <span className="absolute bottom-0.5 right-0.5 bg-white/80 px-1 rounded text-[9px] font-bold text-green-700">
                                    {item.cost}
                                </span>
                            </button>
                        ))}

                        <div className="w-px bg-gray-200 mx-1"></div>

                        {/* Animals */}
                        {Object.values(ANIMALS).map(anim => (
                            <button
                                key={anim.id}
                                onClick={() => setSelectedTool(anim.id)}
                                className={`
                                    flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center border-2 transition-all relative
                                    ${selectedTool === anim.id ? 'bg-orange-100 border-orange-500 scale-105' : 'bg-white border-gray-200 grayscale opacity-80'}
                                `}
                            >
                                <span className="text-2xl">{anim.emoji}</span>
                                <span className="absolute bottom-0.5 right-0.5 bg-white/80 px-1 rounded text-[9px] font-bold text-orange-700">
                                    {anim.cost}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};