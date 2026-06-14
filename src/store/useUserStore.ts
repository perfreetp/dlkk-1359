import { create } from 'zustand';
import type { User } from '../types';
import { STORAGE_KEYS } from '../types';
import { mockUsers } from '../mock/users';

interface UserStore {
  currentUser: User | null;
  users: User[];
  login: (email: string) => boolean;
  logout: () => void;
  init: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  currentUser: null,
  users: mockUsers,
  
  login: (email: string) => {
    const user = mockUsers.find(u => u.email === email);
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      set({ currentUser: user });
      return true;
    }
    return false;
  },
  
  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    set({ currentUser: null });
  },
  
  init: () => {
    const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (stored) {
      try {
        const user = JSON.parse(stored) as User;
        set({ currentUser: user });
      } catch {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    }
  },
}));
