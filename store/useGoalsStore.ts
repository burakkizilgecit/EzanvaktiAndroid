import { localDateKey } from '../services/dateService';
import { create } from 'zustand';
import { saveData, loadData, STORAGE_KEYS } from '../services/storageService';

export interface Goal {
  id: string;
  title: string;
  target: number;
  unit: string;
  progress: number;
  icon: string;
}

const DEFAULT_GOALS: Goal[] = [
  { id: 'dhikr', title: 'Zikir Yap', target: 100, unit: 'tespih', progress: 0, icon: 'grain' },
  { id: 'quran', title: "Kur'an Oku", target: 30, unit: 'dk', progress: 0, icon: 'menu-book' },
  { id: 'dua', title: 'Dua Et', target: 3, unit: 'dua', progress: 0, icon: 'self-improvement' },
  { id: 'sadaka', title: 'Sadaka Ver', target: 1, unit: 'kez', progress: 0, icon: 'volunteer-activism' },
];

interface GoalsStore {
  goals: Goal[];
  lastDate: string;
  checkDayRollover: () => void;
  updateProgress: (id: string, amount: number) => void;
  setProgress: (id: string, value: number) => void;
  setTarget: (id: string, target: number) => void;
  resetDaily: () => void;
  loadGoals: () => Promise<void>;
  getCompletionRate: () => number;
}

export const useGoalsStore = create<GoalsStore>((set, get) => ({
  goals: DEFAULT_GOALS,
  lastDate: localDateKey(),
  checkDayRollover: () => {
    if (get().lastDate !== localDateKey()) get().resetDaily();
  },

  updateProgress: (id, amount) => {
    get().checkDayRollover();
    const goals = get().goals.map(g =>
      g.id === id ? { ...g, progress: Math.min(g.target, g.progress + amount) } : g
    );
    set({ goals });
    saveData(STORAGE_KEYS.DAILY_GOALS, { date: get().lastDate, goals });
  },

  setProgress: (id, value) => {
    get().checkDayRollover();
    if (!Number.isFinite(value) || value < 0) return;
    const goals = get().goals.map(g => g.id === id ? { ...g, progress: Math.min(g.target, value) } : g);
    set({ goals });
    saveData(STORAGE_KEYS.DAILY_GOALS, { date: get().lastDate, goals });
  },

  setTarget: (id, target) => {
    get().checkDayRollover();
    if (!Number.isFinite(target) || target <= 0) return;
    const goals = get().goals.map(g => g.id === id ? { ...g, target } : g);
    set({ goals });
    saveData(STORAGE_KEYS.DAILY_GOALS, { date: get().lastDate, goals });
  },

  resetDaily: () => {
    const goals = get().goals.map(g => ({ ...g, progress: 0 }));
    set({ goals, lastDate: localDateKey() });
    saveData(STORAGE_KEYS.DAILY_GOALS, { date: get().lastDate, goals });
  },

  loadGoals: async () => {
    const data = await loadData<Goal[] | { date: string; goals: Goal[] }>(STORAGE_KEYS.DAILY_GOALS);
    if (!data) return;
    const saved = Array.isArray(data) ? data : data.goals;
    const date = Array.isArray(data) ? null : data.date;
    // Legacy data has no date; preserve targets without carrying an unknown day's progress.
    const goals = saved.map(g => ({ ...g, progress: date === localDateKey() ? g.progress : 0 }));
    set({ goals, lastDate: localDateKey() });
    await saveData(STORAGE_KEYS.DAILY_GOALS, { date: get().lastDate, goals });
  },

  getCompletionRate: () => {
    const goals = get().goals;
    const completed = goals.filter(g => g.progress >= g.target).length;
    return Math.round((completed / goals.length) * 100);
  },
}));
