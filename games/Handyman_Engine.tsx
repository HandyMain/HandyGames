
import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, RotateCcw, ArrowRight, Settings, Fan, Flower2, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { Confetti } from '../components';
import { speak } from '../utils';
import { JobDef, TOOLS, ToolId, ActionType } from './Handyman_Data';

export const HandymanEngine = ({ job, onBack, onUnlock }: { job: JobDef, onBack: () => void, onUnlock?: (id: string) => void }) => {
    const [stepIndex, setStepIndex] = useState(0);
    const [progress, setProgress] = useState(0); // 0-100 for current step
    const [selectedTool, setSelectedTool] = useState<ToolId | null>(null);
    const [jobComplete, setJobComplete] = useState(false);
    const [toolbeltOpen, setToolbeltOpen] = useState(true);
    
    // Physics State
    const [rotation, setRotation] = useState(0); // For rotational tools
    
    // Job Specific State
    const [shelfAngle, setShelfAngle] = useState(15);
    const [nutRotation, setNutRotation] = useState(0);
    const [bulbRotation, setBulbRotation] = useState(0);
    const [paintCoverage, setPaintCoverage] = useState(0);
    const [oilLevel, setOilLevel] = useState(0);
    const [dirtLevel, setDirtLevel] = useState(0);
    const [nailsDriven, setNailsDriven] = useState(0);

    const actionInterval = useRef<number | null>(null);
    const currentStep = job.steps[stepIndex];

    // --- Voice Logic ---
    useEffect(() => {
        // Initial Step Prompt
        const intro = stepIndex === 0 ? job.description : "";
        const problem = currentStep.problem || "";
        const query = currentStep.toolQuery || "Which tool should we use?";
        speak(`${intro} ${problem} ${query}`);
    }, [stepIndex, job]);

    // --- Interaction Handlers ---

    const handleToolSelect = (toolId: ToolId) => {
        setSelectedTool(toolId);
        if (toolId === currentStep.tool) {
            speak(`Great job! Use the ${TOOLS[toolId].name}. ${currentStep.instruction}`);
            setToolbeltOpen(false); // Auto hide to show work area
            
            // Reset tool visuals
            setRotation(0);
        } else {
            speak("Not quite. Try a different tool.");
        }
    };

    // Generic "Hold to Work" (Scanning, Filling, Pouring)
    const handleActionStart = (e?: React.SyntheticEvent) => {
        if (e) e.preventDefault(); // Prevent text selection/scrolling
        
        if (selectedTool !== currentStep.tool) return;
        if (jobComplete) return;
        if (currentStep.actionType === 'tighten' || currentStep.actionType === 'loosen') return; // Handled by buttons

        if (navigator.vibrate) navigator.vibrate(50);

        if (actionInterval.current) clearInterval(actionInterval.current);

        actionInterval.current = window.setInterval(() => {
            setProgress(p => {
                const next = p + 2; 
                updateVisuals(next);
                if (next >= 100) {
                    completeStep();
                    return 100;
                }
                return next;
            });
        }, 50);
    };

    // Rotational Logic (Drilling, Screwing, Wrenching)
    const handleRotationStart = (direction: 'left' | 'right', e?: React.SyntheticEvent) => {
        if(e) e.preventDefault();
        
        if (selectedTool !== currentStep.tool) return;
        if (jobComplete) return;

        const targetAction = currentStep.actionType;
        const isCorrectDirection = (targetAction === 'tighten' && direction === 'right') || 
                                   (targetAction === 'loosen' && direction === 'left');

        if (!isCorrectDirection) {
            speak(targetAction === 'tighten' ? "Righty Tighty!" : "Lefty Loosey!");
            return;
        }

        if (navigator.vibrate) navigator.vibrate(50);

        if (actionInterval.current) clearInterval(actionInterval.current);

        actionInterval.current = window.setInterval(() => {
            setRotation(r => r + (direction === 'right' ? 15 : -15));
            
            setProgress(p => {
                const next = p + 1.5;
                updateVisuals(next);
                if (next >= 100) {
                    completeStep();
                    return 100;
                }
                return next;
            });
        }, 50);
    };

    const handleActionEnd = (e?: React.SyntheticEvent) => {
        if(e) e.preventDefault();
        if (actionInterval.current) clearInterval(actionInterval.current);
    };

    const updateVisuals = (prog: number) => {
        if (job.id === 'leak' && currentStep.tool === 'wrench') setNutRotation(prev => prev + 5);
        if (job.id === 'light') setBulbRotation(prev => prev + 5);
        if (job.id === 'hole') setPaintCoverage(prog);
        if (job.id === 'engine' && currentStep.tool === 'oil') setOilLevel(prog);
        if (job.id === 'planter' && currentStep.tool === 'shovel') setDirtLevel(prog);
        if (job.id === 'planter' && currentStep.tool === 'hammer') setNailsDriven(prog);
    };

    const handleLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (selectedTool !== 'level' || job.id !== 'shelf') return;
        const val = parseInt(e.target.value);
        setShelfAngle(val);
        if (Math.abs(val) < 3) {
            setProgress(100);
            if (navigator.vibrate) navigator.vibrate(20);
        } else {
            setProgress(0);
        }
    };

    const handleLevelCommit = () => {
        if (progress === 100) completeStep();
        else speak("Not straight yet!");
    };

    const completeStep = () => {
        if (actionInterval.current) clearInterval(actionInterval.current);
        
        if (stepIndex < job.steps.length - 1) {
            setTimeout(() => {
                setStepIndex(prev => prev + 1);
                setProgress(0);
                setSelectedTool(null);
                setToolbeltOpen(true); // Re-open for next tool
            }, 500);
        } else {
            setJobComplete(true);
            speak("Job Complete! You fixed it!");
            if (onUnlock) onUnlock('master_fixer');
        }
    };

    // --- Views ---

    const renderSideView = () => {
        const isTightening = currentStep.actionType === 'tighten';
        
        // Visualization Physics:
        // Screw Length = 100 units.
        // If Tightening: Start at -50 (sticking out), End at 0 (flush).
        // If Loosening: Start at 0 (flush), End at -50 (sticking out).
        
        let screwOffset = 0;
        if (isTightening) {
            screwOffset = -50 + (progress / 100) * 50; 
        } else {
            screwOffset = 0 - (progress / 100) * 50;
        }

        return (
            <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-800">
                {/* Wood/Wall Cross Section */}
                <div className="w-full max-w-md h-64 bg-[#5D4037] border-t-8 border-[#3E2723] relative flex justify-center shadow-2xl overflow-visible z-10">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
                    
                    {/* The Hole in the wood */}
                    <div className="w-12 h-32 bg-black/40 mt-0 border-x border-black/20"></div>
                </div>

                {/* The Screw & Tool Container */}
                {/* Positioned relative to the top of the wood block */}
                <div 
                    className="absolute z-20 flex flex-col items-center transition-all duration-75 ease-linear"
                    style={{ 
                        // The 'wood' top edge is roughly center screen. 
                        // We translate this container based on screwOffset.
                        top: `calc(50% - 32px + ${screwOffset}px)`, 
                    }}
                >
                    {/* Tool (Drill/Driver) - Sits ON TOP of screw head */}
                    {selectedTool && (
                        <div 
                            className="absolute bottom-full mb-0 flex flex-col items-center origin-bottom"
                            style={{ transform: `rotate(${rotation}deg)` }}
                        >
                            {/* Bit */}
                            <div className="w-3 h-12 bg-gray-400"></div>
                            {/* Body */}
                            {selectedTool === 'drill' ? (
                                <div className="w-24 h-32 bg-yellow-500 rounded-lg border-4 border-yellow-700 relative -mb-4">
                                    <div className="absolute top-1/2 -left-6 w-6 h-16 bg-yellow-600 rounded-l-md"></div>
                                </div>
                            ) : (
                                <div className="w-10 h-24 bg-orange-500 rounded-full border-4 border-orange-700"></div>
                            )}
                        </div>
                    )}

                    {/* Screw Head */}
                    <div className="w-16 h-6 bg-gray-300 rounded-t-sm border-b border-gray-400 shadow-sm relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-1 bg-gray-400 rotate-45"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-1 bg-gray-400 -rotate-45"></div>
                    </div>
                    {/* Screw Threads */}
                    <div className="w-10 h-24 bg-gradient-to-b from-gray-300 to-gray-400 flex flex-col justify-evenly border-x border-gray-500">
                        {Array.from({length: 8}).map((_, i) => (
                            <div key={i} className="w-full h-1 bg-gray-500/30 transform -rotate-12 scale-x-110"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderShelf = () => (
        <div 
            className="relative w-[90%] max-w-4xl aspect-[4/1] bg-[#8B4513] rounded-sm shadow-2xl transition-transform duration-200 flex items-center justify-center border-b-[12px] border-[#5D2906]"
            style={{ transform: `rotate(${shelfAngle}deg)` }}
        >
            <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
            <div className="absolute left-[10%] -bottom-16 w-8 h-20 bg-gray-800 rounded-b-lg"></div>
            <div className="absolute right-[10%] -bottom-16 w-8 h-20 bg-gray-800 rounded-b-lg"></div>

            {currentStep.tool === 'level' && selectedTool === 'level' && (
                <div className="absolute -top-32 w-full flex justify-center z-50">
                    <div className="bg-yellow-400 px-8 py-6 rounded-3xl shadow-2xl border-4 border-yellow-600 scale-150">
                        <input type="range" min="-20" max="20" value={shelfAngle} onChange={handleLevelChange} onMouseUp={handleLevelCommit} onTouchEnd={handleLevelCommit} className="w-64 h-4 bg-yellow-800 rounded-lg appearance-none cursor-pointer" />
                    </div>
                </div>
            )}
        </div>
    );

    const renderTopView = () => (
        <div className="z-10 w-full h-full flex items-center justify-center p-8 pb-32 scale-90 md:scale-100">
            {job.id === 'shelf' && renderShelf()}
            {job.id === 'leak' && (
                <div className="relative w-64 h-64 bg-slate-400 rounded-full border-8 border-slate-500 flex items-center justify-center shadow-inner">
                     <div className="w-32 h-32 bg-yellow-600 rounded-full border-8 border-yellow-800 shadow-lg" style={{ transform: `rotate(${nutRotation}deg)` }}>
                        <div className="w-full h-4 bg-yellow-800 absolute top-1/2 -translate-y-1/2"></div>
                     </div>
                     {/* Water Spray */}
                     {progress < 100 && (
                         <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-10 h-32 bg-blue-400/50 blur-md rounded-full animate-pulse origin-bottom" style={{ transform: `scaleY(${1 - progress/100})` }}></div>
                     )}
                </div>
            )}
            {job.id === 'hole' && (
                <div className="w-full h-full bg-stone-200 flex items-center justify-center relative">
                    <div className="w-48 h-48 bg-black/80 rounded-full shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] relative overflow-hidden">
                        <div className="absolute inset-0 bg-pink-200 transition-all duration-300" 
                             style={{ 
                                 clipPath: `circle(${currentStep.tool === 'spackle' ? progress : 100}% at 50% 50%)`,
                                 opacity: currentStep.tool === 'spackle' ? 1 : 0 
                             }} 
                        />
                        <div className="absolute inset-0 bg-stone-200 transition-all duration-300"
                             style={{ 
                                clipPath: `circle(${currentStep.tool === 'paint' ? progress : 0}% at 50% 50%)`
                             }}
                        />
                    </div>
                </div>
            )}
        </div>
    );

    const isRotational = currentStep.actionType === 'tighten' || currentStep.actionType === 'loosen';
    const showSideView = currentStep.view === 'side';

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-100 overflow-hidden select-none">
            {jobComplete && <Confetti />}

            {/* Top HUD */}
            <div className="absolute top-0 left-0 w-full z-40 p-4 pointer-events-none">
                <div className="flex justify-between items-start">
                    <div className="pointer-events-auto">
                        <button onClick={onBack} className="w-12 h-12 bg-white/90 backdrop-blur rounded-full shadow-lg flex items-center justify-center text-slate-700 hover:scale-110 transition-transform">
                            <RotateCcw size={24} />
                        </button>
                    </div>
                    <div className="bg-slate-900/90 backdrop-blur text-white px-6 py-3 rounded-2xl shadow-xl flex flex-col items-center pointer-events-auto max-w-[60%]">
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest truncate max-w-full">{job.title}</span>
                        <span className="font-bold text-sm md:text-base text-center leading-tight">Step {stepIndex + 1}: {currentStep.instruction}</span>
                    </div>
                    <div className="w-12"></div> 
                </div>
            </div>

            {/* Main Scene */}
            <div className={`w-full h-full relative flex items-center justify-center overflow-hidden transition-colors duration-500 ${job.background}`}>
                {showSideView ? renderSideView() : renderTopView()}

                {/* Scan/Action Overlay */}
                {currentStep.actionType === 'scan' && selectedTool === 'scanner' && !jobComplete && (
                    <div 
                        className="absolute inset-0 bg-blue-900/20 flex items-center justify-center z-20 cursor-crosshair touch-none"
                        onMouseDown={(e) => handleActionStart(e)}
                        onMouseUp={(e) => handleActionEnd(e)}
                        onMouseLeave={(e) => handleActionEnd(e)}
                        onTouchStart={(e) => handleActionStart(e)}
                        onTouchEnd={(e) => handleActionEnd(e)}
                    >
                        <div className="border-4 border-blue-400/50 w-[90%] h-[60%] rounded-3xl relative overflow-hidden shadow-2xl pointer-events-none">
                            <div className="absolute top-0 left-0 w-full h-1 bg-red-500 shadow-[0_0_20px_#ef4444] animate-[scan_2s_linear_infinite]"></div>
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-blue-600/90 text-white px-6 py-2 rounded-full font-mono text-xl animate-pulse whitespace-nowrap">HOLD TO SCAN</div>
                            {/* Progress Bar */}
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-64 h-4 bg-black/50 rounded-full overflow-hidden border border-white/30">
                                <div className="h-full bg-green-500 transition-all duration-75" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Rotational Controls */}
                {isRotational && selectedTool === currentStep.tool && !jobComplete && (
                    <div className="absolute bottom-32 w-full flex justify-center gap-8 z-30 pointer-events-auto">
                        <button 
                            onMouseDown={(e) => handleRotationStart('left', e)} 
                            onMouseUp={(e) => handleActionEnd(e)} 
                            onMouseLeave={(e) => handleActionEnd(e)}
                            onTouchStart={(e) => handleRotationStart('left', e)} 
                            onTouchEnd={(e) => handleActionEnd(e)}
                            className="w-24 h-24 bg-white rounded-full shadow-xl border-4 border-slate-200 flex items-center justify-center active:scale-95 active:bg-slate-100 touch-none"
                        >
                            <RefreshCw size={40} className="scale-x-[-1] text-slate-700" /> {/* Flip for CCW */}
                        </button>
                        
                        <div className="flex flex-col items-center justify-center text-white font-black drop-shadow-md pointer-events-none">
                            <span className="bg-black/50 px-2 rounded mb-1">{currentStep.actionType === 'tighten' ? 'TIGHTEN' : 'LOOSEN'}</span>
                            <div className="w-32 h-6 bg-gray-700 rounded-full overflow-hidden border-2 border-white">
                                <div className="h-full bg-green-500 transition-all duration-75" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>

                        <button 
                            onMouseDown={(e) => handleRotationStart('right', e)} 
                            onMouseUp={(e) => handleActionEnd(e)} 
                            onMouseLeave={(e) => handleActionEnd(e)}
                            onTouchStart={(e) => handleRotationStart('right', e)} 
                            onTouchEnd={(e) => handleActionEnd(e)}
                            className="w-24 h-24 bg-white rounded-full shadow-xl border-4 border-slate-200 flex items-center justify-center active:scale-95 active:bg-slate-100 touch-none"
                        >
                            <RefreshCw size={40} className="text-slate-700" />
                        </button>
                    </div>
                )}

                {/* Generic Hold Controls (Rub/Tap/Hold) */}
                {(currentStep.actionType === 'hold' || currentStep.actionType === 'rub' || currentStep.actionType === 'tap') && selectedTool === currentStep.tool && !jobComplete && (
                    <div className="absolute bottom-32 animate-bounce z-30 pointer-events-auto touch-none">
                        <button 
                            onMouseDown={(e) => handleActionStart(e)} 
                            onMouseUp={(e) => handleActionEnd(e)} 
                            onMouseLeave={(e) => handleActionEnd(e)}
                            onTouchStart={(e) => handleActionStart(e)} 
                            onTouchEnd={(e) => handleActionEnd(e)}
                            className="bg-white/90 text-slate-900 px-12 py-6 rounded-full font-black shadow-2xl border-4 border-slate-900 flex items-center gap-2 text-2xl active:scale-95 select-none"
                        >
                            HOLD TO WORK
                        </button>
                    </div>
                )}
                
                {jobComplete && (
                    <div className="absolute bottom-32 animate-in zoom-in z-30">
                        <div className="bg-green-500 text-white px-10 py-5 rounded-full font-black shadow-2xl flex items-center gap-3 text-2xl border-4 border-white">
                            <CheckCircle2 size={32} /> FIXED!
                        </div>
                    </div>
                )}
            </div>

            {/* Toolbelt */}
            <div className={`absolute bottom-0 w-full transition-transform duration-300 z-40 ${toolbeltOpen ? 'translate-y-0' : 'translate-y-[calc(100%-3rem)]'}`}>
                <div className="flex justify-center -mb-1">
                    <button onClick={() => setToolbeltOpen(!toolbeltOpen)} className="bg-slate-800 text-white px-6 py-2 rounded-t-xl shadow-lg border-t border-x border-slate-700 flex items-center gap-2 font-bold text-xs uppercase pointer-events-auto">
                        {toolbeltOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />} Tools
                    </button>
                </div>
                <div className="bg-slate-900 p-4 border-t-4 border-slate-700 pb-safe shadow-2xl pointer-events-auto">
                    <div className="flex gap-4 justify-center overflow-x-auto pb-4 scrollbar-hide w-full px-4">
                        {job.steps.map(s => s.tool).filter((v, i, a) => a.indexOf(v) === i).map(toolId => {
                            const tool = TOOLS[toolId];
                            const isSelected = selectedTool === toolId;
                            const ToolIcon = tool.icon;
                            return (
                                <button
                                    key={tool.id}
                                    onClick={() => handleToolSelect(tool.id)}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all min-w-[80px] ${isSelected ? 'bg-slate-700 scale-110 border-t-4 border-blue-500 -translate-y-4' : 'bg-slate-800'}`}
                                >
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-md ${tool.color} ${isSelected ? 'ring-4 ring-white' : ''}`}>
                                        <ToolIcon {...(tool.iconProps || {})} size={24} />
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-wide w-full text-center ${isSelected ? 'text-white' : 'text-slate-500'}`}>{tool.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
