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
import { usePrayerStore } from '../store/usePrayerStore';
import { useGoalsStore } from '../store/useGoalsStore';
import { getDayShort, formatGregorianDate, getGregorianMonths } from '../services/hijriService';

const WORSHIP_TAB_KEYS = ['worshipTabDaily', 'worshipTabWeekly', 'worshipTabMonthly'] as const;
const PRAYER_ORDER = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
const PRAYER_LABEL_KEYS: Record<string, string> = { fajr: 'prayerFajr', dhuhr: 'prayerDhuhr', asr: 'prayerAsr', maghrib: 'prayerMaghrib', isha: 'prayerIsha' };
const PRAYER_ICON: Record<string, string> = { fajr: 'weather-night', dhuhr: 'weather-sunny', asr: 'weather-partly-cloudy', maghrib: 'weather-sunset-down', isha: 'moon-waning-crescent' };
const GOAL_TITLE_KEYS: Record<string, string> = { dhikr: 'goalTitleDhikr', quran: 'goalTitleQuran', dua: 'goalTitleDua', sadaka: 'goalTitleSadaka' };
const GOAL_UNIT_KEYS: Record<string, string> = { dhikr: 'goalUnitTasbih', quran: 'goalUnitMin', dua: 'goalUnitDua', sadaka: 'goalUnitTimes' };
const EMPTY_COMP = { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false };

function countDone(comp: Record<string, boolean> | undefined): number {
  return Object.values(comp ?? EMPTY_COMP).filter(Boolean).length;
}

function formatRangeLabel(start: Date, end: Date, language: string): string {
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  return sameMonth
    ? `${start.getDate()} - ${formatGregorianDate(end, language)}`
    : `${formatGregorianDate(start, language)} - ${formatGregorianDate(end, language)}`;
}

export default function WorshipTrackingScreen() {
  const { t, language } = useTranslation();
  const { colors, fs } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors, fs), [colors, fs]);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const { completion, togglePrayer } = usePrayerStore();
  const { goals, getCompletionRate } = useGoalsStore();
  const now = useNow();
  const todayKey = localDateKey(now);

  // ── Daily tab state ───────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const selectedKey = localDateKey(selectedDate);
  const isToday = selectedKey === todayKey;
  const selComp = completion[selectedKey] ?? EMPTY_COMP;
  const prayersDoneSel = countDone(selComp);
  const completionRate = getCompletionRate();

  const goPrevDay = () => setSelectedDate(d => { const nd = new Date(d); nd.setDate(d.getDate() - 1); return nd; });
  const goNextDay = () => { if (isToday) return; setSelectedDate(d => { const nd = new Date(d); nd.setDate(d.getDate() + 1); return nd; }); };

  const dailyPercent = isToday
    ? Math.round((prayersDoneSel / 5 * 0.6 + completionRate / 100 * 0.4) * 100)
    : Math.round((prayersDoneSel / 5) * 100);

  // ── Weekly tab state ──────────────────────────────────────────────
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const weekIsCurrent = localDateKey(weekAnchor) === todayKey;
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekAnchor);
    d.setDate(weekAnchor.getDate() - (6 - i));
    const key = localDateKey(d);
    const comp = completion[key] ?? EMPTY_COMP;
    const count = countDone(comp);
    return { date: d, key, count };
  });
  const weekPrayers = weekDays.reduce((s, d) => s + d.count, 0);
  const weekActiveDays = weekDays.filter(d => d.count > 0).length;
  const weekPercent = Math.round((weekPrayers / 35) * 100);
  const weekLabel = formatRangeLabel(weekDays[0].date, weekAnchor, language);

  const goPrevWeek = () => setWeekAnchor(d => { const nd = new Date(d); nd.setDate(d.getDate() - 7); return nd; });
  const goNextWeek = () => { if (weekIsCurrent) return; setWeekAnchor(d => { const nd = new Date(d); nd.setDate(d.getDate() + 7); return nd; }); };

  // ── Monthly tab state ─────────────────────────────────────────────
  const [monthAnchor, setMonthAnchor] = useState(() => new Date());
  const monthYear = monthAnchor.getFullYear();
  const monthIdx = monthAnchor.getMonth();
  const monthIsCurrent = monthYear === now.getFullYear() && monthIdx === now.getMonth();
  const daysInMonth = new Date(monthYear, monthIdx + 1, 0).getDate();
  const firstDayOffset = new Date(monthYear, monthIdx, 1).getDay();
  const monthCells = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const key = `${monthYear}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const count = countDone(completion[key]);
    const isFuture = key > todayKey;
    return { day, key, count, isFuture };
  });
  const monthPrayers = monthCells.reduce((s, c) => s + c.count, 0);
  const monthActiveDays = monthCells.filter(c => c.count > 0).length;
  const monthPercent = Math.round((monthPrayers / (daysInMonth * 5)) * 100);
  const monthLabel = `${getGregorianMonths(language)[monthIdx]} ${monthYear}`;

  const goPrevMonth = () => setMonthAnchor(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goNextMonth = () => { if (monthIsCurrent) return; setMonthAnchor(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)); };

  const jumpToDay = (key: string) => {
    if (key > todayKey) return;
    const [y, m, d] = key.split('-').map(Number);
    setSelectedDate(new Date(y, m - 1, d));
    setActiveTab(0);
  };

  const weekDayShorts = [t('dayFullSun'), t('dayFullMon'), t('dayFullTue'), t('dayFullWed'), t('dayFullThu'), t('dayFullFri'), t('dayFullSat')].map(s => s.substring(0, 2));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('worshipTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {WORSHIP_TAB_KEYS.map((key, i) => (
          <TouchableOpacity key={key} style={[styles.tab, activeTab === i && styles.tabActive]} onPress={() => setActiveTab(i)}>
            <Text style={[styles.tabLabel, activeTab === i && styles.tabLabelActive]}>{t(key as any)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: SPACING.md }}>
        {activeTab === 0 && (
          <>
            {/* Date nav */}
            <View style={styles.dateRow}>
              <TouchableOpacity onPress={goPrevDay} hitSlop={8}>
                <Ionicons name="chevron-back" size={20} color={colors.gold} />
              </TouchableOpacity>
              <Text style={styles.dateText}>{formatGregorianDate(selectedDate, language)}</Text>
              <TouchableOpacity onPress={goNextDay} disabled={isToday} hitSlop={8}>
                <Ionicons name="chevron-forward" size={20} color={isToday ? colors.cardBorder : colors.gold} />
              </TouchableOpacity>
            </View>

            {/* Progress Summary */}
            <View style={styles.summaryCard}>
              <View style={styles.progressCircleWrap}>
                <View style={styles.progressInfo}>
                  <Text style={styles.progressPercent}>%{dailyPercent}</Text>
                  <Text style={styles.progressLabel}>{t('worshipCompletion')}</Text>
                </View>
              </View>
              <View style={styles.summaryStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{prayersDoneSel}/5</Text>
                  <Text style={styles.statLabel}>{t('worshipPrayer')}</Text>
                </View>
                {isToday && (
                  <>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{goals.filter(g => g.progress >= g.target).length}/{goals.length}</Text>
                      <Text style={styles.statLabel}>{t('worshipGoals')}</Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Prayer Tracking */}
            <Text style={styles.sectionTitle}>{t('worshipPrayerSection')}</Text>
            <View style={styles.prayerGrid}>
              {PRAYER_ORDER.map(key => {
                const done = selComp[key];
                return (
                  <TouchableOpacity key={key} style={[styles.prayerCell, done && styles.prayerCellDone]} onPress={() => togglePrayer(selectedKey, key)}>
                    <MaterialCommunityIcons name={PRAYER_ICON[key] as any} size={20} color={done ? colors.background : colors.gold} />
                    <Text style={[styles.prayerCellLabel, done && { color: colors.background }]}>{t(PRAYER_LABEL_KEYS[key] as any)}</Text>
                    {done && <Ionicons name="checkmark-circle" size={14} color={colors.background} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Daily Goals */}
            {isToday ? (
              <>
                <Text style={styles.sectionTitle}>{t('worshipGoalsSection')}</Text>
                <View style={styles.card}>
                  {goals.map((goal, i) => {
                    const progress = Math.min(goal.progress / goal.target, 1);
                    return (
                      <View key={goal.id} style={[styles.goalRow, i < goals.length - 1 && styles.goalRowBorder]}>
                        <MaterialCommunityIcons name={goal.icon as any} size={20} color={colors.gold} />
                        <View style={styles.goalInfo}>
                          <View style={styles.goalTitleRow}>
                            <Text style={styles.goalTitle}>{GOAL_TITLE_KEYS[goal.id] ? t(GOAL_TITLE_KEYS[goal.id] as any) : goal.title}</Text>
                            <Text style={styles.goalProgress}>{goal.progress}/{goal.target} {GOAL_UNIT_KEYS[goal.id] ? t(GOAL_UNIT_KEYS[goal.id] as any) : goal.unit}</Text>
                          </View>
                          <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </>
            ) : (
              <Text style={styles.hintNote}>{t('worshipGoalsTodayOnly')}</Text>
            )}
          </>
        )}

        {activeTab === 1 && (
          <>
            {/* Week nav */}
            <View style={styles.dateRow}>
              <TouchableOpacity onPress={goPrevWeek} hitSlop={8}>
                <Ionicons name="chevron-back" size={20} color={colors.gold} />
              </TouchableOpacity>
              <Text style={styles.dateText}>{weekLabel}</Text>
              <TouchableOpacity onPress={goNextWeek} disabled={weekIsCurrent} hitSlop={8}>
                <Ionicons name="chevron-forward" size={20} color={weekIsCurrent ? colors.cardBorder : colors.gold} />
              </TouchableOpacity>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.progressCircleWrap}>
                <View style={styles.progressInfo}>
                  <Text style={styles.progressPercent}>%{weekPercent}</Text>
                  <Text style={styles.progressLabel}>{t('worshipCompletion')}</Text>
                </View>
              </View>
              <View style={styles.summaryStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{weekPrayers}/35</Text>
                  <Text style={styles.statLabel}>{t('worshipPrayer')}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{weekActiveDays}/7</Text>
                  <Text style={styles.statLabel}>{t('statsActiveDays')}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.sectionTitle}>{t('worshipWeeklySection')}</Text>
            <View style={styles.weekCard}>
              <View style={styles.weekRow}>
                {weekDays.map((d, i) => {
                  const isTodayCol = d.key === todayKey;
                  const pct = d.count / 5;
                  return (
                    <TouchableOpacity key={i} style={styles.weekCol} onPress={() => jumpToDay(d.key)} disabled={d.key > todayKey}>
                      <Text style={[styles.weekDay, isTodayCol && { color: colors.gold }]}>{getDayShort(d.date, language)}</Text>
                      <View style={[styles.weekBar, isTodayCol && { borderColor: colors.gold, borderWidth: 1 }]}>
                        <View style={[styles.weekFill, { height: `${pct * 100}%`, backgroundColor: pct === 1 ? colors.green : colors.gold }]} />
                      </View>
                      <Text style={[styles.weekCount, isTodayCol && { color: colors.gold }]}>{d.count}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </>
        )}

        {activeTab === 2 && (
          <>
            {/* Month nav */}
            <View style={styles.dateRow}>
              <TouchableOpacity onPress={goPrevMonth} hitSlop={8}>
                <Ionicons name="chevron-back" size={20} color={colors.gold} />
              </TouchableOpacity>
              <Text style={styles.dateText}>{monthLabel}</Text>
              <TouchableOpacity onPress={goNextMonth} disabled={monthIsCurrent} hitSlop={8}>
                <Ionicons name="chevron-forward" size={20} color={monthIsCurrent ? colors.cardBorder : colors.gold} />
              </TouchableOpacity>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.progressCircleWrap}>
                <View style={styles.progressInfo}>
                  <Text style={styles.progressPercent}>%{monthPercent}</Text>
                  <Text style={styles.progressLabel}>{t('worshipCompletion')}</Text>
                </View>
              </View>
              <View style={styles.summaryStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{monthPrayers}/{daysInMonth * 5}</Text>
                  <Text style={styles.statLabel}>{t('worshipPrayer')}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{monthActiveDays}/{daysInMonth}</Text>
                  <Text style={styles.statLabel}>{t('statsActiveDays')}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.sectionTitle}>{t('worshipWeeklySection')}</Text>
            <View style={styles.card}>
              <View style={styles.monthWeekHeader}>
                {weekDayShorts.map((d, i) => <Text key={i} style={styles.monthWeekHeaderText}>{d}</Text>)}
              </View>
              <View style={styles.monthGrid}>
                {Array.from({ length: firstDayOffset }, (_, i) => <View key={`blank-${i}`} style={styles.monthCell} />)}
                {monthCells.map(c => {
                  const pct = c.count / 5;
                  const bg = c.isFuture ? 'transparent' : pct === 1 ? colors.green : pct > 0 ? colors.gold + '55' : colors.cardBorder;
                  return (
                    <TouchableOpacity key={c.key} style={styles.monthCell} onPress={() => jumpToDay(c.key)} disabled={c.isFuture}>
                      <View style={[styles.monthDayDot, { backgroundColor: bg }]}>
                        <Text style={[styles.monthDayNum, c.isFuture && { color: colors.textMuted }]}>{c.day}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </>
        )}
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
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  dateText: { color: colors.textPrimary, fontSize: FONT_SIZE.md, fontWeight: '600' },
  summaryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBg, borderColor: colors.cardBorder, borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, gap: SPACING.md },
  progressCircleWrap: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center', borderRadius: 50, borderWidth: 8, borderColor: colors.gold },
  progressInfo: { alignItems: 'center' },
  progressPercent: { color: colors.textPrimary, fontSize: FONT_SIZE.xl, fontWeight: '700' },
  progressLabel: { color: colors.textMuted, fontSize: FONT_SIZE.xs },
  summaryStats: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statItem: { alignItems: 'center' },
  statValue: { color: colors.textPrimary, fontSize: FONT_SIZE.xl, fontWeight: '700' },
  statLabel: { color: colors.textMuted, fontSize: FONT_SIZE.xs },
  statDivider: { width: 1, height: 40, backgroundColor: colors.cardBorder },
  sectionTitle: { color: colors.textSecondary, fontSize: FONT_SIZE.sm, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.sm, marginTop: SPACING.md },
  hintNote: { color: colors.textMuted, fontSize: FONT_SIZE.sm, fontStyle: 'italic', marginBottom: SPACING.xl },
  prayerGrid: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  prayerCell: { flex: 1, backgroundColor: colors.cardBg, borderColor: colors.cardBorder, borderWidth: 1, borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center', gap: 4 },
  prayerCellDone: { backgroundColor: colors.gold, borderColor: colors.gold },
  prayerCellLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '500' },
  card: { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, borderWidth: 1, borderRadius: RADIUS.lg, overflow: 'hidden' },
  goalRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2, gap: SPACING.sm },
  goalRowBorder: { borderBottomColor: colors.cardBorder, borderBottomWidth: 1 },
  goalInfo: { flex: 1 },
  goalTitleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  goalTitle: { color: colors.textPrimary, fontSize: FONT_SIZE.sm, fontWeight: '500' },
  goalProgress: { color: colors.textMuted, fontSize: FONT_SIZE.xs },
  progressBar: { height: 6, backgroundColor: colors.cardBorder, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.gold, borderRadius: 3 },
  weekCard: { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.xl },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 90 },
  weekCol: { alignItems: 'center', gap: 4, flex: 1 },
  weekDay: { color: colors.textMuted, fontSize: FONT_SIZE.xs },
  weekBar: { width: 24, height: 60, backgroundColor: colors.cardBorder, borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
  weekFill: { width: '100%', borderRadius: 4 },
  weekCount: { color: colors.textMuted, fontSize: FONT_SIZE.xs },
  monthWeekHeader: { flexDirection: 'row', paddingTop: SPACING.sm, paddingHorizontal: SPACING.xs },
  monthWeekHeaderText: { flex: 1, textAlign: 'center', color: colors.textMuted, fontSize: FONT_SIZE.xs, fontWeight: '600' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: SPACING.xs, paddingBottom: SPACING.md },
  monthCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  monthDayDot: { width: '82%', height: '82%', borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  monthDayNum: { color: colors.textPrimary, fontSize: FONT_SIZE.xs, fontWeight: '600' },
});
