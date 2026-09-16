import { localDateKey } from '../services/dateService';
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from '../i18n';
import { SPACING, RADIUS, FONT_SIZE } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { usePrayerStore, type PrayerCompletion } from '../store/usePrayerStore';
import { useDhikrStore, type DhikrHistory } from '../store/useDhikrStore';

// ── Calculation helpers ────────────────────────────────────────────────────

function prayerStreak(completion: PrayerCompletion, prayer: string): number {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = localDateKey(d);
    const day = completion[key] as any;
    if (day?.[prayer]) streak++;
    else break;
  }
  return streak;
}

function anyPrayerStreak(completion: PrayerCompletion): number {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = localDateKey(d);
    const day = completion[key];
    const hasAny = day && Object.values(day).some(Boolean);
    if (hasAny) streak++;
    else break;
  }
  return streak;
}

function totalPrayersEver(completion: PrayerCompletion): number {
  let n = 0;
  for (const day of Object.values(completion)) {
    n += Object.values(day).filter(Boolean).length;
  }
  return n;
}

function activeDays(completion: PrayerCompletion): number {
  return Object.values(completion).filter(day => Object.values(day).some(Boolean)).length;
}

function totalDhikrById(history: DhikrHistory, id: string): number {
  let n = 0;
  for (const day of Object.values(history)) {
    n += (day as any)[id] ?? 0;
  }
  return n;
}

function totalDhikrAll(history: DhikrHistory): number {
  let n = 0;
  for (const day of Object.values(history)) {
    n += Object.values(day as any).reduce((a: number, b: any) => a + (b as number), 0);
  }
  return n;
}

function fridayStreak(completion: PrayerCompletion): number {
  let count = 0;
  const today = new Date();
  // go back up to 8 weeks, check each Friday
  for (let w = 0; w < 8; w++) {
    const friday = new Date(today);
    const dayOfWeek = today.getDay(); // 0=Sun
    const daysToLastFriday = ((dayOfWeek + 7 - 5) % 7) + w * 7;
    friday.setDate(today.getDate() - daysToLastFriday);
    const key = localDateKey(friday);
    const day = completion[key];
    if (day && Object.values(day).some(Boolean)) count++;
    else break;
  }
  return count;
}

// ── Achievement definitions ────────────────────────────────────────────────

interface AchievementDef {
  id: string;
  titleKey: string;
  descKey: string;
  icon: string;
  color: string;
  category: string;
  xp: number;
  goal: number;
  getValue: (c: PrayerCompletion, h: DhikrHistory) => number;
}

const DEFS: AchievementDef[] = [
  { id: 'first_step',       titleKey: 'achFirstStep',   descKey: 'achFirstStepDesc',   icon: 'star',                color: '#FFD700', category: 'achTabOther',  xp: 50,  goal: 1,    getValue: () => 1 },
  { id: 'fajr_7',           titleKey: 'achFajrMaster',  descKey: 'achFajrMasterDesc',  icon: 'weather-night',       color: '#7B61FF', category: 'achTabPrayer', xp: 100, goal: 7,    getValue: (c) => prayerStreak(c, 'fajr') },
  { id: 'asr_7',            titleKey: 'achAsrMaster',   descKey: 'achAsrMasterDesc',   icon: 'weather-partly-cloudy', color: '#2196F3', category: 'achTabPrayer', xp: 100, goal: 7,   getValue: (c) => prayerStreak(c, 'asr') },
  { id: 'isha_7',           titleKey: 'achIshaMaster',  descKey: 'achIshaMasterDesc',  icon: 'moon-waning-crescent', color: '#9C27B0', category: 'achTabPrayer', xp: 100, goal: 7,   getValue: (c) => prayerStreak(c, 'isha') },
  { id: 'prayers_50',       titleKey: 'achPrayer50',    descKey: 'achPrayer50Desc',    icon: 'mosque',              color: '#D4A84B', category: 'achTabPrayer', xp: 150, goal: 50, getValue: (c) => totalPrayersEver(c) },
  { id: 'prayers_200',      titleKey: 'achPrayer200',   descKey: 'achPrayer200Desc',   icon: 'mosque',              color: '#FF8C42', category: 'achTabPrayer', xp: 300, goal: 200,  getValue: (c) => totalPrayersEver(c) },
  { id: 'streak_30',        titleKey: 'achStreak30',    descKey: 'achStreak30Desc',    icon: 'fire',                color: '#FF5722', category: 'achTabOther',  xp: 200, goal: 30,   getValue: (c) => anyPrayerStreak(c) },
  { id: 'friday_4',         titleKey: 'achFriday',      descKey: 'achFridayDesc',      icon: 'calendar-check',      color: '#4CAF50', category: 'achTabPrayer', xp: 150, goal: 4,    getValue: (c) => fridayStreak(c) },
  { id: 'active_7',         titleKey: 'achWeekHero',    descKey: 'achWeekHeroDesc',    icon: 'shield-star',         color: '#00BCD4', category: 'achTabOther',  xp: 100, goal: 7,    getValue: (c) => Math.min(activeDays(c), 7) },
  { id: 'dhikr_100',        titleKey: 'achDhikr100',    descKey: 'achDhikr100Desc',    icon: 'circle-outline',      color: '#D4A84B', category: 'achTabDhikr', xp: 75,  goal: 100, getValue: (_, h) => totalDhikrById(h, 'subhanallah') },
  { id: 'dhikr_500',        titleKey: 'achDhikr500',    descKey: 'achDhikr500Desc',    icon: 'circle-double',       color: '#C8A853', category: 'achTabDhikr', xp: 150, goal: 500,  getValue: (_, h) => totalDhikrById(h, 'subhanallah') },
  { id: 'salavat_100',      titleKey: 'achSalavat100',  descKey: 'achSalavat100Desc',  icon: 'rotate-right',        color: '#FF8C42', category: 'achTabDhikr', xp: 100, goal: 100,  getValue: (_, h) => totalDhikrById(h, 'salavat') },
  { id: 'istigfar_100',     titleKey: 'achIstigfar100', descKey: 'achIstigfar100Desc', icon: 'hands-pray',          color: '#E91E63', category: 'achTabDhikr', xp: 100, goal: 100,  getValue: (_, h) => totalDhikrById(h, 'istigfar') },
  { id: 'dhikr_total_1000', titleKey: 'achDhikr1000',   descKey: 'achDhikr1000Desc',   icon: 'star-circle',         color: '#FFD700', category: 'achTabDhikr', xp: 300, goal: 1000, getValue: (_, h) => totalDhikrAll(h) },
];

const XP_LEVELS = [
  { level: 1, titleKey: 'lvlBeginner',  min: 0 },
  { level: 2, titleKey: 'lvlStudent',   min: 100 },
  { level: 3, titleKey: 'lvlTraveler',  min: 300 },
  { level: 4, titleKey: 'lvlBeliever',  min: 600 },
  { level: 5, titleKey: 'lvlPious',     min: 1000 },
  { level: 6, titleKey: 'lvlDevout',    min: 1500 },
  { level: 7, titleKey: 'lvlSiddiq',    min: 2200 },
];

function getLevel(xp: number) {
  let cur = XP_LEVELS[0];
  for (const l of XP_LEVELS) { if (xp >= l.min) cur = l; else break; }
  const idx = XP_LEVELS.indexOf(cur);
  const next = XP_LEVELS[idx + 1];
  const progress = next ? (xp - cur.min) / (next.min - cur.min) : 1;
  return { ...cur, next: next?.min ?? cur.min, progress };
}

export default function AchievementsScreen() {
  const { t } = useTranslation();
  const { colors, fs } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors, fs), [colors, fs]);
  const router = useRouter();
  const { completion } = usePrayerStore();
  const { history } = useDhikrStore();
  const [activeFilter, setActiveFilter] = useState('achTabAll');
  const [detail, setDetail] = useState<(typeof DEFS)[0] | null>(null);
  const FILTER_TABS = ['achTabAll', 'achTabPrayer', 'achTabDhikr', 'achTabOther'] as const;

  const achievements = useMemo(() =>
    DEFS.map(def => {
      const current = Math.min(def.getValue(completion, history), def.goal);
      const unlocked = current >= def.goal;
      return { ...def, current, unlocked, pct: Math.round((current / def.goal) * 100) };
    }),
  [completion, history]);

  const filtered = activeFilter === 'achTabAll' ? achievements : achievements.filter(a => a.category === activeFilter);
  const unlockedList = achievements.filter(a => a.unlocked);
  const totalXP = unlockedList.reduce((s, a) => s + a.xp, 0);
  const levelInfo = getLevel(totalXP);

  const detailItem = detail ? achievements.find(a => a.id === detail.id) : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Detail Modal */}
      <Modal visible={!!detailItem} transparent animationType="fade" onRequestClose={() => setDetail(null)}>
        <TouchableOpacity style={styles.modalBack} activeOpacity={1} onPress={() => setDetail(null)}>
          <View style={styles.detailCard} onStartShouldSetResponder={() => true}>
            {detailItem && (
              <>
                <View style={[styles.detailIconBox, { backgroundColor: detailItem.color + '22' }]}>
                  <MaterialCommunityIcons name={detailItem.icon as any} size={48} color={detailItem.unlocked ? detailItem.color : colors.textMuted} />
                  {!detailItem.unlocked && <View style={styles.lockBadge}><Ionicons name="lock-closed" size={16} color={colors.textMuted} /></View>}
                </View>
                <Text style={styles.detailTitle}>{t(detailItem.titleKey as any)}</Text>
                <Text style={styles.detailDesc}>{t(detailItem.descKey as any)}</Text>
                <View style={styles.detailProgressRow}>
                  <Text style={styles.detailProgressText}>{detailItem.current} / {detailItem.goal}</Text>
                  <Text style={[styles.detailXP, { color: detailItem.color }]}>+{detailItem.xp} XP</Text>
                </View>
                <View style={styles.detailBar}>
                  <View style={[styles.detailFill, { width: `${detailItem.pct}%`, backgroundColor: detailItem.color }]} />
                </View>
                <Text style={styles.detailPct}>{t('achCompleted', { pct: detailItem.pct })}</Text>
                {detailItem.unlocked && (
                  <View style={styles.unlockedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.green} />
                    <Text style={styles.unlockedText}>{t('achUnlocked')}</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('achievementsTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Level card */}
      <View style={styles.levelCard}>
        <View style={styles.hexWrap}>
          <MaterialCommunityIcons name="hexagon" size={64} color={colors.gold} />
          <Text style={styles.hexLevel}>{levelInfo.level}</Text>
        </View>
        <View style={styles.levelInfo}>
          <Text style={styles.levelTitle}>{t(levelInfo.titleKey as any)}</Text>
          <Text style={styles.levelSub}>{t('achLevel', { n: levelInfo.level })}</Text>
          <View style={styles.xpBar}>
            <View style={[styles.xpFill, { width: `${Math.round(levelInfo.progress * 100)}%` }]} />
          </View>
          <Text style={styles.xpText}>{totalXP} XP{levelInfo.next > totalXP ? ` / ${levelInfo.next} XP` : ` — ${t('achMaxLevel')}`}</Text>
        </View>
        <View style={styles.xpSummary}>
          <Text style={styles.xpSummaryVal}>{unlockedList.length}</Text>
          <Text style={styles.xpSummaryLabel}>{t('achBadges')}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>{unlockedList.length} / {DEFS.length} {t('achBadgesUnlocked')}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(unlockedList.length / DEFS.length) * 100}%` }]} />
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {FILTER_TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, activeFilter === tab && styles.filterTabActive]}
            onPress={() => setActiveFilter(tab)}
          >
            <Text style={[styles.filterLabel, activeFilter === tab && styles.filterLabelActive]}>{t(tab as any)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        numColumns={3}
        keyExtractor={a => a.id}
        contentContainerStyle={{ padding: SPACING.sm, paddingBottom: SPACING.xl }}
        columnWrapperStyle={{ gap: SPACING.sm, marginBottom: SPACING.sm }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.cell, !item.unlocked && styles.cellLocked]}
            onPress={() => setDetail(item)}
            activeOpacity={0.75}
          >
            <View style={[styles.cellIcon, { backgroundColor: item.unlocked ? item.color + '30' : colors.cardBorder }]}>
              <MaterialCommunityIcons
                name={item.icon as any}
                size={28}
                color={item.unlocked ? item.color : colors.textMuted}
              />
              {!item.unlocked && (
                <View style={styles.lockOverlay}>
                  <Ionicons name="lock-closed" size={12} color={colors.textMuted} />
                </View>
              )}
            </View>
            <Text style={[styles.cellTitle, !item.unlocked && { color: colors.textMuted }]} numberOfLines={2}>
              {t(item.titleKey as any)}
            </Text>
            {/* Mini progress bar */}
            <View style={styles.miniBar}>
              <View style={[styles.miniFill, { width: `${item.pct}%`, backgroundColor: item.unlocked ? item.color : colors.gold }]} />
            </View>
            <Text style={styles.miniPct}>{item.pct}%</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const makeStyles = (colors: any, fs: (n: number) => number) => StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.background },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  backBtn:    { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle:{ color: colors.textPrimary, fontSize: FONT_SIZE.xl, fontWeight: '700' },

  // Level card
  levelCard:  { flexDirection: 'row', alignItems: 'center', marginHorizontal: SPACING.md, backgroundColor: colors.cardBg, borderColor: colors.cardBorder, borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACING.md, gap: SPACING.md, marginBottom: SPACING.sm },
  hexWrap:    { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  hexLevel:   { position: 'absolute', color: colors.background, fontSize: FONT_SIZE.xl, fontWeight: '900' },
  levelInfo:  { flex: 1 },
  levelTitle: { color: colors.textPrimary, fontSize: FONT_SIZE.md, fontWeight: '700' },
  levelSub:   { color: colors.gold, fontSize: FONT_SIZE.xs, marginBottom: SPACING.xs },
  xpBar:      { height: 8, backgroundColor: colors.cardBorder, borderRadius: 4, overflow: 'hidden', marginBottom: 3 },
  xpFill:     { height: '100%', backgroundColor: colors.gold, borderRadius: 4 },
  xpText:     { color: colors.textMuted, fontSize: FONT_SIZE.xs },
  xpSummary:  { alignItems: 'center' },
  xpSummaryVal:   { color: colors.gold, fontSize: FONT_SIZE.xxl, fontWeight: '700' },
  xpSummaryLabel: { color: colors.textMuted, fontSize: FONT_SIZE.xs },

  // Progress row
  progressRow:  { paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  progressText: { color: colors.textSecondary, fontSize: FONT_SIZE.xs, marginBottom: 4 },
  progressTrack:{ height: 5, backgroundColor: colors.cardBorder, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.gold, borderRadius: 3 },

  // Filters
  filterRow: { flexDirection: 'row', paddingHorizontal: SPACING.md, gap: SPACING.xs, marginBottom: SPACING.sm },
  filterTab: { paddingHorizontal: SPACING.sm + 2, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: colors.cardBg, borderColor: colors.cardBorder, borderWidth: 1 },
  filterTabActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  filterLabel: { color: colors.textSecondary, fontSize: FONT_SIZE.xs, fontWeight: '500' },
  filterLabelActive: { color: colors.background, fontWeight: '700' },

  // Grid cell
  cell:       { flex: 1, backgroundColor: colors.cardBg, borderColor: colors.cardBorder, borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACING.sm, alignItems: 'center', gap: 4 },
  cellLocked: { opacity: 0.65 },
  cellIcon:   { width: 56, height: 56, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  lockOverlay:{ position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.cardBg, borderRadius: 8, padding: 2 },
  cellTitle:  { color: colors.textPrimary, fontSize: FONT_SIZE.xs, fontWeight: '600', textAlign: 'center', lineHeight: 15 },
  miniBar:    { width: '100%', height: 4, backgroundColor: colors.cardBorder, borderRadius: 2, overflow: 'hidden' },
  miniFill:   { height: '100%', borderRadius: 2 },
  miniPct:    { color: colors.textMuted, fontSize: 9 },

  // Detail modal
  modalBack:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  detailCard:  { width: '90%', backgroundColor: colors.cardBg, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: colors.cardBorder, padding: SPACING.lg, alignItems: 'center', gap: SPACING.sm },
  detailIconBox:   { width: 88, height: 88, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  lockBadge:       { position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.cardBg, borderRadius: 12, padding: 3 },
  detailTitle:     { color: colors.textPrimary, fontSize: FONT_SIZE.lg, fontWeight: '700', textAlign: 'center' },
  detailDesc:      { color: colors.textSecondary, fontSize: FONT_SIZE.sm, textAlign: 'center' },
  detailProgressRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  detailProgressText:{ color: colors.textSecondary, fontSize: FONT_SIZE.sm },
  detailXP:        { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  detailBar:       { width: '100%', height: 10, backgroundColor: colors.cardBorder, borderRadius: 5, overflow: 'hidden' },
  detailFill:      { height: '100%', borderRadius: 5 },
  detailPct:       { color: colors.textMuted, fontSize: FONT_SIZE.xs },
  unlockedBadge:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(76,175,80,0.15)', borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs },
  unlockedText:    { color: colors.green, fontSize: FONT_SIZE.sm, fontWeight: '700' },
});
