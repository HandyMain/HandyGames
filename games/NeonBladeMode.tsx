
import React, { useState, useEffect, useRef } from 'react';
import { Camera, Zap, AlertTriangle, RotateCcw, Trophy, Settings2, EyeOff } from 'lucide-react';
import { Confetti } from '../components';
import { getRandomItem } from '../utils';

// --- 3D MATH ENGINE ---

interface Point3D { x: number; y: number; z: number; }
interface Point2D { x: number; y: number; scale: number; }

// Rotation Matrix Helpers (Still used for Particle geometry if needed, or simple math)
const project = (p: Point3D, width: number, height: number, fov: number, camera: Point3D): Point2D => {
    const factor = fov / (fov + p.z + camera.z);
    const x = (p.x + camera.x) * factor + width / 2;
    const y = (p.y + camera.y) * factor + height / 2;
    return { x, y, scale: factor };
};

// --- GAME DATA ---

const FOODS = [
    { emoji: '🥦', color: '#4ADE80' }, // Green
    { emoji: '🍎', color: '#EF4444' }, // Red
    { emoji: '🥕', color: '#F97316' }, // Orange
    { emoji: '🍆', color: '#A855F7' }, // Purple
    { emoji: '🌽', color: '#EAB308' }, // Yellow
    { emoji: '🥑', color: '#84CC16' }, // Lime
    { emoji: '🍕', color: '#F59E0B' }, // Orange/Yellow
    { emoji: '🍟', color: '#FCD34D' }, // Yellow
    { emoji: '🍩', color: '#EC4899' }, // Pink
    { emoji: '🍉', color: '#F87171' }, // Red/Green
];

// --- GAME ENTITIES ---

interface Entity {
    id: number;
    type: 'enemy' | 'particle';
    x: number; y: number; z: number;
    vx: number; vy: number; vz: number;
    rx: number; ry: number; rz: number; // Rotation
    vRx: number; vRy: number; vRz: number; // Rotation Velocity
    size: number;
    color: string;
    emoji?: string; // For enemies
    life: number;
    maxLife: number;
}

// --- MAIN COMPONENT ---

export const NeonBladeMode = () => {
    // Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const requestRef = useRef<number | null>(null);
    
    // State
    const [score, setScore] = useState(0);
    const [health, setHealth] = useState(100);
    const [status, setStatus] = useState<'intro' | 'playing' | 'gameover'>('intro');
    const [cameraPerm, setCameraPerm] = useState<boolean | null>(null);

    // Game Engine Refs (Mutable for performance)
    const entities = useRef<Entity[]>([]);
    const trail = useRef<{x: number, y: number, life: number}[]>([]);
    const lastTime = useRef(0);
    const lastSpawn = useRef(0);
    const cameraOffset = useRef({ x: 0, y: 0 }); // Controlled by gyro
    
    // --- SETUP ---
    useEffect(() => {
        startCamera();
        
        // Gyro / Mouse Parallax
        const handleMove = (e: MouseEvent) => {
            cameraOffset.current = { 
                x: (e.clientX / window.innerWidth - 0.5) * 100, 
                y: (e.clientY / window.innerHeight - 0.5) * 100 
            };
        };
        const handleGyro = (e: DeviceOrientationEvent) => {
            if (e.gamma && e.beta) {
                cameraOffset.current = { x: e.gamma * 2, y: e.beta * 2 };
            }
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('deviceorientation', handleGyro);

        return () => {
            stopCamera();
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('deviceorientation', handleGyro);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    const startCamera = async () => {
        try {
            // Try environment first (back camera)
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(e => console.error("Video play error:", e));
            }
            setCameraPerm(true);
        } catch (e) {
            console.log("Environment camera not found, trying fallback...");
            try {
                // Fallback to ANY camera
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(e => console.error("Video play error:", e));
                }
                setCameraPerm(true);
            } catch (e2) {
                console.error("No camera found:", e2);
                setCameraPerm(false); // Game can still proceed in simulation mode
            }
        }
    };

    const stopCamera = () => {
        const stream = videoRef.current?.srcObject as MediaStream;
        stream?.getTracks().forEach(t => t.stop());
    };

    const startGame = () => {
        setScore(0);
        setHealth(100);
        entities.current = [];
        trail.current = [];
        setStatus('playing');
        
        // Initialize Timers
        const now = performance.now();
        lastTime.current = now;
        lastSpawn.current = now;
        
        requestRef.current = requestAnimationFrame(gameLoop);
    };

    // --- PHYSICS ENGINE ---

    const spawnEnemy = () => {
        const zStart = 800 + Math.random() * 500;
        const xStart = (Math.random() - 0.5) * 600;
        const yStart = (Math.random() - 0.5) * 600;
        
        const food = getRandomItem(FOODS);
        
        const enemy: Entity = {
            id: Math.random(),
            type: 'enemy',
            x: xStart, y: yStart, z: zStart,
            vx: -xStart * 0.005, vy: -yStart * 0.005, vz: -15 - (Math.random() * 10), // Move towards center/camera
            rx: 0, ry: 0, rz: Math.random() * 360,
            vRx: 0, vRy: 0, vRz: (Math.random() - 0.5) * 0.1, // Spin speed
            size: 60 + Math.random() * 20, // Base size for Emoji font
            color: food.color,
            emoji: food.emoji,
            life: 1, maxLife: 1,
        };
        entities.current.push(enemy);
    };

    const spawnExplosion = (x: number, y: number, z: number, color: string) => {
        for (let i = 0; i < 15; i++) {
            entities.current.push({
                id: Math.random(),
                type: 'particle',
                x, y, z,
                vx: (Math.random() - 0.5) * 25,
                vy: (Math.random() - 0.5) * 25,
                vz: (Math.random() - 0.5) * 25,
                rx: 0, ry: 0, rz: 0,
                vRx: 0, vRy: 0, vRz: 0,
                size: Math.random() * 8 + 4,
                color: color,
                life: 1.0,
                maxLife: 1.0,
            });
        }
    };

    const gameLoop = (time: number) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        // Resize Canvas to Fullscreen HighDPI
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
        }
        const width = rect.width;
        const height = rect.height;

        // Safety check for delta time
        let delta = (time - lastTime.current) / 16; 
        if (delta < 0 || delta > 10) delta = 1; 
        lastTime.current = time;

        // Clear
        ctx.clearRect(0, 0, width, height);

        // --- UPDATE LOGIC ---
        
        // Spawn Enemies
        if (time - lastSpawn.current > 800 && status === 'playing') { 
            spawnEnemy();
            lastSpawn.current = time;
        }

        // Update Entities
        for (let i = entities.current.length - 1; i >= 0; i--) {
            const e = entities.current[i];
            
            // Movement
            e.x += e.vx * delta;
            e.y += e.vy * delta;
            e.z += e.vz * delta;

            // Rotation
            e.rx += e.vRx * delta;
            e.ry += e.vRy * delta;
            e.rz += e.vRz * delta;

            // Life (Particles)
            if (e.type !== 'enemy') e.life -= 0.02 * delta;

            // Collision with Camera (Player Hit)
            if (e.type === 'enemy' && e.z < 0) {
                setHealth(h => Math.max(0, h - 20));
                if (navigator.vibrate) navigator.vibrate(200);
                entities.current.splice(i, 1);
                continue;
            }

            // Despawn dead
            if (e.life <= 0) {
                entities.current.splice(i, 1);
                continue;
            }
        }

        // Update Trail
        for (let i = trail.current.length - 1; i >= 0; i--) {
            trail.current[i].life -= 0.05 * delta;
            if (trail.current[i].life <= 0) trail.current.splice(i, 1);
        }

        // --- RENDER LOGIC ---

        const fov = 600;
        const camera = { x: cameraOffset.current.x, y: cameraOffset.current.y, z: 0 };

        // Sort by Z (Painter's Algo)
        entities.current.sort((a, b) => b.z - a.z);

        // Draw Entities
        entities.current.forEach(e => {
            const center2D = project(e, width, height, fov, camera);
            
            // Culling
            if (e.z + fov <= 0) return;

            if (e.type === 'particle') {
                // Draw Particle
                ctx.globalCompositeOperation = 'lighter';
                ctx.beginPath();
                ctx.arc(center2D.x, center2D.y, e.size * center2D.scale, 0, Math.PI * 2);
                ctx.fillStyle = e.color;
                ctx.globalAlpha = e.life;
                ctx.fill();
                ctx.globalAlpha = 1.0;
            } else if (e.emoji) {
                // Draw Enemy (Emoji)
                ctx.globalCompositeOperation = 'source-over';
                
                // Save context for rotation
                ctx.save();
                ctx.translate(center2D.x, center2D.y);
                ctx.rotate(e.rz); // Spin 2D
                
                // Scale text by depth
                const fontSize = e.size * center2D.scale * dpr;
                ctx.font = `${fontSize}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Glow effect
                ctx.shadowBlur = 20;
                ctx.shadowColor = e.color;
                
                ctx.fillText(e.emoji, 0, 0);
                
                ctx.restore();
                ctx.shadowBlur = 0;
            }
        });

        // Draw Blade Trail
        if (trail.current.length > 1) {
            ctx.beginPath();
            ctx.moveTo(trail.current[0].x, trail.current[0].y);
            for (let i = 1; i < trail.current.length; i++) {
                const p = trail.current[i];
                ctx.lineTo(p.x, p.y);
            }
            ctx.strokeStyle = '#FFFFFF';
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#F472B6'; // Neon Pink
            ctx.lineWidth = 8;
            ctx.lineCap = 'round';
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Loop
        if (health > 0) {
            requestRef.current = requestAnimationFrame(gameLoop);
        } else {
            setStatus('gameover');
        }
    };

    // --- INPUT HANDLERS ---

    const handleInput = (clientX: number, clientY: number) => {
        if (status !== 'playing') return;

        // Get canvas coordinates
        const canvas = canvasRef.current;
        if(!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        // Add to trail
        trail.current.unshift({ x, y, life: 1.0 });
        if (trail.current.length > 10) trail.current.pop();

        // Raycast / Collision Logic
        const fov = 600;
        const camera = { x: cameraOffset.current.x, y: cameraOffset.current.y, z: 0 };
        const width = rect.width;
        const height = rect.height;

        for (let i = entities.current.length - 1; i >= 0; i--) {
            const e = entities.current[i];
            if (e.type !== 'enemy') continue;
            if (e.z > 800) continue; // Too far away

            const p = project(e, width, height, fov, camera);
            const dist = Math.hypot(p.x - x, p.y - y);
            const radius = (e.size * 0.8) * p.scale; // Hitbox slightly smaller than emoji visual

            if (dist < radius) {
                // HIT!
                spawnExplosion(e.x, e.y, e.z, e.color);
                setScore(s => s + 100);
                entities.current.splice(i, 1);
                // Haptic
                if (navigator.vibrate) navigator.vibrate(10);
            }
        }
    };

    return (
        <div className="w-full h-[80vh] relative overflow-hidden rounded-[2rem] border-4 border-slate-900 bg-black shadow-2xl">
            {/* Background Camera */}
            <video 
                ref={videoRef}
                autoPlay playsInline muted
                className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none"
            />
            
            {/* 3D Canvas Layer */}
            <canvas 
                ref={canvasRef}
                className="absolute inset-0 w-full h-full touch-none"
                onTouchMove={(e) => handleInput(e.touches[0].clientX, e.touches[0].clientY)}
                onMouseMove={(e) => handleInput(e.clientX, e.clientY)}
                onTouchStart={(e) => handleInput(e.touches[0].clientX, e.touches[0].clientY)}
            />

            {/* HUD */}
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                <div className="bg-black/50 backdrop-blur border border-white/20 px-3 py-1 md:px-4 md:py-2 rounded-xl flex items-center gap-2 text-white">
                    <Trophy className="text-yellow-400 w-5 h-5 md:w-6 md:h-6" />
                    <span className="font-mono font-bold text-xl md:text-2xl">{score.toLocaleString()}</span>
                </div>
            </div>

            <div className="absolute top-4 right-4 z-20">
                <div className="bg-black/50 backdrop-blur border border-white/20 px-3 py-1 md:px-4 md:py-2 rounded-xl flex items-center gap-2">
                    <div className="w-24 md:w-32 h-3 md:h-4 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-300 ${health > 50 ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{width: `${health}%`}} 
                        />
                    </div>
                    <Zap className={`w-5 h-5 md:w-6 md:h-6 ${health > 50 ? 'text-green-400' : 'text-red-500'}`} />
                </div>
            </div>

            {/* Overlays */}
            {status === 'intro' && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 md:p-8 text-center animate-in fade-in z-30">
                    <div className="bg-slate-900 border-2 border-cyan-500 p-6 md:p-8 rounded-3xl shadow-[0_0_50px_rgba(34,211,238,0.3)] max-w-sm w-full">
                        <Settings2 size={48} className="mx-auto text-cyan-400 mb-4 animate-spin-slow" />
                        <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tighter italic">NEON BLADE <span className="text-pink-500">AR</span></h1>
                        <div className="flex gap-2 justify-center mb-6">
                            <span className="bg-gray-800 text-gray-400 text-[10px] md:text-xs px-2 py-1 rounded">120HZ PHYSICS</span>
                            <span className="bg-gray-800 text-gray-400 text-[10px] md:text-xs px-2 py-1 rounded">HDR BLOOM</span>
                        </div>
                        <p className="text-gray-300 mb-8 max-w-xs mx-auto text-sm md:text-base">
                            Slice the snacks before they hit you!
                            <br/><br/>
                            <span className="text-cyan-400 font-bold">SWIPE</span> to slice.
                            <br/>
                            <span className="text-pink-400 font-bold">TILT</span> to look around.
                        </p>
                        
                        {cameraPerm === false && (
                            <div className="mb-4 bg-yellow-500/20 text-yellow-200 px-4 py-2 rounded-lg text-xs md:text-sm border border-yellow-500/50 flex items-center justify-center gap-2">
                                <EyeOff size={16} /> No Camera Detected - Simulation Mode
                            </div>
                        )}

                        <button 
                            onClick={startGame}
                            className={`w-full py-4 rounded-xl font-black text-lg md:text-xl flex items-center justify-center gap-2 transition-all
                                ${cameraPerm === false 
                                    ? 'bg-yellow-500 text-black hover:bg-yellow-400' 
                                    : 'bg-cyan-500 text-black hover:bg-cyan-400 hover:scale-105'
                                }
                            `}
                        >
                             <Camera size={20} /> {cameraPerm === false ? 'PLAY (SIMULATION)' : 'START GAME'}
                        </button>
                    </div>
                </div>
            )}

            {status === 'gameover' && (
                <div className="absolute inset-0 bg-red-900/80 flex flex-col items-center justify-center p-8 text-center animate-in zoom-in z-30">
                    <AlertTriangle size={64} className="text-white mb-6 md:w-20 md:h-20" />
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-2">GAME OVER</h2>
                    <p className="text-red-200 text-lg md:text-xl font-mono mb-8">TOO MANY SNACKS!</p>
                    <div className="bg-black/50 px-8 py-4 rounded-2xl mb-8">
                        <span className="text-gray-400 text-xs md:text-sm uppercase">Final Score</span>
                        <div className="text-3xl md:text-4xl font-bold text-white">{score.toLocaleString()}</div>
                    </div>
                    <button 
                        onClick={startGame}
                        className="bg-white text-red-900 px-8 py-3 md:px-10 md:py-4 rounded-full font-bold text-lg md:text-xl hover:scale-105 transition-transform flex items-center gap-2"
                    >
                        <RotateCcw /> PLAY AGAIN
                    </button>
                </div>
            )}
        </div>
    );
};
