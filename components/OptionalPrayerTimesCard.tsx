import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RADIUS, SPACING } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../i18n';
import { calculateOptionalPrayerTimes } from '../services/optionalPrayerService';
import { formatPrayerTime, type PrayerTimesData } from '../services/prayerService';

const range = (start: Date, end: Date) => `${formatPrayerTime(start)}–${formatPrayerTime(end)}`;

export function OptionalPrayerTimesCard({ times, now, isToday }: { times: PrayerTimesData; now: Date; isToday: boolean }) {
  const { colors, fs } = useTheme();
  const { t } = useTranslation();
  const data = calculateOptionalPrayerTimes(times);
  const inDislikedTime = isToday && data.disliked.some(item => now >= item.start && now < item.end);
  const styles = React.useMemo(() => makeStyles(colors, fs), [colors, fs]);
  const rows = [
    { icon: 'weather-sunset-up', title: t('optionalIshraq'), detail: t('optionalIshraqDesc'), value: `≈ ${formatPrayerTime(data.ishraqStart)}` },
    { icon: 'weather-sunny', title: t('optionalDuha'), detail: t('optionalDuhaDesc'), value: range(data.duhaStart, data.duhaEnd) },
    { icon: 'weather-sunset-down', title: t('optionalAwwabin'), detail: t('optionalAwwabinDesc'), value: range(data.awwabinStart, data.awwabinEnd) },
  ];
  return <View style={styles.wrapper}>
    <View style={styles.headingRow}>
      <View style={styles.headingIcon}><MaterialCommunityIcons name="hands-pray" size={20} color={colors.gold} /></View>
      <View style={styles.headingText}>
        <Text style={styles.title}>{t('optionalPrayerTitle')}</Text>
        <Text style={styles.subtitle}>{t('optionalPrayerSubtitle')}</Text>
      </View>
      <View style={styles.badge}><Text style={styles.badgeText}>{t('optionalBadge')}</Text></View>
    </View>
    {rows.map((item, index) => <View key={item.title} style={[styles.row, index > 0 && styles.rowBorder]}>
      <MaterialCommunityIcons name={item.icon as any} size={21} color={colors.gold} />
      <View style={styles.rowText}><Text style={styles.rowTitle}>{item.title}</Text><Text style={styles.rowDetail}>{item.detail}</Text></View>
      <Text style={styles.time}>{item.value}</Text>
    </View>)}
    <View style={[styles.warning, inDislikedTime && styles.warningActive]}>
      <Ionicons name="warning-outline" size={18} color={inDislikedTime ? colors.red : colors.orange} />
      <View style={styles.warningText}>
        <Text style={[styles.warningTitle, inDislikedTime && { color: colors.red }]}>{inDislikedTime ? t('dislikedActive') : t('dislikedTitle')}</Text>
        <Text style={styles.warningRanges}>{data.disliked.map(item => range(item.start, item.end)).join('  •  ')}</Text>
        <Text style={styles.warningNote}>{t('dislikedNote')}</Text>
      </View>
    </View>
    <Text style={styles.footnote}>{t('optionalApproxNote')}</Text>
  </View>;
}

const makeStyles = (colors: any, fs: (n: number) => number) => StyleSheet.create({
  wrapper: { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACING.md, marginTop: SPACING.sm, marginBottom: SPACING.md },
  headingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  headingIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.goldGlow, alignItems: 'center', justifyContent: 'center' },
  headingText: { flex: 1, marginLeft: SPACING.sm }, title: { color: colors.textPrimary, fontSize: fs(15), fontWeight: '700' }, subtitle: { color: colors.textSecondary, fontSize: fs(11), marginTop: 2 },
  badge: { backgroundColor: colors.goldGlow, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 4 }, badgeText: { color: colors.gold, fontSize: fs(10), fontWeight: '700' },
  row: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }, rowBorder: { borderTopWidth: 1, borderTopColor: colors.cardBorder },
  rowText: { flex: 1 }, rowTitle: { color: colors.textPrimary, fontSize: fs(14), fontWeight: '600' }, rowDetail: { color: colors.textMuted, fontSize: fs(10), marginTop: 2 }, time: { color: colors.gold, fontSize: fs(13), fontWeight: '700' },
  warning: { flexDirection: 'row', gap: SPACING.sm, backgroundColor: colors.orangeBg, borderRadius: RADIUS.md, padding: SPACING.sm, marginTop: SPACING.xs },
  warningActive: { backgroundColor: colors.redBg, borderWidth: 1, borderColor: colors.red }, warningText: { flex: 1 }, warningTitle: { color: colors.orange, fontSize: fs(12), fontWeight: '700' }, warningRanges: { color: colors.textPrimary, fontSize: fs(11), fontWeight: '600', marginTop: 3 }, warningNote: { color: colors.textSecondary, fontSize: fs(10), lineHeight: 15, marginTop: 4 },
  footnote: { color: colors.textMuted, fontSize: fs(10), lineHeight: 15, marginTop: SPACING.sm },
});
