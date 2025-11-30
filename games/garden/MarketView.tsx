
import React from 'react';
import { Store, X, Droplets, RefreshCw, ArrowUp, Fence } from 'lucide-react';
import { ITEMS, Upgrades } from './data';

interface MarketViewProps {
    inventory: Record<string, number>;
    coins: number;
    upgrades: Upgrades;
    onSell: (id: string) => void;
    onUpgrade: (type: keyof Upgrades) => void;
    onClose: () => void;
}

export const MarketView = ({ inventory, coins, upgrades, onSell, onUpgrade, onClose }: MarketViewProps) => {
    return (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in slide-in-from-bottom-10">
            <div className="bg-white w-full max-w-md rounded-[2rem] p-6 shadow-2xl relative flex flex-col max-h-[85vh]">
                <button onClick={onClose} className="absolute top-4 right-4 bg-slate-100 p-2 rounded-full hover:bg-slate-200"><X /></button>
                <h2 className="text-2xl font-black text-slate-800 mb-2 flex items-center gap-2"><Store className="text-blue-500" /> Market</h2>
                <p className="text-slate-500 text-sm mb-6">Sell crops & buy tech!</p>

                <div className="space-y-2 overflow-y-auto pr-2 flex-1 min-h-0">
                    {Object.entries(inventory).length === 0 ? (
                        <div className="text-center py-8 text-slate-400 italic">Silo is empty! Go harvest something.</div>
                    ) : (
                        Object.entries(inventory).map(([id, count]) => {
                            const item = ITEMS[id as any];
                            return (
                                <div key={id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">{item.emoji}</span>
                                        <div>
                                            <div className="font-bold text-slate-700">{item.name}</div>
                                            <div className="text-xs text-slate-400">x{count} in silo</div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => onSell(id)}
                                        className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-green-600 active:scale-95 whitespace-nowrap"
                                    >
                                        Sell {item.sell * count}
                                    </button>
                                </div>
                            )
                        })
                    )}
                </div>
                
                {/* Upgrades */}
                <div className="mt-4 pt-4 border-t border-slate-100 shrink-0">
                    <h3 className="font-bold text-slate-400 uppercase text-xs mb-3">Farm Upgrades</h3>
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        <button onClick={() => onUpgrade('sprinkler')} className={`flex-shrink-0 p-3 rounded-xl border-2 flex flex-col items-center gap-1 min-w-[80px] ${upgrades.sprinkler ? 'bg-blue-50 border-blue-200 opacity-50' : 'bg-white border-slate-200'}`}>
                            <Droplets className="text-blue-500" />
                            <span className="text-[10px] font-bold">Sprinkler</span>
                            {!upgrades.sprinkler && <span className="text-[10px] bg-slate-100 px-1 rounded">500</span>}
                        </button>
                        <button onClick={() => onUpgrade('autofeeder')} className={`flex-shrink-0 p-3 rounded-xl border-2 flex flex-col items-center gap-1 min-w-[80px] ${upgrades.autofeeder ? 'bg-orange-50 border-orange-200 opacity-50' : 'bg-white border-slate-200'}`}>
                            <RefreshCw className="text-orange-500" />
                            <span className="text-[10px] font-bold">Auto-Feed</span>
                            {!upgrades.autofeeder && <span className="text-[10px] bg-slate-100 px-1 rounded">800</span>}
                        </button>
                        <button onClick={() => onUpgrade('plotCount')} className={`flex-shrink-0 p-3 rounded-xl border-2 flex flex-col items-center gap-1 min-w-[80px] ${upgrades.plotCount >= 32 ? 'bg-green-50 border-green-200 opacity-50' : 'bg-white border-slate-200'}`}>
                            <Fence className="text-green-500" />
                            <span className="text-[10px] font-bold">More Land</span>
                            {upgrades.plotCount < 32 && <span className="text-[10px] bg-slate-100 px-1 rounded">1000</span>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
