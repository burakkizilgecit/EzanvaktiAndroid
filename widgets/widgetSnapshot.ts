import {
  calculatePrayerTimes,
  formatPrayerTime,
} from "../services/prayerService";
import { localDateKey } from "../services/dateService";
import { formatGregorianDate, getDayName } from "../services/hijriService";
import { tr } from "../i18n/tr";
import { en } from "../i18n/en";
import { ar } from "../i18n/ar";
import type { AppSettings } from "../store/useSettingsStore";

export interface WatchPrayerState {
  date: string;
  prayers: Record<string, boolean>;
}

export interface WatchDhikrItem {
  id: string;
  name: string;
  count: number;
  target: number;
  isCustom?: boolean;
}

export interface WatchState {
  prayer?: WatchPrayerState;
  dhikr?: WatchDhikrItem[];
  offlineDaysAvailable?: number;
  lastPrayerUpdateAt?: string | null;
}

const META = [
  ["fajr", "prayerFajr", "☾"],
  ["sunrise", "prayerSunrise", "☼"],
  ["dhuhr", "prayerDhuhr", "☀"],
  ["asr", "prayerAsr", "☀"],
  ["maghrib", "prayerMaghrib", "☼"],
  ["isha", "prayerIsha", "☾"],
] as const;
/** The widgets consume the exact same Adhan calculations as the app. No native duplicate algorithm. */
export function buildWidgetSnapshot(
  location: { lat: number; lng: number; city?: string } | null,
  settings: AppSettings,
  now = new Date(),
  watch: WatchState = {},
) {
  const language = ["tr", "en", "ar"].includes(settings.language)
    ? settings.language
    : "tr";
  const text = { tr, en, ar }[language];
  const valid =
    location &&
    Number.isFinite(location.lat) &&
    Number.isFinite(location.lng) &&
    Math.abs(location.lat) <= 90 &&
    Math.abs(location.lng) <= 180;
  const days = [];
  if (valid)
    for (let i = 0; i < 32; i++) {
      const date = new Date(now);
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() + i);
      const times = calculatePrayerTimes(location.lat, location.lng, date);
      const entries = META.map(([key, label, icon]) => ({
        key,
        label: text[label],
        icon,
        at: times[key].getTime(),
        time: formatPrayerTime(times[key]),
      }));
      if (entries.every((entry) => Number.isFinite(entry.at)))
        days.push({
          date: localDateKey(date),
          dateLabel: formatGregorianDate(date, language),
          dayLabel: getDayName(date, language),
          entries,
        });
    }
  return {
    version: 1,
    updatedAt: now.getTime(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language,
    theme: settings.theme ?? "system",
    city: valid
      ? location.city ||
        `${location.lat.toFixed(2)}, ${location.lng.toFixed(2)}`
      : "",
    days,
    labels: {
      next: text.widgetNext,
      missing: text.widgetMissing,
      refresh: text.widgetRefresh,
      today: text.widgetToday,
      upcoming: text.widgetUpcoming,
    },
    reminder: settings.notifications.prayerTimes,
    watch: {
      prayer: watch.prayer ?? { date: localDateKey(now), prayers: {} },
      dhikr: (watch.dhikr ?? []).map((item) => ({
        id: item.id,
        name: item.name,
        count: Math.max(0, Math.trunc(item.count || 0)),
        target: Math.max(1, Math.trunc(item.target || 1)),
        isCustom: item.isCustom === true,
      })),
      offlineDaysAvailable: Math.max(0, Math.trunc(watch.offlineDaysAvailable ?? days.length)),
      lastPrayerUpdateAt: watch.lastPrayerUpdateAt ?? new Date(now).toISOString(),
    },
  };
}
