import { localDateKey } from './dateService';
import { calculatePrayerTimes, type PrayerTimesData } from './prayerService';

export const OFFLINE_PRAYER_DAYS = 32;

type SerializedPrayerTimes = Record<keyof PrayerTimesData, string>;

export interface PrayerScheduleCache {
  version: 1;
  generatedAt: string;
  location: { lat: number; lng: number; city: string };
  fromDate: string;
  toDate: string;
  days: Record<string, SerializedPrayerTimes>;
}

const serialize = (times: PrayerTimesData): SerializedPrayerTimes => ({
  fajr: times.fajr.toISOString(),
  sunrise: times.sunrise.toISOString(),
  dhuhr: times.dhuhr.toISOString(),
  asr: times.asr.toISOString(),
  maghrib: times.maghrib.toISOString(),
  isha: times.isha.toISOString(),
});

const deserialize = (times: SerializedPrayerTimes): PrayerTimesData => ({
  fajr: new Date(times.fajr),
  sunrise: new Date(times.sunrise),
  dhuhr: new Date(times.dhuhr),
  asr: new Date(times.asr),
  maghrib: new Date(times.maghrib),
  isha: new Date(times.isha),
});

export function buildPrayerSchedule(
  location: { lat: number; lng: number; city: string },
  now = new Date(),
  dayCount = OFFLINE_PRAYER_DAYS,
): PrayerScheduleCache {
  const days: PrayerScheduleCache['days'] = {};
  const cursor = new Date(now);
  cursor.setHours(12, 0, 0, 0);
  for (let offset = 0; offset < dayCount; offset++) {
    const date = new Date(cursor);
    date.setDate(cursor.getDate() + offset);
    days[localDateKey(date)] = serialize(calculatePrayerTimes(location.lat, location.lng, date));
  }
  const keys = Object.keys(days).sort();
  return {
    version: 1,
    generatedAt: new Date(now).toISOString(),
    location: { ...location },
    fromDate: keys[0],
    toDate: keys[keys.length - 1],
    days,
  };
}

export function scheduleMatchesLocation(
  schedule: PrayerScheduleCache | null,
  location: { lat: number; lng: number },
): schedule is PrayerScheduleCache {
  return !!schedule && schedule.version === 1
    && Math.abs(schedule.location.lat - location.lat) < 0.000001
    && Math.abs(schedule.location.lng - location.lng) < 0.000001;
}

export function getScheduledPrayerTimes(schedule: PrayerScheduleCache | null, date = new Date()): PrayerTimesData | null {
  const serialized = schedule?.days?.[localDateKey(date)];
  if (!serialized) return null;
  const result = deserialize(serialized);
  return Object.values(result).every(value => Number.isFinite(value.getTime())) ? result : null;
}

export function getOfflineDaysAvailable(schedule: PrayerScheduleCache | null, now = new Date()): number {
  if (!schedule) return 0;
  const today = localDateKey(now);
  return Object.keys(schedule.days).filter(key => key >= today).length;
}
