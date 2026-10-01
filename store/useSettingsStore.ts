import { create } from 'zustand';
import { saveData, loadData, STORAGE_KEYS } from '../services/storageService';

export type NotificationSound = 'default' | 'ezan' | 'ilahi' | 'custom';
export type Language = 'tr' | 'en' | 'ar';

export interface AppSettings {
  settingsVersion: number;
  notifications: {
    prayerTimes: boolean;
    earlyReminder: boolean;
    dailyHadith: boolean;
    dailyDua: boolean;
    dhikrReminder: boolean;
    islamicDays: boolean;
    optionalPrayers: boolean;
    persistentPrayerTimes: boolean;
  };
  silentHours: { start: string; end: string };
  vibration: boolean;
  calculationMethod: string;
  notificationSound: NotificationSound;
  customSoundUri?: string;
  customSoundName?: string;
  language: Language;
  theme?: 'dark' | 'light' | 'system';
  fontSize?: 'normal' | 'large' | 'xlarge';
  notifiedEventIds: string[];
}

export const DEFAULT_SETTINGS: AppSettings = {
  settingsVersion: 2,
  notifications: {
    prayerTimes: true,
    earlyReminder: true,
    dailyHadith: true,
    dailyDua: true,
    dhikrReminder: true,
    islamicDays: true,
    optionalPrayers: false,
    persistentPrayerTimes: false,
  },
  silentHours: { start: '22:00', end: '07:00' },
  vibration: true,
  calculationMethod: 'Turkey',
  notificationSound: 'default',
  language: 'tr',
  theme: 'dark',
  fontSize: 'normal',
  notifiedEventIds: [],
};

interface SettingsStore {
  settings: AppSettings;
  toggleNotification: (key: keyof AppSettings['notifications']) => void;
  toggleEventNotification: (eventId: string) => void;
  updateSettings: (partial: Partial<AppSettings>) => void;
  loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,

  toggleNotification: (key) => {
    const settings = get().settings;
    const updated = {
      ...settings,
      notifications: { ...settings.notifications, [key]: !settings.notifications[key] },
    };
    set({ settings: updated });
    saveData(STORAGE_KEYS.SETTINGS, updated);
  },

  toggleEventNotification: (eventId) => {
    const settings = get().settings;
    const ids = settings.notifiedEventIds ?? [];
    const updated = {
      ...settings,
      notifiedEventIds: ids.includes(eventId) ? ids.filter(id => id !== eventId) : [...ids, eventId],
    };
    set({ settings: updated });
    saveData(STORAGE_KEYS.SETTINGS, updated);
  },

  updateSettings: (partial) => {
    const updated = { ...get().settings, ...partial };
    set({ settings: updated });
    saveData(STORAGE_KEYS.SETTINGS, updated);
  },

  loadSettings: async () => {
    const data = await loadData<AppSettings>(STORAGE_KEYS.SETTINGS);
    set({ settings: normalizeSettings(data) });
  },
}));

export function normalizeSettings(data: Partial<AppSettings> | null): AppSettings {
  const migratedSound = data && (data.settingsVersion ?? 1) < 2 && data.notificationSound === 'ezan' ? 'default' : data?.notificationSound;
  return {
    ...DEFAULT_SETTINGS, ...data, settingsVersion: 2,
    notificationSound: migratedSound ?? DEFAULT_SETTINGS.notificationSound,
    notifications: { ...DEFAULT_SETTINGS.notifications, ...data?.notifications },
    silentHours: { ...DEFAULT_SETTINGS.silentHours, ...data?.silentHours },
  };
}
