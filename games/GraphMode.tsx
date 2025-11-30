
import React, { useState, useEffect, useRef } from 'react';
import { Home, School, Trees, ShoppingBag, MapPin, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Confetti } from '../components';
import { speak } from '../utils';

interface Node {
  id: number; // 1-based index
  x: number;
  y: number;
  icon: React.ReactNode;
  label: string;
}

const ICONS = [
    { label: 'Start', icon: <Home className="text-white w-6 h-6" /> },
    { label: 'School', icon: <School className="text-white w-6 h-6" /> },
    { label: 'Park', icon: <Trees className="text-white w-6 h-6" /> },
    { label: 'Store', icon: <ShoppingBag className="text-white w-6 h-6" /> },
    { label: 'Zoo', icon: <MapPin className="text-white w-6 h-6" /> },
];

export const GraphMode = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [visited, setVisited] = useState<number[]>([]);
  const [currentPath, setCurrentPath] = useState<{x:number, y:number}[]>([]);
  const [level, setLevel] = useState(1);
  const [status, setStatus] = useState<'playing' | 'won'>('playing');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Generate Level
  useEffect(() => {
    generateLevel();
  }, [level]);

  const generateLevel = () => {
    if (!containerRef.current) return;
    
    // Determine number of nodes based on level (3 to 5)
    const count = Math.min(3 + Math.floor((level - 1) / 2), 5);
    const newNodes: Node[] = [];
    
    const width = containerRef.current.clientWidth;
    const height = 400; // Fixed height area
    const padding = 50;

    // Simple layout generation (Random but spaced)
    for(let i=0; i<count; i++) {
        let x, y, tooClose;
        let attempts = 0;
        do {
            tooClose = false;
            x = padding + Math.random() * (width - padding * 2);
            y = padding + Math.random() * (height - padding * 2);
            
            for(const n of newNodes) {
                const dist = Math.hypot(n.x - x, n.y - y);
                if (dist < 100) tooClose = true;
            }
            attempts++;
        } while(tooClose && attempts < 50);

        newNodes.push({
            id: i + 1, // 1-based IDs
            x,
            y,
            icon: ICONS[i].icon,
            label: ICONS[i].label
        });
    }

    setNodes(newNodes);
    setVisited([]);
    setCurrentPath([]);
    setStatus('playing');
    speak("Trace the numbers in order! Start at 1.");
  };

  const getTouchPos = (e: React.TouchEvent | React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x:0, y:0 };
      const rect = canvas.getBoundingClientRect();
      
      let cx, cy;
      if ('touches' in e) {
          cx = e.touches[0].clientX;
          cy = e.touches[0].clientY;
      } else {
          cx = (e as React.MouseEvent).clientX;
          cy = (e as React.MouseEvent).clientY;
      }
      return {
          x: cx - rect.left,
          y: cy - rect.top
      };
  };

  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (status === 'won') return;
    const pos = getTouchPos(e);
    
    // Check if starting on Node 1
    const startNode = nodes.find(n => Math.hypot(n.x - pos.x, n.y - pos.y) < 40);
    
    if (startNode && startNode.id === 1) {
        isDragging.current = true;
        setVisited([startNode.id]);
        setCurrentPath([{x: startNode.x, y: startNode.y}]);
        speak("One");
    } else if (startNode) {
        speak("Start at number 1!");
    }
  };

  const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging.current || status === 'won') return;
    const pos = getTouchPos(e);
    
    setCurrentPath(prev => [...prev, pos]);

    // Check collision with unvisited nodes
    const hitNode = nodes.find(n => Math.hypot(n.x - pos.x, n.y - pos.y) < 30);
    
    if (hitNode && !visited.includes(hitNode.id)) {
        const lastId = visited[visited.length - 1];
        
        // Validation: Must be next number in sequence
        if (hitNode.id === lastId + 1) {
             setVisited(prev => [...prev, hitNode.id]);
             setCurrentPath(prev => [...prev, {x: hitNode.x, y: hitNode.y}]); // Snap point
             speak(hitNode.id.toString());
        } else if (hitNode.id > lastId + 1) {
             // Skipped a number
             isDragging.current = false;
             speak(`No skipping! Go to ${lastId + 1} next.`);
             // Reset path to last valid node
             const validNode = nodes.find(n => n.id === lastId);
             if(validNode) setCurrentPath([{x:validNode.x, y:validNode.y}]); 
             setVisited([1]); // Hard reset or soft reset? Hard reset for clarity
             setVisited([]);
             setCurrentPath([]);
        }
    }
  };

  const handleEnd = () => {
    isDragging.current = false;
    
    // Check win
    if (visited.length === nodes.length) {
        setStatus('won');
        speak("You connected them all! Amazing!");
        setTimeout(() => setLevel(l => l + 1), 2000);
    } else {
        // Reset if failed
        if (visited.length > 0) {
             setCurrentPath([]);
             setVisited([]);
        }
    }
  };

  // Draw Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Path
    if (currentPath.length > 0) {
        ctx.beginPath();
        ctx.strokeStyle = '#84cc16'; // Lime-500
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        const startNode = nodes.find(n => n.id === visited[0]);
        if (startNode) ctx.moveTo(startNode.x, startNode.y);
        else ctx.moveTo(currentPath[0].x, currentPath[0].y);

        visited.forEach((id, idx) => {
            if (idx === 0) return;
            const n = nodes.find(node => node.id === id);
            if (n) ctx.lineTo(n.x, n.y);
        });

        if (isDragging.current) {
             const lastP = currentPath[currentPath.length-1];
             ctx.lineTo(lastP.x, lastP.y);
        }

        ctx.stroke();
    }

  }, [currentPath, visited, nodes]);

  return (
    <div className="w-full max-w-2xl flex flex-col items-center">
        {status === 'won' && <Confetti />}

        <div className="bg-lime-100 p-4 rounded-3xl w-full text-center shadow-lg border-4 border-lime-200 mb-6 flex justify-between items-center">
            <div>
                <h2 className="text-sm font-bold text-lime-700 uppercase tracking-widest">Route Planner</h2>
                <p className="font-bold text-lime-900">Level {level}</p>
            </div>
            <button onClick={() => generateLevel()} className="bg-white p-2 rounded-full text-lime-600 shadow-sm"><RefreshCw size={20} /></button>
        </div>

        <div 
            ref={containerRef}
            className="relative w-full h-[400px] bg-white rounded-3xl shadow-xl border-8 border-lime-100 overflow-hidden touch-none"
        >
            <canvas 
                ref={canvasRef}
                width={containerRef.current?.clientWidth || 300}
                height={400}
                className="absolute inset-0 z-10"
                onTouchStart={handleStart}
                onTouchMove={handleMove}
                onTouchEnd={handleEnd}
                onMouseDown={handleStart}
                onMouseMove={handleMove}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
            />

            {nodes.map(node => (
                <div 
                    key={node.id}
                    className={`absolute w-16 h-16 -ml-8 -mt-8 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 z-20 pointer-events-none border-4
                        ${visited.includes(node.id) ? 'bg-lime-500 border-lime-600 scale-110' : 'bg-gray-100 border-gray-300'}
                    `}
                    style={{ left: node.x, top: node.y }}
                >
                    <span className={`text-2xl font-black ${visited.includes(node.id) ? 'text-white' : 'text-gray-400'}`}>
                        {node.id}
                    </span>
                    <span className="absolute -bottom-8 bg-white/80 px-2 py-1 rounded text-xs font-bold text-gray-600 whitespace-nowrap">
                        {node.label}
                    </span>
                </div>
            ))}
        </div>
        
        <p className="mt-4 text-center text-gray-500 font-medium text-sm">
            Draw a line from 1 to {nodes.length} in order!
        </p>
    </div>
  );
};
