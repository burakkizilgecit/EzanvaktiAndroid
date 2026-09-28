import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ToastAndroid, Platform, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from '../i18n';
import { SPACING, RADIUS, FONT_SIZE } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { ISLAMIC_EVENTS, IslamicEvent, getEventName, getEventDescription, getEventInfo } from '../data/islamicEvents';
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
  const [selectedEvent, setSelectedEvent] = useState<IslamicEvent | null>(null);
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
  const selectedInfo = selectedEvent ? getEventInfo(selectedEvent, language) : null;
  const isRtl = language === 'ar';

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
                      <View style={[styles.eventTitleRow, isRtl && styles.rtlRow]}>
                        <MaterialCommunityIcons name={EVENT_ICONS[event.type] as any} size={16} color={color} />
                        <Text style={[styles.eventName, isRtl && styles.rtlText]}>{getEventName(event, language)}</Text>
                        <TouchableOpacity
                          style={styles.infoButton}
                          onPress={() => setSelectedEvent(event)}
                          accessibilityRole="button"
                          accessibilityLabel={t('upcomingInfoButton')}
                          hitSlop={8}
                        >
                          <Ionicons name="information-circle-outline" size={22} color={colors.gold} />
                        </TouchableOpacity>
                      </View>
                      {getEventDescription(event, language) && <Text style={[styles.eventDesc, isRtl && styles.rtlText]}>{getEventDescription(event, language)}</Text>}
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
                  <View style={[styles.eventTitleRow, isRtl && styles.rtlRow]}>
                    <Text style={[styles.upcomingName, isRtl && styles.rtlText]}>{getEventName(event, language)}</Text>
                    <TouchableOpacity
                      style={styles.infoButton}
                      onPress={() => setSelectedEvent(event)}
                      accessibilityRole="button"
                      accessibilityLabel={t('upcomingInfoButton')}
                      hitSlop={8}
                    >
                      <Ionicons name="information-circle-outline" size={22} color={colors.gold} />
                    </TouchableOpacity>
                  </View>
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

      <Modal
        visible={selectedEvent !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedEvent(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedEvent(null)} />
          {selectedEvent && selectedInfo && (
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <View style={[styles.modalHeader, isRtl && styles.rtlRow]}>
                <View style={[styles.modalIcon, { backgroundColor: EVENT_COLORS[selectedEvent.type] + '22' }]}>
                  <MaterialCommunityIcons
                    name={EVENT_ICONS[selectedEvent.type] as any}
                    size={30}
                    color={EVENT_COLORS[selectedEvent.type]}
                  />
                </View>
                <View style={styles.modalTitleWrap}>
                  <Text style={[styles.modalTitle, isRtl && styles.rtlText]}>{getEventName(selectedEvent, language)}</Text>
                  <Text style={[styles.modalDate, isRtl && styles.rtlText]}>{formatGregorianDate(new Date(selectedEvent.date), language)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseIcon}
                  onPress={() => setSelectedEvent(null)}
                  accessibilityRole="button"
                  accessibilityLabel={t('upcomingInfoClose')}
                >
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
                <InfoSection icon="help-circle-outline" title={t('upcomingInfoWhat')} text={selectedInfo.summary} isRtl={isRtl} styles={styles} colors={colors} />
                <InfoSection icon="sparkles-outline" title={t('upcomingInfoImportance')} text={selectedInfo.significance} isRtl={isRtl} styles={styles} colors={colors} />
                <InfoSection icon="heart-outline" title={t('upcomingInfoPractices')} text={selectedInfo.observances} isRtl={isRtl} styles={styles} colors={colors} />
              </ScrollView>

              <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedEvent(null)} accessibilityRole="button">
                <Text style={styles.closeButtonText}>{t('upcomingInfoClose')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InfoSection({ icon, title, text, isRtl, styles, colors }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  text: string;
  isRtl: boolean;
  styles: ReturnType<typeof makeStyles>;
  colors: any;
}) {
  return (
    <View style={styles.detailSection}>
      <View style={[styles.detailHeadingRow, isRtl && styles.rtlRow]}>
        <Ionicons name={icon} size={20} color={colors.gold} />
        <Text style={[styles.detailHeading, isRtl && styles.rtlText]}>{title}</Text>
      </View>
      <Text style={[styles.detailText, isRtl && styles.rtlText]}>{text}</Text>
    </View>
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
  eventName: { color: colors.textPrimary, fontSize: FONT_SIZE.sm, fontWeight: '600', flexShrink: 1 },
  eventDesc: { color: colors.textMuted, fontSize: FONT_SIZE.xs, marginTop: 2 },
  infoButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.gold + '16' },
  bellBtn: { padding: SPACING.xs },
  upcomingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBg, borderColor: colors.cardBorder, borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, gap: SPACING.md },
  upcomingIcon: { width: 52, height: 52, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  upcomingInfo: { flex: 1 },
  upcomingName: { color: colors.textPrimary, fontSize: FONT_SIZE.md, fontWeight: '600', flexShrink: 1 },
  upcomingDate: { color: colors.textMuted, fontSize: FONT_SIZE.xs, marginTop: 2 },
  daysLeftBadge: { alignItems: 'center', borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, minWidth: 54 },
  daysLeftNum: { fontSize: FONT_SIZE.xl, fontWeight: '700' },
  daysLeftLabel: { fontSize: FONT_SIZE.xs },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.58)' },
  modalSheet: { maxHeight: '82%', backgroundColor: colors.cardBg, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: SPACING.lg, borderWidth: 1, borderColor: colors.cardBorder },
  modalHandle: { width: 44, height: 4, borderRadius: 2, backgroundColor: colors.textMuted + '66', alignSelf: 'center', marginBottom: SPACING.md },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingBottom: SPACING.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.cardBorder },
  modalIcon: { width: 54, height: 54, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  modalTitleWrap: { flex: 1 },
  modalTitle: { color: colors.textPrimary, fontSize: fs(20), fontWeight: '800' },
  modalDate: { color: colors.textMuted, fontSize: fs(12), marginTop: 3 },
  modalCloseIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  detailScroll: { marginTop: SPACING.sm },
  detailSection: { paddingVertical: SPACING.sm },
  detailHeadingRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: 6 },
  detailHeading: { color: colors.gold, fontSize: fs(14), fontWeight: '800' },
  detailText: { color: colors.textSecondary, fontSize: fs(14), lineHeight: fs(21) },
  closeButton: { minHeight: 48, borderRadius: RADIUS.md, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.sm },
  closeButtonText: { color: colors.background, fontSize: fs(15), fontWeight: '800' },
  rtlRow: { flexDirection: 'row-reverse' },
  rtlText: { textAlign: 'right', writingDirection: 'rtl' },
});
