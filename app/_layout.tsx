import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';
import { AppState, View, Text, ActivityIndicator, Button } from 'react-native';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { subscribeToNativeWatchActions, syncNativeWidgets } from '../widgets/syncNativeWidgets';
import { isNotificationPreview } from '../services/notificationRuntime';
import { usePrayerStore } from '../store/usePrayerStore';
import { useDhikrStore } from '../store/useDhikrStore';
import { useGoalsStore } from '../store/useGoalsStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useTutorialStore } from '../store/useTutorialStore';
import { addNotificationResponseListener, setupNotificationChannel, setupNotificationHandler, requestNotificationPermission, scheduleAllNotifications } from '../services/notificationService';
import { registerNotificationRenewal } from '../services/backgroundNotifications';
import { localDateKey } from '../services/dateService';
import { RateAppPrompt } from '../components/RateAppPrompt';
import { AppUpdatePrompt } from '../components/AppUpdatePrompt';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutInner() {
  const router = useRouter();
  const { isDark, colors } = useTheme();
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [updateCheckComplete, setUpdateCheckComplete] = useState(false);
  const [storeUpdateAvailable, setStoreUpdateAvailable] = useState(false);
  const location = usePrayerStore(s => s.location);
  const locationLoading = usePrayerStore(s => s.locationLoading);
  const settings = useSettingsStore(s => s.settings);
  const { completed: tutorialDone, loaded: tutorialLoaded } = useTutorialStore();
  const handleUpdateCheckComplete = useCallback((available: boolean) => {
    setStoreUpdateAvailable(available);
    setUpdateCheckComplete(true);
  }, []);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    const subscription = subscribeToNativeWatchActions();
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    let active = true;
    setBootError(false);
    setupNotificationHandler();
    Promise.all([
      usePrayerStore.getState().loadCompletion(), usePrayerStore.getState().loadLocation(), useDhikrStore.getState().loadData(),
      useGoalsStore.getState().loadGoals(), useSettingsStore.getState().loadSettings(),
      useNotificationStore.getState().loadNotifications(), useTutorialStore.getState().load(),
    ]).then(async () => {
      if (!active) return;
      setReady(true);
      usePrayerStore.getState().refreshLocation().catch(console.warn);
      try {
        await setupNotificationChannel();
        await requestNotificationPermission();
        await registerNotificationRenewal();
      } catch (error) { console.warn('Notification initialization failed', error); }
      if (active) setRefresh(n => n + 1);
    }).catch(error => { console.warn('Data loading failed', error); if (active) setBootError(true); });
    return () => { active = false; };
  }, [attempt]);

  useEffect(() => {
    if (!ready) return;
    let day = localDateKey();
    let offset = new Date().getTimezoneOffset();
    const updateDay = () => {
      usePrayerStore.getState().refreshPrayerTimes();
      useDhikrStore.getState().checkDayRollover();
      useGoalsStore.getState().checkDayRollover();
      if (day !== localDateKey() || offset !== new Date().getTimezoneOffset()) {
        day = localDateKey(); offset = new Date().getTimezoneOffset();
        setRefresh(n => n + 1);
      }
    };
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active') {
        updateDay();
        usePrayerStore.getState().refreshLocation().catch(console.warn);
        setRefresh(n => n + 1);
      }
    });
    const interval = setInterval(updateDay, 1000);
    return () => { listener.remove(); clearInterval(interval); };
  }, [ready]);

  useEffect(() => {
    const listener = addNotificationResponseListener(response => {
      const type = response.notification.request.content.data?.type;
      if (type === 'prayer' || type === 'early' || type === 'optionalPrayer' || type === 'persistentPrayerTimes') router.push('/(tabs)/prayer-times');
      else if (type === 'dhikr') router.push('/(tabs)/dhikr');
      else if (type === 'dua') router.push('/(tabs)/duas');
      else if (type === 'islamicDay') router.push('/upcoming-events');
      else router.push('/(tabs)');
    });
    return () => listener?.remove();
  }, [router]);

  useEffect(() => {
    if (ready && tutorialLoaded && !tutorialDone) router.replace('/tutorial');
  }, [ready, tutorialLoaded, tutorialDone, router]);

  useEffect(() => {
    if (!ready) return;
    if (locationLoading) return;
    scheduleAllNotifications(location?.lat ?? null, location?.lng ?? null, settings).catch(error => console.warn('Notification scheduling failed', error));
    syncNativeWidgets(location, settings).catch(error => console.warn('Widget update failed', error));
  }, [ready, location, locationLoading, settings, refresh]);

  if (!ready) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      {bootError ? <><Text style={{ color: colors.textPrimary }}>Veriler yüklenemedi.</Text><Button title="Tekrar Dene" onPress={() => setAttempt(n => n + 1)} /></> : <ActivityIndicator color={colors.gold} />}
    </View>
  );
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
        <Stack.Screen name="select-location" options={{ presentation: 'modal' }} />
        <Stack.Screen name="quran" />
        <Stack.Screen name="quran-surah" />
        <Stack.Screen name="tutorial" options={{ gestureEnabled: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      {isNotificationPreview && <View style={{ backgroundColor: colors.background, padding: 12 }}><Text style={{ color: colors.textPrimary, textAlign: 'center', fontSize: 12 }}>{settings.language === 'ar'
        ? 'معاينة Expo Go: التنبيهات وعناصر الشاشة الرئيسية تحتاج إلى نسخة Android مثبتة.'
        : settings.language === 'en'
          ? 'Expo Go preview: reminders and home screen widgets require an installed Android build.'
          : 'Expo Go önizlemesi: Hatırlatmalar ve ana ekran widgetları için Android uygulama derlemesi gerekir.'}</Text></View>}
      <AppUpdatePrompt enabled={ready && tutorialLoaded && tutorialDone} onCheckComplete={handleUpdateCheckComplete} />
      <RateAppPrompt enabled={ready && tutorialLoaded && tutorialDone && updateCheckComplete && !storeUpdateAvailable} />
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
