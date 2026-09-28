import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Modal, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from '../i18n';
import { SPACING, RADIUS, FONT_SIZE } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { ISLAMIC_EVENTS, IslamicEvent, getEventName, getEventDescription, getEventInfo } from '../data/islamicEvents';
import { formatGregorianDate } from '../services/hijriService';

type FilterKey = 'all' | 'bayram' | 'kandil' | 'ozel';
type UpcomingEvent = IslamicEvent & { daysLeft: number; eventDate: Date };
const FILTER_KEYS: FilterKey[] = ['all', 'bayram', 'kandil', 'ozel'];
const FILTER_LABEL_KEYS: Record<FilterKey, string> = {
  all: 'upcomingTabAll', bayram: 'upcomingTabEid',
  kandil: 'upcomingTabKandil', ozel: 'upcomingTabSpecial',
};

const EVENT_COLORS: Record<IslamicEvent['type'], string> = {
  bayram: '#4CAF50', kandil: '#D4A84B', ozel: '#2196F3',
};

const EVENT_ICONS: Record<IslamicEvent['type'], string> = {
  bayram: 'star-circle', kandil: 'candle', ozel: 'calendar-star',
};

export default function UpcomingEventsScreen() {
  const { t, language } = useTranslation();
  const { colors, fs } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors, fs), [colors, fs]);
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [selectedEvent, setSelectedEvent] = useState<UpcomingEvent | null>(null);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const allWithDays = ISLAMIC_EVENTS
    .map(e => {
      const eventDate = new Date(e.date);
      const daysLeft = Math.ceil((eventDate.getTime() - now.getTime()) / 86400000);
      return { ...e, daysLeft, eventDate };
    })
    .filter(e => e.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const filtered = activeFilter === 'all'
    ? allWithDays
    : allWithDays.filter(e => e.type === activeFilter);
  const selectedInfo = selectedEvent ? getEventInfo(selectedEvent, language) : null;
  const isRtl = language === 'ar';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('upcomingTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter */}
      <View style={styles.filterRow}>
        {FILTER_KEYS.map(key => (
          <TouchableOpacity key={key} style={[styles.filterTab, activeFilter === key && styles.filterTabActive]} onPress={() => setActiveFilter(key)}>
            <Text style={[styles.filterLabel, activeFilter === key && styles.filterLabelActive]}>{t(FILTER_LABEL_KEYS[key] as any)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: SPACING.md }}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
        renderItem={({ item }) => {
          const color = EVENT_COLORS[item.type];
          const d = item.eventDate;
          return (
            <View style={styles.eventCard}>
              <View style={[styles.eventIcon, { backgroundColor: color + '22' }]}>
                <MaterialCommunityIcons name={EVENT_ICONS[item.type] as any} size={28} color={color} />
              </View>
              <View style={styles.eventInfo}>
                <View style={[styles.eventTitleRow, isRtl && styles.rtlRow]}>
                  <Text style={[styles.eventName, isRtl && styles.rtlText]}>{getEventName(item, language)}</Text>
                  <TouchableOpacity
                    style={styles.infoButton}
                    onPress={() => setSelectedEvent(item)}
                    accessibilityRole="button"
                    accessibilityLabel={t('upcomingInfoButton')}
                    hitSlop={8}
                  >
                    <Ionicons name="information-circle-outline" size={23} color={colors.gold} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.eventDate}>{formatGregorianDate(d, language)}</Text>
                {getEventDescription(item, language) && <Text style={styles.eventDesc}>{getEventDescription(item, language)}</Text>}
              </View>
              <View style={[styles.daysBadge, { borderColor: color }]}>
                <Text style={[styles.daysNum, { color }]}>{item.daysLeft}</Text>
                <Text style={[styles.daysLabel, { color }]}>{t('upcomingDaysLeft')}</Text>
              </View>
            </View>
          );
        }}
      />

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
                  <Text style={[styles.modalDate, isRtl && styles.rtlText]}>{formatGregorianDate(selectedEvent.eventDate, language)}</Text>
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
  headerTitle: { color: colors.textPrimary, fontSize: FONT_SIZE.xl, fontWeight: '700' },
  filterRow: { flexDirection: 'row', paddingHorizontal: SPACING.md, gap: SPACING.xs, marginBottom: SPACING.sm },
  filterTab: { paddingHorizontal: SPACING.sm + 2, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: colors.cardBg, borderColor: colors.cardBorder, borderWidth: 1 },
  filterTabActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  filterLabel: { color: colors.textSecondary, fontSize: FONT_SIZE.xs, fontWeight: '500' },
  filterLabelActive: { color: colors.background, fontWeight: '700' },
  eventCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBg, borderColor: colors.cardBorder, borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACING.md, gap: SPACING.md },
  eventIcon: { width: 56, height: 56, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  eventInfo: { flex: 1 },
  eventTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  eventName: { color: colors.textPrimary, fontSize: FONT_SIZE.md, fontWeight: '700', flexShrink: 1 },
  infoButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.gold + '16' },
  eventDate: { color: colors.textMuted, fontSize: FONT_SIZE.xs, marginTop: 2 },
  eventDesc: { color: colors.textSecondary, fontSize: FONT_SIZE.xs, marginTop: 3 },
  daysBadge: { alignItems: 'center', borderWidth: 2, borderRadius: RADIUS.md, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, minWidth: 60 },
  daysNum: { fontSize: FONT_SIZE.xxl, fontWeight: '900' },
  daysLabel: { fontSize: 9, fontWeight: '700', textAlign: 'center', letterSpacing: 0.5 },
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
