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
  };
}
