import { localDateKey } from '../services/dateService';
import * as Location from 'expo-location';
import { create } from 'zustand';
import { PrayerTimesData, calculatePrayerTimes } from '../services/prayerService';
import { saveData, loadData, STORAGE_KEYS } from '../services/storageService';

export interface PrayerCompletion {
  [dateKey: string]: {
    fajr: boolean;
    dhuhr: boolean;
    asr: boolean;
    maghrib: boolean;
    isha: boolean;
  };
}

interface PrayerStore {
  prayerTimes: PrayerTimesData | null;
  location: { lat: number; lng: number; city: string } | null;
  locationLoading: boolean;
  locationError: boolean;
  refreshLocation: () => Promise<void>;
  refreshPrayerTimes: () => void;
  completion: PrayerCompletion;
  setPrayerTimes: (times: PrayerTimesData) => void;
  setLocation: (lat: number, lng: number, city: string) => Promise<void>;
  togglePrayer: (dateKey: string, prayer: keyof PrayerCompletion[string]) => void;
  loadCompletion: () => Promise<void>;
  loadLocation: () => Promise<void>;
  getTodayCompletion: () => PrayerCompletion[string];
}

const todayKey = () => localDateKey();
const emptyDay = () => ({ fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false });

let locationRequest: Promise<void> | null = null;

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
  locationLoading: true,
  locationError: false,
  refreshLocation: () => {
    if (locationRequest) return locationRequest;
    set({ locationLoading: true });
    locationRequest = (async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') {
          // Permission revoked: don't keep presenting a location the user no longer allows.
          await saveData(STORAGE_KEYS.LOCATION, null);
          set({ location: null, prayerTimes: null, locationError: true });
          return;
        }
        const loc = await withTimeout(Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }), 20000);
        if (!Number.isFinite(loc.coords.latitude) || !Number.isFinite(loc.coords.longitude)) throw new Error('Invalid coordinates');
        let city = `${loc.coords.latitude.toFixed(2)}, ${loc.coords.longitude.toFixed(2)}`;
        // Geocoding is optional: valid coordinates must not be discarded.
        try {
          const geo = await withTimeout(Location.reverseGeocodeAsync(loc.coords), 5000);
          city = geo[0]?.city ?? geo[0]?.region ?? city;
        } catch { /* Coordinates are sufficient for prayer calculations. */ }
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
    const { location, prayerTimes } = get();
    if (location && (!prayerTimes || localDateKey(prayerTimes.dhuhr) !== localDateKey())) {
      set({ prayerTimes: calculatePrayerTimes(location.lat, location.lng) });
    }
  },
  completion: {},

  setPrayerTimes: (times) => set({ prayerTimes: times }),

  setLocation: async (lat, lng, city) => {
    const times = calculatePrayerTimes(lat, lng);
    await saveData(STORAGE_KEYS.LOCATION, { lat, lng, city });
    set({ location: { lat, lng, city }, prayerTimes: times, locationError: false });
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
    const data = await loadData<{ lat: number; lng: number; city: string }>(STORAGE_KEYS.LOCATION);
    if (data && Number.isFinite(data.lat) && Number.isFinite(data.lng)) {
      set({ location: data, prayerTimes: calculatePrayerTimes(data.lat, data.lng) });
    }
  },

  getTodayCompletion: () => {
    const key = todayKey();
    return get().completion[key] ?? emptyDay();
  },
}));
