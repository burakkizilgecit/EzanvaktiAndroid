import { useNow } from '../hooks/use-now';
import { localDateKey } from '../services/dateService';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from '../i18n';
import { SPACING, RADIUS, FONT_SIZE } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { usePrayerStore, PrayerCompletion } from '../store/usePrayerStore';
import { useDhikrStore, DhikrHistory } from '../store/useDhikrStore';
import { getDayShort, formatGregorianDate, getGregorianMonths } from '../services/hijriService';

type StatPeriod = 'week' | 'month' | 'year';
interface Bucket { key: string; label: string; prayerCount: number; prayerMax: number; dhikrTotal: number; isCurrent: boolean }

function dateKeyOf(d: Date): string {
  return localDateKey(d);
}

function dayStats(key: string, completion: PrayerCompletion, history: DhikrHistory) {
  const prayerCount = Object.values(completion[key] ?? {}).filter(Boolean).length;
  const dhikrTotal = Object.values(history[key] ?? {}).reduce((a: number, b) => a + (b as number), 0);
  return { prayerCount, dhikrTotal };
}

// Monday of the calendar week containing `d`.
function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function weekBuckets(weekAnchor: Date, completion: PrayerCompletion, history: DhikrHistory, language: string, todayStr: string): Bucket[] {
  const monday = getMonday(weekAnchor);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = dateKeyOf(d);
    const { prayerCount, dhikrTotal } = dayStats(key, completion, history);
    return { key, label: getDayShort(d, language), prayerCount, prayerMax: 5, dhikrTotal, isCurrent: key === todayStr };
  });
}

// Splits the calendar month (1st to last day) into Monday-Sunday chunks; the
// first/last chunk is partial when the month doesn't start/end on a Monday/Sunday.
function monthWeekBuckets(year: number, month: number, completion: PrayerCompletion, history: DhikrHistory, todayStr: string): Bucket[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const buckets: Bucket[] = [];
  let day = 1;
  while (day <= daysInMonth) {
    const date = new Date(year, month, day);
    const mondayIndex = (date.getDay() + 6) % 7; // 0=Mon..6=Sun
    const span = Math.min(7 - mondayIndex, daysInMonth - day + 1);
    let prayerCount = 0, dhikrTotal = 0, isCurrent = false;
    for (let i = 0; i < span; i++) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day + i).padStart(2, '0')}`;
      const stats = dayStats(key, completion, history);
      prayerCount += stats.prayerCount;
      dhikrTotal += stats.dhikrTotal;
      if (key === todayStr) isCurrent = true;
    }
    const endDay = day + span - 1;
    buckets.push({ key: `d${day}`, label: span > 1 ? `${day}-${endDay}` : `${day}`, prayerCount, prayerMax: span * 5, dhikrTotal, isCurrent });
    day += span;
  }
  return buckets;
}

function yearBuckets(completion: PrayerCompletion, history: DhikrHistory, language: string): Bucket[] {
  const today = new Date();
  const months = getGregorianMonths(language);
  const buckets: Bucket[] = [];
  for (let m = 11; m >= 0; m--) {
    const target = new Date(today.getFullYear(), today.getMonth() - m, 1);
    const year = target.getFullYear(), month = target.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let prayerCount = 0, dhikrTotal = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const stats = dayStats(key, completion, history);
      prayerCount += stats.prayerCount;
      dhikrTotal += stats.dhikrTotal;
    }
    buckets.push({
      key: `${year}-${month}`, label: months[month].slice(0, 3),
      prayerCount, prayerMax: 5 * daysInMonth, dhikrTotal,
      isCurrent: month === today.getMonth() && year === today.getFullYear(),
    });
  }
  return buckets;
}

function countActiveDaysInRange(start: Date, end: Date, completion: PrayerCompletion): number {
  let count = 0;
  const d = new Date(start);
  while (d <= end) {
    if (Object.values(completion[dateKeyOf(d)] ?? {}).filter(Boolean).length > 0) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

function formatRangeLabel(start: Date, end: Date, language: string): string {
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  return sameMonth
    ? `${start.getDate()} - ${formatGregorianDate(end, language)}`
    : `${formatGregorianDate(start, language)} - ${formatGregorianDate(end, language)}`;
}

const PERIOD_KEYS: StatPeriod[] = ['week', 'month', 'year'];

export default function StatisticsScreen() {
  const { t, language } = useTranslation();
  const { colors, fs } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors, fs), [colors, fs]);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const { completion } = usePrayerStore();
  const { history: dhikrHistory } = useDhikrStore();
  const clock = useNow();
  const day = localDateKey(clock);
  const now = React.useMemo(() => new Date(day + 'T12:00:00'), [day]);
  const period = PERIOD_KEYS[activeTab];

  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [monthAnchor, setMonthAnchor] = useState(() => new Date());

  const weekIsCurrent = dateKeyOf(getMonday(weekAnchor)) === dateKeyOf(getMonday(now));
  const monthIsCurrent = monthAnchor.getFullYear() === now.getFullYear() && monthAnchor.getMonth() === now.getMonth();

  const goPrevWeek = () => setWeekAnchor(d => { const nd = new Date(d); nd.setDate(d.getDate() - 7); return nd; });
  const goNextWeek = () => { if (weekIsCurrent) return; setWeekAnchor(d => { const nd = new Date(d); nd.setDate(d.getDate() + 7); return nd; }); };
  const goPrevMonth = () => setMonthAnchor(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goNextMonth = () => { if (monthIsCurrent) return; setMonthAnchor(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)); };

  const buckets = (() => {
    if (period === 'month') return monthWeekBuckets(monthAnchor.getFullYear(), monthAnchor.getMonth(), completion, dhikrHistory, day);
    if (period === 'year') return yearBuckets(completion, dhikrHistory, language);
    return weekBuckets(weekAnchor, completion, dhikrHistory, language, day);
  })();

  const rangeStart = React.useMemo(() => {
    if (period === 'year') return new Date(now.getFullYear(), now.getMonth() - 11, 1);
    if (period === 'month') return new Date(monthAnchor.getFullYear(), monthAnchor.getMonth(), 1);
    return getMonday(weekAnchor);
  }, [period, now, weekAnchor, monthAnchor]);
  const rangeEnd = React.useMemo(() => {
    if (period === 'year') return now;
    if (period === 'month') return new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + 1, 0);
    const d = new Date(rangeStart);
    d.setDate(d.getDate() + 6);
    return d;
  }, [period, now, monthAnchor, rangeStart]);
  const rangeLabel = period === 'month'
    ? `${getGregorianMonths(language)[monthAnchor.getMonth()]} ${monthAnchor.getFullYear()}`
    : formatRangeLabel(rangeStart, rangeEnd, language);

  const totalPrayers = buckets.reduce((s, b) => s + b.prayerCount, 0);
  const maxPossible = buckets.reduce((s, b) => s + b.prayerMax, 0);
  const prayerRate = maxPossible > 0 ? Math.round((totalPrayers / maxPossible) * 100) : 0;

  const maxDhikr = Math.max(...buckets.map(b => b.dhikrTotal), 1);
  const totalDhikr = buckets.reduce((s, b) => s + b.dhikrTotal, 0);
  const activeDaysCount = countActiveDaysInRange(rangeStart, rangeEnd, completion);

  const canGoNext = period === 'week' ? !weekIsCurrent : period === 'month' ? !monthIsCurrent : false;
  const showNav = period !== 'year';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('statsTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabs}>
        {(['statsTabWeekly', 'statsTabMonthly', 'statsTabYearly'] as const).map((key, i) => (
          <TouchableOpacity key={key} style={[styles.tab, activeTab === i && styles.tabActive]} onPress={() => setActiveTab(i)}>
            <Text style={[styles.tabLabel, activeTab === i && styles.tabLabelActive]}>{t(key)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: SPACING.md }}>
        {/* Range nav */}
        <View style={styles.rangeRow}>
          {showNav ? (
            <TouchableOpacity onPress={period === 'week' ? goPrevWeek : goPrevMonth} hitSlop={8}>
              <Ionicons name="chevron-back" size={20} color={colors.gold} />
            </TouchableOpacity>
          ) : <View style={{ width: 20 }} />}
          <Text style={styles.rangeText}>{rangeLabel}</Text>
          {showNav ? (
            <TouchableOpacity onPress={period === 'week' ? goNextWeek : goNextMonth} disabled={!canGoNext} hitSlop={8}>
              <Ionicons name="chevron-forward" size={20} color={canGoNext ? colors.gold : colors.cardBorder} />
            </TouchableOpacity>
          ) : <View style={{ width: 20 }} />}
        </View>

        {/* Prayer rate */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <View>
              <Text style={styles.statTitle}>{t('statsPrayerRate')}</Text>
              <Text style={styles.statMain}>%{prayerRate}</Text>
              <Text style={styles.statSub}>{t('statsTotalPrayers', { total: totalPrayers, max: maxPossible })}</Text>
            </View>
            <View style={styles.rateBadge}>
              <Text style={styles.rateBadgeText}>%{prayerRate}</Text>
            </View>
          </View>

          {/* Bar Chart */}
          <View style={styles.barChart}>
            {buckets.map((b) => {
              const pct = b.prayerMax > 0 ? b.prayerCount / b.prayerMax : 0;
              return (
                <View key={b.key} style={styles.barCol}>
                  <Text style={styles.barPct}>{b.prayerCount > 0 ? `${Math.round(pct * 100)}%` : ''}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { height: `${pct * 100}%`, backgroundColor: b.isCurrent ? colors.gold : pct === 1 ? colors.green : colors.gold + '88' }]} />
                  </View>
                  <Text style={[styles.barLabel, b.isCurrent && { color: colors.gold }]}>{b.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Dhikr Stats */}
        <View style={styles.statCard}>
          <Text style={styles.statTitle}>{t('statsDhikrCount')}</Text>
          <Text style={styles.statMain}>{t('statsTotalDhikr', { total: totalDhikr })}</Text>

          <View style={styles.lineChart}>
            {buckets.map((b) => {
              const pct = b.dhikrTotal / maxDhikr;
              return (
                <View key={b.key} style={styles.lineCol}>
                  <Text style={styles.barPct}>{b.dhikrTotal > 0 ? b.dhikrTotal : ''}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { height: `${pct * 100}%`, backgroundColor: b.isCurrent ? colors.gold : colors.gold + '66' }]} />
                  </View>
                  <Text style={[styles.barLabel, b.isCurrent && { color: colors.gold }]}>{b.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <MaterialCommunityIcons name="clock-time-five-outline" size={24} color={colors.gold} />
            <Text style={styles.summaryValue}>{totalPrayers}</Text>
            <Text style={styles.summaryLabel}>{t('statsPrayersDone')}</Text>
          </View>
          <View style={styles.summaryCard}>
            <MaterialCommunityIcons name="circle-outline" size={24} color={colors.gold} />
            <Text style={styles.summaryValue}>{totalDhikr}</Text>
            <Text style={styles.summaryLabel}>{t('statsDhikrDone')}</Text>
          </View>
          <View style={styles.summaryCard}>
            <MaterialCommunityIcons name="fire" size={24} color={colors.gold} />
            <Text style={styles.summaryValue}>
              {activeDaysCount}
            </Text>
            <Text style={styles.summaryLabel}>{t('statsActiveDays')}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any, fs: (n: number) => number) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: colors.textPrimary, fontSize: FONT_SIZE.xl, fontWeight: '700' },
  tabs: { flexDirection: 'row', marginHorizontal: SPACING.md, backgroundColor: colors.cardBg, borderRadius: RADIUS.full, padding: 3, borderColor: colors.cardBorder, borderWidth: 1, marginBottom: SPACING.sm },
  tab: { flex: 1, paddingVertical: SPACING.xs + 2, alignItems: 'center', borderRadius: RADIUS.full },
  tabActive: { backgroundColor: colors.gold },
  tabLabel: { color: colors.textSecondary, fontSize: FONT_SIZE.sm, fontWeight: '500' },
  tabLabelActive: { color: colors.background, fontWeight: '700' },
  rangeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  rangeText: { color: colors.textPrimary, fontSize: FONT_SIZE.md, fontWeight: '600' },
  statCard: { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
  statTitle: { color: colors.textSecondary, fontSize: FONT_SIZE.sm, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  statMain: { color: colors.textPrimary, fontSize: FONT_SIZE.xxl, fontWeight: '700' },
  statSub: { color: colors.textMuted, fontSize: FONT_SIZE.xs },
  rateBadge: { width: 64, height: 64, borderRadius: 32, borderWidth: 4, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  rateBadgeText: { color: colors.gold, fontSize: FONT_SIZE.md, fontWeight: '700' },
  barChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 100 },
  lineChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 90, marginTop: SPACING.md },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  lineCol: { flex: 1, alignItems: 'center', gap: 4 },
  barPct: { color: colors.textMuted, fontSize: 9 },
  barTrack: { width: 26, height: 70, backgroundColor: colors.cardBorder, borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 6 },
  barLabel: { color: colors.textMuted, fontSize: FONT_SIZE.xs },
  summaryRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl },
  summaryCard: { flex: 1, backgroundColor: colors.cardBg, borderColor: colors.cardBorder, borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center', gap: SPACING.xs },
  summaryValue: { color: colors.textPrimary, fontSize: FONT_SIZE.xl, fontWeight: '700' },
  summaryLabel: { color: colors.textMuted, fontSize: FONT_SIZE.xs, textAlign: 'center' },
});
