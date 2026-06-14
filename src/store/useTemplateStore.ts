import { create } from 'zustand';
import type { Template, TaskSubType, TaskType } from '../types';
import { STORAGE_KEYS } from '../types';
import { mockTemplates } from '../mock/templates';
import { generateId } from '../utils/formatters';

interface TemplateStore {
  templates: Template[];
  favoriteTemplates: Template[];
  init: () => void;
  addTemplate: (template: Omit<Template, 'id' | 'createdAt' | 'usageCount'>) => Template;
  updateTemplate: (id: string, updates: Partial<Template>) => void;
  deleteTemplate: (id: string) => void;
  incrementUsage: (id: string) => void;
  toggleFavorite: (id: string) => void;
  getTopTemplates: (type?: TaskSubType, limit?: number) => Template[];
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

export const useTemplateStore = create<TemplateStore>((set, get) => ({
  templates: [],
  favoriteTemplates: [],
  
  init: () => {
    const templates = loadFromStorage<Template[]>(STORAGE_KEYS.TEMPLATES, []);
    
    if (templates.length === 0) {
      saveToStorage(STORAGE_KEYS.TEMPLATES, mockTemplates);
      set({ 
        templates: mockTemplates,
        favoriteTemplates: mockTemplates.filter(t => t.isFavorite),
      });
    } else {
      set({ 
        templates,
        favoriteTemplates: templates.filter(t => t.isFavorite),
      });
    }
  },
  
  addTemplate: (templateData) => {
    const newTemplate: Template = {
      ...templateData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      usageCount: 0,
      isFavorite: false,
    };
    
    const allTemplates = loadFromStorage<Template[]>(STORAGE_KEYS.TEMPLATES, []);
    allTemplates.push(newTemplate);
    saveToStorage(STORAGE_KEYS.TEMPLATES, allTemplates);
    
    set(state => ({ 
      templates: [...state.templates, newTemplate],
      favoriteTemplates: newTemplate.isFavorite 
        ? [...state.favoriteTemplates, newTemplate]
        : state.favoriteTemplates,
    }));
    return newTemplate;
  },
  
  updateTemplate: (id, updates) => {
    const allTemplates = loadFromStorage<Template[]>(STORAGE_KEYS.TEMPLATES, []);
    const index = allTemplates.findIndex(t => t.id === id);
    
    if (index !== -1) {
      allTemplates[index] = { ...allTemplates[index], ...updates };
      saveToStorage(STORAGE_KEYS.TEMPLATES, allTemplates);
      
      const updatedTemplates = allTemplates;
      set(state => ({
        templates: state.templates.map(t => t.id === id ? { ...t, ...updates } : t),
        favoriteTemplates: updatedTemplates.filter(t => t.isFavorite),
      }));
    }
  },
  
  deleteTemplate: (id) => {
    const allTemplates = loadFromStorage<Template[]>(STORAGE_KEYS.TEMPLATES, []);
    const filtered = allTemplates.filter(t => t.id !== id);
    saveToStorage(STORAGE_KEYS.TEMPLATES, filtered);
    
    set(state => ({
      templates: state.templates.filter(t => t.id !== id),
      favoriteTemplates: state.favoriteTemplates.filter(t => t.id !== id),
    }));
  },
  
  incrementUsage: (id) => {
    const allTemplates = loadFromStorage<Template[]>(STORAGE_KEYS.TEMPLATES, []);
    const index = allTemplates.findIndex(t => t.id === id);
    
    if (index !== -1) {
      allTemplates[index].usageCount += 1;
      saveToStorage(STORAGE_KEYS.TEMPLATES, allTemplates);
      
      set(state => ({
        templates: state.templates.map(t => 
          t.id === id ? { ...t, usageCount: t.usageCount + 1 } : t
        ),
      }));
    }
  },

  toggleFavorite: (id) => {
    const allTemplates = loadFromStorage<Template[]>(STORAGE_KEYS.TEMPLATES, []);
    const index = allTemplates.findIndex(t => t.id === id);
    
    if (index !== -1) {
      allTemplates[index].isFavorite = !allTemplates[index].isFavorite;
      saveToStorage(STORAGE_KEYS.TEMPLATES, allTemplates);
      
      const updatedTemplates = allTemplates;
      set({
        templates: updatedTemplates,
        favoriteTemplates: updatedTemplates.filter(t => t.isFavorite),
      });
    }
  },
  
  getTopTemplates: (type, limit = 5) => {
    const { templates } = get();
    let filtered = templates;
    
    if (type) {
      filtered = templates.filter(t => t.type === type);
    }
    
    return filtered
      .sort((a, b) => (b.usageCount - a.usageCount) || (b.conversionRate || 0) - (a.conversionRate || 0))
      .slice(0, limit);
  },
}));
