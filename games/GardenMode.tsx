
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Coins, Warehouse, Truck, ChevronDown, ChevronUp, Shovel, Droplets, CloudRain, Sun } from 'lucide-react';
import { speak } from '../utils';
import { 
    ITEMS, ANIMALS, ItemId, AnimalId, Plot, BarnSlot, Upgrades, 
    PlotState, ItemDef, AnimalDef, Recipe
} from './garden/data';
import { FarmView } from './garden/FarmView';
import { BarnView } from './garden/BarnView';
import { MarketView } from './garden/MarketView';
import { DocksView } from './garden/DocksView';

interface Particle {
    id: number;
    x: number;
    y: number;
    content: string;
    type: 'drop' | 'float' | 'star' | 'gold' | 'heart';
}

interface Dog {
    x: number; // Percentage 0-100
    y: number; // Percentage 0-100
    state: 'idle' | 'walking' | 'sitting' | 'running';
    facingRight: boolean;
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
        sprinkler: false, autofeeder: false, scarecrow: false, combine: false, barnCapacity: 8, plotCount: 16,
        superPlow: false, goldenCan: false, greenhouse: false, seeder: false, autoCollector: false,
        windmill: false, statue: false,
        coastAccess: false, rodPro: false, masterChef: false
    });

    // Environment
    const [weather, setWeather] = useState<'sunny' | 'rain'>('sunny');
    const [dog, setDog] = useState<Dog>({ x: 50, y: 50, state: 'idle', facingRight: true });

    // UI
    const [activeView, setActiveView] = useState<'farm' | 'barn' | 'market' | 'docks'>('farm');
    const [selectedTool, setSelectedTool] = useState<string>(''); // Default to nothing/smart cursor
    const [toolbeltOpen, setToolbeltOpen] = useState(true);
    const [particles, setParticles] = useState<Particle[]>([]);

    // Ref for Game Loop to access latest state without re-triggering interval
    const stateRef = useRef({ plots, barn, inventory, upgrades, weather, dog });
    useEffect(() => {
        stateRef.current = { plots, barn, inventory, upgrades, weather, dog };
    }, [plots, barn, inventory, upgrades, weather, dog]);

    // --- GAME LOOP ---
    useEffect(() => {
        const baseGrowthMult = difficulty === 'easy' ? 3 : difficulty === 'hard' ? 0.8 : 1.5;
        const tickRate = 250; 

        const timer = setInterval(() => {
            const { plots, barn, inventory, upgrades, weather, dog } = stateRef.current;
            const growthMult = upgrades.greenhouse ? baseGrowthMult * 2 : baseGrowthMult;

            let invUpdates: Record<string, number> = {};
            let hasInvUpdates = false;
            
            // 1. Weather Logic (Random change every ~30s)
            if (Math.random() < 0.005) {
                const newWeather = weather === 'sunny' ? 'rain' : 'sunny';
                setWeather(newWeather);
                if (newWeather === 'rain') speak("It's raining! Free water!");
                else speak("The sun is out!");
            }

            // 2. Dog Logic (Move randomly)
            if (Math.random() < 0.05) {
                const moves = Math.random() > 0.3;
                if (moves) {
                    const newX = Math.max(10, Math.min(90, dog.x + (Math.random() - 0.5) * 20));
                    const newY = Math.max(20, Math.min(90, dog.y + (Math.random() - 0.5) * 20));
                    setDog({
                        x: newX,
                        y: newY,
                        state: Math.random() > 0.7 ? 'running' : 'walking',
                        facingRight: newX > dog.x
                    });
                } else {
                    setDog(d => ({ ...d, state: Math.random() > 0.5 ? 'idle' : 'sitting' }));
                }
            }

            // 3. Plot Logic (Growth + Tractor + Rain)
            let plotsChanged = false;
            const newPlots = plots.map(plot => {
                // Tractor Logic (Auto-Harvest)
                if (upgrades.combine && plot.crop && plot.stage === 3) {
                    invUpdates[plot.crop] = (invUpdates[plot.crop] || 0) + 1;
                    hasInvUpdates = true;
                    plotsChanged = true;
                    return { ...plot, crop: null, stage: 0, progress: 0, state: 'exhausted' as PlotState, isWet: false };
                }

                // Sprinkler OR Rain
                const isRaining = weather === 'rain';
                const sprinklerTrigger = upgrades.sprinkler && Math.random() > 0.8;
                
                if (plot.state === 'soil' && !plot.isWet && (isRaining || sprinklerTrigger)) {
                    plotsChanged = true;
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
                        // Stays wet if raining or sprinkler, otherwise dries
                        if (!upgrades.sprinkler && !isRaining) newWet = false; 
                    }
                    if (newStage > 3) newStage = 3;

                    if (newProgress !== plot.progress || newStage !== plot.stage || newWet !== plot.isWet) {
                        plotsChanged = true;
                        return { ...plot, isWet: newWet, stage: newStage, progress: newProgress };
                    }
                }
                return plot;
            });

            // 4. Barn Logic (Production + Auto-Feed + Auto-Collect)
            let barnChanged = false;
            const newBarn = barn.map(slot => {
                // Auto-Feeder Logic
                if (upgrades.autofeeder && slot.animal && slot.isHungry) {
                    const food = ANIMALS[slot.animal].eats;
                    const currentStock = (inventory[food] || 0) + (invUpdates[food] || 0);
                    
                    if (currentStock > 0) {
                        invUpdates[food] = (invUpdates[food] || 0) - 1;
                        hasInvUpdates = true;
                        barnChanged = true;
                        return { ...slot, isHungry: false };
                    }
                }

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
                    
                    if (newProgress !== slot.progress || newReady !== slot.productReady) {
                        barnChanged = true;
                        // Check Auto-Collect
                        if (newReady && upgrades.autoCollector) {
                            const prod = ANIMALS[slot.animal as AnimalId].produces;
                            invUpdates[prod] = (invUpdates[prod] || 0) + 1;
                            hasInvUpdates = true;
                            return { ...slot, isHungry: newHungry, productReady: false, progress: 0 };
                        }
                        return { ...slot, progress: newProgress, productReady: newReady, isHungry: newHungry } as BarnSlot;
                    }
                }
                return slot;
            });

            // Apply Updates
            if (plotsChanged) setPlots(newPlots);
            if (barnChanged) setBarn(newBarn);
            
            if (hasInvUpdates) {
                setInventory(prev => {
                    const next = { ...prev };
                    Object.entries(invUpdates).forEach(([id, delta]) => {
                        next[id] = (next[id] || 0) + delta;
                        if (next[id] <= 0) delete next[id];
                    });
                    return next;
                });
            }

        }, tickRate);

        return () => clearInterval(timer);
    }, [difficulty]); 

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

    const handleDogClick = (e: React.MouseEvent) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        
        // Reward
        const reward = Math.floor(Math.random() * 5) + 1;
        setCoins(c => c + reward);
        
        spawnParticle("❤️", rect.left + rect.width/2, rect.top, 'heart');
        spawnParticle(`+${reward}`, rect.left + rect.width/2 + 20, rect.top - 20, 'gold');
        
        speak("Good dog!");
        
        // Dog jumps
        setDog(d => ({ ...d, state: 'running' }));
        setTimeout(() => setDog(d => ({ ...d, state: 'idle' })), 500);
    };

    const handlePlotClick = (idx: number, e: React.MouseEvent) => {
        const plot = plots[idx];
        let newPlots = [...plots];
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const centerX = rect.left + rect.width/2;
        const centerY = rect.top;
        
        // 1. Harvest (Highest Priority)
        if (plot.crop && plot.stage === 3) {
            updateInv(plot.crop, 1);
            spawnParticle(ITEMS[plot.crop].emoji, centerX, centerY, 'star');
            speak("Harvest!");
            newPlots[idx] = { ...plot, crop: null, stage: 0, progress: 0, state: 'exhausted' as PlotState, isWet: false };
            setPlots(newPlots);
            return;
        }

        // 2. Smart Tilling (If un-tilled, automatically till)
        if (plot.state === 'grass' || plot.state === 'exhausted') {
            if (upgrades.superPlow) {
                // AOE Tilling
                let count = 0;
                newPlots = newPlots.map(p => {
                    if (p.state === 'grass' || p.state === 'exhausted') {
                        count++;
                        return { ...p, state: 'soil' as PlotState };
                    }
                    return p;
                });
                if (count > 0) {
                    spawnParticle("🚜", centerX, centerY);
                    speak("Super Plow!");
                }
            } else {
                // Single Tilling
                newPlots[idx] = { ...plot, state: 'soil' as PlotState };
                spawnParticle("💨", centerX, centerY);
                speak("Ready!");
            }
            setPlots(newPlots);
            return;
        }

        // 3. Tool Actions (Water or Plant) - Only if soil
        if (plot.state === 'soil') {
            
            if (selectedTool === 'water') {
                if (upgrades.goldenCan) {
                    // AOE Water
                    let count = 0;
                    newPlots = newPlots.map(p => {
                        if (p.state === 'soil' && !p.isWet) {
                            count++;
                            return { ...p, isWet: true };
                        }
                        return p;
                    });
                    if (count > 0) {
                        spawnParticle("✨", centerX, centerY, 'drop');
                        speak("Golden Shower!");
                    }
                } else {
                    // Single Water
                    if (!plot.isWet) {
                        newPlots[idx] = { ...plot, isWet: true };
                        spawnParticle("💧", centerX, centerY, 'drop');
                    }
                }
                setPlots(newPlots);
                return;
            }

            // Planting
            const item = ITEMS[selectedTool as ItemId];
            if (item && item.type === 'crop') {
                if (plot.crop) {
                    speak("Already planted!");
                    return;
                }

                if (upgrades.seeder) {
                    // AOE Planting
                    let planted = 0;
                    let cost = 0;
                    let currentMoney = coins;
                    
                    newPlots = newPlots.map(p => {
                        if (p.state === 'soil' && !p.crop && currentMoney >= item.cost) {
                            planted++;
                            currentMoney -= item.cost;
                            cost += item.cost;
                            return { ...p, crop: item.id, stage: 0, progress: 0 };
                        }
                        return p;
                    });

                    if (planted > 0) {
                        setCoins(currentMoney);
                        spawnParticle(`-${cost}`, centerX, centerY);
                        speak("Mass Planting!");
                        setToolbeltOpen(false);
                    } else {
                        speak("Not enough coins!");
                    }
                } else {
                    // Single Planting
                    if (coins >= item.cost) {
                        setCoins(c => c - item.cost);
                        newPlots[idx] = { ...plot, crop: item.id, stage: 0, progress: 0 };
                        spawnParticle(`-${item.cost}`, centerX, centerY);
                        setToolbeltOpen(false); 
                    } else {
                        speak("Need more coins");
                    }
                }
                setPlots(newPlots);
            }
        }
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
                setToolbeltOpen(false);
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
                speak(`Need ${ITEMS[food].name}`);
            }
            setBarn(newBarn);
        }
    };

    const handleSell = (id: string) => {
        const amount = inventory[id];
        if (!amount) return;
        const item = ITEMS[id as ItemId];
        if (!item) return;
        
        // Master Chef Bonus logic (re-applied here for safety)
        const price = upgrades.masterChef && item.type === 'dish' ? Math.floor(item.sell * 1.2) : item.sell;

        setCoins(c => c + (price * (amount || 0)));
        updateInv(id, -amount);
        speak("Sold!");
    };

    const handleService = (type: string) => {
        if (type === 'rain') {
            if (coins >= 500) {
                setCoins(c => c - 500);
                setWeather('rain');
                speak("Let it rain!");
                setActiveView('farm');
            } else {
                speak("Need 500 coins.");
            }
        }
    };

    const handleUpgrade = (type: keyof Upgrades) => {
        const costs: Record<keyof Upgrades, number> = { 
            sprinkler: 500, autofeeder: 800, scarecrow: 300, combine: 2000, 
            plotCount: 1000, barnCapacity: 1000,
            superPlow: 3000, goldenCan: 3000, greenhouse: 5000, seeder: 2500,
            autoCollector: 15000, windmill: 8000, statue: 10000,
            coastAccess: 2000, rodPro: 5000, masterChef: 10000
        };
        
        // Calculate Dynamic Costs
        let finalCost = costs[type];
        if (type === 'plotCount') finalCost = plots.length * 250;
        if (type === 'barnCapacity') finalCost = barn.length * 500;

        if (type === 'plotCount' && upgrades.plotCount >= 256) return; // Hard Cap safety
        if (type === 'barnCapacity' && upgrades.barnCapacity >= 128) return;
        if (upgrades[type] === true) return; // Already bought single-use

        if (coins >= finalCost) {
            setCoins(c => c - finalCost);
            if (type === 'plotCount') {
                const newPlots = Array.from({ length: 16 }, (_, i) => ({
                    id: plots.length + i, state: 'grass', isWet: false, crop: null, stage: 0, progress: 0
                } as Plot));
                setPlots(prev => [...prev, ...newPlots]);
                setUpgrades(u => ({ ...u, plotCount: u.plotCount + 16 }));
            } else if (type === 'barnCapacity') {
                const newSlots = Array.from({ length: 8 }, (_, i) => ({
                    id: barn.length + i, animal: null, isHungry: true, productReady: false, progress: 0
                } as BarnSlot));
                setBarn(prev => [...prev, ...newSlots]);
                setUpgrades(u => ({ ...u, barnCapacity: u.barnCapacity + 8 }));
            } else {
                setUpgrades(u => ({ ...u, [type]: true }));
            }
            speak("Upgraded!");
        } else {
            speak(`Need ${finalCost} coins`);
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
                // Apply Chef Bonus
                const price = upgrades.masterChef && item.type === 'dish' ? Math.floor(item.sell * 1.2) : item.sell;
                totalSoldValue += sellAmount * price;
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

    // --- COAST LOGIC ---
    const handleFishCatch = (fishId: ItemId) => {
        updateInv(fishId, 1);
        spawnParticle(ITEMS[fishId].emoji, window.innerWidth/2, window.innerHeight/2, 'star');
        speak(`Caught a ${ITEMS[fishId].name}!`);
    };

    const handleCook = (recipe: Recipe) => {
        // Deduct ingredients
        const newInv = { ...inventory };
        let canCook = true;
        Object.entries(recipe.ingredients).forEach(([id, count]) => {
            if ((newInv[id] || 0) < (count || 0)) canCook = false;
            newInv[id] = (newInv[id] || 0) - (count || 0);
            if (newInv[id] <= 0) delete newInv[id];
        });

        if (canCook) {
            // Add dish
            newInv[recipe.id] = (newInv[recipe.id] || 0) + 1;
            setInventory(newInv);
            spawnParticle(ITEMS[recipe.id].emoji, window.innerWidth/2, window.innerHeight/2, 'star');
            speak(`Cooked ${ITEMS[recipe.id].name}!`);
        }
    };

    const totalValue = Object.entries(inventory).reduce((acc: number, [id, count]: [string, number]) => {
        const item = ITEMS[id as ItemId];
        return acc + ((item?.sell || 0) * count);
    }, 0);

    return (
        <div className={`w-full h-full relative overflow-hidden select-none transition-colors duration-2000 ${weather === 'rain' ? 'bg-slate-600' : 'bg-gradient-to-b from-sky-300 via-sky-200 to-green-100'}`}>
            
            {/* Background Atmosphere */}
            <div className="absolute inset-0 pointer-events-none">
                {weather === 'sunny' ? (
                    <>
                        <div className="absolute top-10 left-10 text-6xl opacity-80 animate-[floatCloud_20s_linear_infinite]">☁️</div>
                        <div className="absolute top-20 right-20 text-5xl opacity-60 animate-[floatCloud_25s_linear_infinite_reverse]">☁️</div>
                        <div className="absolute top-40 left-1/3 text-4xl opacity-40 animate-[floatCloud_30s_linear_infinite]">☁️</div>
                    </>
                ) : (
                    <div className="absolute inset-0 bg-blue-900/30 backdrop-blur-[1px]"></div>
                )}
            </div>

            {/* 3D WORLD */}
            <FarmView 
                plots={plots} 
                barn={barn}
                weather={weather}
                dog={dog}
                upgrades={upgrades}
                onPlotClick={handlePlotClick}
                onBarnClick={handleBarnClick}
                onDogClick={handleDogClick}
                onOpenMarket={() => setActiveView('market')}
                onOpenDocks={() => setActiveView('docks')}
            />

            {/* PARTICLES */}
            {particles.map(p => (
                <div 
                    key={p.id}
                    className="fixed pointer-events-none text-2xl font-bold animate-[floatUp_1s_ease-out_forwards] z-50"
                    style={{ left: p.x, top: p.y, color: p.type === 'star' ? '#FBBF24' : p.type === 'drop' ? '#60A5FA' : p.type === 'heart' ? '#F43F5E' : '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
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
                    onService={handleService}
                    onClose={() => setActiveView('farm')}
                />
            )}

            {activeView === 'docks' && (
                <DocksView 
                    inventory={inventory}
                    onClose={() => setActiveView('farm')}
                    onFishCatch={handleFishCatch}
                    onCook={handleCook}
                    rodLevel={upgrades.rodPro ? 1 : 0}
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
                    
                    <div className="flex gap-2 justify-center mb-2">
                        <button onClick={() => { setSelectedTool('water'); setToolbeltOpen(true); }} className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1 ${selectedTool === 'water' ? 'bg-blue-100 text-blue-800' : 'bg-slate-50 text-slate-500'}`}>
                            <Droplets size={16} /> Water
                        </button>
                        <button onClick={() => { setSelectedTool('seeds'); setToolbeltOpen(true); }} className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1 ${['corn','wheat','carrot'].includes(selectedTool) || selectedTool === 'seeds' ? 'bg-green-100 text-green-800' : 'bg-slate-50 text-slate-500'}`}>
                            🌿 Seeds
                        </button>
                        <button onClick={() => { setSelectedTool('animals'); setToolbeltOpen(true); }} className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1 ${['chicken','cow'].includes(selectedTool) || selectedTool === 'animals' ? 'bg-orange-100 text-orange-800' : 'bg-slate-50 text-slate-500'}`}>
                            🐮 Animals
                        </button>
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-6 px-4 no-scrollbar min-h-[80px]">
                        {selectedTool === 'seeds' && (
                            (Object.values(ITEMS) as ItemDef[]).filter(i => i.type === 'crop').map((item: ItemDef) => (
                                <button key={item.id} onClick={() => setSelectedTool(item.id)} className="flex-shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center border-b-4 transition-all relative bg-white border-slate-200 active:scale-95">
                                    <span className="text-2xl">{item.emoji}</span>
                                    <span className="absolute top-1 right-1 text-[9px] font-bold text-green-700 bg-green-100 px-1 rounded-full">{item.cost}</span>
                                </button>
                            ))
                        )}
                        {selectedTool === 'animals' && (
                            (Object.values(ANIMALS) as AnimalDef[]).map((anim: AnimalDef) => (
                                <button key={anim.id} onClick={() => setSelectedTool(anim.id)} className="flex-shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center border-b-4 transition-all relative bg-white border-slate-200 active:scale-95">
                                    <span className="text-2xl">{anim.emoji}</span>
                                    <span className="absolute top-1 right-1 text-[9px] font-bold text-orange-700 bg-orange-100 px-1 rounded-full">{anim.cost}</span>
                                </button>
                            ))
                        )}
                        {selectedTool === 'water' && (
                            <div className="w-full text-center text-slate-400 font-bold text-sm flex items-center justify-center">
                                Tap soil to water!
                            </div>
                        )}
                        {selectedTool === '' && (
                            <div className="w-full text-center text-slate-400 font-bold text-sm flex items-center justify-center">
                                Tap dry land to fix it!
                            </div>
                        )}
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
