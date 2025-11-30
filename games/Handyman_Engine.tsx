
import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, RotateCcw, ArrowRight, Settings, Fan, Flower2, ChevronDown, ChevronUp } from 'lucide-react';
import { Confetti } from '../components';
import { speak } from '../utils';
import { JobDef, TOOLS, ToolId } from './Handyman_Data';

export const HandymanEngine = ({ job, onBack, onUnlock }: { job: JobDef, onBack: () => void, onUnlock?: (id: string) => void }) => {
    const [stepIndex, setStepIndex] = useState(0);
    const [progress, setProgress] = useState(0); // 0-100 for current step
    const [selectedTool, setSelectedTool] = useState<ToolId | null>(null);
    const [jobComplete, setJobComplete] = useState(false);
    const [toolbeltOpen, setToolbeltOpen] = useState(true);
    
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

    // --- Init ---
    useEffect(() => {
        speak(job.description + " " + currentStep.instruction);
    }, [job]);

    // --- Interaction Handlers ---

    const handleToolSelect = (toolId: ToolId) => {
        setSelectedTool(toolId);
        if (toolId === currentStep.tool) {
            speak("Correct tool! " + currentStep.instruction);
            setToolbeltOpen(false); // Auto hide to show work area
        } else {
            speak("Try a different tool.");
        }
    };

    const handleActionStart = () => {
        if (selectedTool !== currentStep.tool) return;
        if (jobComplete) return;

        if (navigator.vibrate) navigator.vibrate(50);

        actionInterval.current = window.setInterval(() => {
            setProgress(p => {
                const next = p + 2; // Speed
                
                // Visual Updates based on progress
                if (job.id === 'leak' && currentStep.tool === 'wrench') setNutRotation(prev => prev + 5);
                if (job.id === 'light') setBulbRotation(prev => prev + 5);
                if (job.id === 'hole') setPaintCoverage(next);
                if (job.id === 'engine' && currentStep.tool === 'oil') setOilLevel(next);
                if (job.id === 'engine' && currentStep.tool === 'wrench') setNutRotation(prev => prev + 5);
                if (job.id === 'planter' && currentStep.tool === 'shovel') setDirtLevel(next);
                if (job.id === 'planter' && currentStep.tool === 'hammer') setNailsDriven(next);

                if (next >= 100) {
                    completeStep();
                    return 100;
                }
                return next;
            });
        }, 50);
    };

    const handleActionEnd = () => {
        if (actionInterval.current) clearInterval(actionInterval.current);
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
                const nextStep = job.steps[stepIndex + 1];
                speak("Good! Next: " + nextStep.instruction);
            }, 500);
        } else {
            setJobComplete(true);
            speak("Job Complete! You fixed it!");
            if (onUnlock) onUnlock('master_fixer');
        }
    };

    // --- Renderers ---

    const renderShelf = () => (
        <div 
            className="relative w-[90%] max-w-4xl aspect-[4/1] bg-amber-700 rounded-md shadow-2xl transition-transform duration-200 flex items-center justify-center border-b-8 border-amber-900"
            style={{ transform: `rotate(${shelfAngle}deg)` }}
        >
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
            <div className="absolute left-[10%] w-12 h-12 bg-gray-300 rounded-full border-4 border-gray-400 flex items-center justify-center shadow-inner">
                <div className={`w-full h-2 bg-gray-400 rotate-45 ${currentStep.tool === 'drill' && progress > 0 ? 'animate-spin' : ''}`}></div>
                <div className={`w-full h-2 bg-gray-400 -rotate-45 ${currentStep.tool === 'drill' && progress > 0 ? 'animate-spin' : ''}`}></div>
            </div>
            <div className="absolute right-[10%] w-12 h-12 bg-gray-300 rounded-full border-4 border-gray-400 flex items-center justify-center shadow-inner">
                <div className={`w-full h-2 bg-gray-400 rotate-45 ${currentStep.tool === 'drill' && progress > 0 ? 'animate-spin' : ''}`}></div>
                <div className={`w-full h-2 bg-gray-400 -rotate-45 ${currentStep.tool === 'drill' && progress > 0 ? 'animate-spin' : ''}`}></div>
            </div>
            {currentStep.tool === 'level' && selectedTool === 'level' && (
                <div className="absolute -top-24 w-full flex justify-center">
                    <div className="bg-yellow-400 px-6 py-4 rounded-2xl shadow-xl border-4 border-yellow-600 scale-150">
                        <input type="range" min="-20" max="20" value={shelfAngle} onChange={handleLevelChange} onMouseUp={handleLevelCommit} onTouchEnd={handleLevelCommit} className="w-48" />
                    </div>
                </div>
            )}
        </div>
    );

    const renderPipe = () => (
        <div className="relative flex flex-col items-center justify-center w-full h-full max-w-lg">
            <div className="w-full h-48 bg-slate-400 rounded-full border-8 border-slate-500 relative flex items-center justify-center overflow-hidden shadow-2xl">
                <div className="absolute inset-x-0 top-1/2 h-2 bg-slate-300 opacity-50"></div>
                <div className="w-24 h-64 bg-slate-500 absolute left-1/2 -translate-x-1/2 rounded-md border-x-8 border-slate-600"></div>
                <div 
                    className="w-32 h-32 bg-yellow-600 absolute left-1/2 -translate-x-1/2 rounded-full border-8 border-yellow-800 flex items-center justify-center transition-transform shadow-lg"
                    style={{ transform: `translateX(-50%) rotate(${nutRotation}deg)` }}
                >
                    <div className="w-16 h-16 border-4 border-yellow-800 rotate-45"></div>
                </div>
                {stepIndex >= 2 && (
                    <div 
                        className="absolute left-1/2 -translate-x-1/2 w-28 bg-white/80 transition-all"
                        style={{ height: `${progress}%`, top: '50%', transform: 'translate(-50%, -50%)', opacity: 0.8 }}
                    ></div>
                )}
            </div>
            {!jobComplete && stepIndex < 2 && (
                <div className="absolute top-[60%] left-1/2 -translate-x-1/2 flex flex-col items-center scale-150">
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-ping mb-2"></div>
                    <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce mb-2 delay-75"></div>
                    <div className="w-5 h-5 bg-blue-600 rounded-full animate-bounce delay-150"></div>
                </div>
            )}
        </div>
    );

    const renderLight = () => (
        <div className="relative flex flex-col items-center justify-center w-full h-full">
            <div className="w-4 h-48 bg-black"></div>
            <div className="w-32 h-24 bg-yellow-900 rounded-t-2xl"></div>
            <div 
                className={`w-64 h-64 rounded-full border-8 border-gray-300 transition-all duration-300 flex items-center justify-center shadow-2xl
                    ${stepIndex === 0 ? 'bg-gray-800 animate-pulse' : ''}
                    ${stepIndex === 1 ? 'bg-gray-800 translate-y-24 opacity-50' : ''} 
                    ${stepIndex === 2 ? 'bg-yellow-200 shadow-[0_0_200px_rgba(253,224,71,0.9)]' : ''}
                `}
                style={{ transform: stepIndex > 0 ? `rotate(${bulbRotation}deg)` : 'none' }}
            >
                {stepIndex === 0 && <div className="text-gray-600 font-bold text-2xl">BROKEN</div>}
                {jobComplete && <div className="text-yellow-600 font-bold text-2xl">BRIGHT</div>}
            </div>
        </div>
    );

    const renderWall = () => (
        <div className="relative w-full h-full max-w-2xl bg-stone-300 rounded-3xl shadow-inner border-8 border-stone-400 flex items-center justify-center overflow-hidden">
            <div className="absolute w-64 h-64 bg-black rounded-full opacity-80" style={{ clipPath: 'polygon(20% 0%, 80% 10%, 100% 35%, 100% 70%, 80% 90%, 20% 100%, 0% 70%, 0% 35%)' }}></div>
            {stepIndex >= 1 && (
                <div 
                    className="absolute w-72 h-72 bg-pink-200 rounded-full transition-all duration-300 blur-md"
                    style={{ opacity: stepIndex === 1 ? progress / 100 : 1, transform: `scale(${stepIndex === 1 ? progress/100 : 1})` }}
                ></div>
            )}
            {stepIndex >= 2 && (
                <div 
                    className="absolute inset-0 bg-stone-300 transition-all duration-500"
                    style={{ opacity: progress / 100 }}
                ></div>
            )}
        </div>
    );

    const renderEngine = () => (
        <div className="relative w-full max-w-3xl aspect-video bg-neutral-700 rounded-3xl border-8 border-neutral-600 shadow-2xl flex items-center justify-center p-8">
            {/* Fan */}
            <div className="absolute left-8 top-8">
                <Fan className={`w-32 h-32 text-neutral-400 ${jobComplete ? 'animate-spin' : ''}`} />
            </div>
            {/* Engine Block */}
            <div className="w-full h-full bg-neutral-800 rounded-2xl relative overflow-hidden border-4 border-neutral-900 flex justify-center items-center">
                {/* Pistons */}
                <div className="flex justify-center gap-8 mt-12 w-full">
                    <div className="w-16 h-32 bg-neutral-600 rounded-t-xl animate-pulse"></div>
                    <div className="w-16 h-32 bg-neutral-600 rounded-t-xl animate-pulse delay-75"></div>
                    <div className="w-16 h-32 bg-neutral-600 rounded-t-xl animate-pulse delay-150"></div>
                </div>
                {/* Tensioner Bolt */}
                <div className="absolute right-12 bottom-12 w-24 h-24 bg-neutral-500 rounded-full flex items-center justify-center border-8 border-neutral-400 shadow-lg">
                    <div className="w-12 h-2 bg-neutral-900" style={{ transform: `rotate(${nutRotation}deg)` }}></div>
                    <div className="w-2 h-12 bg-neutral-900 absolute" style={{ transform: `rotate(${nutRotation}deg)` }}></div>
                </div>
                {/* Oil Level */}
                {stepIndex === 2 && (
                    <div className="absolute bottom-0 left-0 w-full bg-amber-500/50 transition-all" style={{ height: `${oilLevel}%` }}></div>
                )}
            </div>
        </div>
    );

    const renderPlanter = () => (
        <div className="relative w-full max-w-4xl aspect-[4/3] flex items-end justify-center mb-12">
            {/* Box construction */}
            <div className="w-full h-64 bg-[#8B4513] border-8 border-[#5D2906] relative flex items-center justify-center overflow-hidden shadow-2xl rounded-sm">
                {/* Wood Texture */}
                <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
                
                {/* Nails */}
                <div className="absolute top-4 left-4 w-4 h-4 bg-gray-400 rounded-full shadow-sm" style={{ opacity: nailsDriven > 20 ? 1 : 0 }}></div>
                <div className="absolute top-4 right-4 w-4 h-4 bg-gray-400 rounded-full shadow-sm" style={{ opacity: nailsDriven > 50 ? 1 : 0 }}></div>
                <div className="absolute bottom-4 left-4 w-4 h-4 bg-gray-400 rounded-full shadow-sm" style={{ opacity: nailsDriven > 80 ? 1 : 0 }}></div>
                <div className="absolute bottom-4 right-4 w-4 h-4 bg-gray-400 rounded-full shadow-sm" style={{ opacity: nailsDriven === 100 ? 1 : 0 }}></div>

                {/* Dirt */}
                <div className="absolute bottom-0 w-full bg-[#3E2723] transition-all" style={{ height: `${dirtLevel}%` }}></div>
            </div>

            {/* Flowers pop up */}
            {stepIndex === 2 && (
                <div className="absolute bottom-56 flex gap-8">
                    <Flower2 className={`text-pink-500 w-24 h-24 transition-all ${progress > 30 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} />
                    <Flower2 className={`text-purple-500 w-24 h-24 transition-all delay-100 ${progress > 60 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} />
                    <Flower2 className={`text-yellow-500 w-24 h-24 transition-all delay-200 ${progress > 90 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} />
                </div>
            )}
        </div>
    );

    // --- Main Render ---

    const isActionStep = ['drill', 'wrench', 'tape', 'screwdriver', 'spackle', 'paint', 'oil', 'hammer', 'shovel', 'flower'].includes(currentStep.tool);

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-100 overflow-hidden">
            {jobComplete && <Confetti />}

            {/* Top HUD (Absolute Overlay) */}
            <div className="absolute top-0 left-0 w-full z-40 p-4 pointer-events-none">
                <div className="flex justify-between items-start">
                    {/* Back Button */}
                    <div className="pointer-events-auto">
                        {/* Handled by global back button in index.tsx usually, but we can add secondary or rely on that one. 
                            Since we are 'fixed inset-0', we cover the global button if it's z-index is lower. 
                            Index.tsx has z-50 for the global button wrapper. This component is z-50. 
                            Let's ensure we have a functional back button here just in case.
                        */}
                        <button onClick={onBack} className="w-12 h-12 bg-white/90 backdrop-blur rounded-full shadow-lg flex items-center justify-center text-slate-700 hover:scale-110 transition-transform">
                            <RotateCcw size={24} />
                        </button>
                    </div>

                    {/* Job Info */}
                    <div className="bg-slate-900/90 backdrop-blur text-white px-6 py-3 rounded-2xl shadow-xl flex flex-col items-center pointer-events-auto max-w-[60%]">
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest truncate max-w-full">{job.title}</span>
                        <span className="font-bold text-sm md:text-base text-center leading-tight">Step {stepIndex + 1}: {currentStep.instruction}</span>
                    </div>
                    
                    <div className="w-12"></div> 
                </div>
            </div>

            {/* Workspace Scene (Full Screen) */}
            <div 
                className={`w-full h-full relative flex items-center justify-center overflow-hidden transition-colors duration-500 ${job.background}`}
                onMouseDown={isActionStep ? handleActionStart : undefined}
                onMouseUp={isActionStep ? handleActionEnd : undefined}
                onTouchStart={isActionStep ? handleActionStart : undefined}
                onTouchEnd={isActionStep ? handleActionEnd : undefined}
                style={{ cursor: isActionStep && selectedTool === currentStep.tool ? 'pointer' : 'default' }}
            >
                {/* Interactive Object Container (Scaled up) */}
                <div className="z-10 w-full h-full flex items-center justify-center p-8 pb-32">
                    {job.id === 'shelf' && renderShelf()}
                    {job.id === 'leak' && renderPipe()}
                    {job.id === 'light' && renderLight()}
                    {job.id === 'hole' && renderWall()}
                    {job.id === 'engine' && renderEngine()}
                    {job.id === 'planter' && renderPlanter()}
                </div>

                {/* Scan Overlay */}
                {currentStep.tool === 'scanner' && selectedTool === 'scanner' && !jobComplete && (
                    <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center pointer-events-none animate-pulse z-20">
                        <div className="border-4 border-blue-400 w-[90%] h-[60%] rounded-3xl flex items-center justify-center">
                            <span className="bg-blue-600 text-white px-6 py-2 rounded-full font-mono text-xl shadow-lg">SCANNING...</span>
                        </div>
                    </div>
                )}

                {/* Action Trigger Button */}
                {isActionStep && selectedTool === currentStep.tool && !jobComplete && (
                    <div className="absolute bottom-32 md:bottom-40 animate-bounce z-30 pointer-events-none">
                        <div className="bg-white/90 text-slate-900 px-8 py-4 rounded-full font-black shadow-2xl border-4 border-slate-900 flex items-center gap-2 text-xl">
                            HOLD TO WORK
                        </div>
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

            {/* Collapsible Toolbelt */}
            <div className={`absolute bottom-0 w-full transition-transform duration-300 z-40 ${toolbeltOpen ? 'translate-y-0' : 'translate-y-[calc(100%-3rem)]'}`}>
                {/* Toggle Tab */}
                <div className="flex justify-center -mb-1">
                    <button 
                        onClick={() => setToolbeltOpen(!toolbeltOpen)}
                        className="bg-slate-800 text-white px-6 py-2 rounded-t-xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] hover:bg-slate-700 flex items-center gap-2 font-bold text-xs uppercase tracking-widest border-t border-x border-slate-700"
                    >
                        {toolbeltOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                        Toolbelt
                    </button>
                </div>

                {/* Belt Content */}
                <div className="bg-slate-900 p-4 border-t-4 border-slate-700 pb-safe shadow-2xl">
                    <div className="flex gap-4 justify-center overflow-x-auto pb-4 scrollbar-hide w-full px-4">
                        {job.steps.map(s => s.tool).filter((v, i, a) => a.indexOf(v) === i).map(toolId => {
                            const tool = TOOLS[toolId];
                            const isCurrent = currentStep.tool === toolId;
                            const isSelected = selectedTool === toolId;
                            const ToolIcon = tool.icon;

                            return (
                                <button
                                    key={tool.id}
                                    onClick={() => handleToolSelect(tool.id)}
                                    className={`
                                        flex flex-col items-center gap-2 p-3 rounded-2xl transition-all min-w-[80px]
                                        ${isSelected 
                                            ? 'bg-slate-700 scale-110 shadow-lg border-t-4 border-blue-500 -translate-y-4' 
                                            : 'bg-slate-800 hover:bg-slate-700 border-t-4 border-transparent'
                                        }
                                        ${isCurrent && !isSelected ? 'animate-pulse ring-2 ring-blue-500/50' : ''}
                                    `}
                                >
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-md ${tool.color} ${isSelected ? 'ring-4 ring-white' : ''}`}>
                                        <ToolIcon {...(tool.iconProps || {})} size={24} />
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-wide truncate w-full text-center ${isSelected ? 'text-white' : 'text-slate-500'}`}>
                                        {tool.name}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
