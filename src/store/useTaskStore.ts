import { create } from 'zustand';
import type { Task, TaskOutput, TaskType, TaskStatus, UsageStats } from '../types';
import { STORAGE_KEYS } from '../types';
import { mockTasks } from '../mock/tasks';
import { generateId } from '../utils/formatters';

interface TaskStore {
  tasks: Task[];
  usageStats: UsageStats[];
  loading: boolean;
  init: (userId: string) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'isFavorite'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  updateTaskOutput: (taskId: string, outputId: string, updates: Partial<TaskOutput>) => void;
  markOutput: (taskId: string, outputId: string) => void;
  toggleFavorite: (id: string) => void;
  deleteTask: (id: string) => void;
  addUsage: (taskType: TaskType, userId: string) => void;
  filterTasks: (filters: {
    type?: TaskType;
    status?: string;
    favorite?: boolean;
    keyword?: string;
  }) => Task[];
  getTaskById: (id: string) => Task | undefined;
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

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  usageStats: [],
  loading: false,
  
  init: (userId: string) => {
    const tasks = loadFromStorage<Task[]>(STORAGE_KEYS.TASKS, []);
    const usageStats = loadFromStorage<UsageStats[]>(STORAGE_KEYS.USAGE_STATS, []);
    
    let userTasks = tasks.filter(t => t.userId === userId);
    let userStats = usageStats.filter(s => s.userId === userId);
    
    if (userTasks.length === 0) {
      userTasks = mockTasks.map(t => ({ ...t, userId }));
      saveToStorage(STORAGE_KEYS.TASKS, userTasks);
    }
    
    set({ tasks: userTasks, usageStats: userStats });
  },
  
  addTask: (taskData) => {
    const newTask: Task = {
      ...taskData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      isFavorite: false,
    };
    
    const allTasks = loadFromStorage<Task[]>(STORAGE_KEYS.TASKS, []);
    allTasks.push(newTask);
    saveToStorage(STORAGE_KEYS.TASKS, allTasks);
    
    set(state => ({ tasks: [newTask, ...state.tasks] }));
    return newTask;
  },
  
  updateTask: (id, updates) => {
    const allTasks = loadFromStorage<Task[]>(STORAGE_KEYS.TASKS, []);
    const index = allTasks.findIndex(t => t.id === id);
    
    if (index !== -1) {
      allTasks[index] = { ...allTasks[index], ...updates };
      saveToStorage(STORAGE_KEYS.TASKS, allTasks);
      
      set(state => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t),
      }));
    }
  },

  updateTaskOutput: (taskId, outputId, updates) => {
    const allTasks = loadFromStorage<Task[]>(STORAGE_KEYS.TASKS, []);
    const taskIndex = allTasks.findIndex(t => t.id === taskId);
    
    if (taskIndex !== -1) {
      const task = allTasks[taskIndex];
      const outputs = task.outputs.map(o => 
        o.id === outputId ? { ...o, ...updates } : o
      );
      
      const updatedTask = { ...task, outputs };
      allTasks[taskIndex] = updatedTask;
      saveToStorage(STORAGE_KEYS.TASKS, allTasks);
      
      set(state => ({
        tasks: state.tasks.map(t => t.id === taskId ? updatedTask : t),
      }));
    }
  },
  
  markOutput: (taskId, outputId) => {
    const allTasks = loadFromStorage<Task[]>(STORAGE_KEYS.TASKS, []);
    const index = allTasks.findIndex(t => t.id === taskId);
    
    if (index !== -1) {
      const task = allTasks[index];
      const outputs = task.outputs.map(o => ({
        ...o,
        isMarked: o.id === outputId ? !o.isMarked : o.isMarked,
      }));
      
      const hasMarked = outputs.some(o => o.isMarked);
      const updatedTask = {
        ...task,
        outputs,
        status: (hasMarked ? 'marked' : 'completed') as TaskStatus,
        markedOutputId: outputs.find(o => o.isMarked)?.id,
      };
      
      allTasks[index] = updatedTask;
      saveToStorage(STORAGE_KEYS.TASKS, allTasks);
      
      set(state => ({
        tasks: state.tasks.map(t => t.id === taskId ? updatedTask : t),
      }));
    }
  },
  
  toggleFavorite: (id) => {
    const allTasks = loadFromStorage<Task[]>(STORAGE_KEYS.TASKS, []);
    const index = allTasks.findIndex(t => t.id === id);
    
    if (index !== -1) {
      allTasks[index].isFavorite = !allTasks[index].isFavorite;
      saveToStorage(STORAGE_KEYS.TASKS, allTasks);
      
      set(state => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, isFavorite: !t.isFavorite } : t),
      }));
    }
  },
  
  deleteTask: (id) => {
    const allTasks = loadFromStorage<Task[]>(STORAGE_KEYS.TASKS, []);
    const filtered = allTasks.filter(t => t.id !== id);
    saveToStorage(STORAGE_KEYS.TASKS, filtered);
    
    set(state => ({
      tasks: state.tasks.filter(t => t.id !== id),
    }));
  },
  
  addUsage: (taskType, userId) => {
    const allStats = loadFromStorage<UsageStats[]>(STORAGE_KEYS.USAGE_STATS, []);
    const today = new Date().toISOString().split('T')[0];
    
    const existingIndex = allStats.findIndex(
      s => s.date === today && s.taskType === taskType && s.userId === userId
    );
    
    if (existingIndex !== -1) {
      allStats[existingIndex].count += 1;
    } else {
      allStats.push({
        date: today,
        taskType,
        count: 1,
        userId,
      });
    }
    
    saveToStorage(STORAGE_KEYS.USAGE_STATS, allStats);
    
    set(state => {
      const userStats = state.usageStats.filter(
        s => !(s.date === today && s.taskType === taskType && s.userId === userId)
      );
      const updatedStat = existingIndex !== -1 ? allStats[existingIndex] : allStats[allStats.length - 1];
      return { usageStats: [...userStats, updatedStat] };
    });
  },
  
  filterTasks: (filters) => {
    const { tasks } = get();
    return tasks.filter(task => {
      if (filters.type && task.type !== filters.type) return false;
      if (filters.status && task.status !== filters.status) return false;
      if (filters.favorite && !task.isFavorite) return false;
      if (filters.keyword && !task.title.includes(filters.keyword)) return false;
      return true;
    });
  },
  
  getTaskById: (id) => {
    return get().tasks.find(t => t.id === id);
  },
}));
