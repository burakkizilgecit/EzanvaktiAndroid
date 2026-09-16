import { NativeModules, Platform } from "react-native";
import { loadData, STORAGE_KEYS } from "../services/storageService";
import { normalizeSettings, type AppSettings } from "../store/useSettingsStore";
import { buildWidgetSnapshot } from "./widgetSnapshot";

export async function syncNativeWidgets(
  location: { lat: number; lng: number; city?: string } | null,
  settings: AppSettings,
) {
  if (Platform.OS !== "android" || !NativeModules?.PrayerWidgets) return;
  await NativeModules.PrayerWidgets.publish(
    JSON.stringify(buildWidgetSnapshot(location, settings)),
  );
}
export async function syncStoredNativeWidgets() {
  const [location, settings] = await Promise.all([
    loadData<{ lat: number; lng: number; city?: string }>(
      STORAGE_KEYS.LOCATION,
    ),
    loadData<AppSettings>(STORAGE_KEYS.SETTINGS),
  ]);
  await syncNativeWidgets(location, normalizeSettings(settings));
}
