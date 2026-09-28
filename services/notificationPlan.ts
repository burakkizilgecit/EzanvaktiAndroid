import { calculatePrayerTimes } from './prayerService';
import { localDateKey } from './dateService';
import type { AppSettings } from '../store/useSettingsStore';
import { ISLAMIC_EVENTS, getEventName } from '../data/islamicEvents';
import { tr } from '../i18n/tr';
import { en } from '../i18n/en';
import { ar } from '../i18n/ar';
import { getDailyHadith } from '../data/hadiths';
import { getDailyDua } from '../data/duas';
import { optionalPrayerReminderTimes } from './optionalPrayerService';

export interface PlannedNotification {
  identifier: string;
  date: Date;
  title: string;
  body: string;
  type: 'prayer' | 'early' | 'optionalPrayer' | 'dhikr' | 'hadith' | 'dua' | 'islamicDay';
}

export function isInSilentHours(date: Date, start: string, end: string): boolean {
  const cur = date.getHours() * 60 + date.getMinutes();
  const minutes = (value: string) => { const [h, m] = value.split(':').map(Number); return h * 60 + m; };
  const s = minutes(start), e = minutes(end);
  // Equal endpoints disable the quiet period; the ending minute is outside it.
  if (s === e) return false;
  return s < e ? cur >= s && cur < e : cur >= s || cur < e;
}

export function buildNotificationPlan(
  location: { lat: number; lng: number } | null,
  settings: AppSettings,
  now = new Date(),
): PlannedNotification[] {
  const plan: PlannedNotification[] = [];
  const language = settings.language;
  const t = ({ tr, en, ar }[language] ?? tr);
  const add = (item: PlannedNotification) => {
    const mustAlertForPrayer = item.type === 'prayer' || item.type === 'early';
    const isQuiet = isInSilentHours(item.date, settings.silentHours.start, settings.silentHours.end);
    if (item.date > now && (mustAlertForPrayer || !isQuiet)) plan.push(item);
  };
  const prayerKeys = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
  const labels = { fajr: t.prayerFajr, dhuhr: t.prayerDhuhr, asr: t.prayerAsr, maghrib: t.prayerMaghrib, isha: t.prayerIsha };
  for (let d = 0; d < 30; d++) {
    const day = new Date(now);
    day.setDate(day.getDate() + d);
    day.setHours(0, 0, 0, 0);
    const key = localDateKey(day);
    if (location && (settings.notifications.prayerTimes || settings.notifications.optionalPrayers)) {
      const times = calculatePrayerTimes(location.lat, location.lng, day);
      if (settings.notifications.prayerTimes) {
        for (const prayer of prayerKeys) {
          add({ identifier: `prayer_${prayer}_${key}`, date: times[prayer], type: 'prayer', title: `🕌 ${labels[prayer]}`, body: t.notifPrayerTimes });
          if (settings.notifications.earlyReminder) {
            add({ identifier: `early_${prayer}_${key}`, date: new Date(times[prayer].getTime() - 600000), type: 'early',
              title: `⏰ ${labels[prayer]}`, body: language === 'tr' ? 'Namaz vaktine 10 dakika kaldı.' : language === 'ar' ? 'بقيت عشر دقائق على الصلاة.' : 'Prayer begins in 10 minutes.' });
          }
        }
      }
      if (settings.notifications.optionalPrayers) {
        const optional = optionalPrayerReminderTimes(times);
        add({ identifier: `optional_ishraq_${key}`, date: optional.ishraq, type: 'optionalPrayer', title: `☀️ ${t.optionalIshraq}`, body: t.notifOptionalIshraqBody });
        add({ identifier: `optional_awwabin_${key}`, date: optional.awwabin, type: 'optionalPrayer', title: `🌙 ${t.optionalAwwabin}`, body: t.notifOptionalAwwabinBody });
      }
    }
    const at = (hour: number) => { const date = new Date(day); date.setHours(hour); return date; };
    if (settings.notifications.dhikrReminder) add({ identifier: `dhikr_${key}`, date: at(21), type: 'dhikr', title: t.notifDhikr, body: t.notifDhikrDesc });
    if (settings.notifications.dailyHadith) {
      const hadith = getDailyHadith(day);
      add({ identifier: `hadith_${key}`, date: at(10), type: 'hadith', title: t.notifDailyHadith, body: language === 'ar' ? hadith.ar : language === 'en' ? hadith.en : hadith.text });
    }
    if (settings.notifications.dailyDua) {
      const dua = getDailyDua(day);
      add({ identifier: `dua_${key}`, date: at(11), type: 'dua', title: t.notifDailyDua, body: language === 'ar' ? dua.arabic : language === 'en' ? dua.english : dua.turkish });
    }
  }
  const notifiedEventIds = settings.notifiedEventIds ?? [];
  if (settings.notifications.islamicDays && notifiedEventIds.length > 0) {
    const blessing = { bayram: t.islamicDayBlessingBayram, kandil: t.islamicDayBlessingKandil, ozel: t.islamicDayBlessingOzel };
    for (const event of ISLAMIC_EVENTS) {
      if (!notifiedEventIds.includes(event.id)) continue;
      const [y, m, d] = event.date.split('-').map(Number);
      const name = getEventName(event, language);
      add({
        identifier: `islamicday_${event.id}`,
        date: new Date(y, m - 1, d, 8),
        type: 'islamicDay',
        title: `🌙 ${t.notifIslamicDayToday.replace('{event}', name)}`,
        body: blessing[event.type],
      });
    }
  }
  return plan.sort((a, b) => a.date.getTime() - b.date.getTime());
}
