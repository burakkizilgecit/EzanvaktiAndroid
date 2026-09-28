import { NativeModules, Platform } from "react-native";
import { loadData, STORAGE_KEYS } from "../services/storageService";
import { normalizeSettings, useSettingsStore, type AppSettings } from "../store/useSettingsStore";
import { buildWidgetSnapshot } from "./widgetSnapshot";
import { usePrayerStore, type PrayerCompletion } from "../store/usePrayerStore";
import { useDhikrStore, type DhikrItem } from "../store/useDhikrStore";
import { localDateKey } from "../services/dateService";

function liveWatchState() {
  const prayer = usePrayerStore.getState();
  const dhikr = useDhikrStore.getState();
  const date = localDateKey();
  return {
    prayer: { date, prayers: prayer.completion[date] ?? {} },
    dhikr: dhikr.items,
    offlineDaysAvailable: prayer.offlineDaysAvailable,
    lastPrayerUpdateAt: prayer.lastPrayerUpdateAt,
  };
}

export async function syncNativeWidgets(
  location: { lat: number; lng: number; city?: string } | null,
  settings: AppSettings,
) {
  if (Platform.OS !== "android" || !NativeModules?.PrayerWidgets) return;
  await NativeModules.PrayerWidgets.publish(
    JSON.stringify(buildWidgetSnapshot(location, settings, new Date(), liveWatchState())),
  );
}
export async function syncStoredNativeWidgets() {
  const [location, settings, completion, dhikr] = await Promise.all([
    loadData<{ lat: number; lng: number; city?: string }>(
      STORAGE_KEYS.LOCATION,
    ),
    loadData<AppSettings>(STORAGE_KEYS.SETTINGS),
    loadData<PrayerCompletion>(STORAGE_KEYS.PRAYER_COMPLETION),
    loadData<DhikrItem[]>(STORAGE_KEYS.DHIKR_COUNTS),
  ]);
  const date = localDateKey();
  if (Platform.OS === "android" && NativeModules?.PrayerWidgets) {
    await NativeModules.PrayerWidgets.publish(JSON.stringify(buildWidgetSnapshot(
      location,
      normalizeSettings(settings),
      new Date(),
      { prayer: { date, prayers: completion?.[date] ?? {} }, dhikr: dhikr ?? [] },
    )));
  }
}

export function subscribeToNativeWatchActions() {
  if (Platform.OS !== 'android' || !NativeModules?.PrayerWidgets) return { remove() {} };
  let applying = false;
  const consume = async () => {
    if (applying) return;
    applying = true;
    try {
      const queued = JSON.parse(await NativeModules.PrayerWidgets.consumeActions()) as string[];
      for (const json of queued) {
       const action = JSON.parse(json) as { type?: string; date?: string; prayer?: string; id?: string };
      if (action.type === 'togglePrayer' && action.date && action.prayer && action.prayer !== 'sunrise') {
        usePrayerStore.getState().togglePrayer(action.date, action.prayer as keyof PrayerCompletion[string]);
      } else if (action.type === 'incrementDhikr' && action.id) {
        useDhikrStore.getState().increment(action.id);
      }
      }
      if (queued.length) {
      const state = usePrayerStore.getState();
      await syncNativeWidgets(state.location, useSettingsStore.getState().settings);
      }
    } catch (error) {
      console.warn('Watch action could not be applied', error);
    } finally {
      applying = false;
    }
  };
  void consume();
  const interval = setInterval(consume, 2000);
  return { remove() { clearInterval(interval); } };
}
