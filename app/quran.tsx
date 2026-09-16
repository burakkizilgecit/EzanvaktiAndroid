import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SPACING, RADIUS, FONT_SIZE } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { SURAHS, type SurahMeta } from '../data/quranData';


export default function QuranScreen() {
  const { colors, fs } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors, fs), [colors, fs]);
  const router = useRouter();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return SURAHS;
    return SURAHS.filter(s =>
      s.nameTurkish.toLowerCase().includes(q) ||
      s.nameTranslit.toLowerCase().includes(q) ||
      String(s.number).includes(q)
    );
  }, [search]);

  const renderSurah = ({ item }: { item: SurahMeta }) => (
    <TouchableOpacity
      style={styles.surahRow}
      onPress={() => router.push({ pathname: '/quran-surah', params: { number: item.number } })}
      activeOpacity={0.75}
    >
      <View style={styles.numberBox}>
        <Text style={styles.numberText}>{item.number}</Text>
      </View>
      <View style={styles.surahInfo}>
        <Text style={styles.surahNameTr}>{item.nameTurkish}</Text>
        <View style={styles.surahMeta}>
          <Text style={styles.surahMetaText}>{item.nameTranslit}</Text>
          <View style={styles.dot} />
          <Text style={styles.surahMetaText}>{item.verseCount} ayet</Text>
          <View style={styles.dot} />
          <Text style={[styles.revType, { color: item.revelationType === 'Meccan' ? colors.gold : colors.green }]}>
            {item.revelationType === 'Meccan' ? 'Mekke' : 'Medine'}
          </Text>
        </View>
      </View>
      <Text style={styles.surahNameAr}>{item.nameArabic}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerArabic}>القرآن الكريم</Text>
          <Text style={styles.headerTitle}>Kur&apos;an-ı Kerim</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Sure adı veya numara ara..."
          placeholderTextColor={colors.textMuted}
        />
        {search !== '' && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Quick access */}
      {!search && (
        <View style={styles.quickRow}>
          {[
            { number: 36, label: 'Yâsîn' },
            { number: 55, label: 'Rahmân' },
            { number: 56, label: 'Vâkıa' },
            { number: 67, label: 'Mülk' },
            { number: 1,  label: 'Fâtiha' },
          ].map(q => (
            <TouchableOpacity
              key={q.number}
              style={styles.quickBtn}
              onPress={() => router.push({ pathname: '/quran-surah', params: { number: q.number } })}
            >
              <Text style={styles.quickText}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={s => String(s.number)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: SPACING.xl }}
        renderItem={renderSurah}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="book-search" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>Sure bulunamadı</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const makeStyles = (colors: any, fs: (n: number) => number) => StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.background },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  backBtn:         { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter:    { alignItems: 'center' },
  headerArabic:    { color: colors.gold, fontSize: FONT_SIZE.lg, fontWeight: '700' },
  headerTitle:     { color: colors.textSecondary, fontSize: FONT_SIZE.xs },
  searchRow:       { flexDirection: 'row', alignItems: 'center', marginHorizontal: SPACING.md, marginBottom: SPACING.sm, backgroundColor: colors.cardBg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: SPACING.sm },
  searchIcon:      { marginRight: SPACING.xs },
  searchInput:     { flex: 1, color: colors.textPrimary, fontSize: FONT_SIZE.sm, paddingVertical: SPACING.sm },
  quickRow:        { flexDirection: 'row', paddingHorizontal: SPACING.md, gap: SPACING.xs, marginBottom: SPACING.sm },
  quickBtn:        { flex: 1, backgroundColor: 'rgba(200,168,83,0.12)', borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(200,168,83,0.25)', paddingVertical: SPACING.xs + 2, alignItems: 'center' },
  quickText:       { color: colors.gold, fontSize: FONT_SIZE.xs, fontWeight: '600' },
  surahRow:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2 },
  numberBox:       { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(200,168,83,0.12)', borderWidth: 1, borderColor: 'rgba(200,168,83,0.25)', alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  numberText:      { color: colors.gold, fontSize: FONT_SIZE.xs, fontWeight: '700' },
  surahInfo:       { flex: 1 },
  surahNameTr:     { color: colors.textPrimary, fontSize: FONT_SIZE.md, fontWeight: '700' },
  surahMeta:       { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  surahMetaText:   { color: colors.textMuted, fontSize: FONT_SIZE.xs },
  dot:             { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textMuted },
  revType:         { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  surahNameAr:     { color: colors.textPrimary, fontSize: FONT_SIZE.xl, fontWeight: '300', marginLeft: SPACING.sm },
  divider:         { height: 1, backgroundColor: colors.cardBorder, marginHorizontal: SPACING.md },
  empty:           { alignItems: 'center', paddingVertical: SPACING.xl, gap: SPACING.sm },
  emptyText:       { color: colors.textMuted, fontSize: FONT_SIZE.sm },
});
