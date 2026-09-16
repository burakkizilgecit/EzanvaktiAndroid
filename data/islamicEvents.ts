// Official dates: https://vakithesaplama.diyanet.gov.tr/icerik.php?icerik=153
// https://vakithesaplama.diyanet.gov.tr/icerik.php?icerik=154
export interface IslamicEvent {
  id: string;
  name: string;
  name_en: string;
  name_ar: string;
  date: string;
  type: 'bayram' | 'kandil' | 'ozel';
  description?: string;
  description_en?: string;
  description_ar?: string;
}

export function getEventName(event: IslamicEvent, language: string): string {
  if (language === 'en') return event.name_en;
  if (language === 'ar') return event.name_ar;
  return event.name;
}

export function getEventDescription(event: IslamicEvent, language: string): string | undefined {
  if (language === 'en') return event.description_en ?? event.description;
  if (language === 'ar') return event.description_ar ?? event.description;
  return event.description;
}

export const ISLAMIC_EVENTS: IslamicEvent[] = [
  // 2025
  {
    id: '2025-regaip', date: '2025-01-02', type: 'kandil',
    name: 'Regaip Kandili', name_en: 'Laylat al-Raghaib', name_ar: 'ليلة الرغائب',
    description: 'Recep ayının ilk Cuma gecesi', description_en: 'First Friday night of Rajab', description_ar: 'أول ليلة جمعة من رجب',
  },
  {
    id: '2025-mirac', date: '2025-01-27', type: 'kandil',
    name: 'Miraç Kandili', name_en: "Laylat al-Mi'raj", name_ar: 'ليلة المعراج',
    description: 'Hz. Peygamberin miracının yıldönümü', description_en: "Anniversary of the Prophet's Ascension", description_ar: 'ذكرى معراج النبي ﷺ',
  },
  {
    id: '2025-berat', date: '2025-02-14', type: 'kandil',
    name: 'Berat Kandili', name_en: "Laylat al-Bara'ah", name_ar: 'ليلة البراءة',
    description: 'Şaban ayının 15. gecesi', description_en: '15th night of Sha\'ban', description_ar: 'ليلة النصف من شعبان',
  },
  {
    id: '2025-ramazan', date: '2025-03-01', type: 'ozel',
    name: 'Ramazan Başlangıcı', name_en: 'Start of Ramadan', name_ar: 'بداية رمضان',
    description: "Ramazan-ı Şerif'in başlangıcı", description_en: 'Beginning of the blessed month of Ramadan', description_ar: 'بداية شهر رمضان المبارك',
  },
  {
    id: '2025-kadir', date: '2025-03-27', type: 'kandil',
    name: 'Kadir Gecesi', name_en: 'Laylat al-Qadr', name_ar: 'ليلة القدر',
    description: 'Ramazanın 27. gecesi', description_en: '27th night of Ramadan', description_ar: 'ليلة السابع والعشرين من رمضان',
  },
  {
    id: '2025-fıtr', date: '2025-03-30', type: 'bayram',
    name: 'Ramazan Bayramı', name_en: 'Eid al-Fitr', name_ar: 'عيد الفطر',
    description: 'Ramazan Bayramı (3 gün)', description_en: 'Eid al-Fitr (3 days)', description_ar: 'عيد الفطر (3 أيام)',
  },
  {
    id: '2025-adha', date: '2025-06-06', type: 'bayram',
    name: 'Kurban Bayramı', name_en: 'Eid al-Adha', name_ar: 'عيد الأضحى',
    description: 'Kurban Bayramı (4 gün)', description_en: 'Eid al-Adha (4 days)', description_ar: 'عيد الأضحى (4 أيام)',
  },
  {
    id: '2025-hicri', date: '2025-06-26', type: 'ozel',
    name: 'Hicri Yılbaşı', name_en: 'Islamic New Year', name_ar: 'رأس السنة الهجرية',
    description: 'Hicri 1447 yılının başlangıcı', description_en: 'Beginning of Hijri year 1447', description_ar: 'بداية العام الهجري 1447',
  },
  {
    id: '2025-asure', date: '2025-07-05', type: 'ozel',
    name: 'Aşure Günü', name_en: 'Day of Ashura', name_ar: 'يوم عاشوراء',
    description: 'Muharremin 10. günü', description_en: '10th day of Muharram', description_ar: 'اليوم العاشر من محرم',
  },
  {
    id: '2025-mevlid', date: '2025-09-04', type: 'kandil',
    name: 'Mevlid Kandili', name_en: 'Mawlid al-Nabi', name_ar: 'المولد النبوي',
    description: 'Hz. Peygamberin doğum yıldönümü', description_en: "Anniversary of the Prophet's birth", description_ar: 'ذكرى مولد النبي ﷺ',
  },

  // 2026
  {
    id: '2026-regaip', date: '2026-12-10', type: 'kandil',
    name: 'Regaip Kandili', name_en: 'Laylat al-Raghaib', name_ar: 'ليلة الرغائب',
  },
  {
    id: '2026-mirac', date: '2026-01-15', type: 'kandil',
    name: 'Miraç Kandili', name_en: "Laylat al-Mi'raj", name_ar: 'ليلة المعراج',
  },
  {
    id: '2026-berat', date: '2026-02-02', type: 'kandil',
    name: 'Berat Kandili', name_en: "Laylat al-Bara'ah", name_ar: 'ليلة البراءة',
  },
  {
    id: '2026-ramazan', date: '2026-02-19', type: 'ozel',
    name: 'Ramazan Başlangıcı', name_en: 'Start of Ramadan', name_ar: 'بداية رمضان',
  },
  {
    id: '2026-kadir', date: '2026-03-16', type: 'kandil',
    name: 'Kadir Gecesi', name_en: 'Laylat al-Qadr', name_ar: 'ليلة القدر',
  },
  {
    id: '2026-fıtr', date: '2026-03-20', type: 'bayram',
    name: 'Ramazan Bayramı', name_en: 'Eid al-Fitr', name_ar: 'عيد الفطر',
  },
  {
    id: '2026-adha', date: '2026-05-27', type: 'bayram',
    name: 'Kurban Bayramı', name_en: 'Eid al-Adha', name_ar: 'عيد الأضحى',
  },
  {
    id: '2026-hicri', date: '2026-06-16', type: 'ozel',
    name: 'Hicri Yılbaşı', name_en: 'Islamic New Year', name_ar: 'رأس السنة الهجرية',
  },
  {
    id: '2026-mevlid', date: '2026-08-24', type: 'kandil',
    name: 'Mevlid Kandili', name_en: 'Mawlid al-Nabi', name_ar: 'المولد النبوي',
  },
  // Verified against Diyanet (2026: icerik=153, 2027: icerik=154), 2026-09-14.
  {"id":"2026-asure","date":"2026-06-25","type":"ozel","name":"Aşure Günü","name_en":"Day of Ashura","name_ar":"يوم عاشوراء","description":"Muharremin 10. günü","description_en":"10th day of Muharram","description_ar":"اليوم العاشر من محرم"},
  {"id":"2027-mirac","date":"2027-01-04","type":"kandil","name":"Miraç Kandili","name_en":"Laylat al-Mi'raj","name_ar":"ليلة المعراج"},
  {"id":"2027-berat","date":"2027-01-22","type":"kandil","name":"Berat Kandili","name_en":"Laylat al-Bara'ah","name_ar":"ليلة البراءة"},
  {"id":"2027-ramazan","date":"2027-02-08","type":"ozel","name":"Ramazan Başlangıcı","name_en":"Start of Ramadan","name_ar":"بداية رمضان"},
  {"id":"2027-kadir","date":"2027-03-05","type":"kandil","name":"Kadir Gecesi","name_en":"Laylat al-Qadr","name_ar":"ليلة القدر"},
  {"id":"2027-fıtr","date":"2027-03-09","type":"bayram","name":"Ramazan Bayramı","name_en":"Eid al-Fitr","name_ar":"عيد الفطر"},
  {"id":"2027-adha","date":"2027-05-16","type":"bayram","name":"Kurban Bayramı","name_en":"Eid al-Adha","name_ar":"عيد الأضحى"},
  {"id":"2027-hicri","date":"2027-06-06","type":"ozel","name":"Hicri Yılbaşı","name_en":"Islamic New Year","name_ar":"رأس السنة الهجرية"},
  {"id":"2027-asure","date":"2027-06-15","type":"ozel","name":"Aşure Günü","name_en":"Day of Ashura","name_ar":"يوم عاشوراء"},
  {"id":"2027-mevlid","date":"2027-08-13","type":"kandil","name":"Mevlid Kandili","name_en":"Mawlid al-Nabi","name_ar":"المولد النبوي"},
  {"id":"2027-regaip","date":"2027-12-02","type":"kandil","name":"Regaip Kandili","name_en":"Laylat al-Raghaib","name_ar":"ليلة الرغائب"},
  {"id":"2027-mirac-2","date":"2027-12-24","type":"kandil","name":"Miraç Kandili","name_en":"Laylat al-Mi'raj","name_ar":"ليلة المعراج"},
  {"id":"2026-uc-aylar","date":"2026-12-10","type":"ozel","name":"Üç Ayların Başlangıcı","name_en":"Start of the Three Holy Months","name_ar":"بداية الأشهر الثلاثة"},
  {"id":"2027-uc-aylar","date":"2027-11-29","type":"ozel","name":"Üç Ayların Başlangıcı","name_en":"Start of the Three Holy Months","name_ar":"بداية الأشهر الثلاثة"},
];

export function getUpcomingEvents(count = 5): (IslamicEvent & { daysLeft: number })[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return ISLAMIC_EVENTS
    .map(e => {
      const [year, month, day] = e.date.split('-').map(Number);
      const daysLeft = Math.round((Date.UTC(year, month - 1, day) - Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000);
      return { ...e, daysLeft };
    })
    .filter(e => e.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, count);
}

export function getEventsByMonth(year: number, month: number): IslamicEvent[] {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return ISLAMIC_EVENTS.filter(e => e.date.startsWith(prefix));
}
