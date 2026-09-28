import { localDateKey } from '../services/dateService';
import { create } from 'zustand';
import { saveData, loadData, STORAGE_KEYS } from '../services/storageService';

export interface DhikrItem {
  id: string;
  name: string;
  count: number;
  target: number;
  category: 'tespih' | 'salavat' | 'istigfar' | 'diger';
  isCustom?: boolean;
}

export interface DhikrHistory {
  [dateKey: string]: { [id: string]: number };
}

const DEFAULT_DHIKR: DhikrItem[] = [
  { id: 'subhanallah', name: 'Sübhanallah', count: 0, target: 33, category: 'tespih' },
  { id: 'elhamdulillah', name: 'Elhamdüllilah', count: 0, target: 33, category: 'tespih' },
  { id: 'allahuekber', name: 'Allahu Ekber', count: 0, target: 33, category: 'tespih' },
  { id: 'lailahe', name: 'Lâ ilahe illallah', count: 0, target: 100, category: 'tespih' },
  { id: 'istigfar', name: 'Estağfirullah', count: 0, target: 100, category: 'istigfar' },
  { id: 'salavat', name: 'Salavat-ı Şerife', count: 0, target: 100, category: 'salavat' },
  { id: 'bismillah', name: 'Besmele', count: 0, target: 100, category: 'diger' },
  { id: 'hasbiyallah', name: 'Hasbiyallah', count: 0, target: 100, category: 'diger' },
];

interface DhikrStore {
  items: DhikrItem[];
  history: DhikrHistory;
  activeCategory: DhikrItem['category'];
  lastDate: string;
  increment: (id: string) => void;
  reset: () => void;
  addCustomDhikr: (name: string, target: number) => void;
  removeCustomDhikr: (id: string) => void;
  setCategory: (cat: DhikrStore['activeCategory']) => void;
  getTotalToday: () => number;
  loadData: () => Promise<void>;
  checkDayRollover: () => void;
  getWeeklyHistory: () => { day: string; total: number }[];
}

const todayKey = () => localDateKey();
const defaultIds = new Set(DEFAULT_DHIKR.map(item => item.id));

function reconcileItems(stored: DhikrItem[] | null, keepCounts: boolean): DhikrItem[] {
  const storedById = new Map((stored ?? []).map(item => [item.id, item]));
  const defaults = DEFAULT_DHIKR.map(item => ({
    ...item,
    count: keepCounts ? Math.max(0, storedById.get(item.id)?.count ?? 0) : 0,
  }));
  const custom = (stored ?? [])
    .filter(item => item.isCustom === true || !defaultIds.has(item.id))
    .map(item => ({
      ...item,
      category: 'diger' as const,
      isCustom: true,
      count: keepCounts ? Math.max(0, item.count ?? 0) : 0,
      target: Math.min(100000, Math.max(1, Math.trunc(item.target || 1))),
    }));
  return [...defaults, ...custom];
}

export const useDhikrStore = create<DhikrStore>((set, get) => ({
  items: DEFAULT_DHIKR,
  history: {},
  activeCategory: 'tespih',
  lastDate: todayKey(),

  increment: (id) => {
    get().checkDayRollover();
    const items = get().items.map(item =>
      item.id === id ? { ...item, count: item.count + 1 } : item
    );
    set({ items });
    const key = todayKey();
    const history = get().history;
    const dayHistory = history[key] ?? {};
    const updated = { ...history, [key]: { ...dayHistory, [id]: (dayHistory[id] ?? 0) + 1 } };
    set({ history: updated });
    saveData(STORAGE_KEYS.DHIKR_COUNTS, items);
    saveData(STORAGE_KEYS.DHIKR_HISTORY, updated);
  },

  reset: () => {
    const items = get().items.map(item => ({ ...item, count: 0 }));
    set({ items });
    saveData(STORAGE_KEYS.DHIKR_COUNTS, items);
  },

  addCustomDhikr: (name, target) => {
    const cleanedName = name.trim().replace(/\s+/g, ' ').slice(0, 60);
    const cleanedTarget = Math.min(100000, Math.max(1, Math.trunc(target)));
    if (!cleanedName || !Number.isFinite(cleanedTarget)) return;
    const item: DhikrItem = {
      id: 'custom_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      name: cleanedName,
      count: 0,
      target: cleanedTarget,
      category: 'diger',
      isCustom: true,
    };
    const items = [...get().items, item];
    set({ items, activeCategory: 'diger' });
    saveData(STORAGE_KEYS.DHIKR_COUNTS, items);
  },

  removeCustomDhikr: (id) => {
    const selected = get().items.find(item => item.id === id);
    if (!selected?.isCustom) return;
    const items = get().items.filter(item => item.id !== id);
    set({ items });
    saveData(STORAGE_KEYS.DHIKR_COUNTS, items);
  },

  setCategory: (cat) => set({ activeCategory: cat }),

  getTotalToday: () => Object.values(get().history[todayKey()] ?? {}).reduce((sum, count) => sum + count, 0),

  loadData: async () => {
    const [counts, history, lastDate] = await Promise.all([
      loadData<DhikrItem[]>(STORAGE_KEYS.DHIKR_COUNTS),
      loadData<DhikrHistory>(STORAGE_KEYS.DHIKR_HISTORY),
      loadData<string>(STORAGE_KEYS.DHIKR_LAST_DATE),
    ]);
    if (history) set({ history });

    const today = todayKey();
    const items = reconcileItems(counts, lastDate === today);
    set({ items, lastDate: today });
    saveData(STORAGE_KEYS.DHIKR_COUNTS, items);
    saveData(STORAGE_KEYS.DHIKR_LAST_DATE, today);
  },

  checkDayRollover: () => {
    const today = todayKey();
    if (get().lastDate === today) return;
    const items = reconcileItems(get().items, false);
    set({ items, lastDate: today });
    saveData(STORAGE_KEYS.DHIKR_COUNTS, items);
    saveData(STORAGE_KEYS.DHIKR_LAST_DATE, today);
  },

  getWeeklyHistory: () => {
    const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    const history = get().history;
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = localDateKey(d);
      const dayData = history[key] ?? {};
      const total = Object.values(dayData).reduce((a, b) => a + b, 0);
      return { day: days[d.getDay() === 0 ? 6 : d.getDay() - 1], total };
    });
  },
}));
