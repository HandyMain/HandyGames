
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Palette, Check, RefreshCw, Trash2, ArrowRight, Grid3X3 } from 'lucide-react';
import { Confetti } from '../components';
import { speak, getRandomItem } from '../utils';

// --- PALETTE ---
const COLORS = [
    { id: 1, hex: '#EF4444', name: 'Red' },
    { id: 2, hex: '#3B82F6', name: 'Blue' },
    { id: 3, hex: '#22C55E', name: 'Green' },
    { id: 4, hex: '#EAB308', name: 'Yellow' },
    { id: 5, hex: '#000000', name: 'Black' },
    { id: 6, hex: '#9CA3AF', name: 'Grey' }, 
    { id: 7, hex: '#F97316', name: 'Orange' },
    { id: 8, hex: '#A855F7', name: 'Purple' },
    { id: 9, hex: '#EC4899', name: 'Pink' },
    { id: 10, hex: '#8B4513', name: 'Brown' },
];

// --- PATTERN LIBRARY ---

const PATTERNS_EASY = [
    {
        name: "Heart",
        grid: [
            [0,1,1,0,0,1,1,0],
            [1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1],
            [0,1,1,1,1,1,1,0],
            [0,0,1,1,1,1,0,0],
            [0,0,0,1,1,0,0,0],
            [0,0,0,0,0,0,0,0]
        ]
    },
    {
        name: "Smiley",
        grid: [
            [0,0,4,4,4,4,0,0],
            [0,4,4,4,4,4,4,0],
            [4,4,5,4,4,5,4,4],
            [4,4,4,4,4,4,4,4],
            [4,5,4,4,4,4,5,4],
            [4,4,5,5,5,5,4,4],
            [0,4,4,4,4,4,4,0],
            [0,0,4,4,4,4,0,0]
        ]
    },
    {
        name: "Tree",
        grid: [
            [0,0,0,3,3,0,0,0],
            [0,0,3,3,3,3,0,0],
            [0,3,3,3,3,3,3,0],
            [3,3,3,3,3,3,3,3],
            [0,0,0,10,10,0,0,0],
            [0,0,0,10,10,0,0,0],
            [0,0,0,10,10,0,0,0],
            [3,3,3,3,3,3,3,3]
        ]
    },
    {
        name: "Cross",
        grid: [
            [0,0,0,1,1,0,0,0],
            [0,0,0,1,1,0,0,0],
            [0,1,1,1,1,1,1,0],
            [0,1,1,1,1,1,1,0],
            [0,0,0,1,1,0,0,0],
            [0,0,0,1,1,0,0,0],
            [0,0,0,1,1,0,0,0],
            [0,0,0,1,1,0,0,0]
        ]
    }
];

const PATTERNS_MEDIUM = [
    {
        name: "Duck",
        grid: [
            [0,0,0,0,0,4,4,4,0,0],
            [0,0,0,0,4,4,4,4,7,0],
            [0,0,0,0,4,4,5,4,7,0],
            [0,0,0,0,0,4,4,4,0,0],
            [0,4,4,4,4,4,4,4,0,0],
            [4,4,4,4,4,4,4,4,4,0],
            [4,4,4,4,4,4,4,4,4,0],
            [0,4,4,4,4,4,4,4,0,0],
            [0,0,7,7,0,0,7,7,0,0],
            [0,0,0,0,0,0,0,0,0,0]
        ]
    },
    {
        name: "Mushroom",
        grid: [
            [0,0,0,1,1,1,1,0,0,0],
            [0,0,1,1,6,6,1,1,0,0],
            [0,1,1,6,6,6,6,1,1,0],
            [1,1,1,1,6,6,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1],
            [0,0,2,2,6,6,2,2,0,0],
            [0,0,2,2,6,6,2,2,0,0],
            [0,0,2,2,6,6,2,2,0,0],
            [0,0,2,2,6,6,2,2,0,0],
            [0,0,0,0,0,0,0,0,0,0]
        ]
    },
    {
        name: "Gift",
        grid: [
            [0,0,0,2,2,0,0,0,0,0],
            [0,0,2,2,2,2,0,0,0,0],
            [0,1,1,1,2,2,1,1,1,0],
            [0,1,1,1,2,2,1,1,1,0],
            [0,1,1,1,2,2,1,1,1,0],
            [0,1,1,1,2,2,1,1,1,0],
            [0,1,1,1,2,2,1,1,1,0],
            [0,1,1,1,2,2,1,1,1,0],
            [0,1,1,1,2,2,1,1,1,0],
            [0,0,0,0,0,0,0,0,0,0]
        ]
    }
];

const PATTERNS_HARD = [
    {
        name: "Sword",
        grid: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,6,6,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,6,6,2,0,0],
            [0,0,0,0,0,0,0,0,0,0,6,6,2,6,0,0],
            [0,0,0,0,0,0,0,0,0,6,6,2,6,0,0,0],
            [0,0,0,0,0,0,0,0,6,6,2,6,0,0,0,0],
            [0,0,0,0,0,0,0,6,6,2,6,0,0,0,0,0],
            [0,0,0,0,0,0,6,6,2,6,0,0,0,0,0,0],
            [0,0,0,0,0,6,6,2,6,0,0,0,0,0,0,0],
            [0,0,0,0,7,7,7,6,0,0,0,0,0,0,0,0],
            [0,0,0,7,7,4,7,7,0,0,0,0,0,0,0,0],
            [0,0,7,7,4,4,4,7,7,0,0,0,0,0,0,0],
            [0,0,0,0,4,4,4,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,10,4,10,0,0,0,0,0,0,0,0],
            [0,0,0,0,10,0,10,0,0,0,0,0,0,0,0],
            [0,0,0,0,10,0,10,0,0,0,0,0,0,0,0]
        ]
    },
    {
        name: "Potion",
        grid: [
            [0,0,0,0,0,0,0,6,6,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,6,6,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,6,6,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
            [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
            [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
            [0,0,0,1,1,1,3,3,1,3,1,1,1,0,0,0],
            [0,0,1,1,1,3,3,3,3,3,3,1,1,1,0,0],
            [0,1,1,1,1,3,3,3,3,3,3,1,1,1,1,0],
            [0,1,1,1,1,1,3,3,3,3,1,1,1,1,1,0],
            [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
            [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
            [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
            [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
            [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ]
    }
];

export const PaintPixelMode = ({ difficulty = 'easy' }: { difficulty: 'easy' | 'medium' | 'hard' }) => {
    const [pattern, setPattern] = useState(PATTERNS_EASY[0]);
    const [userGrid, setUserGrid] = useState<number[][]>([]);
    const [selectedColor, setSelectedColor] = useState(1);
    const [status, setStatus] = useState<'playing' | 'won'>('playing');
    const [isDragging, setIsDragging] = useState(false);
    
    // Track previous puzzles to avoid direct repeats
    const historyRef = useRef<Set<string>>(new Set());

    const getPool = useCallback(() => {
        if (difficulty === 'hard') return PATTERNS_HARD;
        if (difficulty === 'medium') return PATTERNS_MEDIUM;
        return PATTERNS_EASY;
    }, [difficulty]);

    const startRound = useCallback((reset = false) => {
        const pool = getPool();
        let next;
        
        if (reset) {
            // Keep current pattern, just wipe grid
            next = pattern;
        } else {
            // Pick new pattern
            const available = pool.filter(p => !historyRef.current.has(p.name));
            if (available.length === 0) {
                historyRef.current.clear(); // Reset history if exhausted
                next = getRandomItem(pool);
            } else {
                next = getRandomItem(available);
            }
            
            // Avoid immediate repeat if possible
            if (next.name === pattern.name && pool.length > 1) {
                next = pool.find(p => p.name !== pattern.name) || next;
            }
            historyRef.current.add(next.name);
        }

        setPattern(next);
        
        // Initialize Grid based on pattern size
        const rows = next.grid.length;
        const cols = next.grid[0].length;
        const empty = Array(rows).fill(null).map(() => Array(cols).fill(0));
        
        setUserGrid(empty);
        setStatus('playing');
        
        if (!reset) speak(`Let's paint a ${next.name}! Match the numbers.`);
    }, [difficulty, getPool, pattern]);

    // Initial Load & Difficulty Change
    useEffect(() => {
        startRound(false);
    }, [difficulty]);

    // Check Win
    useEffect(() => {
        if (status === 'won' || userGrid.length === 0) return;
        
        let match = true;
        let filledCount = 0;
        let totalCount = 0;

        for(let r=0; r<pattern.grid.length; r++){
            for(let c=0; c<pattern.grid[0].length; c++){
                const target = pattern.grid[r][c];
                if (target !== 0) {
                    totalCount++;
                    if (userGrid[r][c] !== target) {
                        match = false;
                    } else {
                        filledCount++;
                    }
                } else if (userGrid[r][c] !== 0) {
                    // Painted outside lines
                    match = false;
                }
            }
        }

        if (match && totalCount > 0) {
            setStatus('won');
            speak(`Beautiful! You painted a ${pattern.name}!`);
        }
    }, [userGrid, pattern, status]);

    // --- PAINTING LOGIC ---

    const paint = (r: number, c: number) => {
        if (status === 'won') return;
        if (!userGrid[r] || userGrid[r][c] === selectedColor) return;

        // Feedback for wrong color (only if trying to paint a numbered cell)
        const target = pattern.grid[r][c];
        if (target !== 0 && selectedColor !== target) {
             // Maybe a sound effect? "Boop"
             // Don't paint if strict mode? No, allow mistakes but maybe wiggle.
        }

        const newGrid = [...userGrid];
        newGrid[r] = [...userGrid[r]];
        newGrid[r][c] = selectedColor;
        setUserGrid(newGrid);
    };

    const handlePointerDown = (r: number, c: number, e: React.PointerEvent) => {
        e.preventDefault(); // Prevent scrolling
        setIsDragging(true);
        paint(r, c);
    };

    const handlePointerEnter = (r: number, c: number) => {
        if (isDragging) {
            paint(r, c);
        }
    };

    const handlePointerUp = () => {
        setIsDragging(false);
    };

    // Touch support for dragging (since PointerEnter doesn't work effectively on touch drag without this)
    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        const touch = e.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        if (element && element.hasAttribute('data-r')) {
            const r = parseInt(element.getAttribute('data-r') || '0');
            const c = parseInt(element.getAttribute('data-c') || '0');
            paint(r, c);
        }
    };

    // --- RENDER ---

    const rows = pattern.grid.length;
    const cols = pattern.grid[0].length;

    // Filter colors used in this pattern
    const usedColorIds = new Set<number>();
    pattern.grid.flat().forEach(id => { if(id !== 0) usedColorIds.add(id); });
    const activePalette = COLORS.filter(c => usedColorIds.has(c.id));

    return (
        <div 
            className="w-full max-w-2xl flex flex-col items-center"
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            {status === 'won' && <Confetti />}

            {/* Header */}
            <div className="bg-pink-100 px-6 py-3 rounded-full shadow-sm mb-6 flex items-center justify-between gap-4 w-full max-w-sm">
                 <div className="flex items-center gap-2">
                    <Grid3X3 className="text-pink-600" />
                    <span className="font-bold text-pink-900">{pattern.name}</span>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => startRound(true)} className="p-2 bg-white rounded-full text-pink-400 hover:text-pink-600 shadow-sm" title="Reset">
                        <Trash2 size={16} />
                    </button>
                    <button onClick={() => startRound(false)} className="p-2 bg-white rounded-full text-pink-400 hover:text-pink-600 shadow-sm" title="Skip">
                        <ArrowRight size={16} />
                    </button>
                 </div>
            </div>

            {/* Grid */}
            <div 
                className="bg-white p-2 rounded-xl shadow-2xl border-4 border-gray-200 mb-8 touch-none select-none"
                style={{ 
                    display: 'grid', 
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gap: '1px',
                    width: '100%',
                    maxWidth: difficulty === 'hard' ? '450px' : '350px',
                    aspectRatio: `${cols}/${rows}`
                }}
                onTouchMove={handleTouchMove}
            >
                {userGrid.length > 0 && pattern.grid.map((row, r) => (
                    row.map((targetVal, c) => {
                        const userVal = userGrid[r][c];
                        const isCorrect = userVal === targetVal && targetVal !== 0;
                        const bgColor = userVal === 0 ? '#F9FAFB' : COLORS.find(cl => cl.id === userVal)?.hex;
                        const textColor = targetVal === 5 || targetVal === 2 || targetVal === 10 ? 'text-white/80' : 'text-gray-400';

                        return (
                            <div
                                key={`${r}-${c}`}
                                data-r={r}
                                data-c={c}
                                onPointerDown={(e) => handlePointerDown(r, c, e)}
                                onPointerEnter={() => handlePointerEnter(r, c)}
                                className={`
                                    relative w-full h-full rounded-sm flex items-center justify-center font-mono font-bold text-xs select-none
                                    ${targetVal !== 0 ? 'border-[0.5px] border-gray-100' : ''}
                                `}
                                style={{ backgroundColor: bgColor }}
                            >
                                {/* Show number hint if not painted correctly yet */}
                                {targetVal !== 0 && userVal === 0 && (
                                    <span className={textColor}>{targetVal}</span>
                                )}
                                
                                {/* Show check if correct */}
                                {isCorrect && <Check size={10} className="text-white/50 absolute" />}
                            </div>
                        );
                    })
                ))}
            </div>

            {/* Palette */}
            <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-8 max-w-md">
                {activePalette.map(col => (
                    <button
                        key={col.id}
                        onClick={() => setSelectedColor(col.id)}
                        className={`w-12 h-12 md:w-14 md:h-14 rounded-full shadow-md border-4 flex items-center justify-center transition-transform active:scale-95
                             ${selectedColor === col.id ? 'scale-110 ring-4 ring-pink-200 border-white' : 'border-gray-100'}
                        `}
                        style={{ backgroundColor: col.hex }}
                    >
                        <span className={`font-bold drop-shadow-md ${col.id === 6 || col.id === 4 ? 'text-gray-800' : 'text-white'}`}>{col.id}</span>
                    </button>
                ))}
                {/* Eraser */}
                <button
                    onClick={() => setSelectedColor(0)} // 0 = Eraser
                    className={`w-12 h-12 md:w-14 md:h-14 rounded-full shadow-sm border-4 flex items-center justify-center transition-transform active:scale-95 bg-gray-100
                             ${selectedColor === 0 ? 'scale-110 ring-4 ring-pink-200 border-white' : 'border-gray-200'}
                        `}
                >
                    <Trash2 size={20} className="text-gray-500" />
                </button>
            </div>

            {status === 'won' && (
                <button 
                    onClick={() => startRound(false)}
                    className="bg-pink-500 text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg hover:bg-pink-600 flex items-center gap-2 animate-bounce"
                >
                    Next Picture <RefreshCw />
                </button>
            )}
        </div>
    );
};
