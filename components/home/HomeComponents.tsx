import React, { memo, useMemo } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { HOME_COLORS, HOME_LAYOUT } from "../../constants/homeTheme";
import { useTranslation } from "../../i18n";
import {
  formatHijriDate,
  getDayName,
  getGregorianMonths,
} from "../../services/hijriService";
import {
  formatPrayerTime,
  getCountdown,
  type PrayerTimesData,
} from "../../services/prayerService";
import { type PrayerCompletion } from "../../store/usePrayerStore";
import { useNow } from "../../hooks/use-now";
import { LocationNotice } from "../LocationNotice";

type PrayerKey = keyof PrayerTimesData;
type CompletionKey = keyof PrayerCompletion[string];
type Next = { key: string; time: Date } | null;
const KEYS: PrayerKey[] = [
  "fajr",
  "sunrise",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
];
const META = {
  fajr: { icon: "weather-night", label: "prayerFajr" },
  sunrise: { icon: "weather-sunset-up", label: "prayerSunrise" },
  dhuhr: { icon: "weather-sunny", label: "prayerDhuhr" },
  asr: { icon: "weather-partly-cloudy", label: "prayerAsr" },
  maghrib: { icon: "weather-sunset-down", label: "prayerMaghrib" },
  isha: { icon: "moon-waning-crescent", label: "prayerIsha" },
} as const;
const HERO = {
  light: require("../../assets/prayer/hero-light.webp"),
  dark: require("../../assets/prayer/hero-dark.webp"),
};
function useHome() {
  const { isDark, fs } = useTheme();
  const { t, language } = useTranslation();
  const colors = isDark ? HOME_COLORS.dark : HOME_COLORS.light;
  const rtl = language === "ar";
  const styles = useMemo(() => makeStyles(colors, fs, rtl), [colors, fs, rtl]);
  return { colors, fs, styles, isDark, t, language, rtl };
}
export function HomeHero({
  now,
  location,
  loading,
  unreadCount,
  onLocation,
  onSettings,
  onNotifications,
}: {
  now: Date;
  location: { city: string } | null;
  loading: boolean;
  unreadCount: number;
  onLocation: () => void;
  onSettings: () => void;
  onNotifications: () => void;
}) {
  const { colors, styles, isDark, t, language } = useHome();
  const insets = useSafeAreaInsets();
  return (
    <ImageBackground
      source={isDark ? HERO.dark : HERO.light}
      style={[styles.hero, { height: 268 + insets.top }]}
      resizeMode="cover"
    >
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isDark
              ? "rgba(8,19,32,0.38)"
              : "rgba(255,253,248,0.16)",
          },
        ]}
      />
      <SafeAreaView edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onLocation}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={t("homeRefreshLocation")}
            style={[
              styles.location,
              { backgroundColor: isDark ? "#081320DD" : "#FFFDF8E8" },
            ]}
          >
            <Ionicons name="location" color={colors.gold} size={21} />
            <View style={{ flex: 1 }}>
              {location?.city && (
                <Text style={styles.locationLabel}>
                  {t("homeCurrentLocation")}
                </Text>
              )}
              <Text numberOfLines={1} style={styles.city}>
                {location?.city || t("homeRefreshLocation")}
              </Text>
            </View>
            {loading ? (
              <ActivityIndicator color={colors.gold} />
            ) : (
              <Ionicons name="refresh-outline" size={18} color={colors.gold} />
            )}
          </TouchableOpacity>
          <View
            style={[
              styles.headerActions,
              { backgroundColor: isDark ? "#081320DD" : "#FFFDF8E8" },
            ]}
          >
            <TouchableOpacity
              style={styles.touch}
              accessibilityRole="button"
              accessibilityLabel={t("settingsAppSettings")}
              onPress={onSettings}
            >
              <Ionicons
                name="settings-outline"
                size={23}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.touch}
              accessibilityRole="button"
              accessibilityLabel={`${t("homeNotifications")}, ${unreadCount}`}
              onPress={onNotifications}
            >
              <Ionicons
                name="notifications-outline"
                size={24}
                color={colors.textPrimary}
              />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        <View
          style={[
            styles.date,
            { backgroundColor: isDark ? "#081320CE" : "#FFFDF8DA" },
          ]}
        >
          <Text style={styles.day}>{getDayName(now, language)}</Text>
          <Text style={styles.dateText}>
            {now.getDate()} {getGregorianMonths(language)[now.getMonth()]}
          </Text>
          <Text style={styles.hijri}>{formatHijriDate(now, language)}</Text>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}
const Countdown = memo(function Countdown({ target }: { target: Date }) {
  const now = useNow();
  const { styles, t } = useHome();
  const remaining = getCountdown(target, now.getTime());
  return (
    <View
      style={styles.countdown}
      accessible
      accessibilityLabel={`${t("homeRemaining")}: ${remaining}`}
    >
      <Text style={styles.count} adjustsFontSizeToFit numberOfLines={1}>
        {remaining}
      </Text>
      <View style={styles.units}>
        {(["homeHours", "homeMinutes", "homeSeconds"] as const).map((k) => (
          <Text key={k} style={styles.unit}>
            {t(k)}
          </Text>
        ))}
      </View>
    </View>
  );
});
export function NextPrayerCard({
  next,
  loading,
  hasLocation,
}: {
  next: Next;
  loading: boolean;
  hasLocation: boolean;
}) {
  const { styles, colors, t, fs } = useHome();
  const { width, fontScale } = useWindowDimensions();
  if (loading && !hasLocation)
    return (
      <View style={[styles.card, styles.loading]}>
        <ActivityIndicator color={colors.gold} />
        <Text style={styles.secondary}>{t("homeLoading")}</Text>
      </View>
    );
  if (!hasLocation || !next)
    return (
      <View style={[styles.card, styles.loading]}>
        <LocationNotice />
      </View>
    );
  const meta = META[next.key as PrayerKey];
  const stacked = width < 350 || fontScale > 1.3 || fs(16) > 20;
  return (
    <View
      style={[
        styles.card,
        styles.next,
        stacked && { flexDirection: "column", alignItems: "stretch" },
      ]}
    >
      <View style={styles.nextSide}>
        <Text style={styles.eyebrow}>{t("homeNextPrayer")}</Text>
        <View style={styles.row}>
          <View style={styles.prayerIcon}>
            <MaterialCommunityIcons
              name={meta.icon}
              size={30}
              color={colors.gold}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.nextName}>{t(meta.label)}</Text>
            <Text style={styles.nextTime}>{formatPrayerTime(next.time)}</Text>
          </View>
        </View>
      </View>
      <View
        style={[
          styles.remaining,
          stacked && {
            borderStartWidth: 0,
            borderTopWidth: 1,
            paddingTop: 12,
            paddingStart: 0,
          },
        ]}
      >
        <Text style={styles.eyebrow}>{t("homeRemaining")}</Text>
        <Countdown target={next.time} />
      </View>
    </View>
  );
}
export function QuickActions({
  onQibla,
  onMosques,
}: {
  onQibla: () => void;
  onMosques: () => void;
}) {
  const { styles, colors, t } = useHome();
  return (
    <View style={styles.actions}>
      {(
        [
          { label: "homeQibla", icon: "compass-outline", family: "ion", onPress: onQibla },
          { label: "homeMosques", icon: "mosque", family: "mci", onPress: onMosques },
        ] as const
      ).map((a) => (
        <TouchableOpacity
          key={a.label}
          accessibilityRole="button"
          onPress={a.onPress}
          style={styles.action}
        >
          {a.family === "mci" ? (
            <MaterialCommunityIcons name={a.icon} size={23} color={colors.gold} />
          ) : (
            <Ionicons name={a.icon} size={23} color={colors.gold} />
          )}
          <Text style={styles.actionText}>{t(a.label)}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
export function PrayerTimesCard({
  times,
  now,
  next,
  completion,
  reminderEnabled,
  onReminder,
  onToggle,
  onViewAll,
}: {
  times: PrayerTimesData | null;
  now: Date;
  next: Next;
  completion: PrayerCompletion[string];
  reminderEnabled: boolean;
  onReminder: () => void;
  onToggle: (key: CompletionKey) => void;
  onViewAll: () => void;
}) {
  const { styles, colors, t, rtl } = useHome();
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={[styles.eyebrow, { flex: 1 }]}>
          {t("prayerTimesTitle")}
        </Text>
        <TouchableOpacity
          style={styles.viewAll}
          onPress={onViewAll}
          accessibilityRole="button"
        >
          <Text style={styles.secondary}>{t("homeViewAll")}</Text>
          <Ionicons
            name={rtl ? "chevron-back" : "chevron-forward"}
            size={16}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
      {KEYS.map((key) => {
        const time = times?.[key];
        const past = !!time && time.getTime() <= now.getTime();
        const active =
          next?.key === key && time?.getTime() === next.time.getTime();
        const done = key !== "sunrise" && completion[key];
        const color = active
          ? colors.gold
          : past
            ? colors.textMuted
            : colors.textPrimary;
        return (
          <View
            key={key}
            style={[
              styles.prayerRow,
              active && { backgroundColor: colors.goldGlow },
            ]}
          >
            <MaterialCommunityIcons
              name={META[key].icon}
              size={25}
              color={color}
            />
            <View style={styles.prayerLabel}>
              <Text style={[styles.prayerName, { color }]}>
                {t(META[key].label)}
              </Text>
              {active && (
                <Text style={styles.nextTag}>{t("widgetUpcoming")}</Text>
              )}
            </View>
            <Text style={[styles.time, { color }]}>
              {time ? formatPrayerTime(time) : "—"}
            </Text>
            {key !== "sunrise" && past ? (
              <TouchableOpacity
                style={styles.touch}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: !!done }}
                accessibilityLabel={t(
                  done ? "homeUnmarkPrayer" : "homeMarkPrayer",
                  { prayer: t(META[key].label) },
                )}
                onPress={() => onToggle(key)}
              >
                <Ionicons
                  name={done ? "checkmark-circle" : "square-outline"}
                  size={22}
                  color={done ? colors.gold : colors.textMuted}
                />
              </TouchableOpacity>
            ) : active ? (
              <TouchableOpacity
                style={styles.touch}
                accessibilityRole="button"
                accessibilityLabel={t(
                  reminderEnabled ? "homeReminderOn" : "homeReminderOff",
                )}
                onPress={onReminder}
              >
                <Ionicons
                  name={
                    reminderEnabled
                      ? "notifications"
                      : "notifications-off-outline"
                  }
                  size={21}
                  color={colors.gold}
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.touch}>
                <Ionicons
                  name={past ? "time-outline" : "remove-outline"}
                  size={18}
                  color={colors.textMuted}
                  accessible={false}
                />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
export function DailyContentCard({
  title,
  subtitle,
  text,
  arabic,
  source,
  onShare,
  onOpen,
}: {
  title: string;
  subtitle?: string;
  text: string;
  arabic?: string;
  source: string;
  onShare: () => void;
  onOpen?: () => void;
}) {
  const { styles, colors, t, rtl } = useHome();
  return (
    <View style={[styles.card, styles.daily]}>
      <MaterialCommunityIcons
        name="book-open-variant"
        size={29}
        color={colors.gold}
      />
      <View style={{ flex: 1, gap: 5 }}>
        <Text style={styles.eyebrow}>{title}</Text>
        {subtitle && <Text style={styles.prayerName}>{subtitle}</Text>}
        {arabic && (
          <Text
            style={[
              styles.content,
              { textAlign: "right", writingDirection: "rtl" },
            ]}
          >
            {arabic}
          </Text>
        )}
        <Text style={styles.content}>{text}</Text>
        <Text style={styles.source}>{source}</Text>
        {onOpen && (
          <TouchableOpacity
            accessibilityRole="button"
            onPress={onOpen}
            style={styles.viewAll}
          >
            <Text style={styles.secondary}>{t("homeViewAll")}</Text>
            <Ionicons
              name={rtl ? "chevron-back" : "chevron-forward"}
              size={16}
              color={colors.gold}
            />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity
        style={styles.touch}
        accessibilityRole="button"
        accessibilityLabel={`${t("homeShare")}: ${title}`}
        onPress={onShare}
      >
        <Ionicons name="share-social-outline" size={20} color={colors.gold} />
      </TouchableOpacity>
    </View>
  );
}
const makeStyles = (
  c: typeof HOME_COLORS.dark,
  fs: (n: number) => number,
  rtl: boolean,
) =>
  StyleSheet.create({
    hero: { minHeight: 268, paddingBottom: 60 },
    header: {
      flexDirection: rtl ? "row-reverse" : "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    location: {
      flex: 1,
      flexDirection: rtl ? "row-reverse" : "row",
      gap: 5,
      alignItems: "center",
      minHeight: 48,
      paddingHorizontal: 8,
      borderRadius: 16,
    },
    city: {
      fontSize: fs(17),
      fontWeight: "700",
      color: c.textPrimary,
      flexShrink: 1,
    },
    locationLabel: {
      fontSize: fs(11),
      fontWeight: "600",
      color: c.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    headerActions: { flexDirection: "row", borderRadius: 16 },
    touch: {
      minWidth: 48,
      minHeight: 48,
      alignItems: "center",
      justifyContent: "center",
    },
    badge: {
      position: "absolute",
      top: 4,
      end: 4,
      backgroundColor: c.red,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      paddingHorizontal: 3,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeText: { color: "#FFF", fontSize: 10, fontWeight: "700" },
    date: {
      marginHorizontal: 16,
      marginTop: 18,
      padding: 12,
      borderRadius: 14,
      alignSelf: rtl ? "flex-end" : "flex-start",
    },
    day: {
      fontSize: fs(12),
      color: c.textSecondary,
      textAlign: rtl ? "right" : "left",
    },
    dateText: {
      fontSize: fs(29),
      fontWeight: "700",
      color: c.textPrimary,
      textAlign: rtl ? "right" : "left",
      marginVertical: 3,
    },
    hijri: {
      fontSize: fs(14),
      color: c.textPrimary,
      textAlign: rtl ? "right" : "left",
    },
    card: {
      backgroundColor: c.cardBg,
      borderColor: c.cardBorder,
      borderWidth: 1,
      borderRadius: HOME_LAYOUT.radius,
      overflow: "hidden",
    },
    next: {
      flexDirection: rtl ? "row-reverse" : "row",
      alignItems: "center",
      padding: 16,
      gap: 12,
    },
    nextSide: { flex: 1, gap: 8 },
    remaining: {
      flex: 1,
      borderStartWidth: 1,
      borderColor: c.cardBorder,
      paddingStart: 12,
      gap: 8,
    },
    eyebrow: {
      fontSize: fs(11),
      fontWeight: "600",
      color: c.textSecondary,
      textAlign: rtl ? "right" : "left",
    },
    row: {
      flexDirection: rtl ? "row-reverse" : "row",
      alignItems: "center",
      gap: 9,
    },
    prayerIcon: {
      width: 42,
      height: 42,
      borderRadius: 22,
      backgroundColor: c.goldGlow,
      alignItems: "center",
      justifyContent: "center",
    },
    nextName: {
      fontSize: fs(22),
      fontWeight: "700",
      color: c.textPrimary,
      textAlign: rtl ? "right" : "left",
    },
    nextTime: {
      fontSize: fs(21),
      fontWeight: "700",
      color: c.gold,
      fontVariant: ["tabular-nums"],
      writingDirection: "ltr",
      textAlign: rtl ? "right" : "left",
    },
    countdown: { gap: 4 },
    count: {
      fontSize: fs(28),
      color: c.gold,
      fontWeight: "700",
      fontVariant: ["tabular-nums"],
      writingDirection: "ltr",
      textAlign: "center",
    },
    units: { flexDirection: "row", justifyContent: "space-around" },
    unit: { fontSize: fs(9), color: c.textSecondary },
    actions: {
      flexDirection: rtl ? "row-reverse" : "row",
      gap: 8,
      flexWrap: "wrap",
    },
    action: {
      flexGrow: 1,
      flexBasis: 140,
      flexDirection: rtl ? "row-reverse" : "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      minHeight: 48,
      padding: 10,
      borderWidth: 1,
      borderColor: c.cardBorder,
      borderRadius: 28,
      backgroundColor: c.cardBg,
    },
    actionText: {
      color: c.gold,
      fontSize: fs(13),
      flexShrink: 1,
      textAlign: "center",
    },
    cardHeader: {
      flexDirection: rtl ? "row-reverse" : "row",
      alignItems: "center",
      paddingHorizontal: 16,
      gap: 8,
    },
    viewAll: {
      flexDirection: rtl ? "row-reverse" : "row",
      alignItems: "center",
      gap: 3,
      minHeight: 48,
    },
    secondary: { color: c.textSecondary, fontSize: fs(12) },
    prayerRow: {
      flexDirection: rtl ? "row-reverse" : "row",
      alignItems: "center",
      paddingStart: 16,
      paddingEnd: 4,
      gap: 12,
      minHeight: 48,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: c.cardBorder,
    },
    prayerLabel: { flex: 1, paddingVertical: 5 },
    prayerName: {
      color: c.textPrimary,
      fontSize: fs(15),
      textAlign: rtl ? "right" : "left",
    },
    nextTag: {
      fontSize: fs(9),
      color: c.gold,
      textAlign: rtl ? "right" : "left",
    },
    time: {
      fontSize: fs(15),
      fontWeight: "600",
      fontVariant: ["tabular-nums"],
      writingDirection: "ltr",
    },
    daily: {
      flexDirection: rtl ? "row-reverse" : "row",
      alignItems: "flex-start",
      gap: 10,
      padding: 14,
      borderStartWidth: 3,
      borderStartColor: c.gold,
    },
    content: {
      color: c.textPrimary,
      fontSize: fs(14),
      lineHeight: fs(22),
      textAlign: rtl ? "right" : "left",
      writingDirection: rtl ? "rtl" : "ltr",
    },
    source: {
      fontSize: fs(11),
      color: c.textSecondary,
      textAlign: rtl ? "right" : "left",
    },
    loading: { padding: 16, gap: 12, minHeight: 112, justifyContent: "center" },
  });
