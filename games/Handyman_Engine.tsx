
import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, RotateCcw, ArrowRight, Settings, Fan, Flower2 } from 'lucide-react';
import { Confetti } from '../components';
import { speak } from '../utils';
import { JobDef, TOOLS, ToolId } from './Handyman_Data';

export const HandymanEngine = ({ job, onBack }: { job: JobDef, onBack: () => void }) => {
    const [stepIndex, setStepIndex] = useState(0);
    const [progress, setProgress] = useState(0); // 0-100 for current step
    const [selectedTool, setSelectedTool] = useState<ToolId | null>(null);
    const [jobComplete, setJobComplete] = useState(false);
    
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
                const nextStep = job.steps[stepIndex + 1];
                speak("Good! Next: " + nextStep.instruction);
            }, 500);
        } else {
            setJobComplete(true);
            speak("Job Complete! You fixed it!");
        }
    };

    // --- Renderers ---

    const renderShelf = () => (
        <div 
            className="relative w-full max-w-[300px] aspect-[4/1] bg-amber-700 rounded-md shadow-2xl transition-transform duration-200 flex items-center justify-center border-b-4 border-amber-900"
            style={{ transform: `rotate(${shelfAngle}deg)` }}
        >
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
            <div className="absolute left-4 w-6 h-6 bg-gray-300 rounded-full border border-gray-400 flex items-center justify-center">
                <div className={`w-full h-1 bg-gray-400 rotate-45 ${currentStep.tool === 'drill' && progress > 0 ? 'animate-spin' : ''}`}></div>
                <div className={`w-full h-1 bg-gray-400 -rotate-45 ${currentStep.tool === 'drill' && progress > 0 ? 'animate-spin' : ''}`}></div>
            </div>
            <div className="absolute right-4 w-6 h-6 bg-gray-300 rounded-full border border-gray-400 flex items-center justify-center">
                <div className={`w-full h-1 bg-gray-400 rotate-45 ${currentStep.tool === 'drill' && progress > 0 ? 'animate-spin' : ''}`}></div>
                <div className={`w-full h-1 bg-gray-400 -rotate-45 ${currentStep.tool === 'drill' && progress > 0 ? 'animate-spin' : ''}`}></div>
            </div>
            {currentStep.tool === 'level' && selectedTool === 'level' && (
                <div className="absolute top-[-60px] w-full flex justify-center">
                    <div className="bg-yellow-400 px-4 py-2 rounded-xl shadow-lg border-2 border-yellow-600">
                        <input type="range" min="-20" max="20" value={shelfAngle} onChange={handleLevelChange} onMouseUp={handleLevelCommit} onTouchEnd={handleLevelCommit} />
                    </div>
                </div>
            )}
        </div>
    );

    const renderPipe = () => (
        <div className="relative flex flex-col items-center w-full max-w-[300px]">
            <div className="w-full h-24 bg-slate-400 rounded-full border-4 border-slate-500 relative flex items-center justify-center overflow-hidden">
                <div className="absolute inset-x-0 top-1/2 h-1 bg-slate-300 opacity-50"></div>
                <div className="w-12 h-32 bg-slate-500 absolute left-1/2 -translate-x-1/2 rounded-md border-x-4 border-slate-600"></div>
                <div 
                    className="w-16 h-16 bg-yellow-600 absolute left-1/2 -translate-x-1/2 rounded-full border-4 border-yellow-800 flex items-center justify-center transition-transform"
                    style={{ transform: `translateX(-50%) rotate(${nutRotation}deg)` }}
                >
                    <div className="w-8 h-8 border-2 border-yellow-800 rotate-45"></div>
                </div>
                {stepIndex >= 2 && (
                    <div 
                        className="absolute left-1/2 -translate-x-1/2 w-14 bg-white/80 transition-all"
                        style={{ height: `${progress}%`, top: '50%', transform: 'translate(-50%, -50%)', opacity: 0.8 }}
                    ></div>
                )}
            </div>
            {!jobComplete && stepIndex < 2 && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 flex flex-col items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping mb-1"></div>
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce mb-1 delay-75"></div>
                    <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce delay-150"></div>
                </div>
            )}
        </div>
    );

    const renderLight = () => (
        <div className="relative flex flex-col items-center w-full max-w-[300px]">
            <div className="w-2 h-24 bg-black"></div>
            <div className="w-16 h-12 bg-yellow-900 rounded-t-lg"></div>
            <div 
                className={`w-32 h-32 rounded-full border-4 border-gray-300 transition-all duration-300 flex items-center justify-center shadow-xl
                    ${stepIndex === 0 ? 'bg-gray-800 animate-pulse' : ''}
                    ${stepIndex === 1 ? 'bg-gray-800 translate-y-12 opacity-50' : ''} 
                    ${stepIndex === 2 ? 'bg-yellow-200 shadow-[0_0_100px_rgba(253,224,71,0.8)]' : ''}
                `}
                style={{ transform: stepIndex > 0 ? `rotate(${bulbRotation}deg)` : 'none' }}
            >
                {stepIndex === 0 && <div className="text-gray-600 font-bold text-xs">BROKEN</div>}
                {jobComplete && <div className="text-yellow-600 font-bold">BRIGHT</div>}
            </div>
        </div>
    );

    const renderWall = () => (
        <div className="relative w-full max-w-[300px] aspect-square bg-stone-300 rounded-lg shadow-inner border-4 border-stone-400 flex items-center justify-center overflow-hidden">
            <div className="absolute w-32 h-32 bg-black rounded-full opacity-80" style={{ clipPath: 'polygon(20% 0%, 80% 10%, 100% 35%, 100% 70%, 80% 90%, 20% 100%, 0% 70%, 0% 35%)' }}></div>
            {stepIndex >= 1 && (
                <div 
                    className="absolute w-36 h-36 bg-pink-200 rounded-full transition-all duration-300 blur-sm"
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
        <div className="relative w-full max-w-[350px] aspect-video bg-neutral-700 rounded-xl border-4 border-neutral-600 shadow-2xl flex items-center justify-center p-4">
            {/* Fan */}
            <div className="absolute left-4 top-4">
                <Fan className={`w-16 h-16 text-neutral-400 ${jobComplete ? 'animate-spin' : ''}`} />
            </div>
            {/* Engine Block */}
            <div className="w-full h-full bg-neutral-800 rounded-lg relative overflow-hidden border-2 border-neutral-900">
                {/* Pistons */}
                <div className="flex justify-center gap-4 mt-4">
                    <div className="w-8 h-12 bg-neutral-600 rounded-t animate-pulse"></div>
                    <div className="w-8 h-12 bg-neutral-600 rounded-t animate-pulse delay-75"></div>
                    <div className="w-8 h-12 bg-neutral-600 rounded-t animate-pulse delay-150"></div>
                </div>
                {/* Tensioner Bolt */}
                <div className="absolute right-8 bottom-8 w-10 h-10 bg-neutral-500 rounded-full flex items-center justify-center border-4 border-neutral-400">
                    <div className="w-6 h-1 bg-neutral-900" style={{ transform: `rotate(${nutRotation}deg)` }}></div>
                    <div className="w-1 h-6 bg-neutral-900 absolute" style={{ transform: `rotate(${nutRotation}deg)` }}></div>
                </div>
                {/* Oil Level */}
                {stepIndex === 2 && (
                    <div className="absolute bottom-0 left-0 w-full bg-amber-500/50 transition-all" style={{ height: `${oilLevel}%` }}></div>
                )}
            </div>
        </div>
    );

    const renderPlanter = () => (
        <div className="relative w-full max-w-[300px] aspect-[4/3] flex items-end justify-center">
            {/* Box construction */}
            <div className="w-full h-32 bg-[#8B4513] border-4 border-[#5D2906] relative flex items-center justify-center overflow-hidden">
                {/* Wood Texture */}
                <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
                
                {/* Nails */}
                <div className="absolute top-2 left-2 w-2 h-2 bg-gray-400 rounded-full" style={{ opacity: nailsDriven > 20 ? 1 : 0 }}></div>
                <div className="absolute top-2 right-2 w-2 h-2 bg-gray-400 rounded-full" style={{ opacity: nailsDriven > 50 ? 1 : 0 }}></div>
                <div className="absolute bottom-2 left-2 w-2 h-2 bg-gray-400 rounded-full" style={{ opacity: nailsDriven > 80 ? 1 : 0 }}></div>
                <div className="absolute bottom-2 right-2 w-2 h-2 bg-gray-400 rounded-full" style={{ opacity: nailsDriven === 100 ? 1 : 0 }}></div>

                {/* Dirt */}
                <div className="absolute bottom-0 w-full bg-[#3E2723] transition-all" style={{ height: `${dirtLevel}%` }}></div>
            </div>

            {/* Flowers pop up */}
            {stepIndex === 2 && (
                <div className="absolute bottom-32 flex gap-4">
                    <Flower2 className={`text-pink-500 w-12 h-12 transition-all ${progress > 30 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} />
                    <Flower2 className={`text-purple-500 w-12 h-12 transition-all delay-100 ${progress > 60 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} />
                    <Flower2 className={`text-yellow-500 w-12 h-12 transition-all delay-200 ${progress > 90 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} />
                </div>
            )}
        </div>
    );

    // --- Main Render ---

    const isActionStep = ['drill', 'wrench', 'tape', 'screwdriver', 'spackle', 'paint', 'oil', 'hammer', 'shovel', 'flower'].includes(currentStep.tool);

    return (
        <div className="w-full h-full flex flex-col relative bg-slate-100 rounded-[2rem] overflow-hidden">
            {jobComplete && <Confetti />}

            {/* Top Bar */}
            <div className="bg-slate-800 text-white p-4 flex justify-between items-center z-20 shadow-md">
                <button onClick={onBack} className="bg-slate-700 p-2 rounded-full hover:bg-slate-600"><RotateCcw size={20}/></button>
                <div className="flex flex-col items-center flex-1 mx-2">
                    <span className="text-[10px] md:text-xs font-bold text-blue-400 uppercase tracking-widest truncate">{job.title}</span>
                    <span className="font-bold text-xs md:text-sm opacity-80 text-center leading-tight">Step {stepIndex + 1}: {currentStep.instruction}</span>
                </div>
                <div className="w-10"></div>
            </div>

            {/* Workspace Scene */}
            <div 
                className={`flex-1 relative flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden transition-colors duration-500 ${job.background}`}
                onMouseDown={isActionStep ? handleActionStart : undefined}
                onMouseUp={isActionStep ? handleActionEnd : undefined}
                onTouchStart={isActionStep ? handleActionStart : undefined}
                onTouchEnd={isActionStep ? handleActionEnd : undefined}
                style={{ cursor: isActionStep && selectedTool === currentStep.tool ? 'pointer' : 'default' }}
            >
                {/* Interactive Object Container */}
                <div className="z-10 w-full h-full flex items-center justify-center">
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
                        <div className="border-4 border-blue-400 w-full max-w-xs h-48 rounded-xl flex items-center justify-center">
                            <span className="bg-blue-600 text-white px-3 py-1 rounded font-mono text-sm">SCANNING...</span>
                        </div>
                    </div>
                )}

                {/* Action Trigger Button */}
                {isActionStep && selectedTool === currentStep.tool && !jobComplete && (
                    <div className="absolute bottom-4 md:bottom-8 animate-bounce z-30 pointer-events-none">
                        <div className="bg-white/90 text-slate-900 px-6 py-3 rounded-full font-black shadow-xl border-2 border-slate-900 flex items-center gap-2">
                            HOLD TO WORK
                        </div>
                    </div>
                )}
                
                {jobComplete && (
                    <div className="absolute bottom-8 animate-in zoom-in z-30">
                        <div className="bg-green-500 text-white px-8 py-4 rounded-full font-black shadow-xl flex items-center gap-2 text-xl">
                            <CheckCircle2 /> FIXED!
                        </div>
                    </div>
                )}
            </div>

            {/* Toolbelt */}
            <div className="bg-slate-900 p-2 md:p-4 z-20 border-t-4 border-slate-700 min-h-[100px]">
                <div className="flex gap-2 justify-center overflow-x-auto pb-2 scrollbar-hide w-full">
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
                                    flex flex-col items-center gap-1 p-2 md:p-3 rounded-2xl transition-all min-w-[70px] md:min-w-[80px]
                                    ${isSelected ? 'bg-slate-700 scale-105 shadow-lg border-t-4 border-blue-500 -translate-y-2' : 'hover:bg-slate-800 border-t-4 border-transparent'}
                                    ${isCurrent && !isSelected ? 'animate-pulse bg-slate-800/50' : ''}
                                `}
                            >
                                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white shadow-sm ${tool.color} ${isSelected ? 'ring-2 ring-white' : ''}`}>
                                    <ToolIcon {...(tool.iconProps || {})} size={20} />
                                </div>
                                <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wide truncate w-full text-center ${isSelected ? 'text-white' : 'text-slate-500'}`}>
                                    {tool.name}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
