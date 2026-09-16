import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from '../i18n';
import { SPACING, RADIUS, FONT_SIZE } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useGoalsStore } from '../store/useGoalsStore';

const GOAL_TITLE_KEYS: Record<string, string> = { dhikr: 'goalTitleDhikr', quran: 'goalTitleQuran', dua: 'goalTitleDua', sadaka: 'goalTitleSadaka' };
const GOAL_UNIT_KEYS: Record<string, string> = { dhikr: 'goalUnitTasbih', quran: 'goalUnitMin', dua: 'goalUnitDua', sadaka: 'goalUnitTimes' };

export default function DailyGoalsScreen() {
  const { t } = useTranslation();
  const { colors, fs } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors, fs), [colors, fs]);
  const router = useRouter();
  const { goals, setTarget, setProgress } = useGoalsStore();
  const [targets, setTargets] = useState<Record<string, string>>(
    Object.fromEntries(goals.map(g => [g.id, String(g.target)]))
  );
  const [progresses, setProgresses] = useState<Record<string, string>>(
    Object.fromEntries(goals.map(g => [g.id, String(g.progress)]))
  );

  const handleSave = () => {
    Object.entries(targets).forEach(([id, val]) => {
      const num = parseInt(val);
      if (!isNaN(num) && num > 0) setTarget(id, num);
    });
    Object.entries(progresses).forEach(([id, val]) => {
      const num = parseInt(val);
      if (!isNaN(num) && num >= 0) setProgress(id, num);
    });
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('goalsTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: SPACING.md }}>
        <Text style={styles.hint}>{t('goalsSubtitle')}</Text>

        <View style={styles.card}>
          {goals.map((goal, i) => {
            const progress = Math.min(goal.progress / goal.target, 1);
            return (
              <View key={goal.id} style={[styles.goalRow, i < goals.length - 1 && styles.goalRowBorder]}>
                <View style={styles.goalIconBox}>
                  <MaterialCommunityIcons name={goal.icon as any} size={24} color={colors.gold} />
                </View>
                <View style={styles.goalInfo}>
                  <View style={styles.goalTitleRow}>
                    <Text style={styles.goalTitle}>{GOAL_TITLE_KEYS[goal.id] ? t(GOAL_TITLE_KEYS[goal.id] as any) : goal.title}</Text>
                  </View>
                  <View style={styles.progressRow}>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                    </View>
                    <TextInput
                      style={styles.progressInput}
                      value={progresses[goal.id]}
                      onChangeText={v => setProgresses(p => ({ ...p, [goal.id]: v }))}
                      keyboardType="numeric"
                      selectTextOnFocus
                    />
                    <Text style={styles.progressText}>/{goal.target}</Text>
                  </View>
                  <View style={styles.targetRow}>
                    <Text style={styles.targetLabel}>{t('goalsTarget')} </Text>
                    <TextInput
                      style={styles.targetInput}
                      value={targets[goal.id]}
                      onChangeText={v => setTargets(t => ({ ...t, [goal.id]: v }))}
                      keyboardType="numeric"
                      selectTextOnFocus
                    />
                    <Text style={styles.targetUnit}>{GOAL_UNIT_KEYS[goal.id] ? t(GOAL_UNIT_KEYS[goal.id] as any) : goal.unit}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{t('save')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any, fs: (n: number) => number) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: colors.textPrimary, fontSize: FONT_SIZE.xl, fontWeight: '700' },
  hint: { color: colors.textMuted, fontSize: FONT_SIZE.sm, marginBottom: SPACING.md },
  card: { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, borderWidth: 1, borderRadius: RADIUS.lg, overflow: 'hidden', marginBottom: SPACING.lg },
  goalRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, gap: SPACING.sm },
  goalRowBorder: { borderBottomColor: colors.cardBorder, borderBottomWidth: 1 },
  goalIconBox: { width: 44, height: 44, borderRadius: RADIUS.sm, backgroundColor: 'rgba(200,168,83,0.12)', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  goalInfo: { flex: 1 },
  goalTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.xs },
  goalTitle: { color: colors.textPrimary, fontSize: FONT_SIZE.md, fontWeight: '600' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.xs },
  progressBar: { flex: 1, height: 6, backgroundColor: colors.cardBorder, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.gold, borderRadius: 3 },
  progressInput: { backgroundColor: colors.background, borderColor: colors.cardBorder, borderWidth: 1, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.xs, paddingVertical: 3, color: colors.textPrimary, fontSize: FONT_SIZE.xs, minWidth: 36, textAlign: 'center' },
  progressText: { color: colors.textMuted, fontSize: FONT_SIZE.xs },
  targetRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  targetLabel: { color: colors.textMuted, fontSize: FONT_SIZE.xs },
  targetInput: { backgroundColor: colors.background, borderColor: colors.cardBorder, borderWidth: 1, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 3, color: colors.textPrimary, fontSize: FONT_SIZE.sm, minWidth: 50, textAlign: 'center' },
  targetUnit: { color: colors.textMuted, fontSize: FONT_SIZE.xs },
  saveBtn: { backgroundColor: colors.gold, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center' },
  saveBtnText: { color: colors.background, fontSize: FONT_SIZE.md, fontWeight: '700' },
});
