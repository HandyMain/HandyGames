
import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { Settings, Home, CheckCircle2, ArrowLeft, Star, Grid, Trophy, Flame, User, Rocket, Hammer, Palette, Search, Book } from 'lucide-react';
import { DATA_SETS, DatasetKey } from './data';
import { GAMES, CATEGORIES } from './games/gamesList';
import { Layout, NavItem, MobileNavItem } from './components';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ACHIEVEMENTS } from './data/achievements';

// --- Main App ---
const App = () => {
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [view, setView] = useState<'home' | 'settings' | 'passport'>('home');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [settings, setSettings] = useState<Record<DatasetKey, boolean>>({
    uppercase: true,
    lowercase: false,
    numbers: true,
  });
  
  // Game Stats (Play Counts)
  const [playCounts, setPlayCounts] = useState<Record<string, number>>({});
  
  // Achievements
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);

  // Load stats and achievements on mount
  useEffect(() => {
    const savedStats = localStorage.getItem('handyapp_stats');
    if (savedStats) {
        try {
            setPlayCounts(JSON.parse(savedStats));
        } catch (e) {
            console.error("Failed to parse stats", e);
        }
    }

    const savedAchievements = localStorage.getItem('handyapp_achievements');
    if (savedAchievements) {
        try {
            setUnlockedAchievements(JSON.parse(savedAchievements));
        } catch (e) {
            console.error("Failed to parse achievements", e);
        }
    }

    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const unlockAchievement = useCallback((id: string) => {
      setUnlockedAchievements(prev => {
          if (prev.includes(id)) return prev;
          const newSet = [...prev, id];
          localStorage.setItem('handyapp_achievements', JSON.stringify(newSet));
          // Optional: Could trigger a global toast here
          return newSet;
      });
  }, []);

  // Track Play
  const handleGameSelect = (gameId: string) => {
      const newCounts = { ...playCounts, [gameId]: (playCounts[gameId] || 0) + 1 };
      setPlayCounts(newCounts);
      localStorage.setItem('handyapp_stats', JSON.stringify(newCounts));
      
      // Unlock First Play
      unlockAchievement('first_play');
      
      setActiveGameId(gameId);
  };

  // Computed pool of items based on settings
  const getPool = useCallback(() => {
    let pool: string[] = [];
    if (settings.uppercase) pool = [...pool, ...DATA_SETS.uppercase];
    if (settings.lowercase) pool = [...pool, ...DATA_SETS.lowercase];
    if (settings.numbers) pool = [...pool, ...DATA_SETS.numbers];
    if (pool.length === 0) return ['?']; // Fallback
    return pool;
  }, [settings]);

  const toggleSetting = (key: DatasetKey) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const activeGameMeta = GAMES.find(g => g.id === activeGameId);
  const ActiveComponent = activeGameMeta?.component;

  const getDifficultyColor = (d: string) => {
      if (d === 'easy') return 'bg-green-100 text-green-700 border-green-200';
      if (d === 'medium') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      return 'bg-red-100 text-red-700 border-red-200';
  }

  // --- Helper to render achievement icon
  const renderAchievementIcon = (iconKey: string) => {
      switch(iconKey) {
          case 'hammer': return <Hammer size={24} />;
          case 'palette': return <Palette size={24} />;
          case 'search': return <Search size={24} />;
          default: return <span className="text-2xl">{iconKey}</span>;
      }
  };

  // --- Logic ---
  const hasHistory = Object.keys(playCounts).length > 0;
  const totalPlays = Object.values(playCounts).reduce((a: number, b: number) => a + b, 0);
  
  const sortedByPlays = [...GAMES].sort((a, b) => {
      const countA = playCounts[a.id] || 0;
      const countB = playCounts[b.id] || 0;
      return countB - countA;
  });

  const featuredGames = hasHistory 
    ? sortedByPlays.slice(0, 3) 
    : GAMES.filter(g => g.featured).slice(0, 3);

  const standardGames = GAMES;

  // --- FOCUS MODE (Active Game) ---
  if (activeGameId && ActiveComponent) {
      return (
        <div className="fixed inset-0 z-50 bg-slate-50 font-sans text-gray-800 selection:bg-purple-300 overflow-hidden flex flex-col">
            {/* Minimal Header */}
            <div className="absolute top-4 left-4 z-50">
                <button 
                    onClick={() => setActiveGameId(null)}
                    className="w-10 h-10 md:w-12 md:h-12 bg-white/90 backdrop-blur-md rounded-full shadow-md border border-gray-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all hover:scale-110 active:scale-95"
                    title="Back to Base"
                >
                    <ArrowLeft size={24} strokeWidth={2.5} />
                </button>
            </div>

            {/* Game Content - Full Screen */}
            <main className="w-full h-full relative">
                <ErrorBoundary>
                    <ActiveComponent 
                        pool={getPool()} 
                        difficulty={difficulty} 
                        onUnlock={unlockAchievement} 
                    />
                </ErrorBoundary>
            </main>
        </div>
      );
  }

  // --- DASHBOARD LAYOUT ---
  return (
    <Layout
      sidebar={
        <div className="p-6 h-full flex flex-col">
            <div className="flex items-center gap-3 px-2 mb-10">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                    <Rocket size={24} fill="currentColor" />
                </div>
                <h1 className="text-2xl font-black text-indigo-900 tracking-tight">HandyApp</h1>
            </div>
            
            <div className="space-y-2 flex-1">
                <NavItem icon={Home} label="Adventure" isActive={view === 'home'} onClick={() => setView('home')} />
                <NavItem icon={Book} label="Passport" isActive={view === 'passport'} onClick={() => setView('passport')} badge={unlockedAchievements.length > 0 ? unlockedAchievements.length : undefined} />
                <NavItem icon={Settings} label="Learning Settings" isActive={view === 'settings'} onClick={() => setView('settings')} />
            </div>

            {/* Difficulty Widget */}
            <div className="mt-4 mb-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">Difficulty</h3>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    {(['easy', 'medium', 'hard'] as const).map((level) => (
                        <button
                            key={level}
                            onClick={() => setDifficulty(level)}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                                difficulty === level 
                                ? 'bg-white shadow-sm text-indigo-600'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            {level}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Widget */}
            <div className="mt-auto bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-3xl border border-indigo-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/50 rounded-full -mr-8 -mt-8 blur-xl"></div>
                <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Trophy size={12} /> Total Plays</h3>
                <p className="text-3xl font-black text-indigo-900">{totalPlays}</p>
                <div className="text-xs text-indigo-400 font-medium mt-1">Keep it up!</div>
            </div>
        </div>
      }
      mobileDock={
        <div className="flex justify-around items-center px-2">
            <MobileNavItem icon={Home} label="Home" isActive={view === 'home'} onClick={() => setView('home')} />
            <div className="w-px h-8 bg-gray-100 mx-2"></div>
            <MobileNavItem icon={Book} label="Passport" isActive={view === 'passport'} onClick={() => setView('passport')} />
            <div className="w-px h-8 bg-gray-100 mx-2"></div>
            <MobileNavItem icon={Settings} label="Settings" isActive={view === 'settings'} onClick={() => setView('settings')} />
        </div>
      }
    >
        {/* VIEW: HOME DASHBOARD */}
        {view === 'home' && (
            <div className="container mx-auto px-4 md:px-8 py-8 md:py-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="max-w-6xl mx-auto space-y-10">
                    
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl md:text-5xl font-black text-slate-800 mb-2 tracking-tight">
                            Hey, Explorer! 👋
                        </h1>
                        <p className="text-slate-500 font-medium text-lg flex items-center gap-2">
                            {hasHistory ? <><Flame className="text-orange-500 fill-orange-500" size={20} /> Here are your favorite adventures</> : "Ready for a new adventure?"}
                        </p>
                    </div>

                    {/* Featured Grid (Hero Section) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {featuredGames.map(game => (
                            <button
                                key={game.id}
                                onClick={() => handleGameSelect(game.id)}
                                className={`
                                    relative overflow-hidden group p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border-b-8 transition-all active:scale-[0.98] active:border-b-0 active:translate-y-2 text-left flex flex-col justify-between h-56 md:h-64
                                    ${game.color} border-black/10 hover:border-black/20
                                `}
                            >
                                <div className="flex justify-between items-start z-10">
                                    <div className={`p-4 rounded-2xl bg-white/30 backdrop-blur-md ${game.textColor} shadow-sm`}>
                                        {game.icon}
                                    </div>
                                    {/* Show Play Count if available */}
                                    {playCounts[game.id] ? (
                                        <div className={`flex items-center gap-1 text-xs font-bold ${game.textColor} bg-white/30 backdrop-blur-md px-3 py-1.5 rounded-full`}>
                                            <Trophy size={12} /> {playCounts[game.id]}
                                        </div>
                                    ) : (
                                        <div className="bg-white/30 backdrop-blur-md p-2 rounded-full">
                                            <Star className="text-yellow-400 fill-yellow-400 w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                                <div className="z-10">
                                    <h3 className={`font-black text-2xl md:text-3xl ${game.textColor} mb-2 leading-tight`}>{game.title}</h3>
                                    <p className={`${game.textColor} opacity-90 font-medium leading-snug text-sm md:text-base`}>{game.description}</p>
                                </div>
                                {/* Background Decoration */}
                                <div className="absolute -right-8 -bottom-8 opacity-10 scale-[2] rotate-12 text-white pointer-events-none transition-transform group-hover:scale-[2.2] group-hover:rotate-6">
                                    {game.icon}
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Standard Games Categorized */}
                    <div className="space-y-16">
                        {CATEGORIES.map((cat) => {
                            const catGames = standardGames.filter(g => g.category === cat.id);
                            if (catGames.length === 0) return null;

                            return (
                                <div key={cat.id} className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                                    <div className="flex items-center gap-4 mb-6 md:mb-8">
                                        <span className="text-3xl md:text-4xl bg-slate-50 p-3 rounded-2xl">{cat.icon}</span>
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-800">{cat.label}</h2>
                                            <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">{catGames.length} Games</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                                        {catGames.map(game => (
                                            <button
                                                key={game.id}
                                                onClick={() => handleGameSelect(game.id)}
                                                className={`
                                                    p-4 rounded-3xl shadow-sm border-2 transition-all active:scale-95 active:border-b-2 active:translate-y-0.5 text-left flex items-center gap-4
                                                    bg-white hover:shadow-md border-slate-100 hover:border-indigo-100 group h-full
                                                `}
                                            >
                                                <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center ${game.color} ${game.textColor} group-hover:scale-110 transition-transform`}>
                                                    {game.icon}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-base md:text-lg text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">{game.title}</h3>
                                                    <p className="text-xs text-slate-400 font-medium leading-tight mt-1 line-clamp-2">{game.description}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        )}

        {/* VIEW: PASSPORT */}
        {view === 'passport' && (
            <div className="container mx-auto px-4 md:px-8 py-8 md:py-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-8">Adventure Passport</h1>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {ACHIEVEMENTS.map(ach => {
                            const isUnlocked = unlockedAchievements.includes(ach.id);
                            return (
                                <div key={ach.id} className={`
                                    p-6 rounded-[2rem] border-4 flex flex-col items-center text-center transition-all
                                    ${isUnlocked ? 'bg-white border-yellow-400 shadow-xl scale-100' : 'bg-slate-50 border-slate-200 grayscale opacity-70 scale-95'}
                                `}>
                                    <div className={`
                                        w-20 h-20 rounded-full flex items-center justify-center text-3xl mb-4
                                        ${isUnlocked ? 'bg-yellow-100 text-yellow-600 animate-bounce' : 'bg-slate-200 text-slate-400'}
                                    `}>
                                        {renderAchievementIcon(ach.icon)}
                                    </div>
                                    <h3 className={`text-xl font-black mb-1 ${isUnlocked ? 'text-slate-800' : 'text-slate-400'}`}>{ach.title}</h3>
                                    <p className={`text-sm font-medium ${isUnlocked ? 'text-slate-500' : 'text-slate-400'}`}>{ach.desc}</p>
                                    
                                    {isUnlocked ? (
                                        <div className="mt-4 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-widest">
                                            Unlocked
                                        </div>
                                    ) : (
                                        <div className="mt-4 px-3 py-1 bg-slate-200 text-slate-500 rounded-full text-xs font-bold uppercase tracking-widest">
                                            Locked
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        )}

        {/* VIEW: SETTINGS */}
        {view === 'settings' && (
            <div className="container mx-auto px-4 md:px-8 py-8 md:py-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-8">Learning Settings</h1>
                    
                    <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                        <div className="p-8 space-y-6">
                            {(Object.keys(DATA_SETS) as DatasetKey[]).map(key => (
                                <button
                                    key={key}
                                    onClick={() => toggleSetting(key)}
                                    className={`w-full p-6 rounded-3xl flex justify-between items-center text-lg md:text-xl font-bold transition-all border-2 ${
                                        settings[key] 
                                        ? 'bg-purple-50 border-purple-500 text-purple-900 shadow-md' 
                                        : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${settings[key] ? 'bg-purple-200' : 'bg-slate-200'}`}>
                                            {key === 'uppercase' && <span className="text-xl">Aa</span>}
                                            {key === 'lowercase' && <span className="text-xl">aa</span>}
                                            {key === 'numbers' && <span className="text-xl">123</span>}
                                        </div>
                                        <span className="capitalize">{key}</span>
                                    </div>
                                    {settings[key] ? <CheckCircle2 size={32} className="text-purple-600" fill="currentColor" color="white" /> : <div className="w-8 h-8 rounded-full border-4 border-slate-300" />}
                                </button>
                            ))}
                        </div>
                        <div className="bg-slate-50 p-6 text-center text-slate-400 font-medium text-sm">
                            These settings affect language games like Show & Tell and Find It.
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <button 
                            onClick={() => setView('home')}
                            className="bg-indigo-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:bg-indigo-700 transition-colors"
                        >
                            Save & Return Home
                        </button>
                    </div>
                </div>
            </div>
        )}
    </Layout>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
