
import React, { useState, useEffect, useRef } from 'react';
import { 
  Sprout, Droplets, Shovel, ShoppingBag, Coins, 
  ArrowRight, Warehouse, Tractor, Egg, Milk, Scissors, 
  Settings2, ChevronUp, ChevronDown, RefreshCw, Sun, CheckCircle, Store, Home, AlertCircle, Plus, Hammer, Zap, Rabbit
} from 'lucide-react';
import { Confetti } from '../components';
import { speak } from '../utils';

// --- CONFIGURATION ---

type ItemId = 'corn' | 'wheat' | 'carrot' | 'tomato' | 'strawberry' | 'pumpkin' | 'egg' | 'milk' | 'wool';
type AnimalId = 'chicken' | 'cow' | 'sheep';

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

interface Upgrades {
    sprinkler: boolean;
    autofeeder: boolean;
    scarecrow: boolean; // Growth boost
    tractor: boolean;   // Quick harvest (future)
}

export const GardenMode = ({ difficulty = 'easy' }: { difficulty: 'easy' | 'medium' | 'hard' }) => {
    // Resources
    const [coins, setCoins] = useState(50); 
    const [inventory, setInventory] = useState<Record<string, number>>({});
    
    // View State
    const [showMarket, setShowMarket] = useState(false);

    // World State
    const [plots, setPlots] = useState<Plot[]>(Array.from({ length: 8 }, (_, i) => ({
        id: i, state: 'grass', isWet: false, crop: null, stage: 0, progress: 0
    })));
    
    const [barn, setBarn] = useState<BarnSlot[]>(Array.from({ length: 3 }, (_, i) => ({
        id: i, animal: null, isHungry: true, productReady: false, progress: 0
    })));

    // Tech Tree
    const [upgrades, setUpgrades] = useState<Upgrades>({
        sprinkler: false,
        autofeeder: false,
        scarecrow: false,
        tractor: false
    });

    // Selection
    const [selectedTool, setSelectedTool] = useState<string>('hoe'); // 'hoe', 'water', ItemId, AnimalId
    const [toolbeltOpen, setToolbeltOpen] = useState(true);
    
    // UI Effects
    const [floaters, setFloaters] = useState<Floater[]>([]);

    const spawnFloater = (text: string, x: number, y: number) => {
        const id = Date.now() + Math.random();
        setFloaters(prev => [...prev, { id, text, x, y }]);
        setTimeout(() => setFloaters(prev => prev.filter(f => f.id !== id)), 1000);
    };

    // --- GAME LOOP ---
    useEffect(() => {
        const growthMult = difficulty === 'easy' ? 2 : difficulty === 'hard' ? 0.5 : 1;
        const scarecrowBonus = upgrades.scarecrow ? 1.5 : 1;
        
        const tickRate = 200; 
        const timer = setInterval(() => {
            
            // 1. FARM LOGIC
            setPlots(curr => curr.map(plot => {
                let newWet: boolean = plot.isWet;
                let newProgress = plot.progress;
                let newStage = plot.stage;

                // Sprinkler Override
                if (upgrades.sprinkler && plot.state === 'soil') newWet = true;

                if (plot.crop && newWet && plot.stage < 3) {
                    const def = ITEMS[plot.crop];
                    const increment = (100 / (def.growthTime * 10)) * growthMult * scarecrowBonus;
                    
                    newProgress += increment;
                    
                    if (newProgress >= 100) {
                        newProgress = 0;
                        newStage += 1;
                        if (!upgrades.sprinkler) newWet = false; 
                    }
                    
                    if (newStage >= 3) { newStage = 3; newProgress = 0; }

                    return { ...plot, isWet: newWet, stage: newStage, progress: newProgress };
                }
                
                return { ...plot, isWet: newWet };
            }));

            // 2. BARN LOGIC
            setBarn(curr => {
                return curr.map(slot => {
                    let { animal, isHungry, productReady, progress } = slot;

                    if (animal && !isHungry && !productReady) {
                        const def = ANIMALS[animal];
                        const increment = (100 / (def.productionTime * 10)) * growthMult;
                        
                        progress += increment;

                        if (progress >= 100) {
                            progress = 0;
                            productReady = true;
                            isHungry = true;
                        }
                    }
                    return { ...slot, progress, productReady, isHungry };
                });
            });

        }, tickRate);

        return () => { clearInterval(timer); };
    }, [difficulty, upgrades]);

    // Auto-Feeder Effect
    useEffect(() => {
        if (!upgrades.autofeeder) return;
        
        const feedLoop = setInterval(() => {
            setBarn(currentBarn => {
                let barnChanged = false;
                
                // We need to access inventory, but we can't inside this setter easily without a ref.
                // For simplicity in this game loop, we will cheat slightly:
                // Auto-feeder works if you have > 0 of the item, but we'll deduct it in a separate state update to avoid complexity
                // Or better: We just check here if we can find a hungry animal.
                
                // Let's implement a functional update pattern that updates both if possible, or use a ref for inventory.
                // Ref approach is best for interval reads.
                return currentBarn;
            });
            
            // To properly implement auto-feeder with inventory deduction, we need to do it outside the main high-speed loop
            // Let's do it here
            setInventory(inv => {
                const newInv = { ...inv };
                let invChanged = false;
                
                setBarn(prevBarn => {
                    let barnChanged = false;
                    const newBarn = prevBarn.map(slot => {
                        if (slot.animal && slot.isHungry) {
                            const foodId = ANIMALS[slot.animal].eats;
                            if ((newInv[foodId] || 0) > 0) {
                                newInv[foodId]--;
                                if (newInv[foodId] <= 0) delete newInv[foodId];
                                invChanged = true;
                                barnChanged = true;
                                return { ...slot, isHungry: false };
                            }
                        }
                        return slot;
                    });
                    return barnChanged ? newBarn : prevBarn;
                });
                
                return invChanged ? newInv : inv;
            });

        }, 2000); // Check every 2s

        return () => clearInterval(feedLoop);
    }, [upgrades.autofeeder]);


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
        const plot = plots[idx];
        const newPlots = [...plots];
        
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top;

        // 1. Harvest
        if (plot.crop && plot.stage === 3) {
            updateInv(plot.crop, 1);
            spawnFloater(`+1 ${ITEMS[plot.crop].emoji}`, x, y);
            speak(`Harvested!`);
            newPlots[idx] = { ...plot, crop: null, stage: 0, progress: 0, isWet: upgrades.sprinkler };
            setPlots(newPlots);
            return;
        }

        // 2. Tools
        if (selectedTool === 'hoe') {
            if (plot.state === 'grass') {
                newPlots[idx] = { ...plot, state: 'soil' };
                speak("Tilled soil");
            } else if (plot.crop) {
                newPlots[idx] = { ...plot, crop: null, stage: 0, progress: 0 };
                speak("Cleared plot");
            }
        } else if (selectedTool === 'water') {
            if (plot.state === 'soil' && !plot.isWet) {
                newPlots[idx] = { ...plot, isWet: true };
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
                        newPlots[idx] = { ...plot, crop: item.id, stage: 0, progress: 0, isWet: upgrades.sprinkler };
                        spawnFloater(`-${item.cost}💰`, x, y);
                    } else {
                        speak("Need coins!");
                    }
                }
            }
        }
        setPlots(newPlots);
    };

    const handleBarnClick = (idx: number) => {
        const slot = barn[idx];
        const newBarn = [...barn];

        if (slot.productReady && slot.animal) {
            const prod = ANIMALS[slot.animal].produces;
            updateInv(prod, 1);
            newBarn[idx] = { ...slot, productReady: false };
            speak(`Collected ${ITEMS[prod].name}`);
            setBarn(newBarn);
            return;
        }

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

        if (slot.animal && slot.isHungry) {
            const requiredFood = ANIMALS[slot.animal].eats;
            if (invCount(requiredFood) > 0) {
                updateInv(requiredFood, -1);
                newBarn[idx] = { ...slot, isHungry: false };
                speak("Yum!");
            } else {
                speak(`Need ${ITEMS[requiredFood].name}!`);
            }
            setBarn(newBarn);
        }
    };

    const buyLand = () => {
        if (coins >= 500) {
            setCoins(c => c - 500);
            const startId = plots.length;
            const newPlots = Array.from({ length: 4 }, (_, i) => ({
                id: startId + i, state: 'grass' as const, isWet: false, crop: null, stage: 0, progress: 0
            }));
            setPlots(prev => [...prev, ...newPlots]);
            speak("Land Expanded!");
        } else {
            speak("Need 500 coins.");
        }
    };

    const buyUpgrade = (type: keyof Upgrades, cost: number, name: string) => {
        if (upgrades[type]) return;
        if (coins >= cost) {
            setCoins(c => c - cost);
            setUpgrades(prev => ({ ...prev, [type]: true }));
            speak(`${name} Installed!`);
        } else {
            speak(`Need ${cost} coins.`);
        }
    };

    const quickSellAll = () => {
        if (inventoryTotalValue > 0) {
            setCoins(c => c + inventoryTotalValue);
            setInventory({});
            speak("Sold everything!");
            spawnFloater(`+${inventoryTotalValue}💰`, window.innerWidth/2, window.innerHeight/2);
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
                <span className="text-3xl md:text-4xl filter drop-shadow-md">{icon}</span>
            </div>
        );
    };

    return (
        <div className="w-full flex flex-col h-full bg-slate-100 relative overflow-hidden">
            
            {/* Floaters */}
            {floaters.map(f => (
                <div key={f.id} className="fixed text-2xl font-bold text-white z-50 pointer-events-none animate-bounce" style={{ left: f.x, top: f.y, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                    {f.text}
                </div>
            ))}

            {/* Top HUD */}
            <div className="fixed top-0 left-0 right-0 z-30 p-2 pointer-events-none flex justify-center">
                <div className="bg-white/90 backdrop-blur shadow-lg rounded-full px-4 py-2 flex gap-4 items-center border border-green-100 pointer-events-auto">
                    <div className="flex items-center gap-1">
                        <Coins className="text-yellow-500" size={18} />
                        <span className="font-black text-slate-800 text-base">{coins}</span>
                    </div>
                    <button 
                        onClick={() => setShowMarket(!showMarket)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-full font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
                    >
                        <Store size={14} /> Market
                        {inventoryTotalValue > 0 && <span className="bg-red-500 text-white text-[9px] px-1.5 rounded-full animate-pulse">!</span>}
                    </button>
                </div>
            </div>

            {/* Main Scrollable Area */}
            <div className="flex-1 overflow-y-auto pb-40 pt-16 px-3 w-full max-w-xl mx-auto scroll-smooth no-scrollbar">
                
                {/* --- FARM SECTION --- */}
                <div className="mb-6">
                    <h2 className="text-sm font-black text-green-800 mb-2 flex items-center gap-1 bg-green-100 px-3 py-1 rounded-lg inline-block">
                        <Tractor size={16} /> Fields
                    </h2>
                    <div className="grid grid-cols-4 gap-2">
                        {plots.map((plot, i) => (
                            <button
                                key={plot.id}
                                onClick={(e) => handleFarmClick(i, e)}
                                className={`
                                    aspect-square rounded-xl border-b-4 active:border-b-0 active:translate-y-1 transition-all overflow-hidden relative shadow-sm
                                    ${plot.state === 'grass' ? 'bg-green-400 border-green-600' : 
                                      plot.isWet ? 'bg-[#5D4037] border-[#3E2723]' : 'bg-[#eecfa1] border-[#d2b48c]'} 
                                `}
                            >
                                {plot.state === 'grass' && <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/grass.png')]"></div>}
                                <div className="absolute inset-0 flex items-center justify-center">{renderCrop(plot)}</div>
                                {plot.crop && plot.stage < 3 && !plot.isWet && (
                                    <div className="absolute top-1 right-1 bg-white/90 p-0.5 rounded-full animate-bounce shadow-md z-10"><Droplets size={10} className="text-blue-500" /></div>
                                )}
                                {plot.crop && plot.stage < 3 && plot.isWet && (
                                    <div className="absolute bottom-1 left-1 right-1 h-1 bg-black/30 rounded-full overflow-hidden"><div className="h-full bg-green-400 transition-all duration-300" style={{ width: `${plot.progress}%` }}></div></div>
                                )}
                            </button>
                        ))}
                        
                        {/* Expansion Slot */}
                        {plots.length < 24 && (
                            <button 
                                onClick={buyLand}
                                className="aspect-square rounded-xl border-2 border-dashed border-green-300 flex flex-col items-center justify-center text-green-500 bg-green-50 hover:bg-green-100 transition-colors gap-0.5"
                            >
                                <Plus size={20} />
                                <span className="text-[9px] font-bold">Buy Land</span>
                                <span className="text-[8px] font-bold bg-white px-1 rounded border border-green-200">500</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* --- BARN SECTION --- */}
                <div className="mb-6">
                    <h2 className="text-sm font-black text-orange-800 mb-2 flex items-center gap-1 bg-orange-100 px-3 py-1 rounded-lg inline-block">
                        <Home size={16} /> Barn
                    </h2>
                    <div className="grid grid-cols-3 gap-2">
                        {barn.map((slot, i) => (
                            <button 
                                key={slot.id}
                                onClick={() => handleBarnClick(i)}
                                className="aspect-square bg-orange-50 rounded-xl border-4 border-orange-200 shadow-sm relative flex flex-col items-center justify-center active:scale-95 transition-transform"
                            >
                                {slot.animal ? (
                                    <>
                                        <span className="text-3xl animate-bounce-slow">{ANIMALS[slot.animal].emoji}</span>
                                        {slot.isHungry && !slot.productReady && (
                                            <div className="absolute top-1 right-1 bg-red-100 text-red-500 text-[8px] font-bold px-1 rounded-full animate-pulse">Hungry</div>
                                        )}
                                        {slot.productReady && (
                                            <div className="absolute top-1 right-1 bg-green-100 text-green-600 text-[8px] font-bold px-1 rounded-full animate-bounce">Ready!</div>
                                        )}
                                        <div className="w-full px-2 mt-1 h-1.5 rounded-full bg-orange-200 overflow-hidden"><div className="h-full bg-orange-500 transition-all" style={{width: `${slot.progress}%`}}></div></div>
                                    </>
                                ) : (
                                    <span className="text-orange-200 text-xs font-bold uppercase">Empty</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- UPGRADES SHOP --- */}
                <div className="mb-8">
                    <h2 className="text-sm font-black text-blue-800 mb-2 flex items-center gap-1 bg-blue-100 px-3 py-1 rounded-lg inline-block">
                        <Zap size={16} /> Tech Shop
                    </h2>
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        <button 
                            onClick={() => buyUpgrade('sprinkler', 500, "Sprinkler")}
                            className={`flex-shrink-0 w-24 p-2 rounded-xl border-2 flex flex-col items-center text-center gap-1 ${upgrades.sprinkler ? 'bg-blue-100 border-blue-400 opacity-50' : 'bg-white border-blue-100'}`}
                        >
                            <Droplets size={20} className="text-blue-500" />
                            <div className="text-[10px] font-bold text-slate-700">Auto Water</div>
                            {!upgrades.sprinkler && <div className="text-[9px] bg-slate-100 px-1 rounded">500 🪙</div>}
                        </button>
                        <button 
                            onClick={() => buyUpgrade('autofeeder', 1000, "Auto Feeder")}
                            className={`flex-shrink-0 w-24 p-2 rounded-xl border-2 flex flex-col items-center text-center gap-1 ${upgrades.autofeeder ? 'bg-orange-100 border-orange-400 opacity-50' : 'bg-white border-orange-100'}`}
                        >
                            <RefreshCw size={20} className="text-orange-500" />
                            <div className="text-[10px] font-bold text-slate-700">Auto Feed</div>
                            {!upgrades.autofeeder && <div className="text-[9px] bg-slate-100 px-1 rounded">1000 🪙</div>}
                        </button>
                        <button 
                            onClick={() => buyUpgrade('scarecrow', 750, "Scarecrow")}
                            className={`flex-shrink-0 w-24 p-2 rounded-xl border-2 flex flex-col items-center text-center gap-1 ${upgrades.scarecrow ? 'bg-yellow-100 border-yellow-400 opacity-50' : 'bg-white border-yellow-100'}`}
                        >
                            <Rabbit size={20} className="text-yellow-600" />
                            <div className="text-[10px] font-bold text-slate-700">Faster Grow</div>
                            {!upgrades.scarecrow && <div className="text-[9px] bg-slate-100 px-1 rounded">750 🪙</div>}
                        </button>
                    </div>
                </div>
            </div>

            {/* --- TOOLBELT --- */}
            <div className={`fixed bottom-0 left-0 right-0 bg-white border-t-4 border-slate-100 p-2 z-40 transition-transform duration-300 ${toolbeltOpen ? 'translate-y-0' : 'translate-y-[85%]'}`}>
                <div className="flex justify-center -mt-5 mb-1">
                    <button onClick={() => setToolbeltOpen(!toolbeltOpen)} className="bg-white border-4 border-slate-100 rounded-full p-1 text-slate-400 shadow-sm">
                        {toolbeltOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                    </button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-1">
                    {['hoe', 'water'].map(t => (
                        <button key={t} onClick={() => setSelectedTool(t)} className={`flex-shrink-0 w-14 h-14 rounded-lg flex flex-col items-center justify-center border-2 transition-all ${selectedTool === t ? 'bg-slate-800 text-white scale-105' : 'bg-slate-50 text-slate-400'}`}>
                            {t === 'hoe' ? <Shovel size={20} /> : <Droplets size={20} />}
                        </button>
                    ))}
                    <div className="w-px bg-slate-200 mx-0.5"></div>
                    {Object.values(ITEMS).filter(i => i.type === 'crop').map(item => (
                        <button key={item.id} onClick={() => setSelectedTool(item.id)} className={`flex-shrink-0 w-14 h-14 rounded-lg flex flex-col items-center justify-center border-2 transition-all relative ${selectedTool === item.id ? 'bg-green-100 border-green-500 scale-105' : 'bg-white border-slate-100'}`}>
                            <span className="text-xl">{item.emoji}</span>
                            <span className="absolute bottom-0.5 right-0.5 text-[8px] font-bold text-green-700 bg-white/80 px-1 rounded">{item.cost}</span>
                        </button>
                    ))}
                    <div className="w-px bg-slate-200 mx-0.5"></div>
                    {Object.values(ANIMALS).map(anim => (
                        <button key={anim.id} onClick={() => setSelectedTool(anim.id)} className={`flex-shrink-0 w-14 h-14 rounded-lg flex flex-col items-center justify-center border-2 transition-all relative ${selectedTool === anim.id ? 'bg-orange-100 border-orange-500 scale-105' : 'bg-white border-slate-100'}`}>
                            <span className="text-xl">{anim.emoji}</span>
                            <span className="absolute bottom-0.5 right-0.5 text-[8px] font-bold text-orange-700 bg-white/80 px-1 rounded">{anim.cost}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* --- MARKET MODAL --- */}
            {showMarket && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center">
                    <div className="bg-white w-full max-w-lg rounded-t-[2rem] md:rounded-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom-10">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Warehouse className="text-blue-500" size={20} /> Silo</h2>
                            <button onClick={() => setShowMarket(false)} className="bg-slate-100 p-2 rounded-full text-slate-500"><ChevronDown size={20} /></button>
                        </div>
                        
                        <div className="max-h-[50vh] overflow-y-auto mb-6 space-y-2">
                            {Object.keys(inventory).length === 0 ? (
                                <div className="text-center text-slate-400 py-8 text-sm">Silo is empty. Harvest crops!</div>
                            ) : (
                                Object.keys(inventory).map(key => {
                                    const item = ITEMS[key as ItemId];
                                    const count = inventory[key];
                                    const price = difficulty === 'easy' ? item.sell : Math.floor(item.sell * 0.8);
                                    return (
                                        <div key={key} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{item.emoji}</span>
                                                <div>
                                                    <div className="font-bold text-slate-700 text-sm">{item.name}</div>
                                                    <div className="text-[10px] text-slate-400">x{count} owned</div>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    setCoins(c => c + (price * count));
                                                    setInventory(prev => { const n = {...prev}; delete n[key]; return n; });
                                                    speak("Sold!");
                                                }}
                                                className="bg-green-500 text-white px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm active:scale-95"
                                            >
                                                Sell (+{price * count})
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        
                        {inventoryTotalValue > 0 && (
                            <button onClick={quickSellAll} className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold text-base shadow-lg hover:bg-blue-600 transition-all">
                                Sell All (+{inventoryTotalValue})
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
