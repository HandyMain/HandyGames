
export type ItemId = 'corn' | 'wheat' | 'carrot' | 'tomato' | 'strawberry' | 'pumpkin' | 'potato' | 'lettuce' | 'watermelon' | 'sunflower' | 'egg' | 'milk' | 'wool' | 'truffle' | 'goatmilk' | 'duckegg';
export type AnimalId = 'chicken' | 'cow' | 'sheep' | 'pig' | 'goat' | 'duck';

export interface ItemDef {
    id: ItemId;
    name: string;
    emoji: string;
    type: 'crop' | 'product';
    cost: number;
    sell: number;
    growthTime: number;
    color: string;
}

export const ITEMS: Record<ItemId, ItemDef> = {
    corn: { id: 'corn', name: 'Corn', emoji: '🌽', type: 'crop', cost: 2, sell: 5, growthTime: 3, color: '#FCD34D' },
    wheat: { id: 'wheat', name: 'Wheat', emoji: '🌾', type: 'crop', cost: 4, sell: 8, growthTime: 4, color: '#F59E0B' },
    carrot: { id: 'carrot', name: 'Carrot', emoji: '🥕', type: 'crop', cost: 6, sell: 12, growthTime: 5, color: '#F97316' },
    potato: { id: 'potato', name: 'Potato', emoji: '🥔', type: 'crop', cost: 5, sell: 10, growthTime: 5, color: '#D6D3D1' },
    lettuce: { id: 'lettuce', name: 'Lettuce', emoji: '🥬', type: 'crop', cost: 8, sell: 15, growthTime: 6, color: '#4ADE80' },
    tomato: { id: 'tomato', name: 'Tomato', emoji: '🍅', type: 'crop', cost: 10, sell: 20, growthTime: 6, color: '#EF4444' },
    sunflower: { id: 'sunflower', name: 'Sunflower', emoji: '🌻', type: 'crop', cost: 12, sell: 30, growthTime: 7, color: '#FBBF24' },
    strawberry: { id: 'strawberry', name: 'Berry', emoji: '🍓', type: 'crop', cost: 20, sell: 45, growthTime: 8, color: '#F43F5E' },
    watermelon: { id: 'watermelon', name: 'Melon', emoji: '🍉', type: 'crop', cost: 30, sell: 80, growthTime: 10, color: '#10B981' },
    pumpkin: { id: 'pumpkin', name: 'Pumpkin', emoji: '🎃', type: 'crop', cost: 40, sell: 100, growthTime: 12, color: '#EA580C' },
    
    egg: { id: 'egg', name: 'Egg', emoji: '🥚', type: 'product', cost: 0, sell: 25, growthTime: 0, color: '#fff' },
    duckegg: { id: 'duckegg', name: 'D.Egg', emoji: '🪺', type: 'product', cost: 0, sell: 35, growthTime: 0, color: '#fff' },
    milk: { id: 'milk', name: 'Milk', emoji: '🥛', type: 'product', cost: 0, sell: 60, growthTime: 0, color: '#fff' },
    goatmilk: { id: 'goatmilk', name: 'G.Milk', emoji: '🍶', type: 'product', cost: 0, sell: 75, growthTime: 0, color: '#fff' },
    wool: { id: 'wool', name: 'Wool', emoji: '🧶', type: 'product', cost: 0, sell: 120, growthTime: 0, color: '#fff' },
    truffle: { id: 'truffle', name: 'Truffle', emoji: '🍄', type: 'product', cost: 0, sell: 200, growthTime: 0, color: '#fff' },
};

export interface AnimalDef {
    id: AnimalId;
    name: string;
    emoji: string;
    cost: number;
    produces: ItemId;
    eats: ItemId;
    productionTime: number; 
}

export const ANIMALS: Record<AnimalId, AnimalDef> = {
    chicken: { id: 'chicken', name: 'Chicken', emoji: '🐔', cost: 50, produces: 'egg', eats: 'corn', productionTime: 10 },
    duck: { id: 'duck', name: 'Duck', emoji: '🦆', cost: 80, produces: 'duckegg', eats: 'wheat', productionTime: 12 },
    pig: { id: 'pig', name: 'Pig', emoji: '🐷', cost: 150, produces: 'truffle', eats: 'potato', productionTime: 25 },
    cow: { id: 'cow', name: 'Cow', emoji: '🐮', cost: 200, produces: 'milk', eats: 'wheat', productionTime: 20 },
    goat: { id: 'goat', name: 'Goat', emoji: '🐐', cost: 250, produces: 'goatmilk', eats: 'lettuce', productionTime: 22 },
    sheep: { id: 'sheep', name: 'Sheep', emoji: '🐑', cost: 350, produces: 'wool', eats: 'carrot', productionTime: 30 },
};

export type PlotState = 'grass' | 'soil' | 'exhausted';

export interface Plot {
    id: number;
    state: PlotState;
    isWet: boolean;
    crop: ItemId | null;
    stage: number; // 0=Seed, 1=Sprout, 2=Plant, 3=Ripe
    progress: number;
}

export interface BarnSlot {
    id: number;
    animal: AnimalId | null;
    isHungry: boolean;
    productReady: boolean;
    progress: number;
}

export interface Upgrades {
    sprinkler: boolean;
    autofeeder: boolean;
    scarecrow: boolean;
    barnCapacity: number; // 8 or 16
    plotCount: number; // 16 or 32
}
