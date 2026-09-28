import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SPACING, RADIUS, FONT_SIZE } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export type ShareCardData =
  | { type: 'hadith';  text: string; source: string }
  | { type: 'dua';     title: string; arabic: string; turkish: string; source: string }
  | { type: 'verse';   surah: string; verseNo: number; arabic: string; turkish: string }
  | { type: 'prayer';  name: string; time: string; date: string };

interface Props { data: ShareCardData }

const TYPE_META: Record<ShareCardData['type'], { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string }> = {
  hadith: { icon: 'format-quote-open', label: 'GÜNÜN HADİSİ' },
  dua:    { icon: 'hands-pray',        label: 'DUA' },
  verse:  { icon: 'book-open-variant', label: "KUR'AN-I KERİM" },
  prayer: { icon: 'mosque',            label: 'NAMAZ VAKTİ' },
};

const ShareCard = forwardRef<View, Props>(({ data }, ref) => {
  const { colors, isDark } = useTheme();
  const bgImage = isDark
    ? require('../assets/images/mosque-night.png')
    : require('../assets/images/mosque-day.png');
  const meta = TYPE_META[data.type];

  return (
    <View
      ref={ref}
      style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.gold + '66' }]}
      collapsable={false}
    >
      {/* Background image */}
      <Image source={bgImage} style={[styles.bg, { opacity: isDark ? 0.28 : 0.18 }]} resizeMode="cover" />
      <View style={[styles.overlay, { backgroundColor: isDark ? 'rgba(8,12,22,0.85)' : 'rgba(251,248,242,0.88)' }]} />

      {/* Corner ornaments */}
      <View style={[styles.corner, styles.cornerTL, { borderColor: colors.gold }]} />
      <View style={[styles.corner, styles.cornerTR, { borderColor: colors.gold }]} />
      <View style={[styles.corner, styles.cornerBL, { borderColor: colors.gold }]} />
      <View style={[styles.corner, styles.cornerBR, { borderColor: colors.gold }]} />

      {/* Gold top accent */}
      <View style={[styles.topAccent, { backgroundColor: colors.gold }]} />

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.typeRow}>
          <View style={[styles.typeBadge, { backgroundColor: colors.goldGlow, borderColor: colors.gold + '55' }]}>
            <MaterialCommunityIcons name={meta.icon} size={15} color={colors.gold} />
          </View>
          <Text style={[styles.typeLabel, { color: colors.gold }]}>{meta.label}</Text>
        </View>

        {data.type === 'hadith' && (
          <>
            <Text style={[styles.mainText, { color: colors.textSecondary }]}>&quot;{data.text}&quot;</Text>
            <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />
            <Text style={[styles.sourceText, { color: colors.textMuted }]}>{data.source}</Text>
          </>
        )}

        {data.type === 'dua' && (
          <>
            <Text style={[styles.titleText, { color: colors.textPrimary }]}>{data.title}</Text>
            <Text style={[styles.arabicText, { color: colors.textPrimary }]}>{data.arabic}</Text>
            <Text style={[styles.mainText, { color: colors.textSecondary }]}>{data.turkish}</Text>
            <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />
            <Text style={[styles.sourceText, { color: colors.textMuted }]}>{data.source}</Text>
          </>
        )}

        {data.type === 'verse' && (
          <>
            <Text style={[styles.titleText, { color: colors.textPrimary }]}>{data.surah} · {data.verseNo}. Ayet</Text>
            <Text style={[styles.arabicText, { color: colors.textPrimary }]}>{data.arabic}</Text>
            <Text style={[styles.mainText, { color: colors.textSecondary }]}>&quot;{data.turkish}&quot;</Text>
          </>
        )}

        {data.type === 'prayer' && (
          <>
            <Text style={[styles.prayerName, { color: colors.textPrimary }]}>{data.name} Namazı</Text>
            <Text style={[styles.prayerTime, { color: colors.gold }]}>{data.time}</Text>
            <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />
            <Text style={[styles.sourceText, { color: colors.textMuted }]}>{data.date}</Text>
          </>
        )}
      </View>

      {/* Bottom accent */}
      <View style={[styles.bottomAccent, { backgroundColor: colors.gold + '4D' }]} />

      {/* Footer */}
      <View style={styles.footer}>
        <MaterialCommunityIcons name="mosque" size={14} color={colors.gold} />
        <Text style={[styles.footerText, { color: colors.textMuted }]}>Ezan Vakti</Text>
      </View>
    </View>
  );
});

ShareCard.displayName = 'ShareCard';
export default ShareCard;

const styles = StyleSheet.create({
  card: {
    width: 360,
    borderRadius: RADIUS.xl, overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10,
  },
  bg:      { position: 'absolute', width: '100%', height: '100%' },
  overlay: { position: 'absolute', width: '100%', height: '100%' },
  corner:  { position: 'absolute', width: 22, height: 22, borderWidth: 1.5, opacity: 0.6 },
  cornerTL:{ top: 10, left: 10, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 8 },
  cornerTR:{ top: 10, right: 10, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 8 },
  cornerBL:{ bottom: 10, left: 10, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 8 },
  cornerBR:{ bottom: 10, right: 10, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 8 },
  topAccent:    { height: 3, marginHorizontal: 28, marginTop: 2, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
  content:      { padding: SPACING.lg, paddingTop: SPACING.md, gap: SPACING.sm },
  typeRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  typeBadge:    { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  typeLabel:    { fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  titleText:    { fontSize: FONT_SIZE.md, fontWeight: '700' },
  arabicText:   { fontSize: 21, lineHeight: 40, textAlign: 'right', fontWeight: '300' },
  mainText:     { fontSize: FONT_SIZE.sm, lineHeight: 22 },
  divider:      { height: StyleSheet.hairlineWidth, marginVertical: 2 },
  sourceText:   { fontSize: FONT_SIZE.xs, fontStyle: 'italic' },
  prayerName:   { fontSize: FONT_SIZE.xxl, fontWeight: '700' },
  prayerTime:   { fontSize: 44, fontWeight: '800', letterSpacing: 2 },
  bottomAccent: { height: 2, marginHorizontal: 28, marginBottom: 2 },
  footer:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: SPACING.sm },
  footerText:   { fontSize: FONT_SIZE.xs, fontWeight: '600' },
});
