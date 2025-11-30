
import React from 'react';
import { Plot, BarnSlot, ITEMS, ANIMALS } from './data';
import { Warehouse, Home, Fence } from 'lucide-react';

interface FarmViewProps {
    plots: Plot[];
    barn: BarnSlot[];
    onPlotClick: (idx: number, e: React.MouseEvent) => void;
    onBarnClick: (idx: number, e: React.MouseEvent) => void;
    onOpenMarket: () => void;
}

export const FarmView = ({ plots, barn, onPlotClick, onBarnClick, onOpenMarket }: FarmViewProps) => {
    
    const renderCrop = (plot: Plot) => {
        if (!plot.crop) return null;
        const item = ITEMS[plot.crop];
        
        let content = <div className="w-1.5 h-1.5 bg-stone-800 rounded-full mx-auto"></div>;
        let scale = 'scale-100';

        if (plot.stage === 1) { 
            content = <span className="text-lg">🌱</span>;
            scale = 'scale-90';
        } else if (plot.stage === 2) { 
            content = <span className="text-2xl">{item.emoji}</span>;
            scale = 'scale-75 grayscale opacity-80';
        } else if (plot.stage === 3) { 
            content = <span className="text-3xl drop-shadow-sm">{item.emoji}</span>;
            scale = 'scale-110 animate-bounce-slow';
        }

        return (
            <div className={`transform transition-all duration-300 ${scale} flex items-center justify-center w-full h-full relative`}>
                {content}
                
                {/* Crop Progress Bar (Only show when not ripe) */}
                {plot.stage < 3 && plot.crop && (
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
        <div className="absolute inset-0 flex flex-col bg-[#86efac]"> 
            
            {/* --- COMPACT SKY HEADER --- */}
            <div className="h-24 bg-gradient-to-b from-sky-400 to-sky-200 shrink-0 relative overflow-hidden border-b-4 border-[#65a30d]">
                <div className="absolute top-2 right-4 text-4xl opacity-90 animate-pulse">☀️</div>
                <div className="absolute top-4 left-4 text-2xl opacity-80 animate-[float_30s_linear_infinite]">☁️</div>
                <div className="absolute top-8 left-1/2 text-3xl opacity-60 animate-[float_40s_linear_infinite_reverse]">☁️</div>
                
                {/* Horizon Hills */}
                <div className="absolute bottom-0 left-0 w-full h-8 bg-[#65a30d] rounded-t-[50%] scale-x-150 translate-y-2"></div>
            </div>

            {/* --- SCROLLABLE FARM AREA --- */}
            <div className="flex-1 overflow-y-auto p-3 pb-64 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-[#86efac]">
                <div className="max-w-md mx-auto flex flex-col gap-4 relative">
                    
                    {/* Floating Silo Button */}
                    <button 
                        onClick={onOpenMarket}
                        className="absolute -right-1 top-0 z-10 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-l-xl shadow-lg border-y-2 border-l-2 border-blue-700 active:translate-x-1 transition-transform"
                    >
                        <Warehouse size={20} />
                    </button>

                    {/* --- CROP FIELD (4x4) --- */}
                    <div className="bg-[#65a30d] p-2 rounded-2xl shadow-md border-b-4 border-[#3f6212] relative">
                        <div className="absolute -top-3 left-4 bg-[#3f6212] text-[#ecfccb] text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">
                            Garden
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                            {plots.map((plot, i) => (
                                <div 
                                    key={plot.id}
                                    onClick={(e) => onPlotClick(i, e)}
                                    className={`
                                        aspect-square rounded-lg shadow-sm cursor-pointer relative overflow-hidden transition-all active:scale-95
                                        ${plot.state === 'grass' ? 'bg-green-500 hover:bg-green-400' : ''}
                                        ${plot.state === 'soil' ? (plot.isWet ? 'bg-[#5D4037]' : 'bg-[#8D6E63]') : ''}
                                        ${plot.state === 'exhausted' ? 'bg-[#A1887F] opacity-80' : ''}
                                    `}
                                >
                                    {/* Texture */}
                                    {plot.state === 'grass' && <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[length:4px_4px]"></div>}
                                    {plot.isWet && <div className="absolute inset-0 bg-blue-900/20"></div>}
                                    
                                    {renderCrop(plot)}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* --- BARN YARD (4x2 or 4xX) --- */}
                    <div className="bg-[#b45309] p-2 rounded-2xl shadow-md border-b-4 border-[#78350f] relative mt-2">
                        <div className="absolute -top-3 left-4 bg-[#78350f] text-[#fef3c7] text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1">
                            <Home size={10} /> Barn
                        </div>
                        
                        <div className="grid grid-cols-4 gap-1">
                            {barn.map((slot, i) => (
                                <div 
                                    key={i} 
                                    onClick={(e) => onBarnClick(i, e)} 
                                    className={`
                                        aspect-square rounded-lg shadow-sm border border-[#92400e] flex flex-col items-center justify-center relative cursor-pointer active:scale-95 transition-transform bg-[#fef3c7] overflow-hidden
                                    `}
                                >
                                    {/* Floor Texture */}
                                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/straw-straw.png')]"></div>

                                    {slot.animal ? (
                                        <>
                                            <span className="text-3xl z-10">{ANIMALS[slot.animal].emoji}</span>
                                            
                                            {/* Status Bubbles */}
                                            {slot.isHungry && !slot.productReady && (
                                                <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse z-20"></div>
                                            )}
                                            {slot.productReady && (
                                                <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-white animate-bounce z-20"></div>
                                            )}
                                            
                                            {/* Progress Bar (Bottom) */}
                                            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gray-200">
                                                <div className="h-full bg-orange-500 transition-all duration-300" style={{width: `${slot.progress}%`}}></div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-[#d6d3d1] opacity-30 text-xl font-black">+</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

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
            `}</style>
        </div>
    );
};
