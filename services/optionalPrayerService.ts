import type { PrayerTimesData } from './prayerService';

export interface OptionalPrayerTimes {
  ishraqStart: Date;
  duhaStart: Date;
  duhaEnd: Date;
  awwabinStart: Date;
  awwabinEnd: Date;
  disliked: { start: Date; end: Date }[];
}

const minutes = (date: Date, amount: number) => new Date(new Date(date).getTime() + amount * 60_000);

/**
 * Approximate educational windows used by the UI. The 45-minute sunrise and
 * sunset margins follow the common 40–50 minute guidance; local conditions and
 * school-specific rulings can differ, so these are never presented as exact.
 */
export function calculateOptionalPrayerTimes(times: PrayerTimesData): OptionalPrayerTimes {
  const ishraqStart = minutes(times.sunrise, 45);
  const duhaEnd = minutes(times.dhuhr, -10);
  return {
    ishraqStart,
    duhaStart: ishraqStart,
    duhaEnd,
    awwabinStart: new Date(times.maghrib),
    awwabinEnd: new Date(times.isha),
    disliked: [
      { start: new Date(times.sunrise), end: ishraqStart },
      { start: duhaEnd, end: new Date(times.dhuhr) },
      { start: minutes(times.maghrib, -45), end: new Date(times.maghrib) },
    ],
  };
}

export function optionalPrayerReminderTimes(times: PrayerTimesData) {
  const windows = calculateOptionalPrayerTimes(times);
  return {
    ishraq: windows.ishraqStart,
    // A reminder shortly after Maghrib avoids colliding with the obligatory
    // prayer notification and reflects that Awwabin follows the Maghrib prayer.
    awwabin: minutes(times.maghrib, 20),
  };
}
