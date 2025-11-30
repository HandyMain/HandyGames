
import React from 'react';
import { Home, X, ArrowUp } from 'lucide-react';
import { BarnSlot, ANIMALS } from './data';

interface BarnViewProps {
    barn: BarnSlot[];
    onBarnClick: (idx: number, e: React.MouseEvent) => void;
    onClose: () => void;
    onExpand?: () => void;
}

export const BarnView = ({ barn, onBarnClick, onClose, onExpand }: BarnViewProps) => {
    return (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-orange-50 w-full max-w-2xl rounded-[2rem] p-6 shadow-2xl border-4 border-orange-200 relative overflow-hidden flex flex-col max-h-[80vh]">
                <button onClick={onClose} className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-sm hover:bg-red-50 text-red-500"><X /></button>
                
                <div className="flex justify-between items-center mb-6 pr-12">
                    <h2 className="text-2xl font-black text-orange-900 flex items-center gap-2"><Home /> The Barn</h2>
                    {onExpand && barn.length < 16 && (
                        <button onClick={onExpand} className="bg-orange-200 text-orange-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 hover:bg-orange-300">
                            <ArrowUp size={14} /> Expand (1000g)
                        </button>
                    )}
                </div>
                
                <div className="grid grid-cols-4 gap-3 overflow-y-auto pr-2 pb-safe">
                    {barn.map((slot, i) => (
                        <div key={i} onClick={(e) => onBarnClick(i, e)} className="aspect-square bg-white rounded-2xl shadow-sm border-2 border-orange-100 flex flex-col items-center justify-center relative cursor-pointer active:scale-95 transition-transform">
                            {slot.animal ? (
                                <>
                                    <span className="text-3xl md:text-4xl animate-bounce-slow">{ANIMALS[slot.animal].emoji}</span>
                                    {slot.isHungry && !slot.productReady && <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">FEED ME</div>}
                                    {slot.productReady && <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-bounce">READY</div>}
                                    <div className="w-12 md:w-16 h-2 bg-gray-200 rounded-full mt-2 overflow-hidden"><div className="h-full bg-orange-500 transition-all" style={{width: `${slot.progress}%`}}></div></div>
                                </>
                            ) : (
                                <span className="text-gray-300 font-bold text-[10px] uppercase">Empty</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
