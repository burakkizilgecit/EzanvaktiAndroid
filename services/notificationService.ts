import { getNotifications } from './notificationRuntime';
import { Platform } from 'react-native';
import type { AppSettings } from '../store/useSettingsStore';
import { buildNotificationPlan } from './notificationPlan';
import { saveData } from './storageService';

function channelId(sound: string, vibration: boolean) {
  let hash = 0;
  for (const char of sound) hash = ((hash * 31) + char.charCodeAt(0)) | 0;
  return 'worship_v2_' + (hash >>> 0).toString(36) + (vibration ? '_v' : '_quiet');
}
async function ensureChannel(sound: string, vibration: boolean, name: string) {
  const id = channelId(sound, vibration);
  const Notifications = getNotifications();
  if (!Notifications) return id;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(id, {
      name, importance: Notifications.AndroidImportance.HIGH,
      sound, enableVibrate: vibration, vibrationPattern: vibration ? [0, 400, 200, 400] : [0],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
  return id;
}
export async function setupNotificationChannel() {
  await ensureChannel('default', true, 'Hatırlatmalar');
}
export async function setupCustomNotificationChannel(soundUri: string) {
  await ensureChannel(soundUri, true, 'Namaz Vakitleri (Özel Ses)');
}
export async function requestNotificationPermission(): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications) return false;
  const { status } = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowBadge: true, allowSound: true } });
  return status === 'granted';
}
export async function getNotificationPermission(): Promise<string> {
  const Notifications = getNotifications();
  return Notifications ? (await Notifications.getPermissionsAsync()).status : 'unavailable';
}

export async function sendTestNotification(
  settings: AppSettings,
  title: string,
  body: string,
  delaySeconds = 5,
): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications || !await requestNotificationPermission()) return false;
  const sound = settings.notificationSound === 'custom' ? (settings.customSoundUri ?? 'default')
    : settings.notificationSound === 'default' ? 'default' : settings.notificationSound + '.mp3';
  const channel = await ensureChannel(sound, settings.vibration, 'Namaz Vakitleri');
  const date = new Date(Date.now() + Math.max(1, delaySeconds) * 1000);
  await Notifications.scheduleNotificationAsync({
    identifier: `test_notification_${Date.now()}`,
    content: {
      title,
      body,
      sound: Platform.OS === 'ios' ? sound : true,
      vibrate: settings.vibration ? [0, 400, 200, 400] : [0],
      data: { type: 'test', scheduledFor: date.toISOString() },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      ...(Platform.OS === 'android' ? { channelId: channel } : {}),
    },
  });
  return true;
}

// Both foreground and background entry points share one queue. Failed runs do not
// poison later requests, and only notifications owned by this app planner are removed.
let scheduling: Promise<void> = Promise.resolve();
export function scheduleAllNotifications(lat: number | null, lng: number | null, settings: AppSettings): Promise<void> {
  const snapshot = JSON.parse(JSON.stringify(settings)) as AppSettings;
  const run = scheduling.catch(() => {}).then(() => reconcile(lat, lng, snapshot));
  scheduling = run;
  return run;
}
async function reconcile(lat: number | null, lng: number | null, settings: AppSettings) {
  const Notifications = getNotifications();
  if (!Notifications) return;
  const location = lat !== null && lng !== null ? { lat, lng } : null;
  // Leave room below iOS's pending notification limit. Keep the nearest items
  // across ALL types; the periodic worker replenishes the rolling window.
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  const owned = (id: string) => /^(prayer_|early_|optional_|dhikr_|hadith_|dua_|islamicday_)/.test(id);
  const otherCount = existing.filter(n => !owned(n.identifier)).length;
  const limit = Platform.OS === 'ios' ? Math.max(0, 60 - otherCount) : 450;
  const plan = buildNotificationPlan(location, settings).slice(0, limit);
  const ids = new Set(plan.map(n => n.identifier));
  for (const n of existing) {
    if (owned(n.identifier) && !ids.has(n.identifier)) await Notifications.cancelScheduledNotificationAsync(n.identifier);
  }
  if ((await Notifications.getPermissionsAsync()).status !== 'granted') return;
  const sound = settings.notificationSound === 'custom' ? (settings.customSoundUri ?? 'default')
    : settings.notificationSound === 'default' ? 'default' : settings.notificationSound + '.mp3';
  const prayerChannel = await ensureChannel(sound, settings.vibration, 'Namaz Vakitleri');
  const reminderChannel = await ensureChannel('default', settings.vibration, 'Hatırlatmalar');
  const byId = new Map(existing.map(n => [n.identifier, n]));
  for (const item of plan) {
    const isPrayer = item.type === 'prayer';
    const channel = isPrayer ? prayerChannel : reminderChannel;
    const fingerprint = JSON.stringify([item.date.getTime(), item.title, item.body, channel]);
    if (byId.get(item.identifier)?.content.data?.fingerprint === fingerprint) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: item.identifier,
      content: {
        title: item.title, body: item.body,
        sound: Platform.OS === 'ios' && isPrayer ? sound : true,
        vibrate: settings.vibration ? [0, 400, 200, 400] : [0],
        data: { type: item.type, fingerprint },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: item.date,
        ...(Platform.OS === 'android' ? { channelId: channel } : {}) },
    });
  }
  await saveData('notification_plan_last_refresh', new Date().toISOString());
}
export function setupNotificationHandler() {
  const Notifications = getNotifications();
  if (!Notifications) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
  });
}

export function addNotificationResponseListener(listener: Parameters<NonNullable<ReturnType<typeof getNotifications>>['addNotificationResponseReceivedListener']>[0]) {
  return getNotifications()?.addNotificationResponseReceivedListener(listener);
}
