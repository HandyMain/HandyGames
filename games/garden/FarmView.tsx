
import React from 'react';
import { Plot, BarnSlot, ITEMS, ANIMALS, Upgrades } from './data';
import { Warehouse, Home, CloudRain, Sun, Fan, Trophy, Anchor } from 'lucide-react';

interface FarmViewProps {
    plots: Plot[];
    barn: BarnSlot[];
    weather?: 'sunny' | 'rain';
    dog?: { x: number; y: number; state: string; facingRight: boolean };
    upgrades: Upgrades;
    onPlotClick: (idx: number, e: React.MouseEvent) => void;
    onBarnClick: (idx: number, e: React.MouseEvent) => void;
    onDogClick?: (e: React.MouseEvent) => void;
    onOpenMarket: () => void;
    onOpenDocks?: () => void;
}

export const FarmView = ({ plots, barn, weather = 'sunny', dog, upgrades, onPlotClick, onBarnClick, onDogClick, onOpenMarket, onOpenDocks }: FarmViewProps) => {
    
    // Determine grid density based on plot count
    const isDense = plots.length > 16;
    const gridClass = isDense ? "grid-cols-8" : "grid-cols-4";

    const renderCrop = (plot: Plot) => {
        if (!plot.crop) return null;
        const item = ITEMS[plot.crop];
        
        let content = <div className="w-1.5 h-1.5 bg-stone-800 rounded-full mx-auto"></div>;
        let scale = 'scale-100';

        if (plot.stage === 1) { 
            content = <span className={isDense ? "text-sm" : "text-lg"}>🌱</span>;
            scale = 'scale-90';
        } else if (plot.stage === 2) { 
            content = <span className={isDense ? "text-lg" : "text-2xl"}>{item.emoji}</span>;
            scale = 'scale-75 grayscale opacity-80';
        } else if (plot.stage === 3) { 
            content = <span className={`${isDense ? "text-xl" : "text-3xl"} drop-shadow-sm`}>{item.emoji}</span>;
            scale = 'scale-110 animate-bounce-slow';
        }

        return (
            <div className={`transform transition-all duration-300 ${scale} flex items-center justify-center w-full h-full relative`}>
                {content}
                
                {/* Crop Progress Bar (Only show when not ripe and not dense mode to save space) */}
                {plot.stage < 3 && plot.crop && !isDense && (
                    <div className="absolute bottom-1 left-1 right-1 h-1 bg-black/20 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-green-400 transition-all duration-300" 
                            style={{width: `${plot.progress}%`}}
                        ></div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={`absolute inset-0 flex flex-col transition-colors duration-1000 ${weather === 'rain' ? 'bg-slate-700' : 'bg-[#86efac]'}`}> 
            
            {/* --- RAIN OVERLAY --- */}
            {weather === 'rain' && (
                <div className="absolute inset-0 pointer-events-none z-50 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-20 animate-[rain_0.5s_linear_infinite]"></div>
            )}

            {/* --- COMPACT SKY HEADER --- */}
            <div className={`h-24 shrink-0 relative overflow-hidden border-b-4 transition-colors duration-1000 ${weather === 'rain' ? 'bg-slate-800 border-slate-900' : 'bg-gradient-to-b from-sky-400 to-sky-200 border-[#65a30d]'}`}>
                {weather === 'sunny' ? (
                    <>
                        <div className="absolute top-2 right-4 text-4xl opacity-90 animate-pulse">☀️</div>
                        <div className="absolute top-4 left-4 text-2xl opacity-80 animate-[float_30s_linear_infinite]">☁️</div>
                        <div className="absolute top-8 left-1/2 text-3xl opacity-60 animate-[float_40s_linear_infinite_reverse]">☁️</div>
                    </>
                ) : (
                    <>
                        <div className="absolute top-2 right-10 text-4xl text-gray-400 animate-pulse"><CloudRain size={40} /></div>
                        <div className="absolute top-4 left-4 text-3xl text-gray-500 animate-[float_10s_linear_infinite]">☁️</div>
                        <div className="absolute top-6 left-1/2 text-4xl text-gray-600 animate-[float_15s_linear_infinite_reverse]">☁️</div>
                    </>
                )}
                
                {/* Windmill Decoration */}
                {upgrades?.windmill && (
                    <div className="absolute bottom-2 right-16 scale-75 opacity-90">
                        <div className="w-1 h-8 bg-stone-700 mx-auto"></div>
                        <div className="w-8 h-8 bg-red-100 rounded-full border-4 border-red-800 animate-[spin_4s_linear_infinite] flex items-center justify-center -mt-8 relative z-10">
                            <Fan className="text-red-800" size={20} />
                        </div>
                    </div>
                )}

                {/* Horizon Hills */}
                <div className={`absolute bottom-0 left-0 w-full h-8 rounded-t-[50%] scale-x-150 translate-y-2 transition-colors duration-1000 ${weather === 'rain' ? 'bg-green-900' : 'bg-[#65a30d]'}`}></div>
            </div>

            {/* --- SCROLLABLE FARM AREA --- */}
            <div className={`flex-1 overflow-y-auto p-3 pb-64 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] transition-colors duration-1000 ${weather === 'rain' ? 'bg-slate-600' : 'bg-[#86efac]'}`}>
                <div className="max-w-md mx-auto flex flex-col gap-4 relative">
                    
                    {/* Floating Silo Button */}
                    <button 
                        onClick={onOpenMarket}
                        className="absolute -right-1 top-0 z-10 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-l-xl shadow-lg border-y-2 border-l-2 border-blue-700 active:translate-x-1 transition-transform"
                    >
                        <Warehouse size={20} />
                    </button>

                    {/* Boat Button (Unlocked) */}
                    {upgrades.coastAccess && (
                        <button 
                            onClick={onOpenDocks}
                            className="absolute -right-1 top-16 z-10 bg-sky-500 hover:bg-sky-600 text-white p-3 rounded-l-xl shadow-lg border-y-2 border-l-2 border-sky-700 active:translate-x-1 transition-transform"
                        >
                            <Anchor size={20} />
                        </button>
                    )}

                    {/* --- CROP FIELD (Dynamic Density) --- */}
                    <div className={`p-2 rounded-2xl shadow-md border-b-4 relative transition-colors duration-1000 ${weather === 'rain' ? 'bg-green-900 border-green-950' : 'bg-[#65a30d] border-[#3f6212]'}`}>
                        <div className={`absolute -top-3 left-4 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest transition-colors ${weather === 'rain' ? 'bg-green-950 text-green-200' : 'bg-[#3f6212] text-[#ecfccb]'}`}>
                            Garden
                        </div>
                        <div className={`grid ${gridClass} gap-1`}>
                            {plots.map((plot, i) => (
                                <div 
                                    key={plot.id}
                                    onClick={(e) => onPlotClick(i, e)}
                                    className={`
                                        aspect-square rounded-lg shadow-sm cursor-pointer relative overflow-hidden transition-all active:scale-95
                                        ${plot.state === 'grass' ? (weather === 'rain' ? 'bg-green-700' : 'bg-green-500 hover:bg-green-400') : ''}
                                        ${plot.state === 'soil' ? (plot.isWet ? 'bg-[#3E2723]' : (weather === 'rain' ? 'bg-[#5D4037]' : 'bg-[#8D6E63]')) : ''}
                                        ${plot.state === 'exhausted' ? 'bg-[#A1887F] opacity-80' : ''}
                                    `}
                                >
                                    {/* Texture */}
                                    {plot.state === 'grass' && <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[length:4px_4px]"></div>}
                                    {plot.isWet && <div className="absolute inset-0 bg-blue-900/30"></div>}
                                    
                                    {renderCrop(plot)}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* --- BARN YARD --- */}
                    <div className={`p-2 rounded-2xl shadow-md border-b-4 relative mt-2 transition-colors duration-1000 ${weather === 'rain' ? 'bg-[#78350f] border-[#451a03]' : 'bg-[#b45309] border-[#78350f]'}`}>
                        <div className={`absolute -top-3 left-4 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1 transition-colors ${weather === 'rain' ? 'bg-[#451a03] text-orange-200' : 'bg-[#78350f] text-[#fef3c7]'}`}>
                            <Home size={10} /> Barn
                        </div>
                        
                        <div className="grid grid-cols-4 gap-1">
                            {barn.map((slot, i) => {
                                // Logic for Barn Visuals
                                const animal = slot.animal ? ANIMALS[slot.animal] : null;
                                const requiredFood = animal ? ITEMS[animal.eats] : null;
                                const product = animal ? ITEMS[animal.produces] : null;

                                return (
                                    <div 
                                        key={i} 
                                        onClick={(e) => onBarnClick(i, e)} 
                                        className={`
                                            aspect-square rounded-lg shadow-sm border border-[#92400e] flex flex-col items-center justify-center relative cursor-pointer active:scale-95 transition-transform overflow-hidden
                                            ${weather === 'rain' ? 'bg-[#fcd34d]' : 'bg-[#fef3c7]'}
                                        `}
                                    >
                                        {/* Floor Texture */}
                                        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/straw-straw.png')]"></div>

                                        {animal ? (
                                            <>
                                                {/* Main Center Image */}
                                                {slot.productReady && product ? (
                                                    <span className="text-4xl z-10 drop-shadow-md animate-bounce">{product.emoji}</span>
                                                ) : (
                                                    <span className="text-3xl z-10 drop-shadow-sm">{animal.emoji}</span>
                                                )}
                                                
                                                {/* Hungry Indicator (Top Left) */}
                                                {slot.isHungry && !slot.productReady && requiredFood && (
                                                    <div className="absolute top-1 left-1 bg-white/90 rounded-full w-6 h-6 flex items-center justify-center border border-gray-300 shadow-sm animate-pulse z-20">
                                                        <span className="text-sm">{requiredFood.emoji}</span>
                                                    </div>
                                                )}

                                                {/* Progress Bar (Bottom) - Only show if working */}
                                                {!slot.productReady && !slot.isHungry && (
                                                    <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gray-200">
                                                        <div className="h-full bg-orange-500 transition-all duration-300" style={{width: `${slot.progress}%`}}></div>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="text-[#d6d3d1] opacity-30 text-xl font-black">+</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Decorations (Statue) */}
                    {upgrades?.statue && (
                        <div className="mx-auto w-24 h-24 bg-yellow-100 rounded-full border-4 border-yellow-400 flex items-center justify-center shadow-lg relative mt-4">
                            <Trophy size={48} className="text-yellow-600 drop-shadow-sm" />
                            <div className="absolute inset-0 bg-yellow-400/20 rounded-full animate-pulse"></div>
                        </div>
                    )}

                    {/* Dog */}
                    {dog && (
                        <div 
                            onClick={onDogClick}
                            className={`absolute w-12 h-12 z-20 transition-all duration-500 cursor-pointer ${dog.state === 'running' ? 'animate-bounce' : ''}`}
                            style={{ 
                                left: `${dog.x}%`, 
                                top: `${dog.y}%`,
                                transform: `translate(-50%, -50%) scaleX(${dog.facingRight ? -1 : 1})` 
                            }}
                        >
                            <span className="text-4xl drop-shadow-lg">🐕</span>
                            {dog.state === 'sitting' && <span className="absolute -top-4 right-0 text-xs">💤</span>}
                        </div>
                    )}

                    {/* Decorations */}
                    <div className="flex justify-between px-4 opacity-70">
                        <span className="text-2xl">🌲</span>
                        <span className="text-2xl">🌲</span>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes float {
                    0% { transform: translateX(0px); }
                    50% { transform: translateX(10px); }
                    100% { transform: translateX(0px); }
                }
                @keyframes rain {
                    0% { background-position: 0 0; }
                    100% { background-position: 10px 20px; }
                }
            `}</style>
        </div>
    );
};
