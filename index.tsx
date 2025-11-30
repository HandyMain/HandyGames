
import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { Settings, Home, CheckCircle2, ArrowLeft, Star, Grid, Trophy, Flame } from 'lucide-react';
import { DATA_SETS, DatasetKey } from './data';
import { GAMES, CATEGORIES } from './games/gamesList';

// --- Main App ---
const App = () => {
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [settings, setSettings] = useState<Record<DatasetKey, boolean>>({
    uppercase: true,
    lowercase: false,
    numbers: true,
  });
  const [showSettings, setShowSettings] = useState(false);
  
  // Game Stats (Play Counts)
  const [playCounts, setPlayCounts] = useState<Record<string, number>>({});

  // Load stats on mount
  useEffect(() => {
    const saved = localStorage.getItem('handyapp_stats');
    if (saved) {
        try {
            setPlayCounts(JSON.parse(saved));
        } catch (e) {
            console.error("Failed to parse stats", e);
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

  // Track Play
  const handleGameSelect = (gameId: string) => {
      const newCounts = { ...playCounts, [gameId]: (playCounts[gameId] || 0) + 1 };
      setPlayCounts(newCounts);
      localStorage.setItem('handyapp_stats', JSON.stringify(newCounts));
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

  // --- Dynamic Sorting Logic ---
  // 1. Get games sorted by play count descending
  // 2. If user has played games, show top 3 most played
  // 3. If user is new (no plays), show the default 'featured' games
  const hasHistory = Object.keys(playCounts).length > 0;
  
  const sortedByPlays = [...GAMES].sort((a, b) => {
      const countA = playCounts[a.id] || 0;
      const countB = playCounts[b.id] || 0;
      return countB - countA;
  });

  const featuredGames = hasHistory 
    ? sortedByPlays.slice(0, 3) 
    : GAMES.filter(g => g.featured).slice(0, 3);

  // Standard games are everything else not currently in the hero section
  const featuredIds = new Set(featuredGames.map(g => g.id));
  const standardGames = GAMES; // We can show duplicates or filter. Let's show all in categories for easy access.

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-800 selection:bg-purple-300 pb-28">
      
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-center mb-6 text-purple-800">Learning Options</h2>
            <div className="space-y-4">
              {(Object.keys(DATA_SETS) as DatasetKey[]).map(key => (
                <button
                  key={key}
                  onClick={() => toggleSetting(key)}
                  className={`w-full p-4 rounded-xl flex justify-between items-center text-lg font-bold transition-all border-2 ${
                    settings[key] 
                      ? 'bg-purple-100 border-purple-500 text-purple-900' 
                      : 'bg-gray-50 border-gray-200 text-gray-400'
                  }`}
                >
                  <span className="capitalize">{key}</span>
                  {settings[key] ? <CheckCircle2 size={24} /> : <div className="w-6 h-6 rounded-full border-2 border-gray-300" />}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowSettings(false)}
              className="mt-6 w-full bg-purple-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-purple-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className={`container mx-auto px-4 ${activeGameId ? 'pt-6 h-full flex items-center justify-center' : ''}`}>
        
        {/* HOME DASHBOARD */}
        {!activeGameId && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pt-8">
            
            {/* Header */}
            <div className="px-2">
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-600 mb-2">
                    HandyApp Games
                </h1>
                <p className="text-gray-500 font-medium text-lg flex items-center gap-2">
                    {hasHistory ? <><Flame className="text-orange-500" size={20} /> Your Favorites</> : "Featured Adventures"}
                </p>
            </div>

            {/* Featured Grid (Hero Section) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredGames.map(game => (
                    <button
                        key={game.id}
                        onClick={() => handleGameSelect(game.id)}
                        className={`
                            relative overflow-hidden group p-6 rounded-[2rem] shadow-lg border-b-8 transition-all active:scale-95 active:border-b-0 active:translate-y-2 text-left flex flex-col justify-between h-48
                            ${game.color} border-black/20
                        `}
                    >
                        <div className="flex justify-between items-start">
                            <div className={`p-3 rounded-2xl bg-white/20 backdrop-blur-sm ${game.textColor}`}>
                                {game.icon}
                            </div>
                            {/* Show Play Count if available */}
                            {playCounts[game.id] ? (
                                <div className={`flex items-center gap-1 text-sm font-bold ${game.textColor} opacity-80 bg-white/20 px-2 py-1 rounded-full`}>
                                    <Trophy size={12} /> {playCounts[game.id]}
                                </div>
                            ) : (
                                <Star className="text-yellow-400 fill-yellow-400 animate-pulse" />
                            )}
                        </div>
                        <div>
                            <h3 className={`font-black text-2xl ${game.textColor} mb-1`}>{game.title}</h3>
                            <p className={`${game.textColor} opacity-80 font-medium leading-tight`}>{game.description}</p>
                        </div>
                        {/* Background Decoration */}
                        <div className="absolute -right-4 -bottom-4 opacity-10 scale-150 rotate-12 text-white">
                            {game.icon}
                        </div>
                    </button>
                ))}
            </div>

            <div className="w-full h-px bg-gray-200 my-8"></div>

            {/* Standard Games Categorized */}
            <div className="space-y-12">
                {CATEGORIES.map((cat) => {
                    const catGames = standardGames.filter(g => g.category === cat.id);
                    if (catGames.length === 0) return null;

                    return (
                        <div key={cat.id}>
                            <div className="flex items-center gap-3 mb-4 px-2">
                                <span className="text-2xl bg-white p-2 rounded-lg shadow-sm">{cat.icon}</span>
                                <h2 className="text-xl font-bold text-gray-700">{cat.label}</h2>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {catGames.map(game => (
                                    <button
                                        key={game.id}
                                        onClick={() => handleGameSelect(game.id)}
                                        className={`
                                            p-4 rounded-3xl shadow-sm border-b-4 transition-all active:scale-95 active:border-b-0 active:translate-y-1 text-left flex flex-col gap-3
                                            bg-white hover:shadow-md border-gray-100 hover:border-indigo-100 group
                                        `}
                                    >
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${game.color} ${game.textColor} group-hover:scale-110 transition-transform`}>
                                            {game.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-base text-gray-800 leading-tight group-hover:text-indigo-600 transition-colors">{game.title}</h3>
                                            <p className="text-xs text-gray-400 font-medium leading-tight mt-1 line-clamp-2">{game.description}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>

          </div>
        )}

        {/* ACTIVE GAME */}
        {activeGameId && ActiveComponent && (
            <div className="w-full flex flex-col items-center animate-in zoom-in duration-300">
                {/* Game Header */}
                <div className="w-full max-w-2xl flex flex-col gap-4 mb-6 px-2">
                    <div className="flex items-center justify-between">
                        <button 
                            onClick={() => setActiveGameId(null)}
                            className="p-2 -ml-2 rounded-full hover:bg-white text-gray-500 flex items-center gap-2 font-bold transition-colors"
                        >
                            <ArrowLeft size={24} /> Back
                        </button>
                        <div className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${activeGameMeta?.color} ${activeGameMeta?.textColor}`}>
                            {activeGameMeta?.title}
                        </div>
                    </div>

                    {/* Difficulty Selector */}
                    <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 self-center w-full max-w-sm">
                        {(['easy', 'medium', 'hard'] as const).map((level) => (
                            <button
                                key={level}
                                onClick={() => setDifficulty(level)}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                                    difficulty === level 
                                    ? getDifficultyColor(level) + ' shadow-sm'
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>
                
                <ActiveComponent pool={getPool()} difficulty={difficulty} />
            </div>
        )}
      </main>

      {/* Floating Bottom Navigation Bar - Only show on Dashboard */}
      {!activeGameId && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-full p-2 flex items-center gap-2 ring-1 ring-black/5">
                <button 
                    onClick={() => setActiveGameId(null)}
                    className={`p-4 rounded-full transition-all ${!activeGameId ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-indigo-50 text-indigo-600'}`}
                >
                    <Home size={24} strokeWidth={2.5} />
                </button>
                
                <div className="w-px h-8 bg-gray-200 mx-1"></div>
                
                <button 
                    onClick={() => setShowSettings(true)}
                    className="p-4 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                >
                    <Settings size={24} strokeWidth={2.5} />
                </button>
            </div>
        </div>
      )}

    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
