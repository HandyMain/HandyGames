
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, ArrowRight, Droplets, CheckCircle2, XCircle, Settings, Trophy } from 'lucide-react';
import { Confetti } from '../components';
import { speak } from '../utils';

// Grid Dimensions
const ROWS = 6;
const COLS = 5;

// Directions Bitmask: North=1, East=2, South=4, West=8
const N = 1, E = 2, S = 4, W = 8;

type PipeType = 'straight' | 'corner' | 'tee' | 'cross' | 'start' | 'end';

interface Cell {
  row: number;
  col: number;
  type: PipeType;
  rotation: number; // 0, 1, 2, 3 (multiplied by 90deg)
  filled: boolean;  // Has water reached here?
  isPath: boolean;  // Is this part of the solution (debug/internal)
  leaking?: boolean; // New: Is water spilling here?
}

const BASE_CONNECTIONS: Record<PipeType, number> = {
    'straight': N | S,
    'corner': N | E,
    'tee': N | E | W,
    'cross': N | E | S | W,
    'start': S,
    'end': N,
};

export const PipeMode = () => {
    const [grid, setGrid] = useState<Cell[][]>([]);
    const [status, setStatus] = useState<'setup' | 'flowing' | 'won' | 'lost'>('setup');
    const [level, setLevel] = useState(1);
    const flowInterval = useRef<number | null>(null);

    // --- Level Generation (Simplified for brevity, logic remains same) ---
    const generateLevel = useCallback(() => {
        const newGrid: Cell[][] = Array.from({ length: ROWS }, (_, r) => 
            Array.from({ length: COLS }, (_, c) => ({
                row: r, col: c, type: 'straight', rotation: 0, filled: false, isPath: false, leaking: false
            }))
        );

        newGrid[0][0] = { ...newGrid[0][0], type: 'start', rotation: 0, filled: true, isPath: true };
        newGrid[ROWS-1][COLS-1] = { ...newGrid[ROWS-1][COLS-1], type: 'end', rotation: 0, isPath: true };

        // Simple Random Path
        let currR = 0, currC = 0;
        const path: {r: number, c: number}[] = [{r: 0, c: 0}];
        
        while (currR < ROWS - 1 || currC < COLS - 1) {
            const canGoDown = currR < ROWS - 1;
            const canGoRight = currC < COLS - 1;
            let moveDown = (canGoDown && canGoRight) ? Math.random() > 0.5 : canGoDown;
            if (moveDown) currR++; else currC++;
            path.push({ r: currR, c: currC });
        }

        // Assign Pipes
        for (let i = 1; i < path.length - 1; i++) {
            const prev = path[i-1];
            const curr = path[i];
            const next = path[i+1];
            const cell = newGrid[curr.r][curr.c];
            cell.isPath = true;

            let connections = 0;
            if (prev.r < curr.r || next.r < curr.r) connections |= N;
            if (prev.r > curr.r || next.r > curr.r) connections |= S;
            if (prev.c < curr.c || next.c < curr.c) connections |= W;
            if (prev.c > curr.c || next.c > curr.c) connections |= E;

            if ((connections & N) && (connections & S)) cell.type = 'straight';
            else if ((connections & E) && (connections & W)) { cell.type = 'straight'; cell.rotation = 1; }
            else cell.type = 'corner';
            
            if (cell.type === 'corner') {
                 if ((connections & N) && (connections & E)) cell.rotation = 0;
                 if ((connections & E) && (connections & S)) cell.rotation = 1;
                 if ((connections & S) && (connections & W)) cell.rotation = 2;
                 if ((connections & W) && (connections & N)) cell.rotation = 3;
            }
        }
        
        // Start/End rotations
        if (path[1].c > 0) newGrid[0][0].rotation = 3;
        const lastPrev = path[path.length-2];
        if (lastPrev.c < COLS-1) newGrid[ROWS-1][COLS-1].rotation = 3;

        // Fill Randoms
        for(let r=0; r<ROWS; r++) {
            for(let c=0; c<COLS; c++) {
                if (!newGrid[r][c].isPath) {
                    newGrid[r][c].type = Math.random() > 0.5 ? 'straight' : 'corner';
                    newGrid[r][c].rotation = Math.floor(Math.random() * 4);
                }
            }
        }

        // Scramble
        for(let r=0; r<ROWS; r++) {
            for(let c=0; c<COLS; c++) {
                if (newGrid[r][c].type !== 'start' && newGrid[r][c].type !== 'end') {
                     newGrid[r][c].rotation = Math.floor(Math.random() * 4);
                }
            }
        }

        setGrid(newGrid);
        setStatus('setup');
        speak("Rotate the pipes to connect the water!");
    }, []);

    useEffect(() => { generateLevel(); }, [generateLevel, level]);

    // --- Logic ---
    const getConnections = (cell: Cell): number => {
        const base = BASE_CONNECTIONS[cell.type];
        let res = 0;
        if (base & N) res |= (1 << ((0 + cell.rotation) % 4));
        if (base & E) res |= (1 << ((1 + cell.rotation) % 4));
        if (base & S) res |= (1 << ((2 + cell.rotation) % 4));
        if (base & W) res |= (1 << ((3 + cell.rotation) % 4));
        
        let mask = 0;
        if (res & 1) mask |= N;
        if (res & 2) mask |= E;
        if (res & 4) mask |= S;
        if (res & 8) mask |= W;
        return mask;
    };

    const rotateCell = (r: number, c: number) => {
        if (status !== 'setup') return;
        const cell = grid[r][c];
        if (cell.type === 'start' || cell.type === 'end') return;

        setGrid(prev => {
            const next = [...prev];
            next[r] = [...prev[r]];
            next[r][c] = { ...next[r][c], rotation: (next[r][c].rotation + 1) % 4 };
            return next;
        });
    };

    const startFlow = () => {
        setStatus('flowing');
        speak("Opening the valve!");
        
        let activeCells: {r: number, c: number}[] = [{r: 0, c: 0}];
        const visited = new Set<string>(['0,0']);

        flowInterval.current = window.setInterval(() => {
            setGrid(prev => {
                const nextGrid = prev.map(row => row.map(cell => ({...cell})));
                const nextActive: {r: number, c: number}[] = [];
                let moved = false;
                let won = false;
                let blocked = false;

                activeCells.forEach(({r, c}) => {
                    const currentCell = nextGrid[r][c];
                    currentCell.filled = true;
                    
                    const conns = getConnections(currentCell);

                    // Neighbor Check Logic
                    const checkDir = (dr: number, dc: number, dirOut: number, dirIn: number) => {
                         if (conns & dirOut) {
                            if (r+dr >= 0 && r+dr < ROWS && c+dc >= 0 && c+dc < COLS) {
                                const neighbor = nextGrid[r+dr][c+dc];
                                const nConns = getConnections(neighbor);
                                if (nConns & dirIn) {
                                    if (!visited.has(`${r+dr},${c+dc}`)) {
                                        visited.add(`${r+dr},${c+dc}`);
                                        nextActive.push({r: r+dr, c: c+dc});
                                        moved = true;
                                    }
                                } else {
                                    // Leak! Pipe open to wall or unconnected pipe
                                    currentCell.leaking = true; 
                                }
                            } else {
                                // Leak! Pipe open to edge of world
                                currentCell.leaking = true;
                            }
                         }
                    };

                    checkDir(-1, 0, N, S); // N
                    checkDir(1, 0, S, N);  // S
                    checkDir(0, 1, E, W);  // E
                    checkDir(0, -1, W, E); // W
                });

                // Win/Loss
                activeCells.forEach(ac => {
                     if (nextGrid[ac.r][ac.c].type === 'end') won = true;
                });

                const anyLeaks = activeCells.some(ac => nextGrid[ac.r][ac.c].leaking);

                if (won) {
                    setStatus('won');
                    speak("Water flows! Great job!");
                    if(flowInterval.current) clearInterval(flowInterval.current);
                } else if (anyLeaks) {
                     setStatus('lost');
                     speak("Oh no! It's leaking!");
                     if(flowInterval.current) clearInterval(flowInterval.current);
                } else if (!moved) {
                     setStatus('lost');
                     speak("Blocked!");
                     if(flowInterval.current) clearInterval(flowInterval.current);
                } else {
                     activeCells = nextActive;
                }

                return nextGrid;
            });
        }, 400);
    };

    const resetLevel = () => {
         if(flowInterval.current) clearInterval(flowInterval.current);
         setGrid(prev => prev.map(row => row.map(cell => ({ ...cell, filled: cell.type === 'start', leaking: false }))));
         setStatus('setup');
    };

    useEffect(() => {
        return () => { if(flowInterval.current) clearInterval(flowInterval.current); };
    }, []);

    const renderPipe = (cell: Cell) => {
        const { type, rotation, filled, leaking } = cell;
        
        let d = "";
        if (type === 'straight') d = "M35,0 L65,0 L65,100 L35,100 Z"; 
        else if (type === 'corner') d = "M35,0 L65,0 L65,35 L100,35 L100,65 L35,65 Z";
        else if (type === 'tee') d = "M35,0 L65,0 L65,35 L100,35 L100,65 L65,65 L65,100 L35,100 L35,65 L0,65 L0,35 L35,35 Z";
        else if (type === 'cross') d = "M35,0 L65,0 L65,35 L100,35 L100,65 L65,65 L65,100 L35,100 L35,65 L0,65 L0,35 L35,35 Z";
        else if (type === 'start') d = "M20,20 L80,20 L80,60 L65,60 L65,100 L35,100 L35,60 L20,60 Z";
        else if (type === 'end') d = "M35,0 L65,0 L65,40 L80,40 L80,80 L20,80 L20,40 L35,40 Z";

        return (
            <div className="relative w-full h-full">
                <svg viewBox="0 0 100 100" className="w-full h-full transition-all duration-300" style={{ transform: `rotate(${rotation * 90}deg)` }}>
                    <defs>
                        {/* Metallic Pipe Gradient */}
                        <linearGradient id="pipeMetal" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#475569" />
                            <stop offset="30%" stopColor="#94A3B8" />
                            <stop offset="50%" stopColor="#E2E8F0" />
                            <stop offset="70%" stopColor="#94A3B8" />
                            <stop offset="100%" stopColor="#475569" />
                        </linearGradient>
                        
                        {/* Water Gradient */}
                        <linearGradient id="waterFlow" x1="0%" y1="0%" x2="100%" y2="0%">
                             <stop offset="0%" stopColor="#1E40AF" />
                             <stop offset="50%" stopColor="#60A5FA" />
                             <stop offset="100%" stopColor="#1E40AF" />
                        </linearGradient>

                        {/* Leak Gradient */}
                        <linearGradient id="leakFlow" x1="0%" y1="0%" x2="100%" y2="0%">
                             <stop offset="0%" stopColor="#991B1B" />
                             <stop offset="50%" stopColor="#EF4444" />
                             <stop offset="100%" stopColor="#991B1B" />
                        </linearGradient>

                        <filter id="glow">
                            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Outer Pipe (Metal/Glass Container) */}
                    <path d={d} fill="url(#pipeMetal)" stroke="#334155" strokeWidth="2" />
                    
                    {/* Inner Fluid (Animated) */}
                    <path 
                        d={d} 
                        fill={leaking ? "url(#leakFlow)" : filled ? "url(#waterFlow)" : "#1e293b"} 
                        transform="scale(0.75) translate(16.5, 12.5)" /* Slight visual hack to center inner pipe */
                        opacity={filled || leaking ? 1 : 0.8}
                        className="transition-all duration-500"
                    />

                    {/* Glass Highlight Overlay */}
                    <path d={d} fill="rgba(255,255,255,0.2)" stroke="none" transform="scale(0.8) translate(10,10)" style={{ pointerEvents: 'none' }} />

                    {/* Start Indicator */}
                    {type === 'start' && <circle cx="50" cy="40" r="12" fill="#22C55E" stroke="#14532D" strokeWidth="3" />}
                </svg>
                
                {/* Visual Effects */}
                {leaking && (
                    <div className="absolute inset-0 flex items-center justify-center animate-pulse z-10">
                        <XCircle size={32} className="text-red-500 bg-white rounded-full" />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full max-w-2xl flex flex-col items-center relative h-[70vh]">
            {/* Victory Overlay */}
            {status === 'won' && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-3xl animate-in zoom-in duration-500">
                    <Confetti />
                    <div className="bg-white p-8 rounded-[3rem] text-center shadow-2xl border-8 border-green-400">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trophy size={48} className="text-green-600 animate-bounce" />
                        </div>
                        <h2 className="text-4xl font-black text-green-700 mb-2">Level Complete!</h2>
                        <p className="text-slate-500 font-bold text-lg mb-8">The water is flowing!</p>
                        <button 
                            onClick={() => { setLevel(l => l + 1); setStatus('setup'); }}
                            className="bg-green-500 text-white px-10 py-4 rounded-full font-bold text-xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2 mx-auto"
                        >
                            Next Level <ArrowRight />
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-slate-900 px-6 py-3 rounded-full shadow-lg border border-slate-700 mb-6 flex justify-between items-center w-full max-w-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-500 p-2 rounded-lg"><Droplets className="text-white w-5 h-5" /></div>
                    <div>
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pipe Master</h2>
                        <p className="text-white font-bold">Level {level}</p>
                    </div>
                </div>
                {status === 'setup' && (
                     <div className="text-blue-400 text-xs font-bold animate-pulse flex items-center gap-1">
                        <Settings size={14} /> ROTATE PIPES
                     </div>
                )}
            </div>

            <div 
                className="bg-slate-800 p-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-8 border-slate-700 mb-8 relative overflow-hidden flex-1"
                style={{ 
                    display: 'grid', 
                    gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                    gap: '2px',
                    width: '100%',
                    maxWidth: '400px',
                    aspectRatio: `${COLS}/${ROWS}`,
                    backgroundImage: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)'
                }}
            >
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                {grid.map((row, r) => (
                    row.map((cell, c) => (
                        <button
                            key={`${r}-${c}`}
                            onClick={() => rotateCell(r, c)}
                            className={`
                                relative rounded-lg overflow-hidden active:scale-95 transition-transform z-10
                                ${(cell.type === 'start' || cell.type === 'end') ? 'cursor-default' : 'cursor-pointer hover:bg-white/5'}
                            `}
                        >
                            {renderPipe(cell)}
                        </button>
                    ))
                ))}
            </div>

            <div className="flex gap-4">
                {status === 'setup' ? (
                    <button 
                        onClick={startFlow}
                        className="bg-blue-600 text-white px-12 py-5 rounded-2xl font-black text-xl shadow-[0_10px_0_rgb(30,64,175)] hover:translate-y-1 hover:shadow-[0_5px_0_rgb(30,64,175)] active:translate-y-2 active:shadow-none transition-all flex items-center gap-2"
                    >
                        <Play fill="currentColor" /> OPEN VALVE
                    </button>
                ) : (
                    <div className="flex gap-4">
                        <button 
                            onClick={resetLevel}
                            className="bg-slate-200 text-slate-700 px-6 py-4 rounded-xl font-bold hover:bg-slate-300 flex items-center gap-2 shadow-sm"
                        >
                            <RotateCcw size={20} /> Reset
                        </button>
                        {(status === 'lost') && (
                            <button 
                                onClick={generateLevel}
                                className="bg-orange-500 text-white px-6 py-4 rounded-xl font-bold shadow-lg hover:bg-orange-600"
                            >
                                New Board
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
