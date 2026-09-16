import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from '../i18n';
import { SPACING, RADIUS, FONT_SIZE } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { ISLAMIC_EVENTS, IslamicEvent, getEventName, getEventDescription } from '../data/islamicEvents';
import { formatGregorianDate } from '../services/hijriService';

type FilterKey = 'all' | 'bayram' | 'kandil' | 'ozel';
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
                <Text style={styles.eventName}>{getEventName(item, language)}</Text>
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
    </SafeAreaView>
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
  eventName: { color: colors.textPrimary, fontSize: FONT_SIZE.md, fontWeight: '700' },
  eventDate: { color: colors.textMuted, fontSize: FONT_SIZE.xs, marginTop: 2 },
  eventDesc: { color: colors.textSecondary, fontSize: FONT_SIZE.xs, marginTop: 3 },
  daysBadge: { alignItems: 'center', borderWidth: 2, borderRadius: RADIUS.md, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, minWidth: 60 },
  daysNum: { fontSize: FONT_SIZE.xxl, fontWeight: '900' },
  daysLabel: { fontSize: 9, fontWeight: '700', textAlign: 'center', letterSpacing: 0.5 },
});
