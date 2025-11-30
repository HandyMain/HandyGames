
import React from 'react';
import { Store, X, Droplets, RefreshCw, ArrowUp, Fence, Scissors, Zap, Sun, Sprout, Grid3X3, CloudRain, Fan, Trophy, Anchor, Fish, ChefHat, Wind } from 'lucide-react';
import { ITEMS, Upgrades } from './data';

interface MarketViewProps {
    inventory: Record<string, number>;
    coins: number;
    upgrades: Upgrades;
    onSell: (id: string) => void;
    onUpgrade: (type: keyof Upgrades) => void;
    onService: (type: string) => void;
    onClose: () => void;
}

export const MarketView = ({ inventory, coins, upgrades, onSell, onUpgrade, onService, onClose }: MarketViewProps) => {
    return (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in slide-in-from-bottom-10">
            <div className="bg-white w-full max-w-lg rounded-[2rem] p-6 shadow-2xl relative flex flex-col max-h-[85vh]">
                <button onClick={onClose} className="absolute top-4 right-4 bg-slate-100 p-2 rounded-full hover:bg-slate-200"><X /></button>
                <h2 className="text-2xl font-black text-slate-800 mb-2 flex items-center gap-2"><Store className="text-blue-500" /> Market</h2>
                <p className="text-slate-500 text-sm mb-6">Sell crops & buy tech!</p>

                <div className="space-y-2 overflow-y-auto pr-2 flex-1 min-h-0 border-b border-slate-100 pb-4">
                    {Object.entries(inventory).length === 0 ? (
                        <div className="text-center py-8 text-slate-400 italic">Silo is empty! Go harvest something.</div>
                    ) : (
                        Object.entries(inventory).map(([id, count]) => {
                            const item = ITEMS[id as any];
                            // Boost sell price if Master Chef
                            const sellPrice = upgrades.masterChef && item.type === 'dish' ? Math.floor(item.sell * 1.2) : item.sell;
                            
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
                                        Sell {sellPrice * count}
                                    </button>
                                </div>
                            )
                        })
                    )}
                </div>
                
                {/* Services */}
                <div className="mt-4 shrink-0 border-b border-slate-100 pb-4">
                    <h3 className="font-bold text-slate-400 uppercase text-xs mb-3">Services</h3>
                    <div className="flex gap-2">
                        <button onClick={() => onService('rain')} className="flex-1 bg-blue-50 border-2 border-blue-200 p-3 rounded-xl flex flex-col items-center gap-1 hover:bg-blue-100 hover:border-blue-300 active:scale-95 transition-all">
                            <CloudRain className="text-blue-500" size={24} />
                            <span className="text-sm font-bold text-blue-900">Rain Dance</span>
                            <span className="text-xs font-mono bg-white px-2 rounded-full border text-slate-500">500g</span>
                        </button>
                    </div>
                </div>

                {/* Upgrades */}
                <div className="mt-4 shrink-0">
                    <h3 className="font-bold text-slate-400 uppercase text-xs mb-3">Farm Upgrades</h3>
                    <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[200px] pr-1 pb-4">
                        
                        {/* Coast Expansion */}
                        <button onClick={() => onUpgrade('coastAccess')} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 ${upgrades.coastAccess ? 'bg-sky-100 border-sky-300 opacity-60' : 'bg-white border-slate-200 hover:border-sky-300'}`}>
                            <Anchor className="text-sky-600" size={20} />
                            <span className="text-[10px] font-bold text-center">Coast Access</span>
                            {!upgrades.coastAccess && <span className="text-[10px] bg-slate-100 px-2 rounded-full font-mono">2000</span>}
                        </button>

                        <button onClick={() => onUpgrade('rodPro')} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 ${upgrades.rodPro ? 'bg-blue-100 border-blue-300 opacity-60' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
                            <Fish className="text-blue-600" size={20} />
                            <span className="text-[10px] font-bold text-center">Pro Rod</span>
                            {!upgrades.rodPro && <span className="text-[10px] bg-slate-100 px-2 rounded-full font-mono">5000</span>}
                        </button>

                        <button onClick={() => onUpgrade('masterChef')} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 ${upgrades.masterChef ? 'bg-orange-100 border-orange-300 opacity-60' : 'bg-white border-slate-200 hover:border-orange-300'}`}>
                            <ChefHat className="text-orange-600" size={20} />
                            <span className="text-[10px] font-bold text-center">Master Chef</span>
                            {!upgrades.masterChef && <span className="text-[10px] bg-slate-100 px-2 rounded-full font-mono">10000</span>}
                        </button>

                        {/* Existing Upgrades */}
                        <button onClick={() => onUpgrade('autoCollector')} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 ${upgrades.autoCollector ? 'bg-purple-100 border-purple-300 opacity-60' : 'bg-white border-slate-200 hover:border-purple-300'}`}>
                            <Wind className="text-purple-600" size={20} />
                            <span className="text-[10px] font-bold text-center">Auto-Collect</span>
                            {!upgrades.autoCollector && <span className="text-[10px] bg-slate-100 px-2 rounded-full font-mono">15000</span>}
                        </button>

                        <button onClick={() => onUpgrade('sprinkler')} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 ${upgrades.sprinkler ? 'bg-blue-50 border-blue-200 opacity-60' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
                            <Droplets className="text-blue-500" size={20} />
                            <span className="text-[10px] font-bold">Sprinkler</span>
                            {!upgrades.sprinkler && <span className="text-[10px] bg-slate-100 px-2 rounded-full font-mono">500</span>}
                        </button>

                        <button onClick={() => onUpgrade('autofeeder')} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 ${upgrades.autofeeder ? 'bg-orange-50 border-orange-200 opacity-60' : 'bg-white border-slate-200 hover:border-orange-300'}`}>
                            <RefreshCw className="text-orange-500" size={20} />
                            <span className="text-[10px] font-bold">Auto-Feed</span>
                            {!upgrades.autofeeder && <span className="text-[10px] bg-slate-100 px-2 rounded-full font-mono">800</span>}
                        </button>

                        <button onClick={() => onUpgrade('combine')} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 ${upgrades.combine ? 'bg-red-50 border-red-200 opacity-60' : 'bg-white border-slate-200 hover:border-red-300'}`}>
                            <Scissors className="text-red-500" size={20} />
                            <span className="text-[10px] font-bold">Tractor</span>
                            {!upgrades.combine && <span className="text-[10px] bg-slate-100 px-2 rounded-full font-mono">2000</span>}
                        </button>

                        <button onClick={() => onUpgrade('superPlow')} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 ${upgrades.superPlow ? 'bg-amber-50 border-amber-200 opacity-60' : 'bg-white border-slate-200 hover:border-amber-300'}`}>
                            <Zap className="text-amber-600" size={20} />
                            <span className="text-[10px] font-bold">Super Plow</span>
                            {!upgrades.superPlow && <span className="text-[10px] bg-slate-100 px-2 rounded-full font-mono">3000</span>}
                        </button>

                        <button onClick={() => onUpgrade('seeder')} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 ${upgrades.seeder ? 'bg-green-50 border-green-200 opacity-60' : 'bg-white border-slate-200 hover:border-green-300'}`}>
                            <Grid3X3 className="text-green-600" size={20} />
                            <span className="text-[10px] font-bold">Seeder</span>
                            {!upgrades.seeder && <span className="text-[10px] bg-slate-100 px-2 rounded-full font-mono">2500</span>}
                        </button>

                        <button onClick={() => onUpgrade('goldenCan')} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 ${upgrades.goldenCan ? 'bg-yellow-50 border-yellow-200 opacity-60' : 'bg-white border-slate-200 hover:border-yellow-300'}`}>
                            <Sun className="text-yellow-500" size={20} />
                            <span className="text-[10px] font-bold">Golden Can</span>
                            {!upgrades.goldenCan && <span className="text-[10px] bg-slate-100 px-2 rounded-full font-mono">3000</span>}
                        </button>

                        <button onClick={() => onUpgrade('greenhouse')} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 ${upgrades.greenhouse ? 'bg-emerald-50 border-emerald-200 opacity-60' : 'bg-white border-slate-200 hover:border-emerald-300'}`}>
                            <Sprout className="text-emerald-500" size={20} />
                            <span className="text-[10px] font-bold">Greenhouse</span>
                            {!upgrades.greenhouse && <span className="text-[10px] bg-slate-100 px-2 rounded-full font-mono">5000</span>}
                        </button>

                        <button onClick={() => onUpgrade('plotCount')} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 ${upgrades.plotCount >= 32 ? 'bg-green-50 border-green-200 opacity-60' : 'bg-white border-slate-200 hover:border-green-300'}`}>
                            <Fence className="text-green-600" size={20} />
                            <span className="text-[10px] font-bold">More Land</span>
                            <span className="text-[10px] bg-slate-100 px-2 rounded-full font-mono">{upgrades.plotCount * 250}</span>
                        </button>

                        <button onClick={() => onUpgrade('barnCapacity')} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 ${upgrades.barnCapacity >= 16 ? 'bg-yellow-50 border-yellow-200 opacity-60' : 'bg-white border-slate-200 hover:border-yellow-300'}`}>
                            <ArrowUp className="text-yellow-600" size={20} />
                            <span className="text-[10px] font-bold">Big Barn</span>
                            <span className="text-[10px] bg-slate-100 px-2 rounded-full font-mono">{upgrades.barnCapacity * 500}</span>
                        </button>

                    </div>
                </div>
            </div>
        </div>
    );
};
