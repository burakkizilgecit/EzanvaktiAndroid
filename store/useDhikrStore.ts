import { create } from 'zustand';
import { saveData, loadData, STORAGE_KEYS } from '../services/storageService';

export interface DhikrItem {
  id: string;
  name: string;
  count: number;
  target: number;
  category: 'tespih' | 'salavat' | 'istigfar' | 'diger';
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
  activeCategory: 'tespih' | 'salavat' | 'istigfar' | 'diger';
  lastDate: string;
  increment: (id: string) => void;
  reset: () => void;
  setCategory: (cat: DhikrStore['activeCategory']) => void;
  getTotalToday: () => number;
  loadData: () => Promise<void>;
  checkDayRollover: () => void;
  getWeeklyHistory: () => { day: string; total: number }[];
}

const todayKey = () => new Date().toISOString().split('T')[0];
const zeroedItems = () => DEFAULT_DHIKR.map(d => ({ ...d, count: 0 }));

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
    const item = items.find(i => i.id === id);
    const updated = { ...history, [key]: { ...dayHistory, [id]: item?.count ?? 0 } };
    set({ history: updated });
    saveData(STORAGE_KEYS.DHIKR_COUNTS, items);
    saveData(STORAGE_KEYS.DHIKR_HISTORY, updated);
  },

  reset: () => {
    const items = get().items.map(i => ({ ...i, count: 0 }));
    set({ items });
    saveData(STORAGE_KEYS.DHIKR_COUNTS, items);
  },

  setCategory: (cat) => set({ activeCategory: cat }),

  getTotalToday: () => get().items.reduce((sum, i) => sum + i.count, 0),

  loadData: async () => {
    const [counts, history, lastDate] = await Promise.all([
      loadData<DhikrItem[]>(STORAGE_KEYS.DHIKR_COUNTS),
      loadData<DhikrHistory>(STORAGE_KEYS.DHIKR_HISTORY),
      loadData<string>(STORAGE_KEYS.DHIKR_LAST_DATE),
    ]);
    if (history) set({ history });

    const today = todayKey();
    // A stored date from a previous day means that day is over — its tallies
    // already live in `history`, so today's counters start fresh instead of
    // continuing to climb forever.
    if (counts && lastDate === today) {
      set({ items: counts, lastDate: today });
    } else {
      const items = zeroedItems();
      set({ items, lastDate: today });
      saveData(STORAGE_KEYS.DHIKR_COUNTS, items);
      saveData(STORAGE_KEYS.DHIKR_LAST_DATE, today);
    }
  },

  // Catches the day rolling over while the app stays open (no restart/reload)
  checkDayRollover: () => {
    const today = todayKey();
    if (get().lastDate === today) return;
    const items = zeroedItems();
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
      const key = d.toISOString().split('T')[0];
      const dayData = history[key] ?? {};
      const total = Object.values(dayData).reduce((a, b) => a + b, 0);
      return { day: days[d.getDay() === 0 ? 6 : d.getDay() - 1], total };
    });
  },
}));
