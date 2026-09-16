import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

export const isExpoGo = isRunningInExpoGo();
export const isNotificationPreview = Platform.OS === 'android' && isExpoGo;

// The package entry point installs push listeners on import, even for local reminders.
// Never evaluate it in Android Expo Go, where that native API is unavailable.
export function getNotifications(): typeof import('expo-notifications') | null {
  if (Platform.OS === 'web' || isNotificationPreview) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- Static imports execute unsupported push listeners before the guard.
  return require('expo-notifications') as typeof import('expo-notifications');
}
