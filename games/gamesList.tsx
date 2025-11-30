
import React from 'react';
import { 
  Mic, PenTool, Music, Gauge, Scale, Eye, Clock, Zap, Ear, Binary, Map, 
  CheckCircle2, BrainCircuit, Calculator, TrainFront, Camera, Palette, 
  ScanFace, BookOpen, Sparkles, ChefHat, Droplets, FlaskConical, Cpu, Grid3X3, Rocket, Sword, Sprout, Hammer, Scissors
} from 'lucide-react';

// Game Imports
import { SayItMode } from './SayItMode';
import { FindItMode } from './FindItMode';
import { MemoryMode } from './MemoryMode';
import { CountingMode } from './CountingMode';
import { BibleMode } from './BibleMode';
import { PatternMode } from './PatternMode';
import { WonderMode } from './WonderMode';
import { DrawingMode } from './DrawingMode';
import { SocialMode } from './SocialMode';
import { ScavengerMode } from './ScavengerMode';
import { RhymeMode } from './RhymeMode';
import { LogicMode } from './LogicMode';
import { GraphMode } from './GraphMode';
import { ChronoMode } from './ChronoMode';
import { NBackMode } from './NBackMode';
import { AudioMemoryMode } from './AudioMemoryMode';
import { EstimationMode } from './EstimationMode';
import { StroopMode } from './StroopMode';
import { StoryMode } from './StoryMode';
import { BalanceMode } from './BalanceMode';
import { ChefMode } from './ChefMode';
import { PipeMode } from './PipeMode';
import { ColorChemistMode } from './ColorChemistMode';
import { CircuitMode } from './CircuitMode';
import { PaintPixelMode } from './PaintPixelMode';
import { StarCatcherMode } from './StarCatcherMode';
import { NeonBladeMode } from './NeonBladeMode';
import { GardenMode } from './GardenMode';
import { HandymanMode } from './HandymanMode';
import { StyleStudioMode } from './StyleStudioMode';

export type GameCategory = 'Language' | 'Math' | 'Brain' | 'Creative' | 'World';

export interface GameMeta {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: GameCategory;
  component: React.ComponentType<any>;
  color: string; // Tailwind background color classes for the card
  textColor: string;
  featured?: boolean; // New flag for "Wheat" games
}

export const CATEGORIES: { id: GameCategory; label: string; icon: string }[] = [
  { id: 'World', label: 'Adventure & AR', icon: '🌍' },
  { id: 'Creative', label: 'Art & Expression', icon: '🎨' },
  { id: 'Math', label: 'Logic & Numbers', icon: '🔢' },
  { id: 'Language', label: 'Words & Speech', icon: '🗣️' },
  { id: 'Brain', label: 'Brain Training', icon: '🧠' },
];

export const GAMES: GameMeta[] = [
  // --- FEATURED (The Wheat) ---
  {
    id: 'handyman',
    title: 'Master Fixer',
    description: 'Learn to fix broken things!',
    icon: <Hammer className="w-6 h-6" />,
    category: 'World',
    component: HandymanMode,
    color: 'bg-slate-800',
    textColor: 'text-blue-300',
    featured: true
  },
  {
    id: 'style-studio',
    title: 'Style Studio',
    description: 'Design outfits & runway show!',
    icon: <Scissors className="w-6 h-6" />,
    category: 'Creative',
    component: StyleStudioMode,
    color: 'bg-fuchsia-600',
    textColor: 'text-white',
    featured: true
  },
  {
    id: 'neonblade',
    title: 'Neon Blade AR',
    description: 'Slice 3D objects in your room!',
    icon: <Sword className="w-6 h-6" />,
    category: 'World',
    component: NeonBladeMode,
    color: 'bg-cyan-950',
    textColor: 'text-cyan-400',
    featured: true
  },
  {
    id: 'garden',
    title: 'Happy Farmer',
    description: 'Plant, Water, and Grow!',
    icon: <Sprout className="w-6 h-6" />,
    category: 'World',
    component: GardenMode,
    color: 'bg-green-900',
    textColor: 'text-green-300',
    featured: true
  },
  {
    id: 'starcatcher',
    title: 'Star Catcher AR',
    description: 'Catch floating stars!',
    icon: <Rocket className="w-6 h-6" />,
    category: 'World',
    component: StarCatcherMode,
    color: 'bg-indigo-900',
    textColor: 'text-indigo-300',
    featured: true
  },
  {
    id: 'scavenger',
    title: 'Scavenger Hunt',
    description: 'Find real items with AI.',
    icon: <Camera className="w-6 h-6" />,
    category: 'World',
    component: ScavengerMode,
    color: 'bg-orange-600',
    textColor: 'text-white',
    featured: true
  },
  {
    id: 'social',
    title: 'Social Detective',
    description: 'Read emotions & feelings.',
    icon: <ScanFace className="w-6 h-6" />,
    category: 'Creative',
    component: SocialMode,
    color: 'bg-blue-600',
    textColor: 'text-white',
    featured: true
  },
  {
    id: 'paint-pixel',
    title: 'Pixel Art',
    description: 'Paint by number mastery.',
    icon: <Grid3X3 className="w-6 h-6" />,
    category: 'Creative',
    component: PaintPixelMode,
    color: 'bg-pink-600',
    textColor: 'text-white',
    featured: true
  },
  {
    id: 'circuit',
    title: 'Circuit City',
    description: 'Master logic gates.',
    icon: <Cpu className="w-6 h-6" />,
    category: 'Math',
    component: CircuitMode,
    color: 'bg-emerald-600',
    textColor: 'text-white',
    featured: true
  },

  // --- STANDARD GAMES ---

  // Language
  {
    id: 'say-it',
    title: 'Show & Tell',
    description: 'Voice-powered flashcards.',
    icon: <Mic className="w-6 h-6" />,
    category: 'Language',
    component: SayItMode,
    color: 'bg-blue-100',
    textColor: 'text-blue-600'
  },
  {
    id: 'rhyme',
    title: 'Rhyme Battle',
    description: 'Beat the clock!',
    icon: <Music className="w-6 h-6" />,
    category: 'Language',
    component: RhymeMode,
    color: 'bg-fuchsia-100',
    textColor: 'text-fuchsia-600'
  },
  {
    id: 'story',
    title: 'Story Weaver',
    description: 'Co-write stories with AI.',
    icon: <PenTool className="w-6 h-6" />,
    category: 'Language',
    component: StoryMode,
    color: 'bg-indigo-100',
    textColor: 'text-indigo-600'
  },
  {
    id: 'wonder',
    title: 'I Wonder...',
    description: 'Ask any question.',
    icon: <Sparkles className="w-6 h-6" />,
    category: 'Language',
    component: WonderMode,
    color: 'bg-violet-100',
    textColor: 'text-violet-600'
  },

  // Math
  {
    id: 'counting',
    title: 'Counting Zoo',
    description: 'Touch & count animals.',
    icon: <Calculator className="w-6 h-6" />,
    category: 'Math',
    component: CountingMode,
    color: 'bg-pink-100',
    textColor: 'text-pink-600'
  },
  {
    id: 'pipes',
    title: 'Pipe Master',
    description: 'Fix the leaks!',
    icon: <Droplets className="w-6 h-6" />,
    category: 'Math',
    component: PipeMode,
    color: 'bg-blue-100',
    textColor: 'text-blue-600'
  },
  {
    id: 'estimation',
    title: 'Jar Guess',
    description: 'Physics estimation.',
    icon: <Eye className="w-6 h-6" />,
    category: 'Math',
    component: EstimationMode,
    color: 'bg-teal-100',
    textColor: 'text-teal-600'
  },
  {
    id: 'balance',
    title: 'Weight & Balance',
    description: 'Physics scale.',
    icon: <Scale className="w-6 h-6" />,
    category: 'Math',
    component: BalanceMode,
    color: 'bg-slate-100',
    textColor: 'text-slate-600'
  },
  {
    id: 'pattern',
    title: 'Pattern Train',
    description: 'Complete the sequence.',
    icon: <TrainFront className="w-6 h-6" />,
    category: 'Math',
    component: PatternMode,
    color: 'bg-indigo-100',
    textColor: 'text-indigo-600'
  },

  // Brain
  {
    id: 'chef',
    title: 'Instruction Chef',
    description: 'Multitasking challenge.',
    icon: <ChefHat className="w-6 h-6" />,
    category: 'Brain',
    component: ChefMode,
    color: 'bg-orange-100',
    textColor: 'text-orange-600'
  },
  {
    id: 'memory',
    title: 'Memory Match',
    description: 'Find the pairs.',
    icon: <BrainCircuit className="w-6 h-6" />,
    category: 'Brain',
    component: MemoryMode,
    color: 'bg-orange-100',
    textColor: 'text-orange-600'
  },
  {
    id: 'find-it',
    title: 'Find It',
    description: 'Spot the item.',
    icon: <CheckCircle2 className="w-6 h-6" />,
    category: 'Brain',
    component: FindItMode,
    color: 'bg-emerald-100',
    textColor: 'text-emerald-600'
  },
  {
    id: 'logic',
    title: 'The Not Game',
    description: 'Negative logic.',
    icon: <Binary className="w-6 h-6" />,
    category: 'Brain',
    component: LogicMode,
    color: 'bg-cyan-100',
    textColor: 'text-cyan-600'
  },
  {
    id: 'stroop',
    title: 'Reaction Racer',
    description: 'Color vs Word.',
    icon: <Gauge className="w-6 h-6" />,
    category: 'Brain',
    component: StroopMode,
    color: 'bg-red-100',
    textColor: 'text-red-600'
  },
  {
    id: 'nback',
    title: 'Brain Trainer',
    description: 'Memory steps.',
    icon: <Zap className="w-6 h-6" />,
    category: 'Brain',
    component: NBackMode,
    color: 'bg-yellow-100',
    textColor: 'text-yellow-600'
  },
  {
    id: 'chrono',
    title: 'Time Detective',
    description: 'Order events.',
    icon: <Clock className="w-6 h-6" />,
    category: 'Brain',
    component: ChronoMode,
    color: 'bg-amber-100',
    textColor: 'text-amber-600'
  },
  {
    id: 'audiomemory',
    title: 'Audio Memory',
    description: 'Match sounds.',
    icon: <Ear className="w-6 h-6" />,
    category: 'Brain',
    component: AudioMemoryMode,
    color: 'bg-rose-100',
    textColor: 'text-rose-600'
  },
  {
    id: 'graph',
    title: 'Route Planner',
    description: 'Connect numbers.',
    icon: <Map className="w-6 h-6" />,
    category: 'Brain',
    component: GraphMode,
    color: 'bg-lime-100',
    textColor: 'text-lime-600'
  },

  // Creative
  {
    id: 'drawing',
    title: 'Magic Draw',
    description: 'AI guesses art.',
    icon: <Palette className="w-6 h-6" />,
    category: 'Creative',
    component: DrawingMode,
    color: 'bg-purple-100',
    textColor: 'text-purple-600'
  },
  {
    id: 'chemist',
    title: 'Color Chemist',
    description: 'Mix light colors.',
    icon: <FlaskConical className="w-6 h-6" />,
    category: 'Creative',
    component: ColorChemistMode,
    color: 'bg-slate-100',
    textColor: 'text-slate-600'
  },

  // World
  {
    id: 'bible',
    title: 'Bible Heroes',
    description: 'Interactive stories.',
    icon: <BookOpen className="w-6 h-6" />,
    category: 'World',
    component: BibleMode,
    color: 'bg-yellow-100',
    textColor: 'text-yellow-600'
  },
];
