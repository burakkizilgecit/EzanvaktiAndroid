import { localDateKey } from './dateService';
import { Coordinates, CalculationMethod, PrayerTimes, Qibla } from 'adhan';

export interface PrayerTimesData {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
}

export function calculatePrayerTimes(lat: number, lng: number, date: Date = new Date()): PrayerTimesData {
  const coords = new Coordinates(lat, lng);
  const params = CalculationMethod.Turkey();
  const pt = new PrayerTimes(coords, date, params);
  // Force proper Date instances — adhan can return Date-like objects
  // that lose their prototype after Zustand stores them
  return {
    fajr:    new Date(pt.fajr),
    sunrise: new Date(pt.sunrise),
    dhuhr:   new Date(pt.dhuhr),
    asr:     new Date(pt.asr),
    maghrib: new Date(pt.maghrib),
    isha:    new Date(pt.isha),
  };
}

export function getNextPrayer(
  times: PrayerTimesData,
  lat: number,
  lng: number,
  now: Date = new Date(),
): { key: string; name: string; time: Date } {
  // A suspended screen may pass yesterday's cached times after midnight.
  if (localDateKey(new Date(times.dhuhr)) !== localDateKey(now)) {
    times = calculatePrayerTimes(lat, lng, now);
  }
  const nowMs = now.getTime();

  const prayers = [
    { key: 'fajr',    name: 'Sabah',  time: new Date(times.fajr) },
    { key: 'sunrise', name: 'Güneş',  time: new Date(times.sunrise) },
    { key: 'dhuhr',   name: 'Öğle',   time: new Date(times.dhuhr) },
    { key: 'asr',     name: 'İkindi', time: new Date(times.asr) },
    { key: 'maghrib', name: 'Akşam',  time: new Date(times.maghrib) },
    { key: 'isha',    name: 'Yatsı',  time: new Date(times.isha) },
  ];

  const next = prayers.find(p => p.time.getTime() > nowMs);
  if (next) return next;

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowTimes = calculatePrayerTimes(lat, lng, tomorrow);
  return { key: 'fajr', name: 'Sabah', time: new Date(tomorrowTimes.fajr) };
}

export function getCountdown(targetTime: Date | string | number, nowMs = Date.now()): string {
  const diff = new Date(targetTime).getTime() - nowMs;
  if (diff <= 0) return '00:00:00';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatPrayerTime(date: Date | string): string {
  const d = new Date(date);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function calculateQiblaDirection(lat: number, lng: number): number {
  return Qibla(new Coordinates(lat, lng));
}
