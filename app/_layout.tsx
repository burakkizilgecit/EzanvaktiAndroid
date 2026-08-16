import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { ThemeProvider } from '../context/ThemeContext';
import { useTheme } from '../context/ThemeContext';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { renderWidgetForUpdate } from '../widgets/widgetTaskHandler';
import * as Notifications from 'expo-notifications';
import { usePrayerStore } from '../store/usePrayerStore';
import { useDhikrStore } from '../store/useDhikrStore';
import { useGoalsStore } from '../store/useGoalsStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useTutorialStore } from '../store/useTutorialStore';
import {
  setupNotificationChannel,
  setupCustomNotificationChannel,
  setupNotificationHandler,
  requestNotificationPermission,
  scheduleAllNotifications,
  scheduleIslamicDayNotifications,
} from '../services/notificationService';

function RootLayoutInner() {
  const router = useRouter();
  const { isDark } = useTheme();
  const loadCompletion    = usePrayerStore(s => s.loadCompletion);
  const loadDhikr         = useDhikrStore(s => s.loadData);
  const checkDhikrDayRollover = useDhikrStore(s => s.checkDayRollover);
  const loadGoals         = useGoalsStore(s => s.loadGoals);
  const loadSettings      = useSettingsStore(s => s.loadSettings);
  const loadNotifications = useNotificationStore(s => s.loadNotifications);
  const location          = usePrayerStore(s => s.location);
  const settings          = useSettingsStore(s => s.settings);
  const { load: loadTutorial, completed: tutorialDone, loaded: tutorialLoaded } = useTutorialStore();
  const notifListener     = useRef<Notifications.EventSubscription | null>(null);
  const appStateRef       = useRef(AppState.currentState);

  useEffect(() => {
    loadCompletion();
    loadDhikr();
    loadGoals();
    loadSettings();
    loadNotifications();
    loadTutorial();

    // Set up notification infrastructure
    setupNotificationHandler();
    setupNotificationChannel();

    // Handle notification taps — dismiss the tapped notification automatically
    notifListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const { notification } = response;
      Notifications.dismissNotificationAsync(notification.request.identifier).catch(() => {});
      const data = notification.request.content.data as any;
      if (data?.type === 'prayer' || data?.type === 'early') {
        router.push('/(tabs)/prayer-times' as any);
      } else if (data?.type === 'dhikr') {
        router.push('/(tabs)/dhikr' as any);
      } else if (data?.type === 'dua') {
        router.push('/(tabs)/duas' as any);
      }
    });

    // Dismiss all notifications when app comes to foreground
    const appStateSub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        Notifications.dismissAllNotificationsAsync().catch(() => {});
        checkDhikrDayRollover();
      }
      appStateRef.current = nextState;
    });

    // Also catch the day rolling over while the app stays open in the foreground
    const dayRolloverInterval = setInterval(checkDhikrDayRollover, 60_000);

    // Request permission
    requestNotificationPermission();

    return () => {
      notifListener.current?.remove();
      appStateSub.remove();
      clearInterval(dayRolloverInterval);
    };
  }, []);

  // Tutorial: ilk yüklenince tamamlanmamışsa yönlendir
  useEffect(() => {
    if (tutorialLoaded && !tutorialDone) {
      router.replace('/tutorial' as any);
    }
  }, [tutorialLoaded, tutorialDone]);

  // Restore custom notification channel on startup if user had one saved
  useEffect(() => {
    if (settings.notificationSound === 'custom' && settings.customSoundUri) {
      setupCustomNotificationChannel(settings.customSoundUri).catch(() => {});
    }
  }, [settings.customSoundUri]);

  // Reschedule notifications + update widget when location or settings change
  useEffect(() => {
    if (!location) return;
    scheduleAllNotifications(location.lat, location.lng, settings).catch(() => {});
    if (Platform.OS === 'android') {
      requestWidgetUpdate({ widgetName: 'PrayerWidget', renderWidget: () => renderWidgetForUpdate() }).catch(() => {});
    }
  }, [location?.lat, location?.lng, settings.notifications, settings.silentHours, settings.notificationSound, settings.customSoundUri]);

  // Islamic days (kandil/bayram/özel) reminders — independent of prayer-time scheduling
  useEffect(() => {
    if (!settings.notifications.islamicDays) {
      Notifications.getAllScheduledNotificationsAsync().then((all) => {
        all
          .filter((n) => n.identifier.startsWith('islamicday_'))
          .forEach((n) => Notifications.cancelScheduledNotificationAsync(n.identifier));
      });
      return;
    }
    scheduleIslamicDayNotifications(settings.language ?? 'tr').catch(() => {});
  }, [settings.notifications.islamicDays, settings.language]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="worship-tracking" />
        <Stack.Screen name="islamic-calendar" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="achievements" />
        <Stack.Screen name="statistics" />
        <Stack.Screen name="daily-goals" />
        <Stack.Screen name="upcoming-events" />
        <Stack.Screen name="quran" />
        <Stack.Screen name="quran-surah" />
        <Stack.Screen name="tutorial" options={{ gestureEnabled: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutInner />
    </ThemeProvider>
  );
}
