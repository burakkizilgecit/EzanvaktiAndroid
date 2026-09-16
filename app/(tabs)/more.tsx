import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SPACING, RADIUS, FONT_SIZE } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../i18n';

interface MenuItem {
  id: string; titleKey: string; subtitleKey: string;
  icon: string; color: string; route: string; featured?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'quran',        titleKey: 'moreQuran',        subtitleKey: 'moreQuranSub',        icon: 'book-open-variant', color: '#34C759', route: '/quran',            featured: true },
  { id: 'duas',         titleKey: 'moreDuas',         subtitleKey: 'moreDuasSub',         icon: 'hands-pray',        color: '#D4A84B',    route: '/(tabs)/duas' },
  { id: 'worship',      titleKey: 'moreWorship',      subtitleKey: 'moreWorshipSub',      icon: 'calendar-check',    color: '#7B61FF',      route: '/worship-tracking' },
  { id: 'calendar',     titleKey: 'moreIslamicDays',  subtitleKey: 'moreIslamicDaysSub',  icon: 'calendar-star',     color: '#FF9F0A',      route: '/islamic-calendar' },
  { id: 'goals',        titleKey: 'moreGoals',        subtitleKey: 'moreGoalsSub',        icon: 'target',            color: '#30D158',      route: '/daily-goals' },
  { id: 'upcoming',     titleKey: 'moreUpcoming',     subtitleKey: 'moreUpcomingSub',     icon: 'clock-fast',        color: '#0A84FF',      route: '/upcoming-events' },
  { id: 'achievements', titleKey: 'moreAchievements', subtitleKey: 'moreAchievementsSub', icon: 'medal',             color: '#FFD60A',      route: '/achievements' },
  { id: 'statistics',   titleKey: 'moreStatistics',   subtitleKey: 'moreStatisticsSub',   icon: 'chart-line',        color: '#FF375F',      route: '/statistics' },
  { id: 'settings',     titleKey: 'moreSettings',     subtitleKey: 'moreSettingsSub',     icon: 'cog',               color: '#8E8E93',      route: '/settings' },
];

const makeStyles = (colors: any, fs: (n: number) => number) => StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.background },
  header:     { paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, paddingBottom: SPACING.xs },
  headerTitle:{ color: colors.textPrimary, fontSize: fs(FONT_SIZE.xxl), fontWeight: '800', letterSpacing: 0.2 },
  scroll:     { padding: SPACING.md, gap: SPACING.sm },
  featuredCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: colors.cardBg, borderWidth: 1, borderRadius: RADIUS.xl, padding: SPACING.md },
  featuredIconBox:  { width: 56, height: 56, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  featuredInfo:     { flex: 1 },
  featuredTitle:    { color: colors.textPrimary, fontSize: fs(FONT_SIZE.lg), fontWeight: '700' },
  featuredSubtitle: { color: colors.textMuted, fontSize: fs(FONT_SIZE.xs), marginTop: 2 },
  featuredArrow:    { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  card: { width: '47.5%', backgroundColor: colors.cardBg, borderColor: colors.cardBorder, borderWidth: 1, borderRadius: RADIUS.xl, padding: SPACING.md, gap: 6, minHeight: 110 },
  iconBox:     { width: 48, height: 48, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  cardTitle:   { color: colors.textPrimary, fontSize: fs(FONT_SIZE.md), fontWeight: '700', marginTop: 2 },
  cardSubtitle:{ color: colors.textMuted, fontSize: fs(FONT_SIZE.xs), lineHeight: 16 },
  footer:     { alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: SPACING.xs, paddingVertical: SPACING.lg },
  footerText: { color: colors.textMuted, fontSize: fs(FONT_SIZE.xs), letterSpacing: 0.5 },
});

export default function MoreScreen() {
  const router = useRouter();
  const { colors, fs } = useTheme();
  const { t } = useTranslation();
  const styles = React.useMemo(() => makeStyles(colors, fs), [colors, fs]);
  const featured = MENU_ITEMS.filter(i => i.featured);
  const regular  = MENU_ITEMS.filter(i => !i.featured);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('moreTitle')}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {featured.map(item => (
          <TouchableOpacity
            key={item.id}
            style={[styles.featuredCard, { borderColor: item.color + '44' }]}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.78}
          >
            <View style={[styles.featuredIconBox, { backgroundColor: item.color + '20' }]}>
              <MaterialCommunityIcons name={item.icon as any} size={32} color={item.color} />
            </View>
            <View style={styles.featuredInfo}>
              <Text style={styles.featuredTitle}>{t(item.titleKey as any)}</Text>
              <Text style={styles.featuredSubtitle}>{t(item.subtitleKey as any)}</Text>
            </View>
            <View style={[styles.featuredArrow, { backgroundColor: item.color + '20' }]}>
              <Ionicons name="arrow-forward" size={18} color={item.color} />
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.grid}>
          {regular.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.78}
            >
              <View style={[styles.iconBox, { backgroundColor: item.color + '1A' }]}>
                <MaterialCommunityIcons name={item.icon as any} size={26} color={item.color} />
              </View>
              <Text style={styles.cardTitle} numberOfLines={1}>{t(item.titleKey as any)}</Text>
              <Text style={styles.cardSubtitle} numberOfLines={2}>{t(item.subtitleKey as any)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <MaterialCommunityIcons name="mosque" size={22} color={colors.gold} style={{ opacity: 0.35 }} />
          <Text style={styles.footerText}>{t('appName')} · v1.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

