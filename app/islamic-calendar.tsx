import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ToastAndroid, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from '../i18n';
import { SPACING, RADIUS, FONT_SIZE } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { ISLAMIC_EVENTS, IslamicEvent, getEventName, getEventDescription } from '../data/islamicEvents';
import { getGregorianMonths, formatGregorianDate } from '../services/hijriService';
import { useSettingsStore } from '../store/useSettingsStore';
import { requestNotificationPermission } from '../services/notificationService';

const CALENDAR_TAB_KEYS = ['calendarTabYearly', 'calendarTabUpcoming'] as const;

const EVENT_COLORS: Record<IslamicEvent['type'], string> = {
  bayram: '#4CAF50',
  kandil: '#D4A84B',
  ozel: '#2196F3',
};

const EVENT_ICONS: Record<IslamicEvent['type'], string> = {
  bayram: 'star-circle',
  kandil: 'candle',
  ozel: 'calendar-star',
};

export default function IslamicCalendarScreen() {
  const { t, language } = useTranslation();
  const { colors, fs } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors, fs), [colors, fs]);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedYear] = useState(new Date().getFullYear());
  const now = new Date();
  const notifiedEventIds = useSettingsStore(s => s.settings.notifiedEventIds ?? []);
  const toggleEventNotification = useSettingsStore(s => s.toggleEventNotification);

  const handleToggleEventNotification = async (event: IslamicEvent) => {
    const willEnable = !notifiedEventIds.includes(event.id);
    if (willEnable) {
      const granted = await requestNotificationPermission();
      if (!granted) return;
    }
    toggleEventNotification(event.id);
    if (Platform.OS === 'android') {
      ToastAndroid.show(willEnable ? t('islamicDayNotifyOn') : t('islamicDayNotifyOff'), ToastAndroid.SHORT);
    }
  };

  const upcomingEvents = ISLAMIC_EVENTS
    .map(e => {
      const eventDate = new Date(e.date);
      const daysLeft = Math.ceil((eventDate.getTime() - now.getTime()) / 86400000);
      return { ...e, daysLeft, eventDate };
    })
    .filter(e => e.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const monthGroups = getGregorianMonths(language).map((month, i) => {
    const events = ISLAMIC_EVENTS.filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === selectedYear && d.getMonth() === i;
    });
    return { month, events };
  }).filter(g => g.events.length > 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('calendarTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabs}>
        {CALENDAR_TAB_KEYS.map((key, i) => (
          <TouchableOpacity key={key} style={[styles.tab, activeTab === i && styles.tabActive]} onPress={() => setActiveTab(i)}>
            <Text style={[styles.tabLabel, activeTab === i && styles.tabLabelActive]}>{t(key as any)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 0 ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: SPACING.md }}>
          {/* Year selector */}
          <View style={styles.yearRow}>
            <Text style={styles.yearText}>{selectedYear}</Text>
          </View>

          {monthGroups.map(({ month, events }) => (
            <View key={month} style={styles.monthSection}>
              <Text style={styles.monthTitle}>{month}</Text>
              {events.map(event => {
                const d = new Date(event.date);
                const dayName = [t('dayFullSun'),t('dayFullMon'),t('dayFullTue'),t('dayFullWed'),t('dayFullThu'),t('dayFullFri'),t('dayFullSat')][d.getDay()];
                const color = EVENT_COLORS[event.type];
                return (
                  <View key={event.id} style={styles.eventRow}>
                    <View style={[styles.eventDateBox, { backgroundColor: color + '22' }]}>
                      <Text style={[styles.eventDay, { color }]}>{d.getDate()}</Text>
                      <Text style={[styles.eventDayName, { color }]}>{dayName.substring(0, 3)}</Text>
                    </View>
                    <View style={styles.eventInfo}>
                      <View style={styles.eventTitleRow}>
                        <MaterialCommunityIcons name={EVENT_ICONS[event.type] as any} size={16} color={color} />
                        <Text style={styles.eventName}>{getEventName(event, language)}</Text>
                      </View>
                      {getEventDescription(event, language) && <Text style={styles.eventDesc}>{getEventDescription(event, language)}</Text>}
                    </View>
                    <TouchableOpacity
                      style={styles.bellBtn}
                      onPress={() => handleToggleEventNotification(event)}
                      accessibilityRole="button"
                      accessibilityLabel={notifiedEventIds.includes(event.id) ? t('islamicDayNotifyOff') : t('islamicDayNotifyOn')}
                    >
                      <Ionicons
                        name={notifiedEventIds.includes(event.id) ? 'notifications' : 'notifications-outline'}
                        size={18}
                        color={notifiedEventIds.includes(event.id) ? colors.gold : colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: SPACING.md }}>
          {upcomingEvents.slice(0, 10).map(event => {
            const color = EVENT_COLORS[event.type];
            const d = event.eventDate;
            return (
              <View key={event.id} style={styles.upcomingCard}>
                <View style={[styles.upcomingIcon, { backgroundColor: color + '22' }]}>
                  <MaterialCommunityIcons name={EVENT_ICONS[event.type] as any} size={24} color={color} />
                </View>
                <View style={styles.upcomingInfo}>
                  <Text style={styles.upcomingName}>{getEventName(event, language)}</Text>
                  <Text style={styles.upcomingDate}>{formatGregorianDate(d, language)}</Text>
                </View>
                <View style={[styles.daysLeftBadge, { backgroundColor: color + '22', borderColor: color }]}>
                  <Text style={[styles.daysLeftNum, { color }]}>{event.daysLeft}</Text>
                  <Text style={[styles.daysLeftLabel, { color }]}>{t('calendarDaySuffix')}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const makeStyles = (colors: any, fs: (n: number) => number) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: colors.textPrimary, fontSize: FONT_SIZE.lg, fontWeight: '700' },
  tabs: { flexDirection: 'row', marginHorizontal: SPACING.md, backgroundColor: colors.cardBg, borderRadius: RADIUS.full, padding: 3, borderColor: colors.cardBorder, borderWidth: 1, marginBottom: SPACING.sm },
  tab: { flex: 1, paddingVertical: SPACING.xs + 2, alignItems: 'center', borderRadius: RADIUS.full },
  tabActive: { backgroundColor: colors.gold },
  tabLabel: { color: colors.textSecondary, fontSize: FONT_SIZE.sm, fontWeight: '500' },
  tabLabelActive: { color: colors.background, fontWeight: '700' },
  yearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  yearText: { color: colors.textPrimary, fontSize: FONT_SIZE.xl, fontWeight: '700' },
  monthSection: { marginBottom: SPACING.md },
  monthTitle: { color: colors.gold, fontSize: FONT_SIZE.md, fontWeight: '700', marginBottom: SPACING.sm },
  eventRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBg, borderColor: colors.cardBorder, borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACING.sm, marginBottom: SPACING.sm, gap: SPACING.sm },
  eventDateBox: { width: 48, height: 48, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  eventDay: { fontSize: FONT_SIZE.lg, fontWeight: '700' },
  eventDayName: { fontSize: FONT_SIZE.xs },
  eventInfo: { flex: 1 },
  eventTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  eventName: { color: colors.textPrimary, fontSize: FONT_SIZE.sm, fontWeight: '600' },
  eventDesc: { color: colors.textMuted, fontSize: FONT_SIZE.xs, marginTop: 2 },
  bellBtn: { padding: SPACING.xs },
  upcomingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBg, borderColor: colors.cardBorder, borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, gap: SPACING.md },
  upcomingIcon: { width: 52, height: 52, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  upcomingInfo: { flex: 1 },
  upcomingName: { color: colors.textPrimary, fontSize: FONT_SIZE.md, fontWeight: '600' },
  upcomingDate: { color: colors.textMuted, fontSize: FONT_SIZE.xs, marginTop: 2 },
  daysLeftBadge: { alignItems: 'center', borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, minWidth: 54 },
  daysLeftNum: { fontSize: FONT_SIZE.xl, fontWeight: '700' },
  daysLeftLabel: { fontSize: FONT_SIZE.xs },
});
