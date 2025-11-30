
import React, { useEffect, useRef } from 'react';
import { LETTER_OBJECTS } from './data';

// --- Confetti Component ---
interface Particle {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  vx: number;
  vy: number;
  gravity: number;
}

export const Confetti = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    const colors = ['#FFC700', '#FF0000', '#2E3192', '#41BBC7'];

    for (let i = 0; i < 100; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        w: Math.random() * 10 + 5,
        h: Math.random() * 10 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        gravity: 0.5
      });
    }

    let animationId: number;
    const animate = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        
        if (p.y > canvas.height) {
          particles.splice(i, 1);
        }
      }
      
      if (particles.length > 0) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} className="fixed inset-0 pointer-events-none z-50" />;
};

// --- Helper Components ---
export const NumberDots = ({ number, large = false }: { number: number, large?: boolean }) => {
  if (number === 0) return <div className="text-gray-300 font-bold text-3xl">Zero</div>;
  if (number > 20) return null;

  const groups = [];
  let remaining = number;
  while (remaining > 0) {
    groups.push(Math.min(5, remaining));
    remaining -= 5;
  }

  return (
    <div className={`flex flex-wrap justify-center gap-2 md:gap-6 ${large ? 'mt-0' : 'mt-2'}`}>
      {groups.map((count, i) => (
        <div key={i} className="grid grid-cols-5 gap-1 md:gap-2" style={{width: 'fit-content'}}>
          {Array.from({ length: count }).map((_, j) => (
            <div key={j} className={`${large ? 'w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6' : 'w-2 h-2 sm:w-3 sm:h-3'} bg-purple-400 rounded-full`} />
          ))}
        </div>
      ))}
    </div>
  );
};

export const HintDisplay = ({ item, large = false }: { item: string, large?: boolean }) => {
  const isNumber = !isNaN(Number(item));
  
  if (isNumber) {
    return <NumberDots number={Number(item)} large={large} />;
  }

  const lower = item.toLowerCase();
  const hint = LETTER_OBJECTS[lower];
  
  if (!hint) return null;

  return (
    <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500 h-full p-2 md:p-4">
      <span className={`${large ? 'text-7xl sm:text-8xl md:text-[12rem]' : 'text-4xl'} filter drop-shadow-sm leading-none transition-all hover:scale-110`}>{hint.emoji}</span>
      <span className={`${large ? 'text-xl md:text-4xl mt-2 md:mt-8' : 'text-sm'} font-black text-purple-600 uppercase tracking-widest bg-white/50 px-4 py-1 md:px-6 md:py-2 rounded-full text-center`}>{hint.name}</span>
    </div>
  );
};

export const MenuButton = ({ title, subtitle, icon, color, onClick }: { title: string, subtitle: string, icon: React.ReactNode, color: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full p-3 md:p-6 rounded-3xl shadow-lg border-b-4 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-3 md:gap-4 text-left ${color}`}
  >
    <div className="bg-white p-2 md:p-3 rounded-2xl shadow-sm shrink-0">
      {icon}
    </div>
    <div>
      <h3 className="text-lg md:text-2xl font-bold leading-tight">{title}</h3>
      <p className="opacity-80 font-medium text-xs md:text-base">{subtitle}</p>
    </div>
  </button>
);

// --- Responsive Navigation Architecture ---

export const Layout = ({ 
  children, 
  sidebar, 
  mobileDock 
}: { 
  children: React.ReactNode;
  sidebar: React.ReactNode;
  mobileDock: React.ReactNode;
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-gray-800 selection:bg-purple-300">
      {/* Desktop Sidebar (>= 768px) */}
      <aside className="hidden md:flex w-72 flex-col fixed inset-y-0 left-0 z-50 border-r border-gray-200 bg-white shadow-sm">
        {sidebar}
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 pb-[100px] md:pb-0 min-h-screen relative w-full overflow-x-hidden">
        {children}
      </main>

      {/* Mobile Bottom Dock (< 768px) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-200 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        {mobileDock}
      </nav>
    </div>
  );
};

export const NavItem = ({ 
  icon: Icon, 
  label, 
  isActive, 
  onClick,
  badge
}: { 
  icon: React.ElementType; 
  label: string; 
  isActive?: boolean; 
  onClick: () => void;
  badge?: number | string;
}) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full text-left group relative mb-1
      ${isActive 
        ? 'bg-purple-100 text-purple-700 font-bold' 
        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'
      }
    `}
  >
    <Icon size={24} className={isActive ? 'fill-current' : 'group-hover:scale-110 transition-transform'} />
    <span>{label}</span>
    {badge ? (
      <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-purple-200 text-purple-800' : 'bg-gray-100 text-gray-600'}`}>
        {badge}
      </span>
    ) : null}
  </button>
);

export const MobileNavItem = ({ 
  icon: Icon, 
  label, 
  isActive, 
  onClick 
}: { 
  icon: React.ElementType; 
  label: string; 
  isActive?: boolean; 
  onClick: () => void; 
}) => (
  <button
    onClick={onClick}
    className={`
      flex flex-col items-center justify-center flex-1 py-3 transition-all active:scale-95
      ${isActive 
        ? 'text-purple-600' 
        : 'text-gray-400 hover:text-gray-500'
      }
    `}
  >
    <div className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-purple-100' : 'bg-transparent'}`}>
      <Icon size={24} className={isActive ? 'fill-current scale-105' : ''} strokeWidth={isActive ? 2.5 : 2} />
    </div>
    <span className="text-[10px] font-bold mt-1">{label}</span>
  </button>
);
