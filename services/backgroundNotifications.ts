import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { isExpoGo } from './notificationRuntime';
import { scheduleAllNotifications } from './notificationService';
import { loadData, STORAGE_KEYS } from './storageService';
import { normalizeSettings, type AppSettings } from '../store/useSettingsStore';

import { syncStoredNativeWidgets } from '../widgets/syncNativeWidgets';

const TASK = 'worship-notification-renewal';
if (!isExpoGo && Platform.OS !== 'web') TaskManager.defineTask(TASK, async () => {
  try {
    const [location, settings] = await Promise.all([
      loadData<{ lat: number; lng: number }>(STORAGE_KEYS.LOCATION),
      loadData<AppSettings>(STORAGE_KEYS.SETTINGS),
    ]);
    await scheduleAllNotifications(location?.lat ?? null, location?.lng ?? null, normalizeSettings(settings));
    // A widget bridge failure must not prevent the existing notification renewal.
    await syncStoredNativeWidgets().catch(error => console.warn('Widget renewal failed', error));
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    console.warn('Notification renewal failed', error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});
export async function registerNotificationRenewal() {
  if (isExpoGo || Platform.OS === 'web' || !(await TaskManager.isAvailableAsync())) return;
  if (!(await TaskManager.isTaskRegisteredAsync(TASK))) {
    await BackgroundTask.registerTaskAsync(TASK, { minimumInterval: 6 * 60 });
  }
}
