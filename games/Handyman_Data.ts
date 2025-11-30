
import React from 'react';
import { 
  Hammer, Wrench, Ruler, Zap, Scan, Settings, 
  PaintRoller, Disc, Lightbulb, Droplets, CarFront, Shovel, Flower2 
} from 'lucide-react';

export type ToolId = 'scanner' | 'drill' | 'level' | 'hammer' | 'wrench' | 'tape' | 'screwdriver' | 'spackle' | 'paint' | 'oil' | 'shovel' | 'flower';
export type CategoryId = 'home' | 'plumbing' | 'electric' | 'auto' | 'garden';

export interface ToolDef {
    id: ToolId;
    name: string;
    icon: React.ElementType;
    iconProps?: React.SVGProps<SVGSVGElement>;
    color: string;
    desc: string;
}

export interface JobStep {
    tool: ToolId;
    instruction: string;
    targetProgress: number; // 0-100
}

export interface JobDef {
    id: string;
    categoryId: CategoryId;
    title: string;
    description: string;
    steps: JobStep[];
    background: string; // CSS class
}

export const TOOLS: Record<ToolId, ToolDef> = {
    scanner: { id: 'scanner', name: 'Scanner', icon: Scan, color: 'bg-blue-500', desc: 'Find the problem' },
    level: { id: 'level', name: 'Level', icon: Ruler, color: 'bg-green-500', desc: 'Straighten things' },
    drill: { id: 'drill', name: 'Drill', icon: Zap, color: 'bg-yellow-500', desc: 'Tighten screws' },
    wrench: { id: 'wrench', name: 'Wrench', icon: Wrench, color: 'bg-gray-500', desc: 'Tighten bolts' },
    tape: { id: 'tape', name: 'Seal Tape', icon: Disc, color: 'bg-red-500', desc: 'Stop leaks' },
    screwdriver: { id: 'screwdriver', name: 'Driver', icon: Settings, color: 'bg-orange-500', desc: 'Twist screws' },
    spackle: { id: 'spackle', name: 'Putty', icon: Hammer, iconProps: { className: "rotate-45" }, color: 'bg-pink-500', desc: 'Fill holes' },
    paint: { id: 'paint', name: 'Roller', icon: PaintRoller, color: 'bg-indigo-500', desc: 'Paint walls' },
    hammer: { id: 'hammer', name: 'Hammer', icon: Hammer, color: 'bg-red-600', desc: 'Hit nails' }, 
    oil: { id: 'oil', name: 'Oil Can', icon: Droplets, color: 'bg-amber-500', desc: 'Lubricate' },
    shovel: { id: 'shovel', name: 'Shovel', icon: Shovel, color: 'bg-emerald-600', desc: 'Dig dirt' },
    flower: { id: 'flower', name: 'Plant', icon: Flower2, color: 'bg-pink-400', desc: 'Plant flowers' },
};

export const JOBS: JobDef[] = [
    {
        id: 'shelf',
        categoryId: 'home',
        title: 'Wobbly Shelf',
        description: 'The shelf is crooked and loose.',
        background: "bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] bg-amber-100",
        steps: [
            { tool: 'scanner', instruction: 'Scan the shelf to see the damage.', targetProgress: 100 },
            { tool: 'level', instruction: 'Slide the slider to make it straight.', targetProgress: 100 },
            { tool: 'drill', instruction: 'Hold the drill to tighten the screws.', targetProgress: 100 },
        ]
    },
    {
        id: 'leak',
        categoryId: 'plumbing',
        title: 'Leaky Pipe',
        description: 'Water is spraying everywhere!',
        background: "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-200 to-slate-400",
        steps: [
            { tool: 'scanner', instruction: 'Scan to find the source of the leak.', targetProgress: 100 },
            { tool: 'wrench', instruction: 'Turn the wrench to tighten the nut.', targetProgress: 100 },
            { tool: 'tape', instruction: 'Apply tape to seal the crack.', targetProgress: 100 },
        ]
    },
    {
        id: 'light',
        categoryId: 'electric',
        title: 'Broken Light',
        description: 'The room is too dark.',
        background: "bg-slate-900",
        steps: [
            { tool: 'scanner', instruction: 'Scan the broken bulb.', targetProgress: 100 },
            { tool: 'screwdriver', instruction: 'Unscrew the old bulb (Turn Left).', targetProgress: 100 },
            { tool: 'screwdriver', instruction: 'Screw in the new bulb (Turn Right).', targetProgress: 100 },
        ]
    },
    {
        id: 'hole',
        categoryId: 'home',
        title: 'Hole in Wall',
        description: 'Accidents happen!',
        background: "bg-stone-200",
        steps: [
            { tool: 'scanner', instruction: 'Measure the hole size.', targetProgress: 100 },
            { tool: 'spackle', instruction: 'Spread the putty to fill the hole.', targetProgress: 100 },
            { tool: 'paint', instruction: 'Paint over it to match the wall.', targetProgress: 100 },
        ]
    },
    {
        id: 'engine',
        categoryId: 'auto',
        title: 'Engine Tune-Up',
        description: 'The belt is loose and oil is low.',
        background: "bg-neutral-800",
        steps: [
            { tool: 'scanner', instruction: 'Check engine status.', targetProgress: 100 },
            { tool: 'wrench', instruction: 'Tighten the tensioner bolt.', targetProgress: 100 },
            { tool: 'oil', instruction: 'Pour oil into the engine.', targetProgress: 100 },
        ]
    },
    {
        id: 'planter',
        categoryId: 'garden',
        title: 'Garden Planter',
        description: 'Build a box for flowers.',
        background: "bg-sky-100",
        steps: [
            { tool: 'hammer', instruction: 'Nail the wood boards together.', targetProgress: 100 },
            { tool: 'shovel', instruction: 'Fill the box with garden soil.', targetProgress: 100 },
            { tool: 'flower', instruction: 'Plant the flowers!', targetProgress: 100 },
        ]
    }
];

export const CATEGORIES = [
    { id: 'home', name: 'Home Repair', icon: Hammer, color: 'text-amber-500' },
    { id: 'plumbing', name: 'Plumbing', icon: Droplets, color: 'text-blue-500' },
    { id: 'electric', name: 'Electrical', icon: Lightbulb, color: 'text-yellow-500' },
    { id: 'auto', name: 'Automotive', icon: CarFront, color: 'text-red-500' },
    { id: 'garden', name: 'Garden', icon: Flower2, color: 'text-green-500' },
];
