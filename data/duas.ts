export interface Dua {
  id: string;
  title: string;
  title_en: string;
  title_ar?: string;
  arabic: string;
  turkish: string;
  english: string;
  source: string;
  category: string;
}

export function getDuaTitle(dua: Dua, language: string): string {
  if (language === 'ar') return dua.title_ar ?? dua.title_en;
  if (language === 'en') return dua.title_en;
  return dua.title;
}

export function getDuaTranslation(dua: Dua, language: string): string {
  if (language === 'en') return dua.english;
  if (language === 'ar') return dua.english;
  return dua.turkish;
}

export const DUA_CATEGORIES = [
  { id: 'all',     labelKey: 'duaCatAll' },
  { id: 'morning', labelKey: 'duaCatMorning' },
  { id: 'prayer',  labelKey: 'duaCatPrayer' },
  { id: 'daily',   labelKey: 'duaCatDaily' },
  { id: 'quran',   labelKey: 'duaCatQuran' },
  { id: 'special', labelKey: 'duaCatSpecial' },
];

export const DUAS: Dua[] = [
  {
    id: '1', category: 'morning',
    title: 'Sabah Duası', title_en: 'Morning Supplication',
    arabic: 'اَللّٰهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ',
    turkish: "Allah'ım! Senin adınla sabaha erdik, senin adınla akşama erdik, senin adınla yaşar ve senin adınla ölürüz. Dönüş de sanadır.",
    english: 'O Allah! By Your leave we have reached the morning and by Your leave we have reached the evening, by Your leave we live and die and unto You is our resurrection.',
    source: 'Tirmizi, 3391',
  },
  {
    id: '2', category: 'morning',
    title: 'Akşam Duası', title_en: 'Evening Supplication',
    arabic: 'اَللّٰهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ',
    turkish: "Allah'ım! Senin adınla akşama erdik, senin adınla sabaha erdik, senin adınla yaşar ve senin adınla ölürüz. Dönüş de sanadır.",
    english: 'O Allah! By Your leave we have reached the evening and by Your leave we have reached the morning, by Your leave we live and die and unto You is our return.',
    source: 'Tirmizi, 3391',
  },
  {
    id: '3', category: 'daily',
    title: 'Yemek Duası', title_en: 'Meal Supplication',
    arabic: 'بِسْمِ اللّٰهِ وَعَلٰى بَرَكَةِ اللّٰهِ',
    turkish: "Allah'ın adıyla ve Allah'ın bereketi üzerine (yiyorum).",
    english: 'In the name of Allah and with the blessings of Allah.',
    source: 'Ebû Dâvûd, 3767',
  },
  {
    id: '4', category: 'daily',
    title: 'Yemek Sonrası Duası', title_en: 'After Meal Supplication',
    arabic: 'اَلْحَمْدُ لِلّٰهِ الَّذِى أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ',
    turkish: "Bizi yedirip içiren ve bizi Müslüman kılan Allah'a hamdolsun.",
    english: 'All praise is due to Allah Who fed us, gave us drink, and made us Muslims.',
    source: 'Tirmizi, 3457',
  },
  {
    id: '5', category: 'daily',
    title: 'Uyku Duası', title_en: 'Sleep Supplication',
    arabic: 'بِاسْمِكَ اللّٰهُمَّ أَمُوتُ وَأَحْيَا',
    turkish: "Allah'ım! Senin adınla ölür (uyur) ve dirilir (uyanırım).",
    english: 'O Allah! In Your name I die and I live.',
    source: 'Buhârî, 6312',
  },
  {
    id: '6', category: 'daily',
    title: 'Uyanış Duası', title_en: 'Waking Up Supplication',
    arabic: 'اَلْحَمْدُ لِلّٰهِ الَّذِى أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',
    turkish: "Bizi öldürdükten sonra dirilten Allah'a hamdolsun. Dönüş de O'nadır.",
    english: 'All praise is due to Allah Who gave us life after He had caused us to die, and unto Him is the resurrection.',
    source: 'Buhârî, 6312',
  },
  {
    id: '7', category: 'daily',
    title: 'Eve Girerken', title_en: 'Entering Home',
    arabic: 'اَللّٰهُمَّ إِنِّى أَسْأَلُكَ خَيْرَ الْمَوْلِجِ وَخَيْرَ الْمَخْرَجِ',
    turkish: "Allah'ım! Girişinin hayrını ve çıkışının hayrını senden istiyorum.",
    english: 'O Allah! I ask You for the good of the entrance and the good of the exit.',
    source: 'Ebû Dâvûd, 5096',
  },
  {
    id: '8', category: 'daily',
    title: 'Tuvalete Girerken', title_en: 'Entering Restroom',
    arabic: 'اَللّٰهُمَّ إِنِّى أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ',
    turkish: "Allah'ım! Erkek ve dişi şeytanlardan sana sığınırım.",
    english: 'O Allah! I seek refuge in You from male and female devils.',
    source: 'Buhârî, 142',
  },
  {
    id: '9', category: 'prayer',
    title: 'Namaz Öncesi Niyet', title_en: 'Intention Before Prayer',
    arabic: 'اَللّٰهُمَّ إِنِّى أُرِيدُ أَنْ أُصَلِّىَ',
    turkish: "Allah'ım! Namaz kılmayı niyyet ediyorum.",
    english: 'O Allah! I intend to pray.',
    source: 'Genel',
  },
  {
    id: '10', category: 'prayer',
    title: 'Sübhaneke', title_en: 'Opening Supplication (Subhanaka)',
    arabic: 'سُبْحَانَكَ اللّٰهُمَّ وَبِحَمْدِكَ وَتَبَارَكَ اسْمُكَ وَتَعَالٰى جَدُّكَ وَلَا إِلٰهَ غَيْرُكَ',
    turkish: "Allah'ım! Seni eksikliklerden tenzih eder, sana hamdederim. İsmin mübarektir, şanın yücedir. Senden başka ilah yoktur.",
    english: 'Glory be to You, O Allah, and praise be to You. Blessed is Your name and exalted is Your majesty. There is no god but You.',
    source: 'Ebû Dâvûd, 775',
  },
  {
    id: '11', category: 'quran',
    title: 'Fatiha Suresi', title_en: 'Surah Al-Fatiha',
    arabic: "بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ\nاَلْحَمْدُ لِلّٰهِ رَبِّ الْعَالَمِينَ\nالرَّحْمٰنِ الرَّحِيمِ\nمَالِكِ يَوْمِ الدِّينِ\nإِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ\nاِهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ\nصِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
    turkish: "Rahman ve Rahim olan Allah'ın adıyla.\nÂlemlerin Rabbi Allah'a hamdolsun.\nO Rahman'dır, Rahim'dir.\nDin gününün sahibidir.\nYalnız sana ibadet eder, yalnız senden yardım dileriz.\nBizi doğru yola ilet.\nNimet verdiklerinin yoluna; gazaba uğrayanların ve sapıtanların yoluna değil.",
    english: "In the name of Allah, the Most Gracious, the Most Merciful.\nAll praise is due to Allah, Lord of all worlds.\nThe Most Gracious, the Most Merciful.\nMaster of the Day of Judgment.\nYou alone we worship, and You alone we ask for help.\nGuide us on the straight path.\nThe path of those upon whom You have bestowed favor; not of those who have earned anger or those who are astray.",
    source: "Kur'an-ı Kerim, 1. Sure",
  },
  {
    id: '12', category: 'quran',
    title: 'Ayetel Kürsi', title_en: 'Ayat Al-Kursi',
    arabic: 'اَللّٰهُ لَا إِلٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ',
    turkish: "Allah, kendisinden başka hiçbir ilah olmayandır. O, Hay'dır, Kayyum'dur. O'nu ne bir uyuklama, ne de uyku tutar.",
    english: "Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence. Neither drowsiness overtakes Him nor sleep.",
    source: 'Bakara, 255',
  },
  {
    id: '13', category: 'special',
    title: 'Salavat-ı Şerife', title_en: 'Salawat (Blessings upon the Prophet)',
    arabic: 'اَللّٰهُمَّ صَلِّ عَلٰى مُحَمَّدٍ وَعَلٰى اٰلِ مُحَمَّدٍ',
    turkish: "Allah'ım! Hz. Muhammed'e ve onun aile efradına salât eyle.",
    english: 'O Allah! Send blessings upon Muhammad and upon the family of Muhammad.',
    source: 'Buhârî, 3370',
  },
  {
    id: '14', category: 'special',
    title: 'İstiğfar', title_en: 'Seeking Forgiveness (Istighfar)',
    arabic: 'أَسْتَغْفِرُ اللّٰهَ الْعَظِيمَ الَّذِى لَا إِلٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ',
    turkish: "Kendisinden başka ilah olmayan, Hay ve Kayyum olan Azim Allah'tan bağışlanma diler ve O'na tövbe ederim.",
    english: "I seek forgiveness from Allah the Almighty, beside Whom there is no god, the Ever-Living, the Eternal, and I repent to Him.",
    source: 'Tirmizi, 3577',
  },
  {
    id: '15', category: 'special',
    title: 'Yolculuk Duası', title_en: 'Travel Supplication',
    arabic: 'اَللّٰهُمَّ إِنَّا نَسْأَلُكَ فِى سَفَرِنَا هٰذَا الْبِرَّ وَالتَّقْوٰى',
    turkish: "Allah'ım! Bu yolculuğumuzda senden iyilik ve takva istiyoruz.",
    english: 'O Allah! We ask You in this journey for righteousness and piety.',
    source: 'Müslim, 1342',
  },
  {
    id: '16', category: 'morning',
    title: 'Sabah Sığınma Duası', title_en: 'Morning Protection Supplication',
    arabic: 'أَعُوذُ بِكَلِمَاتِ اللّٰهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
    turkish: "Allah'ın eksiksiz kelimelerine sığınırım, yarattığı şeylerin şerrinden.",
    english: "I seek refuge in Allah's perfect words from the evil of what He has created.",
    source: 'Müslim, 2708',
  },
  {
    id: '17', category: 'daily',
    title: 'Evden Çıkarken', title_en: 'Leaving Home',
    arabic: 'بِسْمِ اللّٰهِ تَوَكَّلْتُ عَلَى اللّٰهِ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ',
    turkish: "Allah'ın adıyla, Allah'a tevekkül ettim. Güç ve kuvvet ancak Allah'tandır.",
    english: 'In the name of Allah, I place my trust in Allah; there is no power and no strength except with Allah.',
    source: 'Ebû Dâvûd, Tirmizi',
  },
  {
    id: '18', category: 'prayer',
    title: 'Rükû Duası', title_en: 'Supplication in Ruku',
    arabic: 'سُبْحَانَ رَبِّيَ الْعَظِيمِ',
    turkish: 'Yüce Rabbimi tesbih ederim.',
    english: 'Glory be to my Lord, the Most Great.',
    source: 'Müslim, 772',
  },
  {
    id: '19', category: 'prayer',
    title: 'Secde Duası', title_en: 'Supplication in Sujud',
    arabic: 'سُبْحَانَ رَبِّيَ الْأَعْلَى',
    turkish: 'Yüce Rabbimi tesbih ederim.',
    english: 'Glory be to my Lord, the Most High.',
    source: 'Müslim, 772',
  },
  {
    id: '20', category: 'prayer',
    title: 'Namazdan Sonra Zikir', title_en: 'Supplication After Prayer',
    arabic: 'اَللّٰهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
    turkish: "Allah'ım! Sen selamsın (esenlik kaynağısın), esenlik sendendir. Ey celal ve ikram sahibi, sen yücesin.",
    english: 'O Allah, You are Peace and from You comes peace. Blessed are You, O Owner of majesty and honor.',
    source: 'Müslim, 591',
  },
  {
    id: '21', category: 'prayer',
    title: 'Ezandan Sonra Okunan Dua', title_en: 'Supplication After the Call to Prayer',
    arabic: 'اَللّٰهُمَّ رَبَّ هٰذِهِ الدَّعْوَةِ التَّامَّةِ وَالصَّلَاةِ الْقَائِمَةِ آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ',
    turkish: "Allah'ım! Bu eksiksiz davetin ve kılınacak namazın Rabbi! Muhammed'e vesile ve fazileti ver.",
    english: 'O Allah, Lord of this perfect call and this prayer about to be established, grant Muhammad the intercession and favor.',
    source: 'Buhârî, 614',
  },
  {
    id: '22', category: 'daily',
    title: 'Aynaya Bakarken', title_en: 'Looking in the Mirror',
    arabic: 'اَللّٰهُمَّ كَمَا حَسَّنْتَ خَلْقِي فَحَسِّنْ خُلُقِي',
    turkish: "Allah'ım! Yaratılışımı güzel kıldığın gibi ahlakımı da güzelleştir.",
    english: 'O Allah, just as You have made my outer form good, make my character good as well.',
    source: 'Ahmed b. Hanbel',
  },
  {
    id: '23', category: 'daily',
    title: 'Yağmur Duası', title_en: 'Rain Supplication',
    arabic: 'اَللّٰهُمَّ صَيِّبًا نَافِعًا',
    turkish: "Allah'ım! Faydalı bir yağmur (ver).",
    english: 'O Allah, (send) beneficial rain.',
    source: 'Buhârî, 1032',
  },
  {
    id: '24', category: 'daily',
    title: 'Sıkıntı Anında (Hz. Yunus\'un Duası)', title_en: 'Supplication in Distress (Dua of Prophet Yunus)',
    arabic: 'لَا إِلٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',
    turkish: 'Senden başka ilah yoktur. Seni eksikliklerden tenzih ederim. Gerçekten ben zalimlerden oldum.',
    english: 'There is no god but You, glory be to You; indeed, I have been among the wrongdoers.',
    source: 'Enbiyâ, 87',
  },
  {
    id: '25', category: 'daily',
    title: 'Hasta İçin Dua', title_en: 'Supplication for the Sick',
    arabic: 'أَسْأَلُ اللّٰهَ الْعَظِيمَ رَبَّ الْعَرْشِ الْعَظِيمِ أَنْ يَشْفِيَكَ',
    turkish: "Yüce Arş'ın Rabbi olan büyük Allah'tan sana şifa vermesini dilerim.",
    english: 'I ask Allah the Mighty, Lord of the Mighty Throne, to cure you.',
    source: 'Tirmizi, 2083',
  },
  {
    id: '26', category: 'special',
    title: 'Kabir Ziyareti Duası', title_en: 'Supplication When Visiting Graves',
    arabic: 'اَلسَّلَامُ عَلَيْكُمْ أَهْلَ الدِّيَارِ مِنَ الْمُؤْمِنِينَ وَالْمُسْلِمِينَ وَإِنَّا إِنْ شَاءَ اللّٰهُ بِكُمْ لَاحِقُونَ',
    turkish: 'Ey mümin ve müslüman diyar sakinleri! Size selam olsun. İnşallah biz de size kavuşacağız.',
    english: 'Peace be upon you, O inhabitants of these dwellings, among the believers and Muslims. We will, Allah willing, join you.',
    source: 'Müslim, 975',
  },
  {
    id: '27', category: 'daily',
    title: 'Yeni Elbise Giyerken', title_en: 'Wearing New Clothes',
    arabic: 'اَللّٰهُمَّ لَكَ الْحَمْدُ أَنْتَ كَسَوْتَنِيهِ أَسْأَلُكَ خَيْرَهُ وَخَيْرَ مَا صُنِعَ لَهُ',
    turkish: "Allah'ım! Hamd sanadır. Beni bununla giydirdin. Bunun hayrını ve bunun için yapıldığı şeyin hayrını senden dilerim.",
    english: 'O Allah, praise be to You. You have clothed me with this; I ask You for its good and the good for which it was made.',
    source: 'Ebû Dâvûd, 4020',
  },
  {
    id: '28', category: 'morning',
    title: "Seyyidü'l-İstiğfar", title_en: 'The Best Supplication for Forgiveness',
    arabic: 'اَللّٰهُمَّ أَنْتَ رَبِّي لَا إِلٰهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ',
    turkish: "Allah'ım! Sen benim Rabbimsin. Senden başka ilah yoktur. Beni sen yarattın. Ben senin kulunum ve gücüm yettiğince sana verdiğim söz ve vaad üzereyim.",
    english: 'O Allah, You are my Lord, there is no god but You. You created me and I am Your servant, and I abide by Your covenant and promise as best I can.',
    source: 'Buhârî, 6306',
  },
  {
    id: '29', category: 'daily',
    title: 'Öfkelenince Okunacak Dua', title_en: 'Supplication When Angry',
    arabic: 'أَعُوذُ بِاللّٰهِ مِنَ الشَّيْطَانِ الرَّجِيمِ',
    turkish: 'Kovulmuş şeytanın şerrinden Allah\'a sığınırım.',
    english: 'I seek refuge in Allah from the accursed Satan.',
    source: 'Buhârî, 6115',
  },
  {
    id: '30', category: 'daily',
    title: 'Borçtan Kurtulma Duası', title_en: 'Supplication for Relief from Debt',
    arabic: 'اَللّٰهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ',
    turkish: "Allah'ım! Haramından koruyup helalinle bana yeter; lütfunla beni senden başkasına muhtaç etme.",
    english: 'O Allah, suffice me with what You have made lawful instead of what You have made unlawful, and make me independent of all others besides You.',
    source: 'Tirmizi, 3563',
  },
  {
    id: '31', category: 'special',
    title: 'Sıkıntıdan Kurtulma Duası', title_en: 'Supplication for Relief from Hardship',
    arabic: 'حَسْبُنَا اللّٰهُ وَنِعْمَ الْوَكِيلُ',
    turkish: 'Allah bize yeter, O ne güzel vekildir.',
    english: 'Allah is sufficient for us, and He is the best Disposer of affairs.',
    source: 'Âl-i İmrân, 173',
  },
  {
    id: '32', category: 'quran',
    title: 'İhlas Suresi', title_en: 'Surah Al-Ikhlas',
    arabic: 'قُلْ هُوَ اللّٰهُ أَحَدٌ، اَللّٰهُ الصَّمَدُ، لَمْ يَلِدْ وَلَمْ يُولَدْ، وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ',
    turkish: "De ki: O, Allah'tır, tektir. Allah samed'dir. O, doğurmamış ve doğrulmamıştır. Hiçbir şey O'na denk değildir.",
    english: 'Say: He is Allah, the One. Allah, the Eternal Refuge. He neither begets nor is born, nor is there to Him any equivalent.',
    source: "Kur'an-ı Kerim, 112. Sure",
  },
  {
    id: '33', category: 'quran',
    title: 'Felak Suresi', title_en: 'Surah Al-Falaq',
    arabic: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ، مِنْ شَرِّ مَا خَلَقَ، وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ، وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ، وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ',
    turkish: 'De ki: Sabahın Rabbine sığınırım; yarattığı şeylerin şerrinden, karanlığı çöktüğünde gecenin şerrinden, düğümlere üfleyenlerin şerrinden ve haset ettiğinde hasetçinin şerrinden.',
    english: 'Say: I seek refuge in the Lord of daybreak, from the evil of that which He created, from the evil of darkness when it settles, from the evil of the blowers in knots, and from the evil of an envier when he envies.',
    source: "Kur'an-ı Kerim, 113. Sure",
  },
  {
    id: '34', category: 'quran',
    title: 'Nas Suresi', title_en: 'Surah An-Nas',
    arabic: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ، مَلِكِ النَّاسِ، إِلٰهِ النَّاسِ، مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ، الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ، مِنَ الْجِنَّةِ وَالنَّاسِ',
    turkish: 'De ki: İnsanların Rabbine, insanların hükümdarına, insanların ilahına sığınırım; sinsice vesvese verenin şerrinden; o ki insanların göğüslerine vesvese verir; cinlerden ve insanlardan.',
    english: 'Say: I seek refuge in the Lord of mankind, the Sovereign of mankind, the God of mankind, from the evil of the retreating whisperer who whispers in the breasts of mankind, from among the jinn and mankind.',
    source: "Kur'an-ı Kerim, 114. Sure",
  },
  {
    id: '35', category: 'daily',
    title: 'Şükür Duası', title_en: 'Supplication of Gratitude',
    arabic: 'اَلْحَمْدُ لِلّٰهِ الَّذِي بِنِعْمَتِهِ تَتِمُّ الصَّالِحَاتُ',
    turkish: "Hamd olsun Allah'a ki, O'nun nimetiyle salih ameller tamamlanır.",
    english: "Praise be to Allah, by Whose grace good deeds are completed.",
    source: 'İbn Mâce',
  },
  {
    id: '36', category: 'special',
    title: 'Rabbenâ Âtinâ', title_en: 'Rabbana Atina',
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    turkish: 'Rabbimiz! Bize dünyada iyilik, ahirette de iyilik ver. Bizi ateş azabından koru.',
    english: 'Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.',
    source: 'Bakara, 201',
  },
  {
    id: '37', category: 'daily',
    title: 'Aksırınca Söylenecek Dua', title_en: 'Supplication After Sneezing',
    arabic: 'اَلْحَمْدُ لِلّٰهِ',
    turkish: "Hamd olsun Allah'a.",
    english: 'Praise be to Allah.',
    source: 'Buhârî, 6224',
  },
  {
    id: '38', category: 'prayer',
    title: 'Kunut Duası', title_en: 'Qunut Supplication',
    arabic: 'اَللّٰهُمَّ إِنَّا نَسْتَعِينُكَ وَنَسْتَغْفِرُكَ وَنُؤْمِنُ بِكَ وَنَتَوَكَّلُ عَلَيْكَ',
    turkish: "Allah'ım! Senden yardım isteriz, senden bağışlanma dileriz, sana iman eder ve sana tevekkül ederiz.",
    english: 'O Allah, we seek Your help, we seek Your forgiveness, we believe in You, and we rely upon You.',
    source: 'Ebû Dâvûd, Beyhakî',
  },
  {
    id: '39', category: 'morning',
    title: 'Afiyet Duası', title_en: 'Supplication for Well-being',
    arabic: 'اَللّٰهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ',
    turkish: 'Allah\'ım! Senden dünyada ve ahirette afiyet istiyorum.',
    english: 'O Allah, I ask You for well-being in this world and the Hereafter.',
    source: 'Ebû Dâvûd, 5074',
  },
  {
    id: '40', category: 'daily',
    title: 'Mescide Girerken', title_en: 'Entering the Mosque',
    arabic: 'اَللّٰهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ',
    turkish: 'Allah\'ım! Bana rahmet kapılarını aç.',
    english: 'O Allah, open the gates of Your mercy for me.',
    source: 'Müslim, 713',
  },
  {
    id: '41', category: 'daily',
    title: 'Mescidden Çıkarken', title_en: 'Leaving the Mosque',
    arabic: 'اَللّٰهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ',
    turkish: 'Allah\'ım! Senden lütfunu istiyorum.',
    english: 'O Allah, I ask You from Your bounty.',
    source: 'Müslim, 713',
  },
];

export function getDailyDua(date: Date = new Date()): Dua {
  const dayOfYear = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 86400000);
  const morningEveningDuas = DUAS.filter(d => d.category === 'morning');
  return morningEveningDuas[dayOfYear % morningEveningDuas.length];
}
