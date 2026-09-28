import { localDateKey } from '../services/dateService';
import * as Location from 'expo-location';
import { create } from 'zustand';
import { PrayerTimesData, calculatePrayerTimes } from '../services/prayerService';
import { saveData, loadData, STORAGE_KEYS } from '../services/storageService';
import { findNearestCity } from '../data/turkishCities';
import {
  OFFLINE_PRAYER_DAYS,
  buildPrayerSchedule,
  getOfflineDaysAvailable,
  getScheduledPrayerTimes,
  scheduleMatchesLocation,
  type PrayerScheduleCache,
} from '../services/prayerSchedule';

export interface PrayerCompletion {
  [dateKey: string]: {
    fajr: boolean;
    dhuhr: boolean;
    asr: boolean;
    maghrib: boolean;
    isha: boolean;
  };
}

type LocationSource = 'auto' | 'manual';

interface PrayerStore {
  prayerTimes: PrayerTimesData | null;
  location: { lat: number; lng: number; city: string } | null;
  locationSource: LocationSource;
  locationLoading: boolean;
  locationError: boolean;
  prayerSchedule: PrayerScheduleCache | null;
  lastPrayerUpdateAt: string | null;
  offlineDaysAvailable: number;
  refreshLocation: () => Promise<void>;
  refreshPrayerTimes: () => void;
  getPrayerTimesForDate: (date: Date) => PrayerTimesData | null;
  completion: PrayerCompletion;
  setPrayerTimes: (times: PrayerTimesData) => void;
  setLocation: (lat: number, lng: number, city: string) => Promise<void>;
  setManualLocation: (lat: number, lng: number, city: string) => Promise<void>;
  useAutoLocation: () => Promise<void>;
  togglePrayer: (dateKey: string, prayer: keyof PrayerCompletion[string]) => void;
  loadCompletion: () => Promise<void>;
  loadLocation: () => Promise<void>;
  getTodayCompletion: () => PrayerCompletion[string];
}

const todayKey = () => localDateKey();
const emptyDay = () => ({ fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false });

let locationRequest: Promise<void> | null = null;

function createSchedule(location: { lat: number; lng: number; city: string }, now = new Date()) {
  return buildPrayerSchedule(location, now, OFFLINE_PRAYER_DAYS);
}

function withTimeout<T>(operation: Promise<T>, milliseconds: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    operation,
    new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Location timeout')), milliseconds); }),
  ]).finally(() => clearTimeout(timer));
}

export const usePrayerStore = create<PrayerStore>((set, get) => ({
  prayerTimes: null,
  location: null,
  locationSource: 'auto',
  locationLoading: true,
  locationError: false,
  prayerSchedule: null,
  lastPrayerUpdateAt: null,
  offlineDaysAvailable: 0,
  refreshLocation: () => {
    // A manually chosen city stands until the user explicitly switches back to GPS —
    // an automatic refresh (e.g. on app resume) must never silently override it.
    if (get().locationSource === 'manual') {
      set({ locationLoading: false });
      return Promise.resolve();
    }
    if (locationRequest) return locationRequest;
    set({ locationLoading: true });
    locationRequest = (async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') {
          // Permission denied and no manual city chosen: nothing to show.
          set({ locationError: true });
          return;
        }
        const loc = await withTimeout(Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }), 20000);
        if (!Number.isFinite(loc.coords.latitude) || !Number.isFinite(loc.coords.longitude)) throw new Error('Invalid coordinates');
        // A raw coordinate pair is never shown as the city name; fall back to the
        // nearest known province if reverse geocoding fails or returns nothing.
        let city = findNearestCity(loc.coords.latitude, loc.coords.longitude);
        try {
          const geo = await withTimeout(Location.reverseGeocodeAsync(loc.coords), 5000);
          city = geo[0]?.city ?? geo[0]?.region ?? city;
        } catch { /* The nearest-city fallback already covers this case. */ }
        await get().setLocation(loc.coords.latitude, loc.coords.longitude, city);
      } catch {
        // Transient failure (cold GPS fix timeout, temporarily unavailable): keep
        // showing the last known location instead of going blank until the next retry.
        set({ locationError: true });
      } finally {
        set({ locationLoading: false });
      }
    })().finally(() => { locationRequest = null; });
    return locationRequest;
  },
  refreshPrayerTimes: () => {
    const { location, prayerTimes, prayerSchedule } = get();
    if (!location) return;
    const available = getOfflineDaysAvailable(prayerSchedule);
    const current = getScheduledPrayerTimes(prayerSchedule);
    if (!scheduleMatchesLocation(prayerSchedule, location) || available < 30 || !current) {
      const schedule = createSchedule(location);
      const today = getScheduledPrayerTimes(schedule) ?? calculatePrayerTimes(location.lat, location.lng);
      set({ prayerSchedule: schedule, prayerTimes: today, lastPrayerUpdateAt: schedule.generatedAt, offlineDaysAvailable: getOfflineDaysAvailable(schedule) });
      void saveData(STORAGE_KEYS.PRAYER_SCHEDULE, schedule);
    } else if (!prayerTimes || localDateKey(prayerTimes.dhuhr) !== localDateKey()) {
      set({ prayerTimes: current, offlineDaysAvailable: available });
    }
  },
  getPrayerTimesForDate: (date) => {
    const { location, prayerSchedule } = get();
    if (!location) return null;
    return getScheduledPrayerTimes(prayerSchedule, date) ?? calculatePrayerTimes(location.lat, location.lng, date);
  },
  completion: {},

  setPrayerTimes: (times) => set({ prayerTimes: times }),

  setLocation: async (lat, lng, city) => {
    const location = { lat, lng, city };
    const schedule = createSchedule(location);
    const times = getScheduledPrayerTimes(schedule) ?? calculatePrayerTimes(lat, lng);
    await saveData(STORAGE_KEYS.LOCATION, { lat, lng, city, source: 'auto' });
    await saveData(STORAGE_KEYS.PRAYER_SCHEDULE, schedule);
    set({ location, locationSource: 'auto', prayerTimes: times, prayerSchedule: schedule, lastPrayerUpdateAt: schedule.generatedAt, offlineDaysAvailable: getOfflineDaysAvailable(schedule), locationError: false });
  },

  setManualLocation: async (lat, lng, city) => {
    const location = { lat, lng, city };
    const schedule = createSchedule(location);
    const times = getScheduledPrayerTimes(schedule) ?? calculatePrayerTimes(lat, lng);
    await saveData(STORAGE_KEYS.LOCATION, { lat, lng, city, source: 'manual' });
    await saveData(STORAGE_KEYS.PRAYER_SCHEDULE, schedule);
    set({ location, locationSource: 'manual', prayerTimes: times, prayerSchedule: schedule, lastPrayerUpdateAt: schedule.generatedAt, offlineDaysAvailable: getOfflineDaysAvailable(schedule), locationError: false, locationLoading: false });
  },

  useAutoLocation: async () => {
    const previousSource = get().locationSource;
    set({ locationSource: 'auto' });
    await get().refreshLocation();
    if (get().locationError && previousSource === 'manual') {
      set({ locationSource: 'manual' });
    }
  },

  togglePrayer: (dateKey, prayer) => {
    const current = get().completion;
    const day = current[dateKey] ?? emptyDay();
    const updated = { ...current, [dateKey]: { ...day, [prayer]: !day[prayer] } };
    set({ completion: updated });
    saveData(STORAGE_KEYS.PRAYER_COMPLETION, updated);
  },

  loadCompletion: async () => {
    const data = await loadData<PrayerCompletion>(STORAGE_KEYS.PRAYER_COMPLETION);
    if (data) set({ completion: data });
  },

  loadLocation: async () => {
    const [data, storedSchedule] = await Promise.all([
      loadData<{ lat: number; lng: number; city: string; source?: LocationSource }>(STORAGE_KEYS.LOCATION),
      loadData<PrayerScheduleCache>(STORAGE_KEYS.PRAYER_SCHEDULE),
    ]);
    if (data && Number.isFinite(data.lat) && Number.isFinite(data.lng)) {
      const location = { lat: data.lat, lng: data.lng, city: data.city };
      const reusable = scheduleMatchesLocation(storedSchedule, location) && getOfflineDaysAvailable(storedSchedule) >= 30;
      const schedule = reusable ? storedSchedule : createSchedule(location);
      if (!reusable) await saveData(STORAGE_KEYS.PRAYER_SCHEDULE, schedule);
      set({
        location,
        locationSource: data.source ?? 'auto',
        prayerTimes: getScheduledPrayerTimes(schedule) ?? calculatePrayerTimes(data.lat, data.lng),
        prayerSchedule: schedule,
        lastPrayerUpdateAt: schedule.generatedAt,
        offlineDaysAvailable: getOfflineDaysAvailable(schedule),
      });
    }
  },

  getTodayCompletion: () => {
    const key = todayKey();
    return get().completion[key] ?? emptyDay();
  },
}));
