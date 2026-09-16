import { useSettingsStore } from './useSettingsStore';
import { tr } from '../i18n/tr';
import { en } from '../i18n/en';
import { ar } from '../i18n/ar';
import { localDateKey } from '../services/dateService';
import { create } from 'zustand';
import { saveData, loadData } from '../services/storageService';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'prayer' | 'hadith' | 'dua' | 'dhikr' | 'event';
  timestamp: number;
  read: boolean;
}

interface NotificationStore {
  notifications: AppNotification[];
  loadNotifications: () => Promise<void>;
  addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  getUnreadCount: () => number;
  generateDailyIfNeeded: (hadithText: string, duaTitle: string) => void;
}

const KEY = 'app_notifications';

const save = (notifications: AppNotification[]) =>
  saveData(KEY, notifications.slice(0, 50)); // keep last 50

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],

  loadNotifications: async () => {
    const data = await loadData<AppNotification[]>(KEY);
    if (data) set({ notifications: data });
  },

  addNotification: (n) => {
    const newNotif: AppNotification = {
      ...n,
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      timestamp: Date.now(),
      read: false,
    };
    const updated = [newNotif, ...get().notifications];
    set({ notifications: updated });
    save(updated);
  },

  markRead: (id) => {
    const updated = get().notifications.map(n => n.id === id ? { ...n, read: true } : n);
    set({ notifications: updated });
    save(updated);
  },

  markAllRead: () => {
    const updated = get().notifications.map(n => ({ ...n, read: true }));
    set({ notifications: updated });
    save(updated);
  },

  getUnreadCount: () => get().notifications.filter(n => !n.read).length,

  generateDailyIfNeeded: (hadithText, duaTitle) => {
    const date = localDateKey();
    const { settings } = useSettingsStore.getState();
    const t = { tr, en, ar }[settings.language] ?? tr;
    const items: AppNotification[] = [];
    for (const type of ['hadith', 'dua'] as const) {
      const enabled = type === 'hadith' ? settings.notifications.dailyHadith : settings.notifications.dailyDua;
      const id = `daily_${type}_${date}`;
      if (enabled && !get().notifications.some(n => n.id === id)) {
        items.push({ id, type, title: type === 'hadith' ? t.notifDailyHadith : t.notifDailyDua,
          body: type === 'hadith' ? hadithText : duaTitle, timestamp: Date.now(), read: false });
      }
    }
    if (items.length) {
      const updated = [...items, ...get().notifications].slice(0, 50);
      set({ notifications: updated });
      save(updated).catch(console.warn);
    }
  },
}));
