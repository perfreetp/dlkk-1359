import { create } from 'zustand';
import type { BrandTone, ToneType } from '../types';
import { STORAGE_KEYS } from '../types';
import { generateId } from '../utils/formatters';

const defaultTones: BrandTone[] = [
  {
    id: 'tone-1',
    name: '专业商务',
    description: '适合3C数码、家电等品类，突出专业感和信任感',
    style: '正式、严谨、专业、高品质、科技、效率、智能',
    tone: 'professional',
    isDefault: true,
  },
  {
    id: 'tone-2',
    name: '亲切友好',
    description: '适合服饰、美妆、食品等品类，拉近距离感',
    style: '亲切、温暖、贴心、舒适、推荐、超赞、朋友般',
    tone: 'friendly',
    isDefault: false,
  },
  {
    id: 'tone-3',
    name: '奢华高端',
    description: '适合奢侈品、高端护肤、珠宝等品类',
    style: '尊享、臻选、奢华、典藏、匠心、品质、尊贵',
    tone: 'luxury',
    isDefault: false,
  },
  {
    id: 'tone-4',
    name: '活泼有趣',
    description: '适合年轻潮流品牌、文创、潮玩等品类',
    style: '活泼、有趣、可爱、好玩、潮流、年轻、有活力',
    tone: 'playful',
    isDefault: false,
  },
];

interface BrandToneStore {
  brandTones: BrandTone[];
  currentToneId: string | null;
  selectedTone: BrandTone | undefined;
  init: () => void;
  addBrandTone: (tone: Omit<BrandTone, 'id' | 'isDefault'>) => BrandTone;
  updateBrandTone: (id: string, updates: Partial<BrandTone>) => void;
  deleteBrandTone: (id: string) => void;
  setCurrentTone: (id: string) => void;
}

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage(key: string, value: any): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export const useBrandToneStore = create<BrandToneStore>((set, get) => ({
  brandTones: [],
  currentToneId: null,
  selectedTone: undefined,
  
  init: () => {
    const tones = loadFromStorage<BrandTone[]>(STORAGE_KEYS.BRAND_TONES, []);
    
    if (tones.length === 0) {
      saveToStorage(STORAGE_KEYS.BRAND_TONES, defaultTones);
      const defaultTone = defaultTones.find(t => t.isDefault) || defaultTones[0];
      set({ 
        brandTones: defaultTones, 
        currentToneId: defaultTone.id,
        selectedTone: defaultTone,
      });
    } else {
      const activeTone = tones.find(t => t.isDefault) || tones[0];
      set({ 
        brandTones: tones, 
        currentToneId: activeTone.id,
        selectedTone: activeTone,
      });
    }
  },
  
  addBrandTone: (toneData) => {
    const newTone: BrandTone = {
      ...toneData,
      id: generateId(),
      isDefault: false,
    };
    
    const allTones = loadFromStorage<BrandTone[]>(STORAGE_KEYS.BRAND_TONES, []);
    allTones.push(newTone);
    saveToStorage(STORAGE_KEYS.BRAND_TONES, allTones);
    
    set(state => ({ brandTones: [...state.brandTones, newTone] }));
    return newTone;
  },
  
  updateBrandTone: (id, updates) => {
    const allTones = loadFromStorage<BrandTone[]>(STORAGE_KEYS.BRAND_TONES, []);
    const index = allTones.findIndex(t => t.id === id);
    
    if (index !== -1) {
      if (updates.isDefault) {
        allTones.forEach(t => t.isDefault = false);
      }
      allTones[index] = { ...allTones[index], ...updates };
      saveToStorage(STORAGE_KEYS.BRAND_TONES, allTones);
      
      const state = get();
      const updatedTones = state.brandTones.map(t => t.id === id ? { ...t, ...updates } : t);
      const newSelected = state.currentToneId === id ? { ...state.selectedTone!, ...updates } : state.selectedTone;
      
      set({
        brandTones: updatedTones,
        selectedTone: newSelected,
      });
    }
  },
  
  deleteBrandTone: (id) => {
    const allTones = loadFromStorage<BrandTone[]>(STORAGE_KEYS.BRAND_TONES, []);
    const filtered = allTones.filter(t => t.id !== id);
    saveToStorage(STORAGE_KEYS.BRAND_TONES, filtered);
    
    set(state => {
      const newTones = state.brandTones.filter(t => t.id !== id);
      const newCurrentId = state.currentToneId === id ? newTones[0]?.id || null : state.currentToneId;
      const newSelected = newTones.find(t => t.id === newCurrentId);
      
      return {
        brandTones: newTones,
        currentToneId: newCurrentId,
        selectedTone: newSelected,
      };
    });
  },
  
  setCurrentTone: (id) => {
    const tone = get().brandTones.find(t => t.id === id);
    set({ 
      currentToneId: id,
      selectedTone: tone,
    });
  },
}));
