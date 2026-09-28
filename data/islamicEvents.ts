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

export interface IslamicEventInfo {
  summary: string;
  significance: string;
  observances: string;
}

type SupportedEventLanguage = 'tr' | 'en' | 'ar';
type LocalizedEventInfo = Record<SupportedEventLanguage, IslamicEventInfo>;

const EVENT_INFO: Record<string, LocalizedEventInfo> = {
  regaip: {
    tr: { summary: 'Recep ayının ilk cuma gecesi olarak anılır.', significance: 'Türk-İslam geleneğinde üç ayların manevi iklimine yönelişi ve Ramazan’a hazırlığı simgeler.', observances: 'Dua, tövbe, Kur’an okuma, salavat ve gönüllü ibadetlerle değerlendirilebilir.' },
    en: { summary: 'It is observed on the first Friday night of Rajab.', significance: 'In Turkish Muslim tradition, it marks a spiritual turn toward the Three Holy Months and preparation for Ramadan.', observances: 'It may be observed with supplication, repentance, Quran recitation, salawat and voluntary worship.' },
    ar: { summary: 'تُحيى في أول ليلة جمعة من شهر رجب.', significance: 'ترمز في التقليد الإسلامي التركي إلى الاستعداد الروحي للأشهر المباركة وشهر رمضان.', observances: 'يمكن إحياؤها بالدعاء والتوبة وتلاوة القرآن والصلاة على النبي والنوافل.' },
  },
  mirac: {
    tr: { summary: 'Hz. Muhammed’in İsra ve Miraç yolculuğunu anma gecesidir.', significance: 'Miraç, Allah’ın kudretini ve kulluğun önemini hatırlatır; beş vakit namazın farz kılınması bu geceyle ilişkilendirilir.', observances: 'Namaz, dua, Kur’an okuma, salavat ve olayın anlamı üzerine tefekkürle değerlendirilebilir.' },
    en: { summary: "It commemorates Prophet Muhammad's Night Journey and Ascension.", significance: 'It recalls the power of Allah and the importance of worship; the five daily prayers are traditionally associated with this event.', observances: 'It may be observed with prayer, supplication, Quran recitation, salawat and reflection.' },
    ar: { summary: 'هي ليلة إحياء ذكرى الإسراء والمعراج للنبي محمد ﷺ.', significance: 'تذكّر بقدرة الله وأهمية العبودية، وترتبط بفرض الصلوات الخمس.', observances: 'يمكن إحياؤها بالصلاة والدعاء وتلاوة القرآن والصلاة على النبي والتفكر.' },
  },
  berat: {
    tr: { summary: 'Şaban ayının on beşinci gecesi olarak anılır.', significance: 'Birçok Müslüman toplumda bağışlanma dileme, tövbe ve Ramazan’a manevi hazırlık gecesi kabul edilir; uygulamalar bölgelere göre değişebilir.', observances: 'Dua, tövbe, Kur’an okuma, nafile ibadet ve kırgınlıkları giderme ile değerlendirilebilir.' },
    en: { summary: "It is observed on the fifteenth night of Sha'ban.", significance: 'Many Muslim communities regard it as a time for seeking forgiveness, repentance and spiritual preparation for Ramadan; practices vary by region.', observances: 'It may be observed with supplication, repentance, Quran recitation, voluntary worship and reconciliation.' },
    ar: { summary: 'هي ليلة النصف من شهر شعبان.', significance: 'يعدّها كثير من المسلمين مناسبة لطلب المغفرة والتوبة والاستعداد لرمضان، مع اختلاف العادات بين البلدان.', observances: 'يمكن إحياؤها بالدعاء والتوبة وتلاوة القرآن والنوافل وإصلاح ذات البين.' },
  },
  ramazan: {
    tr: { summary: 'Oruç ayı Ramazan’ın başladığı gündür.', significance: 'Ramazan; oruç, Kur’an, ibadet, paylaşma ve dayanışmanın öne çıktığı mübarek aydır.', observances: 'İmsak ve iftar vakitlerine dikkat edilir; oruç, teravih, Kur’an okuma, dua ve sadakaya ağırlık verilir.' },
    en: { summary: 'It marks the beginning of Ramadan, the month of fasting.', significance: 'Ramadan is a blessed month centered on fasting, the Quran, worship, generosity and solidarity.', observances: 'Muslims observe fasting times and give special attention to taraweeh, Quran recitation, supplication and charity.' },
    ar: { summary: 'هو بداية شهر رمضان، شهر الصيام.', significance: 'رمضان شهر مبارك تبرز فيه عبادة الصيام والقرآن والعبادة والتكافل.', observances: 'تُراعى أوقات الإمساك والإفطار ويُعتنى بالتراويح وتلاوة القرآن والدعاء والصدقة.' },
  },
  kadir: {
    tr: { summary: 'Kur’an’ın indirilmeye başlandığı mübarek gecedir ve Ramazan’ın son on gecesinde aranır.', significance: 'Kur’an’da Kadir Gecesi’nin bin aydan hayırlı olduğu bildirilir (Kadr 97:3). Takvimlerde çoğunlukla Ramazan’ın 27. gecesi gösterilir.', observances: 'Namaz, dua, Kur’an okuma, tövbe ve bağışlanma dileğiyle değerlendirilebilir.' },
    en: { summary: 'It is the blessed night on which the Quran began to be revealed and is sought during the last ten nights of Ramadan.', significance: 'The Quran describes Laylat al-Qadr as better than a thousand months (97:3). Calendars commonly mark the 27th night of Ramadan.', observances: 'It may be observed with prayer, supplication, Quran recitation, repentance and seeking forgiveness.' },
    ar: { summary: 'هي الليلة المباركة التي بدأ فيها نزول القرآن، وتُلتمس في العشر الأواخر من رمضان.', significance: 'ذكر القرآن أن ليلة القدر خير من ألف شهر (القدر 3)، وتُحدد في التقويم غالبًا بليلة السابع والعشرين.', observances: 'تُحيى بالصلاة والدعاء وتلاوة القرآن والتوبة والاستغفار.' },
  },
  fıtr: {
    tr: { summary: 'Ramazan ayının tamamlanmasıyla başlayan bayramdır.', significance: 'Oruç ibadetinin ardından şükür, sevinç, paylaşma ve toplumsal dayanışma günleridir.', observances: 'Bayram namazı kılınır, fitre ihtiyaç sahiplerine ulaştırılır; aile, akraba ve komşular ziyaret edilir. Bayramın ilk günü oruç tutulmaz.' },
    en: { summary: 'It is the festival that begins when Ramadan is completed.', significance: 'It is a time of gratitude, joy, sharing and community after the month of fasting.', observances: 'Muslims perform the Eid prayer, give Zakat al-Fitr, and visit family and neighbours. Fasting on the first day is not permitted.' },
    ar: { summary: 'هو العيد الذي يبدأ بعد إتمام شهر رمضان.', significance: 'هو وقت للشكر والفرح والتكافل بعد شهر الصيام.', observances: 'تُقام صلاة العيد وتُخرج زكاة الفطر وتُزار الأرحام والجيران، ولا يجوز صيام اليوم الأول.' },
  },
  adha: {
    tr: { summary: 'Hac mevsiminde kutlanan ve kurban ibadetinin yerine getirildiği bayramdır.', significance: 'Hz. İbrahim’in teslimiyetini ve Allah’a yakınlaşma niyetini hatırlatır; hac ibadetiyle aynı döneme denk gelir.', observances: 'Bayram namazı kılınır; şartları taşıyanlar kurban keser, etini yakınları ve ihtiyaç sahipleriyle paylaşır.' },
    en: { summary: 'It is the festival during the Hajj season when the sacrifice is offered.', significance: "It recalls Prophet Ibrahim's devotion and the intention to draw closer to Allah, and coincides with Hajj.", observances: 'Muslims perform the Eid prayer; those who meet the conditions offer a sacrifice and share its meat with family and people in need.' },
    ar: { summary: 'هو العيد الذي يأتي في موسم الحج وتُؤدى فيه الأضحية.', significance: 'يذكّر بتسليم إبراهيم عليه السلام لله وطلب القرب منه، ويتزامن مع الحج.', observances: 'تُقام صلاة العيد ويضحي المستطيع ويوزّع من اللحم على الأقارب والمحتاجين.' },
  },
  hicri: {
    tr: { summary: 'Muharrem ayının ilk günüyle başlayan yeni hicri yıldır.', significance: 'Hicretin İslam tarihindeki yerini hatırlatır ve geçen yılın muhasebesi için bir vesiledir.', observances: 'Şükür, dua, tefekkür ve yeni yıl için iyi niyetlerle değerlendirilebilir; bu güne özgü zorunlu bir ibadet yoktur.' },
    en: { summary: 'It is the new Hijri year beginning on the first day of Muharram.', significance: 'It recalls the place of the Hijra in Islamic history and offers an occasion for reflection on the past year.', observances: 'It may be marked with gratitude, supplication, reflection and good intentions; there is no obligatory ritual specific to this day.' },
    ar: { summary: 'هو بداية العام الهجري الجديد في أول يوم من محرم.', significance: 'يذكّر بمكانة الهجرة في التاريخ الإسلامي ويتيح فرصة لمحاسبة النفس على العام الماضي.', observances: 'يمكن استقباله بالشكر والدعاء والتفكر والنية الصالحة، ولا توجد عبادة واجبة خاصة بهذا اليوم.' },
  },
  asure: {
    tr: { summary: 'Muharrem ayının onuncu günüdür.', significance: 'Hz. Musa ve beraberindekilerin kurtuluşunu hatırlatan bir gündür. Kerbelâ’da Hz. Hüseyin ve yakınlarının şehadeti de bu günde anılır.', observances: 'Muharrem’in 9-10. veya 10-11. günlerinde oruç tutulması tavsiye edilir; dua, paylaşma ve tefekkürle değerlendirilebilir.' },
    en: { summary: 'It is the tenth day of Muharram.', significance: 'It recalls the deliverance of Prophet Musa and his people. It also commemorates the martyrdom of Husayn and his companions at Karbala.', observances: 'Fasting on the 9th and 10th or the 10th and 11th of Muharram is recommended; the day may also include supplication, sharing and reflection.' },
    ar: { summary: 'هو اليوم العاشر من شهر محرم.', significance: 'يذكّر بنجاة موسى عليه السلام وقومه، كما تُستذكر فيه شهادة الحسين وأصحابه في كربلاء.', observances: 'يُستحب صيام التاسع والعاشر أو العاشر والحادي عشر من محرم، مع الدعاء والتكافل والتفكر.' },
  },
  mevlid: {
    tr: { summary: 'Hz. Muhammed’in doğumunu anma gecesidir.', significance: 'Peygamberimizin hayatını, güzel ahlakını ve insanlığa mesajını yeniden hatırlamaya vesile olur; anma biçimleri toplumlara göre değişebilir.', observances: 'Kur’an okuma, salavat, siyer öğrenme, dua ve hayır işleriyle değerlendirilebilir.' },
    en: { summary: "It commemorates the birth of Prophet Muhammad.", significance: 'It offers an occasion to remember his life, character and message; forms of observance vary among Muslim communities.', observances: 'It may be observed with Quran recitation, salawat, learning the Seerah, supplication and charitable acts.' },
    ar: { summary: 'هي مناسبة لإحياء ذكرى مولد النبي محمد ﷺ.', significance: 'تتيح تذكّر سيرته وأخلاقه ورسالته، وتختلف صور الاحتفال بين المجتمعات الإسلامية.', observances: 'يمكن إحياؤها بتلاوة القرآن والصلاة على النبي وتعلّم السيرة والدعاء وأعمال الخير.' },
  },
  'uc-aylar': {
    tr: { summary: 'Recep, Şaban ve Ramazan aylarından oluşan dönemin başlangıcıdır.', significance: 'Türk-İslam geleneğinde manevi yenilenme ve Ramazan’a hazırlık dönemi kabul edilir.', observances: 'Tövbe, dua, Kur’an okuma, gönüllü ibadet, sadaka ve güzel alışkanlıklar için başlangıç yapılabilir.' },
    en: { summary: "It marks the beginning of Rajab, Sha'ban and Ramadan, known in Turkish tradition as the Three Holy Months.", significance: 'It is regarded as a period of spiritual renewal and preparation for Ramadan.', observances: 'It may begin a period of repentance, supplication, Quran recitation, voluntary worship, charity and good habits.' },
    ar: { summary: 'هي بداية فترة رجب وشعبان ورمضان المعروفة في التقليد التركي بالأشهر الثلاثة.', significance: 'تُعد فترة للتجدد الروحي والاستعداد لشهر رمضان.', observances: 'يمكن البدء فيها بالتوبة والدعاء وتلاوة القرآن والنوافل والصدقة والعادات الحسنة.' },
  },
};

function getEventInfoKey(event: IslamicEvent): string {
  return event.id.replace(/^\d{4}-/, '').replace(/-\d+$/, '');
}

export function getEventInfo(event: IslamicEvent, language: string): IslamicEventInfo {
  const info = EVENT_INFO[getEventInfoKey(event)] ?? EVENT_INFO.hicri;
  const supportedLanguage: SupportedEventLanguage = language === 'en' || language === 'ar' ? language : 'tr';
  return info[supportedLanguage];
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
