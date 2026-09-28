/** Isolated visual QA entry; never imported by the production app.
 * Kocaeli is a test fixture from the reference. Times are calculated by the real service.
 */
import React from "react";
import { registerRootComponent } from "expo";
import { View, ScrollView } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "../context/ThemeContext";
import {
  HomeHero,
  NextPrayerCard,
  QuickActions,
  PrayerTimesCard,
  DailyContentCard,
} from "../components/home/HomeComponents";
import CustomTabBar from "../components/CustomTabBar";
import { useSettingsStore } from "../store/useSettingsStore";
import { calculatePrayerTimes, getNextPrayer } from "../services/prayerService";
import { getDailyHadith } from "../data/hadiths";
import { useTranslation } from "../i18n";
import { HOME_COLORS } from "../constants/homeTheme";

const query =
  typeof window !== "undefined"
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams();
const theme = query.get("theme") === "dark" ? "dark" : "light";
const language =
  query.get("lang") === "ar" ? "ar" : query.get("lang") === "en" ? "en" : "tr";
useSettingsStore.setState((s) => ({
  settings: {
    ...s.settings,
    theme,
    language,
    fontSize: query.get("large") ? "xlarge" : "normal",
  },
}));
const loc = { lat: 40.7654, lng: 29.9408, city: "Kocaeli" };
const times = calculatePrayerTimes(loc.lat, loc.lng);
const now = new Date();
const next = getNextPrayer(times, loc.lat, loc.lng, now);
const completion = {
  fajr: false,
  dhuhr: false,
  asr: false,
  maghrib: false,
  isha: false,
};
const noop = () => {};
const routes = ["index", "prayer-times", "qibla", "dhikr", "more"].map(
  (name) => ({ name, key: name }),
);
function Preview() {
  const { t } = useTranslation();
  const h = getDailyHadith();
  return (
    <View style={{ flex: 1, backgroundColor: HOME_COLORS[theme].background }}>
      <ScrollView>
        <HomeHero
          now={now}
          location={loc}
          loading={false}
          unreadCount={3}
          onLocation={noop}
          onSelectLocation={noop}
          onSettings={noop}
          onNotifications={noop}
        />
        <View
          style={{
            paddingHorizontal: 16,
            marginTop: -24,
            gap: 12,
            paddingBottom: 24,
          }}
        >
          <NextPrayerCard next={next} loading={false} hasLocation />
          <QuickActions onQibla={noop} onMosques={noop} />
          <PrayerTimesCard
            times={times}
            now={now}
            next={next}
            completion={completion}
            reminderEnabled
            onReminder={noop}
            onToggle={noop}
            onViewAll={noop}
          />
          <DailyContentCard
            title={t("homeDailyHadith")}
            text={language === "ar" ? h.ar : language === "en" ? h.en : h.text}
            source={h.source}
            onShare={noop}
          />
        </View>
      </ScrollView>
      <CustomTabBar
        {...({
          state: { routes, index: 0 },
          navigation: {
            emit: () => ({ defaultPrevented: false }),
            navigate: noop,
          },
        } as any)}
      />
    </View>
  );
}
registerRootComponent(() => (
  <SafeAreaProvider>
    <ThemeProvider>
      <Preview />
    </ThemeProvider>
  </SafeAreaProvider>
));
