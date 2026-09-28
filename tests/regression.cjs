const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
process.env.TZ = 'Europe/Istanbul';

function environment(options = {}) {
  let now = new Date(2026, 8, 14, 12).getTime();
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  const stored = new Map();
  const pending = new Map();
  let scheduledCalls = 0;
  const notificationMock = {
    AndroidImportance: { HIGH: 4 }, AndroidNotificationVisibility: { PUBLIC: 1 },
    SchedulableTriggerInputTypes: { DATE: 'date' },
    getPermissionsAsync: async () => ({ status: 'granted' }),
    requestPermissionsAsync: async () => ({ status: 'granted' }),
    getAllScheduledNotificationsAsync: async () => [...pending.values()],
    cancelScheduledNotificationAsync: async id => pending.delete(id),
    setNotificationChannelAsync: async () => {},
    scheduleNotificationAsync: async n => { scheduledCalls++; pending.set(n.identifier, n); },
  };
  const mocks = {
    'expo': { isRunningInExpoGo: () => options.expoGo ?? false },
    'react-native': { Platform: { OS: options.os ?? 'android' } },
    '@react-native-async-storage/async-storage': { __esModule: true, default: {
      getItem: async key => stored.get(key) ?? null,
      setItem: async (key, value) => stored.set(key, value),
      removeItem: async key => stored.delete(key),
    } },
    'expo-notifications': notificationMock,
    'expo-location': {
      Accuracy: { Balanced: 3 },
      requestForegroundPermissionsAsync: async () => ({ status: 'denied' }),
      ...options.location,
    },
    ...options.mocks,
  };
  const cache = new Map();
  function load(file) {
    const full = path.resolve(root, file);
    if (cache.has(full)) return cache.get(full).exports;
    const module = { exports: {} }; cache.set(full, module);
    const source = ts.transpileModule(fs.readFileSync(full, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    const localRequire = name => {
      if (options.expoGo && name === 'expo-notifications') throw new Error('Notifications must not load in Android Expo Go');
      if (name in mocks) return mocks[name];
      if (name.startsWith('.')) {
        let resolved = path.resolve(path.dirname(full), name);
        if (!path.extname(resolved)) resolved += '.ts';
        return load(resolved);
      }
      return require(name);
    };
    vm.runInNewContext(source, { module, exports: module.exports, require: localRequire, Date: Clock, console, setTimeout, clearTimeout }, { filename: full });
    return module.exports;
  }
  return { load, stored, pending, setTime: date => { now = date.getTime(); }, calls: () => scheduledCalls };
}

test('widget calendar shares app calculations, six events and tomorrow at rollover', () => {
  const env=environment();
  const {buildWidgetSnapshot}=env.load('widgets/widgetSnapshot.ts');
  const {DEFAULT_SETTINGS}=env.load('store/useSettingsStore.ts');
  const service=env.load('services/prayerService.ts');
  const snapshot=buildWidgetSnapshot({lat:40.7654,lng:29.9408,city:'Kocaeli'},DEFAULT_SETTINGS);
  assert.equal(snapshot.days.length,32);
  assert.equal(snapshot.days[0].entries.length,6);
  const times=service.calculatePrayerTimes(40.7654,29.9408);
  assert.equal(snapshot.days[0].entries[2].at,times.dhuhr.getTime());
  assert.equal(snapshot.days[0].entries[1].key,'sunrise');
  env.setTime(new Date(times.isha.getTime()+1));
  const next=service.getNextPrayer(times,40.7654,29.9408);
  const nativeNext=snapshot.days.flatMap(day=>day.entries).find(entry=>entry.at>times.isha.getTime()+1);
  assert.equal(next.key,nativeNext.key);
  assert.equal(next.time.getTime(),nativeNext.at);
});

test('watch payload carries prayer tracking, custom dhikr and offline freshness with the shared calendar', () => {
  const env=environment();
  const {buildWidgetSnapshot}=env.load('widgets/widgetSnapshot.ts');
  const {DEFAULT_SETTINGS}=env.load('store/useSettingsStore.ts');
  const now=new Date(2026,8,14,12);
  const snapshot=buildWidgetSnapshot({lat:40.7654,lng:29.9408,city:'Kocaeli'},DEFAULT_SETTINGS,now,{
    prayer:{date:'2026-09-14',prayers:{fajr:true,dhuhr:false}},
    dhikr:[{id:'custom_test',name:'Şükür',count:7,target:33,isCustom:true}],
    offlineDaysAvailable:32,
    lastPrayerUpdateAt:'2026-09-14T09:00:00.000Z',
  });
  assert.equal(snapshot.days.length,32);
  assert.equal(snapshot.watch.prayer.prayers.fajr,true);
  assert.equal(JSON.stringify(snapshot.watch.dhikr[0]),JSON.stringify({id:'custom_test',name:'Şükür',count:7,target:33,isCustom:true}));
  assert.equal(snapshot.watch.offlineDaysAvailable,32);
  assert.equal(snapshot.watch.lastPrayerUpdateAt,'2026-09-14T09:00:00.000Z');
});

test('widget missing or invalid coordinates never invent a city or prayer time', () => {
  const env=environment();const {buildWidgetSnapshot}=env.load('widgets/widgetSnapshot.ts');
  const {DEFAULT_SETTINGS}=env.load('store/useSettingsStore.ts');
  for(const location of [null,{lat:NaN,lng:20},{lat:91,lng:20}]) {
    const snapshot=buildWidgetSnapshot(location,DEFAULT_SETTINGS);
    assert.equal(snapshot.days.length,0);assert.equal(snapshot.city,'');
  }
  assert.equal(buildWidgetSnapshot({lat:0,lng:0},DEFAULT_SETTINGS).days.length,32);
});

test('widget labels and theme follow app language without Turkish fallbacks', () => {
  const env=environment();const {buildWidgetSnapshot}=env.load('widgets/widgetSnapshot.ts');
  const {DEFAULT_SETTINGS}=env.load('store/useSettingsStore.ts');
  const location={lat:40.7,lng:29.9,city:'Kocaeli'};
  const en=buildWidgetSnapshot(location,{...DEFAULT_SETTINGS,language:'en',theme:'system'});
  const ar=buildWidgetSnapshot(location,{...DEFAULT_SETTINGS,language:'ar',theme:'light'});
  assert.equal(en.days[0].entries[2].label,'Dhuhr');assert.equal(en.theme,'system');
  assert.equal(ar.days[0].entries[2].label,'الظهر');assert.equal(ar.theme,'light');
  assert.ok(!en.days[0].dateLabel.includes('Eylül'));
});

test('Android widgets refresh at prayer boundaries, midnight and periodic launcher updates', () => {
  const kotlin = fs.readFileSync(path.join(root, 'plugins', 'prayer-widgets', 'PrayerWidgets.kt'), 'utf8');
  const plugin = fs.readFileSync(path.join(root, 'plugins', 'withPrayerWidgets.js'), 'utf8');
  assert.match(kotlin, /WIDGET_BOUNDARY/);
  assert.match(kotlin, /setExactAndAllowWhileIdle/);
  assert.match(kotlin, /minOf\(next\.getLong\("at"\)\+100,midnight\+100\)/);
  assert.match(plugin, /android:updatePeriodMillis="1800000"/);
  assert.match(plugin, /android:widgetCategory="home_screen\|keyguard"/);
  assert.match(plugin, /android:initialKeyguardLayout=/);
  assert.match(plugin, /targetCellWidth: 4, targetCellHeight: 2/);
  assert.match(kotlin, /WIDGET_CATEGORY_KEYGUARD/);
  assert.match(kotlin, /!onKeyguard \|\| it\.optString\("key"\)!="sunrise"/);
});

test('Wear OS uses a separate Play artifact and a unique form-factor version code', () => {
  const plugin = require(path.join(root, 'plugins', 'withWearOS.js'));
  const eas = JSON.parse(fs.readFileSync(path.join(root, 'eas.json'), 'utf8'));
  assert.equal(plugin.wearVersionCode(51), 51001);
  assert.equal(eas.build['wear-production'].android.gradleCommand, ':wearos:bundleRelease');
  assert.equal(eas.build['wear-production'].autoIncrement, false);
  const repository = fs.readFileSync(path.join(root, 'plugins', 'wear-os', 'src', 'main', 'java', 'com', 'islamicibadet', 'app', 'wear', 'PrayerRepository.kt'), 'utf8');
  const activity = fs.readFileSync(path.join(root, 'plugins', 'wear-os', 'src', 'main', 'java', 'com', 'islamicibadet', 'app', 'wear', 'MainActivity.kt'), 'utf8');
  assert.match(repository, /fun copyFor\(language:String\?\)/);
  assert.match(repository, /"ar"->WatchCopy/);
  assert.match(repository, /"en"->WatchCopy/);
  assert.match(repository, /fun togglePrayer\(context:Context,date:String,key:String\)/);
  assert.match(repository, /fun incrementDhikr\(context:Context,id:String\)/);
  assert.match(activity, /PrayerRepository\.togglePrayer/);
  assert.match(activity, /PrayerRepository\.incrementDhikr/);
  assert.match(activity, /handler\.postDelayed\(this,1000\)/);
});

test('home quick settings expose the optional prayer notification toggle', () => {
  const home = fs.readFileSync(path.join(root, 'app', '(tabs)', 'index.tsx'), 'utf8');
  assert.match(home, /key: "optionalPrayers"/);
  assert.match(home, /labelKey: "notifOptionalPrayers"/);
});

test('Turkey calculation method stays within two minutes of official Diyanet city fixtures', () => {
  const env = environment();
  const { calculatePrayerTimes, formatPrayerTime } = env.load('services/prayerService.ts');
  const keys = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const fixtures = [
    { location: [41.0082, 28.9784], date: new Date(2026, 8, 27, 12), official: ['05:24', '06:49', '13:00', '16:21', '19:01', '20:21'] },
    { location: [39.9334, 32.8597], date: new Date(2026, 8, 27, 12), official: ['05:10', '06:34', '12:45', '16:06', '18:46', '20:04'] },
    { location: [40.8533, 29.8815], date: new Date(2026, 8, 27, 12), official: ['05:21', '06:45', '12:56', '16:18', '18:58', '20:17'] },
    { location: [41.0082, 28.9784], date: new Date(2027, 0, 1, 12), official: ['06:50', '08:22', '13:12', '15:32', '17:53', '19:19'] },
  ];
  const minutes = value => { const [hour, minute] = value.split(':').map(Number); return hour * 60 + minute; };
  for (const fixture of fixtures) {
    const times = calculatePrayerTimes(fixture.location[0], fixture.location[1], fixture.date);
    keys.forEach((key, index) => {
      const difference = Math.abs(minutes(formatPrayerTime(times[key])) - minutes(fixture.official[index]));
      assert.ok(difference <= 2, `${key} differs from Diyanet by ${difference} minutes`);
    });
  }
});

test('Qibla bearing is normalized and matches known great-circle directions', () => {
  const env = environment();
  const { calculateQiblaDirection } = env.load('services/prayerService.ts');
  const fixtures = [
    [41.0082, 28.9784, 151.6206], // Istanbul
    [51.5074, -0.1278, 118.9872], // London
    [40.7128, -74.0060, 58.4817], // New York
  ];
  for (const [lat, lng, expected] of fixtures) {
    const bearing = calculateQiblaDirection(lat, lng);
    assert.ok(bearing >= 0 && bearing < 360);
    assert.ok(Math.abs(bearing - expected) < 0.05, `${lat},${lng}: ${bearing}`);
  }
  assert.throws(() => calculateQiblaDirection(100, 0), /Invalid coordinates/);
});

test('32-day prayer schedule survives serialization and keeps at least 30 offline days', () => {
  const env = environment();
  const service = env.load('services/prayerSchedule.ts');
  const schedule = service.buildPrayerSchedule({ lat: 40.8533, lng: 29.8815, city: 'Kocaeli' });
  assert.equal(Object.keys(schedule.days).length, 32);
  assert.equal(service.getOfflineDaysAvailable(schedule), 32);
  const restored = JSON.parse(JSON.stringify(schedule));
  const finalDate = new Date(2026, 9, 15, 12);
  assert.ok(service.getScheduledPrayerTimes(restored, finalDate));
  assert.equal(service.scheduleMatchesLocation(restored, { lat: 40.8533, lng: 29.8815 }), true);
});

test('test notification is scheduled for the selected sound five seconds later', async () => {
  const env = environment();
  const settings = { ...env.load('store/useSettingsStore.ts').DEFAULT_SETTINGS, notificationSound: 'ezan' };
  const service = env.load('services/notificationService.ts');
  const scheduled = await service.sendTestNotification(settings, 'Test', 'Body');
  assert.equal(scheduled, true);
  const item = [...env.pending.values()].find(value => value.identifier.startsWith('test_notification_'));
  assert.ok(item);
  assert.equal(item.trigger.date.getTime(), new Date(2026, 8, 14, 12).getTime() + 5000);
  assert.equal(item.content.data.type, 'test');
});

test('explicit clock moves countdown and prayer boundary even with memoized inputs', () => {
  const env=environment();const service=env.load('services/prayerService.ts');
  const times=service.calculatePrayerTimes(40.7,29.9);
  assert.equal(service.getCountdown(times.dhuhr,times.dhuhr.getTime()-1000),'00:00:01');
  assert.equal(service.getCountdown(times.dhuhr,times.dhuhr.getTime()+1000),'00:00:00');
  assert.equal(service.getNextPrayer(times,40.7,29.9,new Date(times.dhuhr.getTime()-1)).key,'dhuhr');
  assert.equal(service.getNextPrayer(times,40.7,29.9,new Date(times.dhuhr.getTime())).key,'asr');
});

test('midnight uses the new local day and selects this morning, not tomorrow', () => {
  const env = environment();
  const { localDateKey } = env.load('services/dateService.ts');
  const service = env.load('services/prayerService.ts');
  const oldTimes = service.calculatePrayerTimes(41.0082, 28.9784);
  env.setTime(new Date(2026, 8, 15, 0, 1));
  assert.equal(localDateKey(), '2026-09-15');
  const next = service.getNextPrayer(oldTimes, 41.0082, 28.9784);
  assert.equal(localDateKey(next.time), '2026-09-15');
  assert.equal(next.key, 'fajr');
});

test('local date follows a negative UTC offset as well', () => {
  process.env.TZ = 'America/New_York';
  try {
    const env = environment();
    env.setTime(new Date('2026-09-15T02:00:00Z'));
    assert.equal(env.load('services/dateService.ts').localDateKey(), '2026-09-14');
  } finally { process.env.TZ = 'Europe/Istanbul'; }
});

test('goals reset next day while target values survive restart and legacy migration', async () => {
  const env = environment();
  const store = env.load('store/useGoalsStore.ts').useGoalsStore;
  store.getState().setTarget('sadaka', 2);
  store.getState().updateProgress('sadaka', 2);
  env.setTime(new Date(2026, 8, 15, 0, 1));
  await store.getState().loadGoals();
  assert.equal(store.getState().goals.find(g => g.id === 'sadaka').progress, 0);
  assert.equal(store.getState().goals.find(g => g.id === 'sadaka').target, 2);
  env.stored.set('daily_goals', JSON.stringify([{ id: 'sadaka', target: 7, progress: 7 }]));
  await store.getState().loadGoals();
  assert.equal(store.getState().goals[0].target, 7);
  assert.equal(store.getState().goals[0].progress, 0);
});

test('resetting the dhikr session preserves daily total and yesterday survives rollover', async () => {
  const env = environment();
  const store = env.load('store/useDhikrStore.ts').useDhikrStore;
  await store.getState().loadData();
  for (let i = 0; i < 33; i++) store.getState().increment('subhanallah');
  store.getState().reset(); store.getState().increment('subhanallah');
  assert.equal(store.getState().getTotalToday(), 34);
  env.setTime(new Date(2026, 8, 15, 0, 1));
  store.getState().checkDayRollover();
  assert.equal(store.getState().getTotalToday(), 0);
  assert.equal(store.getState().history['2026-09-14'].subhanallah, 34);
});

test('custom dhikr survives rollover with its target and can be deleted', async () => {
  const env = environment();
  const store = env.load('store/useDhikrStore.ts').useDhikrStore;
  await store.getState().loadData();
  store.getState().addCustomDhikr('Ya Latif', 41);
  const custom = store.getState().items.find(item => item.isCustom);
  assert.ok(custom);
  store.getState().increment(custom.id);
  env.setTime(new Date(2026, 8, 15, 0, 1));
  store.getState().checkDayRollover();
  const rolled = store.getState().items.find(item => item.id === custom.id);
  assert.equal(rolled?.target, 41);
  assert.equal(rolled?.count, 0);
  assert.equal(rolled?.category, 'diger');
  store.getState().removeCustomDhikr(custom.id);
  assert.equal(store.getState().items.some(item => item.id === custom.id), false);
});

test('manual city survives denied location access and restart', async () => {
  const env = environment();
  const store = env.load('store/usePrayerStore.ts').usePrayerStore;
  await store.getState().setManualLocation(39.9, 32.8, 'Ankara');
  await store.getState().refreshLocation();
  assert.equal(store.getState().location.city, 'Ankara');
  assert.equal(store.getState().locationSource, 'manual');
  assert.ok(store.getState().prayerTimes);
  assert.equal(JSON.parse(env.stored.get('user_location')).source, 'manual');
  await store.getState().loadLocation();
  assert.equal(store.getState().locationSource, 'manual');
  await store.getState().useAutoLocation();
  assert.equal(store.getState().locationSource, 'manual');
  assert.equal(store.getState().location.city, 'Ankara');
});

test('denied GPS permission without a city leaves location unavailable', async () => {
  const env = environment();
  const store = env.load('store/usePrayerStore.ts').usePrayerStore;
  await store.getState().refreshLocation();
  assert.equal(store.getState().location, null);
  assert.equal(store.getState().prayerTimes, null);
  assert.equal(store.getState().locationError, true);
});

test('GPS failure shows unavailable; geocoding failure keeps valid GPS coordinates', async () => {
  const failed = environment({ location: {
    requestForegroundPermissionsAsync: async () => ({ status: 'granted' }),
    getCurrentPositionAsync: async () => { throw Error('GPS unavailable'); },
  } });
  const failedStore = failed.load('store/usePrayerStore.ts').usePrayerStore;
  await failedStore.getState().refreshLocation();
  assert.equal(failedStore.getState().locationError, true);
  const env = environment({ location: {
    requestForegroundPermissionsAsync: async () => ({ status: 'granted' }),
    getCurrentPositionAsync: async () => ({ coords: { latitude: 39.9, longitude: 32.8 } }),
    reverseGeocodeAsync: async () => { throw Error('Offline'); },
  } });
  const store = env.load('store/usePrayerStore.ts').usePrayerStore;
  await store.getState().refreshLocation();
  assert.equal(store.getState().location.lat, 39.9);
  assert.equal(store.getState().locationError, false);
});

test('prayer store refreshes times after overnight suspension', async () => {
  const env = environment(); const store = env.load('store/usePrayerStore.ts').usePrayerStore;
  await store.getState().setLocation(39.9, 32.8, 'Ankara');
  env.setTime(new Date(2026, 8, 15, 0, 1)); store.getState().refreshPrayerTimes();
  assert.equal(store.getState().prayerTimes.dhuhr.getDate(), 15);
});

test('changing prayer sound preserves religious-day and independent reminders', async () => {
  const env = environment();
  env.setTime(new Date(2026, 0, 1, 12));
  const defaults = env.load('store/useSettingsStore.ts').DEFAULT_SETTINGS;
  const DEFAULT_SETTINGS = { ...defaults, notifiedEventIds: env.load('data/islamicEvents.ts').ISLAMIC_EVENTS.map(event => event.id) };
  const service = env.load('services/notificationService.ts');
  await service.scheduleAllNotifications(41, 29, DEFAULT_SETTINGS);
  const events = [...env.pending.keys()].filter(id => id.startsWith('islamicday_'));
  assert.ok(events.length > 0);
  await service.scheduleAllNotifications(41, 29, { ...DEFAULT_SETTINGS, notificationSound: 'ilahi' });
  assert.ok(events.every(id => env.pending.has(id)));
  await service.scheduleAllNotifications(null, null, { ...DEFAULT_SETTINGS, notifications: { ...DEFAULT_SETTINGS.notifications, prayerTimes: false } });
  assert.ok([...env.pending.keys()].some(id => id.startsWith('dhikr_')));
  assert.ok(![...env.pending.keys()].some(id => id.startsWith('prayer_')));
});

test('quiet hours never suppress obligatory prayer alerts or their early reminders', () => {
  const env = environment();
  const { DEFAULT_SETTINGS } = env.load('store/useSettingsStore.ts');
  const { buildNotificationPlan, isInSilentHours } = env.load('services/notificationPlan.ts');
  const settings = {
    ...DEFAULT_SETTINGS,
    notifications: { ...DEFAULT_SETTINGS.notifications, optionalPrayers: true },
    silentHours: { start: '00:00', end: '13:00' },
  };
  const plan = buildNotificationPlan({ lat: 41, lng: 29 }, settings, new Date(2026, 8, 14, 0, 0));
  const alertsDuringQuietHours = plan.filter(n => isInSilentHours(n.date, '00:00', '13:00'));
  assert.ok(alertsDuringQuietHours.some(n => n.type === 'prayer'));
  assert.ok(alertsDuringQuietHours.some(n => n.type === 'early'));
  assert.ok(alertsDuringQuietHours.every(n => n.type === 'prayer' || n.type === 'early'));
  assert.equal(isInSilentHours(new Date(2026, 8, 14, 13), '00:00', '13:00'), false);
  assert.equal(isInSilentHours(new Date(2026, 8, 14, 13), '00:00', '00:00'), false);
});

test('prayer notification trigger uses the exact calculated prayer timestamp', () => {
  const env = environment();
  const settings = env.load('store/useSettingsStore.ts').DEFAULT_SETTINGS;
  const { buildNotificationPlan } = env.load('services/notificationPlan.ts');
  const { calculatePrayerTimes } = env.load('services/prayerService.ts');
  const location = { lat: 40.8533, lng: 29.8815 };
  const expected = calculatePrayerTimes(location.lat, location.lng);
  const item = buildNotificationPlan(location, settings).find(value => value.identifier === 'prayer_dhuhr_2026-09-14');
  assert.ok(item);
  assert.equal(item.date.getTime(), expected.dhuhr.getTime());
});

test('schedule is idempotent, leaves unrelated items intact, and extends beyond seven days', async () => {
  const env = environment(); const settings = env.load('store/useSettingsStore.ts').DEFAULT_SETTINGS;
  const service = env.load('services/notificationService.ts');
  env.pending.set('unrelated', { identifier: 'unrelated', content: {} });
  await service.scheduleAllNotifications(41, 29, settings);
  const calls = env.calls();
  await service.scheduleAllNotifications(41, 29, settings);
  assert.equal(env.calls(), calls); assert.ok(env.pending.has('unrelated'));
  const dates = [...env.pending.values()].filter(n => n.identifier.startsWith('prayer_')).map(n => n.trigger.date.getTime());
  assert.ok(Math.max(...dates) - Math.min(...dates) > 28 * 86400000);
});

test('iOS uses a shared chronological budget and concurrent setting updates finish in order', async () => {
  const env = environment({ os: 'ios' }); const settings = env.load('store/useSettingsStore.ts').DEFAULT_SETTINGS;
  const service = env.load('services/notificationService.ts');
  await Promise.all([
    service.scheduleAllNotifications(41, 29, settings),
    service.scheduleAllNotifications(41, 29, { ...settings, notifications: { ...settings.notifications, prayerTimes: false } }),
  ]);
  assert.ok(env.pending.size <= 60);
  assert.ok(![...env.pending.keys()].some(id => id.startsWith('prayer_')));
  assert.ok([...env.pending.keys()].some(id => id.startsWith('dhikr_')));
});

test('daily inbox honors disabled preferences and does not duplicate enabled items', () => {
  const env = environment(); const settings = env.load('store/useSettingsStore.ts').useSettingsStore;
  settings.getState().toggleNotification('dailyHadith');
  const store = env.load('store/useNotificationStore.ts').useNotificationStore;
  store.getState().generateDailyIfNeeded('Hadith', 'Dua');
  store.getState().generateDailyIfNeeded('Hadith', 'Dua');
  assert.equal(store.getState().notifications.length, 1);
  assert.equal(store.getState().notifications[0].type, 'dua');
});

test('old settings receive defaults for newly introduced notification fields', () => {
  const env = environment(); const { normalizeSettings } = env.load('store/useSettingsStore.ts');
  const result = normalizeSettings({ notifications: { prayerTimes: false } });
  assert.equal(result.notifications.prayerTimes, false);
  assert.equal(result.notifications.islamicDays, true);
  assert.equal(result.notificationSound, 'default');
  assert.equal(normalizeSettings({ notificationSound: 'ezan' }).notificationSound, 'default');
  assert.equal(normalizeSettings({ settingsVersion: 2, notificationSound: 'ezan' }).notificationSound, 'ezan');
  assert.equal(normalizeSettings({ notificationSound: 'ilahi' }).notificationSound, 'ilahi');
  assert.equal(result.notifications.optionalPrayers, false);
});

test('voluntary prayer windows are approximate and reminders remain opt-in', () => {
  const env = environment();
  const { calculateOptionalPrayerTimes } = env.load('services/optionalPrayerService.ts');
  const times = {
    fajr: new Date(2026, 8, 14, 5), sunrise: new Date(2026, 8, 14, 6),
    dhuhr: new Date(2026, 8, 14, 13), asr: new Date(2026, 8, 14, 16, 30),
    maghrib: new Date(2026, 8, 14, 19), isha: new Date(2026, 8, 14, 20, 30),
  };
  const optional = calculateOptionalPrayerTimes(times);
  assert.equal(optional.ishraqStart.getTime(), new Date(2026, 8, 14, 6, 45).getTime());
  assert.equal(optional.duhaEnd.getTime(), new Date(2026, 8, 14, 12, 50).getTime());
  assert.equal(optional.disliked[2].start.getTime(), new Date(2026, 8, 14, 18, 15).getTime());
  const { DEFAULT_SETTINGS } = env.load('store/useSettingsStore.ts');
  const { buildNotificationPlan } = env.load('services/notificationPlan.ts');
  assert.equal(buildNotificationPlan({ lat: 41, lng: 29 }, DEFAULT_SETTINGS).some(n => n.type === 'optionalPrayer'), false);
  const enabled = { ...DEFAULT_SETTINGS, notifications: { ...DEFAULT_SETTINGS.notifications, optionalPrayers: true } };
  assert.ok(buildNotificationPlan({ lat: 41, lng: 29 }, enabled).some(n => n.identifier.startsWith('optional_ishraq_')));
  assert.ok(buildNotificationPlan({ lat: 41, lng: 29 }, enabled).some(n => n.identifier.startsWith('optional_awwabin_')));
});

test('background renewal reads persisted settings and extends the plan without opening a screen', async () => {
  let task;
  let interval;
  const env = environment({ mocks: {
    'expo-task-manager': {
      defineTask: (_name, callback) => { task = callback; },
      isAvailableAsync: async () => true, isTaskRegisteredAsync: async () => false,
    },
    'expo-background-task': {
      BackgroundTaskResult: { Success: 1, Failed: 2 },
      registerTaskAsync: async (_name, options) => { interval = options.minimumInterval; },
    },
  } });
  const settings = env.load('store/useSettingsStore.ts').DEFAULT_SETTINGS;
  env.stored.set('app_settings', JSON.stringify(settings));
  env.stored.set('user_location', JSON.stringify({ lat: 39.9, lng: 32.8 }));
  const background = env.load('services/backgroundNotifications.ts');
  await background.registerNotificationRenewal();
  assert.equal(interval, 360);
  env.setTime(new Date(2026, 9, 20, 12));
  assert.equal(await task(), 1);
  assert.ok([...env.pending.keys()].some(id => id === 'prayer_dhuhr_2026-10-21'));
});

test('calendar uses verified dates and today has zero days remaining', () => {
  const env = environment();
  env.setTime(new Date(2026, 11, 10, 0, 1));
  const { ISLAMIC_EVENTS, getUpcomingEvents } = env.load('data/islamicEvents.ts');
  assert.equal(ISLAMIC_EVENTS.find(e => e.id === '2026-ramazan').date, '2026-02-19');
  assert.equal(ISLAMIC_EVENTS.find(e => e.id === '2027-fıtr').date, '2027-03-09');
  assert.equal(getUpcomingEvents().find(e => e.id === '2026-regaip').daysLeft, 0);
  assert.equal(new Set(ISLAMIC_EVENTS.map(e => e.id)).size, ISLAMIC_EVENTS.length);
});

test('every religious event has explanatory content in all supported languages', () => {
  const env = environment();
  const { ISLAMIC_EVENTS, getEventInfo } = env.load('data/islamicEvents.ts');
  for (const event of ISLAMIC_EVENTS) {
    for (const language of ['tr', 'en', 'ar']) {
      const info = getEventInfo(event, language);
      assert.ok(info.summary.trim(), `${event.id} is missing ${language} summary`);
      assert.ok(info.significance.trim(), `${event.id} is missing ${language} significance`);
      assert.ok(info.observances.trim(), `${event.id} is missing ${language} observances`);
    }
  }
});


test('Android Expo Go skips notification imports and background registration without crashing', async () => {
  const env = environment({ expoGo: true, mocks: {
    'expo-task-manager': {
      defineTask: () => assert.fail('Expo Go must not define background renewal'),
      isAvailableAsync: () => assert.fail('Expo Go must not probe background renewal'),
    },
    'expo-background-task': {},
  } });
  const service = env.load('services/notificationService.ts');
  const settings = env.load('store/useSettingsStore.ts').DEFAULT_SETTINGS;
  service.setupNotificationHandler();
  await service.setupNotificationChannel();
  await service.setupCustomNotificationChannel('file://test.mp3');
  assert.equal(await service.requestNotificationPermission(), false);
  assert.equal(await service.getNotificationPermission(), 'unavailable');
  assert.equal(service.addNotificationResponseListener(() => {}), undefined);
  await service.scheduleAllNotifications(40.7, 29.9, settings);
  await env.load('services/backgroundNotifications.ts').registerNotificationRenewal();
  assert.equal(env.calls(), 0);
});

function audioEnvironment() {
  const players = [];
  const env = environment({ mocks: { 'expo-audio': { createAudioPlayer: () => {
    const player = { isLoaded: false, played: 0, removed: 0, detached: 0,
      pause() {}, play() { this.played++; }, remove() { this.removed++; },
      addListener(_event, listener) { this.emit = listener; return { remove: () => this.detached++ }; },
    };
    players.push(player); return player;
  } } } });
  const { AudioController } = env.load('services/audioController.ts');
  return { controller: new AudioController(), players };
}

test('stopping pending audio releases player and ignores a late load', async () => {
  const {controller, players} = audioEnvironment();
  const loading = controller.play({uri: 'audio.mp3'});
  await controller.stop();
  players[0].emit({isLoaded: true});
  assert.equal(await loading, false);
  assert.equal(players[0].played, 0);
  assert.equal(players[0].removed, 1);
  assert.equal(players[0].detached, 1);
});

test('overlapping audio loads only start the latest selection', async () => {
  const {controller, players} = audioEnvironment();
  const first = controller.play({uri: 'first'});
  const second = controller.play({uri: 'second'});
  players[1].emit({isLoaded: true});
  players[0].emit({isLoaded: true});
  assert.equal(await first, false); assert.equal(await second, true);
  assert.equal(players[0].played, 0); assert.equal(players[1].played, 1);
  await controller.stop();
  assert.equal(players[0].removed, 1); assert.equal(players[1].removed, 1);
});

test('audio completion releases once and can start the next verse', async () => {
  const {controller, players} = audioEnvironment();
  let next;
  const first = controller.play(123, () => { next = controller.play({uri: 'next'}); });
  players[0].emit({isLoaded: true}); await first;
  players[0].emit({didJustFinish: true});
  players[0].emit({didJustFinish: true});
  assert.equal(players.length, 2); assert.equal(players[0].removed, 1);
  players[1].emit({isLoaded: true}); assert.equal(await next, true);
  await controller.stop();
});

test('audio load errors reject and clean up the player', async () => {
  const {controller, players} = audioEnvironment();
  const loading = controller.play({uri: 'bad'});
  players[0].emit({error: 'Unavailable'});
  await assert.rejects(loading, /Unavailable/);
  assert.equal(players[0].removed, 1);
  await controller.stop(); assert.equal(players[0].removed, 1);
});


test('pause during loading prevents playback; resume reuses the same player', async () => {
  const {controller, players} = audioEnvironment();
  const loading = controller.play({uri: 'verse'});
  controller.pause();
  players[0].isLoaded = true; players[0].emit({isLoaded: true});
  await loading; assert.equal(players[0].played, 0);
  controller.resume(); assert.equal(players[0].played, 1);
  controller.pause(); controller.resume();
  assert.equal(players.length, 1); assert.equal(players[0].removed, 0);
  await controller.stop();
});

function speechEnvironment() {
  const utterances = [];
  let release;
  const env = environment({mocks: {'expo-speech': {
    stop: () => new Promise(resolve => { release = resolve; }),
    speak: (text, options) => utterances.push({text, options}),
  }}});
  const {SpeechController} = env.load('services/speechController.ts');
  return {controller: new SpeechController(), utterances,
    drain: async () => { await new Promise(resolve => setImmediate(resolve)); release(); await new Promise(resolve => setImmediate(resolve)); }};
}

test('rapid dua play pause play only starts the latest utterance after stop completes', async () => {
  const {controller, utterances, drain} = speechEnvironment();
  let finished = 0;
  const first = controller.play([{text: 'abc def', language: 'ar'}], () => finished++);
  const pause = controller.pause(); const resume = controller.resume();
  assert.equal(utterances.length, 0);
  await drain(); await drain(); await drain();
  await Promise.all([first,pause,resume]);
  assert.equal(utterances.length, 1); assert.equal(finished, 0);
});

test('dua resumes at word boundary and stale completion cannot queue translation', async () => {
  const {controller, utterances, drain} = speechEnvironment();
  let finished = 0;
  const play = controller.play([{text:'abc def ghi',language:'ar'}, {text:'translation',language:'en'}], () => finished++);
  await drain(); await play;
  utterances[0].options.onBoundary({charIndex:4});
  const pause = controller.pause(); await drain(); await pause;
  utterances[0].options.onDone(); utterances[0].options.onStopped();
  assert.equal(utterances.length, 1); assert.equal(finished, 0);
  const resume = controller.resume(); await drain(); await resume;
  assert.equal(utterances[1].text,'def ghi');
  utterances[1].options.onDone(); assert.equal(utterances[2].text,'translation');
  const stop = controller.stop(); await drain(); await stop;
  utterances[2].options.onDone(); assert.equal(finished, 0);
});

function soundPreviewEnvironment() {
  const states = [], errors = [], played = [], downloads = [];
  let stops = 0, pauses = 0, resumes = 0;
  const env = environment({mocks: {
    'expo-asset': {Asset: {fromModule: id => ({downloadAsync: () => new Promise(resolve => downloads.push({id,resolve}))})}},
    'expo-audio': {setAudioModeAsync: async () => {}},
    './audioController': {AudioController: class {
      async stop() { stops++; } pause() { pauses++; } resume() { resumes++; }
      async play(source,onFinish) { played.push({source,onFinish}); return true; }
    }},
  }});
  const {SoundPreviewController} = env.load('services/soundPreviewController.ts');
  return {controller: new SoundPreviewController(s => states.push(s), e => errors.push(e)), states, errors, played, downloads,
    counts: () => ({stops,pauses,resumes}), flush: () => new Promise(resolve => setImmediate(resolve))};
}

test('notification preview resolves a bundled MP3 locally and duplicate play does not create another player', async () => {
  const e = soundPreviewEnvironment(); const play = e.controller.play('ezan',123);
  await e.flush(); assert.equal(e.played.length,0);
  const duplicate = e.controller.play('ezan',123);
  e.downloads[0].resolve({localUri:'file:///ezan.mp3'}); await play; await duplicate;
  assert.equal(e.played[0].source.uri,'file:///ezan.mp3'); assert.equal(e.played.length,1);
  e.controller.pause(); assert.equal(e.states.at(-1).status,'paused');
  await e.controller.play('ezan',123);
  assert.equal(e.played.length,1); assert.equal(e.counts().resumes,1);
  assert.equal(e.states.at(-1).status,'playing');
});

test('switching preview sounds ignores a late asset download; leaving cancels pending playback', async () => {
  const e = soundPreviewEnvironment(); const first = e.controller.play('ezan',123); await e.flush();
  const second = e.controller.play('ilahi',456); await e.flush();
  e.downloads[1].resolve({localUri:'file:///ilahi.mp3'}); await second;
  e.downloads[0].resolve({localUri:'file:///ezan.mp3'}); await first;
  assert.equal(e.played.length,1); assert.equal(e.played[0].source.uri,'file:///ilahi.mp3');
  const pending = e.controller.play('ezan',123); await e.flush(); await e.controller.stop();
  e.downloads[2].resolve({localUri:'file:///ezan.mp3'}); await pending;
  assert.equal(e.played.length,1); assert.equal(e.states.at(-1).status,'idle');
});

test('pausing a downloading preview prevents startup until resume', async () => {
  const e = soundPreviewEnvironment(); const play = e.controller.play('ezan',123); await e.flush();
  e.controller.pause(); e.downloads[0].resolve({localUri:'file:///ezan.mp3'}); await play;
  assert.equal(e.played.length,0);
  await e.controller.play('ezan',123); assert.equal(e.played.length,1);
});

test('rating prompt waits for established use and respects snooze and completion', () => {
  const env = environment();
  const rating = env.load('services/ratingPromptService.ts');
  const startedAt = new Date(2026, 8, 1, 12).getTime();
  let state = rating.normalizeRatingPromptState(null);
  state = rating.recordEligibleLaunch(state, startedAt);
  state = rating.recordEligibleLaunch(state, startedAt + 1000);
  state = rating.recordEligibleLaunch(state, startedAt + 2000);
  assert.equal(rating.shouldShowRatingPrompt(state, startedAt + rating.MIN_USAGE_AGE_MS), false);
  state = rating.recordEligibleLaunch(state, startedAt + 3000);
  assert.equal(rating.shouldShowRatingPrompt(state, startedAt + rating.MIN_USAGE_AGE_MS - 1), false);
  assert.equal(rating.shouldShowRatingPrompt(state, startedAt + rating.MIN_USAGE_AGE_MS), true);
  state = rating.snoozeRatingPrompt(state, rating.LATER_SNOOZE_MS, startedAt + rating.MIN_USAGE_AGE_MS);
  assert.equal(rating.shouldShowRatingPrompt(state, state.nextPromptAt - 1), false);
  assert.equal(rating.shouldShowRatingPrompt(state, state.nextPromptAt), true);
  assert.equal(rating.shouldShowRatingPrompt(rating.completeRatingPrompt(state), state.nextPromptAt), false);
});
