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
  return d.toISOString().split('T')[0];
}

function dayStats(key: string, completion: PrayerCompletion, history: DhikrHistory) {
  const prayerCount = Object.values(completion[key] ?? {}).filter(Boolean).length;
  const dhikrTotal = Object.values(history[key] ?? {}).reduce((a: number, b) => a + (b as number), 0);
  return { prayerCount, dhikrTotal };
}

function weekBuckets(completion: PrayerCompletion, history: DhikrHistory, language: string): Bucket[] {
  const today = new Date();
  const todayStr = dateKeyOf(today);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const key = dateKeyOf(d);
    const { prayerCount, dhikrTotal } = dayStats(key, completion, history);
    return { key, label: getDayShort(d, language), prayerCount, prayerMax: 5, dhikrTotal, isCurrent: key === todayStr };
  });
}

// Last 5 weeks, bucketed by week — 35 individual daily bars wouldn't fit legibly.
function monthBuckets(completion: PrayerCompletion, history: DhikrHistory): Bucket[] {
  const today = new Date();
  const buckets: Bucket[] = [];
  for (let w = 4; w >= 0; w--) {
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() - w * 7);
    let prayerCount = 0, dhikrTotal = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekEnd);
      d.setDate(weekEnd.getDate() - i);
      const stats = dayStats(dateKeyOf(d), completion, history);
      prayerCount += stats.prayerCount;
      dhikrTotal += stats.dhikrTotal;
    }
    buckets.push({ key: `w${w}`, label: `${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`, prayerCount, prayerMax: 35, dhikrTotal, isCurrent: w === 0 });
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

// Active-day count needs real daily granularity, not the coarser month/year buckets.
function countActiveDays(period: StatPeriod, completion: PrayerCompletion): number {
  const today = new Date();
  const span = period === 'week' ? 7 : period === 'month' ? 35 : 365;
  let count = 0;
  for (let i = 0; i < span; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (Object.values(completion[dateKeyOf(d)] ?? {}).filter(Boolean).length > 0) count++;
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
  const now = new Date();
  const period = PERIOD_KEYS[activeTab];

  const buckets = React.useMemo(() => {
    if (period === 'month') return monthBuckets(completion, dhikrHistory);
    if (period === 'year')  return yearBuckets(completion, dhikrHistory, language);
    return weekBuckets(completion, dhikrHistory, language);
  }, [period, completion, dhikrHistory, language]);

  const rangeStart = React.useMemo(() => {
    if (period === 'year') return new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const d = new Date(now);
    d.setDate(now.getDate() - (period === 'month' ? 34 : 6));
    return d;
  }, [period]);
  const weekLabel = formatRangeLabel(rangeStart, now, language);

  const totalPrayers = buckets.reduce((s, b) => s + b.prayerCount, 0);
  const maxPossible = buckets.reduce((s, b) => s + b.prayerMax, 0);
  const prayerRate = maxPossible > 0 ? Math.round((totalPrayers / maxPossible) * 100) : 0;

  const maxDhikr = Math.max(...buckets.map(b => b.dhikrTotal), 1);
  const totalDhikr = buckets.reduce((s, b) => s + b.dhikrTotal, 0);
  const activeDaysCount = countActiveDays(period, completion);

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
        {/* Week range */}
        <View style={styles.rangeRow}>
          <Ionicons name="chevron-back" size={20} color={colors.gold} />
          <Text style={styles.rangeText}>{weekLabel}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.gold} />
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
