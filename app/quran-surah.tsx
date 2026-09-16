import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, ActivityIndicator, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { AudioController } from '../services/audioController';
import { loadData, saveData } from '../services/storageService';
import { useTranslation } from '../i18n';
import { SPACING, RADIUS, FONT_SIZE } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { fetchSurah, type Verse, type SurahMeta } from '../data/quranData';

export default function QuranSurahScreen() {
  const { t } = useTranslation();
  const { colors, fs } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors, fs), [colors, fs]);
  const { number } = useLocalSearchParams<{ number: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<SurahMeta | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [playingVerse, setPlayingVerse] = useState<number | null>(null);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set());
  const audio = useRef(new AudioController());
  const playbackId = useRef(0);
  const activeVerse = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const [bookmarksLoaded, setBookmarksLoaded] = useState(false);
  const isPlayingAllRef = useRef(false);

  useEffect(() => {
    let active = true;
    setLoading(true); setError(null); setBookmarksLoaded(false);
    activeVerse.current = null; pausedRef.current = false; isPlayingAllRef.current = false;
    setPlayingVerse(null); setIsPlayingAll(false); setPaused(false);
    fetchSurah(Number(number ?? '1')).then(data => {
      if (active) { setMeta(data.meta); setVerses(data.verses); }
    }).catch(() => { if (active) setError('quranError'); })
      .finally(() => { if (active) setLoading(false); });
    loadData<number[]>(`quran_bookmarks_${number ?? '1'}`).then(saved => {
      if (active) { setBookmarks(new Set(saved ?? [])); setBookmarksLoaded(true); }
    }).catch(console.warn);
    const controller = audio.current;
    const session = playbackId;
    return () => {
      active = false; session.current++;
      isPlayingAllRef.current = false;
      controller.stop().catch(console.warn);
    };
  }, [number, loadAttempt]);

  useFocusEffect(React.useCallback(() => {
    const controller = audio.current;
    return () => {
      playbackId.current++;
      activeVerse.current = null; isPlayingAllRef.current = false; pausedRef.current = false;
      setPlayingVerse(null); setIsPlayingAll(false); setPaused(false);
      void controller.stop().catch(console.warn);
    };
  }, []));

  const togglePause = () => {
    const next = !pausedRef.current;
    pausedRef.current = next; setPaused(next);
    if (next) audio.current.pause(); else audio.current.resume();
  };

  const resetPlayback = () => {
    activeVerse.current = null; pausedRef.current = false; isPlayingAllRef.current = false;
    setPlayingVerse(null); setPaused(false); setIsPlayingAll(false);
  };

  const playAudio = async (verse: Verse) => {
    if (activeVerse.current === verse.number) { togglePause(); return; }
    const request = ++playbackId.current;
    activeVerse.current = verse.number; pausedRef.current = false;
    isPlayingAllRef.current = false; setIsPlayingAll(false); setPaused(false);
    setPlayingVerse(verse.number);
    try {
      await audio.current.play({uri: verse.audioUrl}, () => {
        if (request === playbackId.current) resetPlayback();
      });
    } catch { if (request === playbackId.current) resetPlayback(); }
  };

  const playAllVerses = async () => {
    if (isPlayingAllRef.current) { togglePause(); return; }
    const request = ++playbackId.current;
    isPlayingAllRef.current = true; pausedRef.current = false;
    setIsPlayingAll(true); setPaused(false);
    const playNext = async (index: number): Promise<void> => {
      if (request !== playbackId.current) return;
      if (index >= verses.length) { resetPlayback(); return; }
      const verse = verses[index]; activeVerse.current = verse.number; setPlayingVerse(verse.number);
      try {
        await audio.current.play({uri: verse.audioUrl}, () => { void playNext(index + 1); });
      } catch { if (request === playbackId.current) resetPlayback(); }
    };
    await playNext(0);
  };

  const shareVerse = async (verse: Verse) => {
    const text = `${meta?.nameTurkish} Suresi, ${verse.number}. Ayet\n\n${verse.arabic}\n\n"${verse.turkish}"\n\n— Ezan Vakti`;
    await Share.share({ message: text });
  };

  const toggleBookmark = (n: number) => {
    if (!bookmarksLoaded) return;
    const next = new Set(bookmarks);
    if (next.has(n)) next.delete(n); else next.add(n);
    setBookmarks(next);
    saveData(`quran_bookmarks_${number ?? '1'}`, [...next]).catch(console.warn);
  };

  const renderVerse = ({ item }: { item: Verse }) => {
    const isPlaying = playingVerse === item.number && !paused;
    const isBookmarked = bookmarks.has(item.number);
    const isBismillah = ![1, 9].includes(Number(number ?? '1')) && item.number === 1;

    return (
      <View style={styles.verseCard}>
        {isBismillah && (
          <Text style={styles.bismillah}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
        )}
        {/* Arabic */}
        <Text style={styles.arabicText}>{item.arabic}</Text>

        {/* Actions row */}
        <View style={styles.verseActions}>
          <View style={styles.verseNumBadge}>
            <Text style={styles.verseNum}>{item.number}</Text>
          </View>
          <View style={styles.actionBtns}>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={isPlaying ? t('audioPause') : t('audioResume')} style={[styles.actionBtn, isPlaying && styles.actionBtnActive]} onPress={() => playAudio(item)}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={16} color={isPlaying ? colors.background : colors.gold} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => toggleBookmark(item.number)}>
              <Ionicons name={isBookmarked ? 'bookmark' : 'bookmark-outline'} size={16} color={isBookmarked ? colors.gold : colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => shareVerse(item)}>
              <Ionicons name="share-social-outline" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Turkish */}
        <Text style={styles.turkishText}>{item.turkish}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          {meta && (
            <>
              <Text style={styles.headerArabic}>{meta.nameArabic}</Text>
              <Text style={styles.headerTitle}>{meta.nameTurkish} · {meta.verseCount} Ayet</Text>
            </>
          )}
        </View>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace({ pathname: '/quran-surah', params: { number: number ?? '1' } })}>
          <Ionicons name="refresh" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.gold} size="large" />
          <Text style={styles.loadingText}>Sure yükleniyor...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="book-open-variant" size={40} color={colors.textMuted} />
          <Text style={styles.errorText}>{t('quranError')}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => setLoadAttempt(n => n + 1)}>
            <Ionicons name="refresh" size={16} color={colors.background} />
            <Text style={styles.retryText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={verses}
          extraData={{ playingVerse, paused, isPlayingAll, bookmarks }}
          keyExtractor={v => String(v.number)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: SPACING.md, paddingBottom: SPACING.xl }}
          ListHeaderComponent={
            <View style={styles.surahHeader}>
              <Text style={styles.surahHeaderAr}>{meta?.nameArabic}</Text>
              <Text style={styles.surahHeaderTr}>{meta?.nameTurkish} Suresi</Text>
              <View style={styles.surahHeaderMeta}>
                <View style={[styles.revBadge, { backgroundColor: meta?.revelationType === 'Meccan' ? 'rgba(200,168,83,0.15)' : 'rgba(76,175,80,0.15)' }]}>
                  <Text style={[styles.revBadgeText, { color: meta?.revelationType === 'Meccan' ? colors.gold : colors.green }]}>
                    {meta?.revelationType === 'Meccan' ? '🕋 Mekke' : '🕌 Medine'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.playAllBtn, isPlayingAll && styles.playAllBtnActive]}
                onPress={playAllVerses}
              >
                <Ionicons
                  name={isPlayingAll && !paused ? 'pause-circle' : 'play-circle'}
                  size={18}
                  color={isPlayingAll ? colors.background : colors.gold}
                />
                <Text style={[styles.playAllText, isPlayingAll && styles.playAllTextActive]}>
                  {isPlayingAll ? (paused ? t('audioResume') : t('audioPause')) : t('quranPlayAll')}
                </Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={renderVerse}
          ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (colors: any, fs: (n: number) => number) => StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.background },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  backBtn:          { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter:     { flex: 1, alignItems: 'center' },
  headerArabic:     { color: colors.gold, fontSize: FONT_SIZE.lg, fontWeight: '700' },
  headerTitle:      { color: colors.textSecondary, fontSize: FONT_SIZE.xs },
  center:           { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
  loadingText:      { color: colors.textMuted, fontSize: FONT_SIZE.sm },
  errorText:        { color: colors.textMuted, fontSize: FONT_SIZE.sm, textAlign: 'center', paddingHorizontal: SPACING.lg },
  retryBtn:         { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.gold, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
  retryText:        { color: colors.background, fontSize: FONT_SIZE.sm, fontWeight: '700' },
  surahHeader:      { alignItems: 'center', paddingVertical: SPACING.lg, marginBottom: SPACING.md, backgroundColor: colors.cardBg, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: colors.cardBorder },
  surahHeaderAr:    { color: colors.textPrimary, fontSize: 36, fontWeight: '300', marginBottom: 4 },
  surahHeaderTr:    { color: colors.gold, fontSize: FONT_SIZE.lg, fontWeight: '700' },
  surahHeaderMeta:  { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  revBadge:         { borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: 4 },
  revBadgeText:     { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  bismillah:        { color: colors.gold, fontSize: 22, textAlign: 'center', marginBottom: SPACING.md, lineHeight: 36 },
  verseCard:        { backgroundColor: colors.cardBg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: colors.cardBorder, padding: SPACING.md },
  arabicText:       { color: colors.textPrimary, fontSize: 24, lineHeight: 46, textAlign: 'right', fontWeight: '400', marginBottom: SPACING.sm },
  verseActions:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm, borderTopWidth: 1, borderTopColor: colors.cardBorder, paddingTop: SPACING.sm },
  verseNumBadge:    { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(200,168,83,0.15)', alignItems: 'center', justifyContent: 'center' },
  verseNum:         { color: colors.gold, fontSize: FONT_SIZE.xs, fontWeight: '700' },
  actionBtns:       { flexDirection: 'row', gap: SPACING.xs },
  actionBtn:        { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  actionBtnActive:  { backgroundColor: colors.gold, borderColor: colors.gold },
  turkishText:      { color: colors.textSecondary, fontSize: FONT_SIZE.sm, lineHeight: 22 },
  playAllBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, borderWidth: 1, borderColor: colors.gold },
  playAllBtnActive: { backgroundColor: colors.gold },
  playAllText:      { color: colors.gold, fontSize: FONT_SIZE.sm, fontWeight: '600' },
  playAllTextActive:{ color: colors.background },
});
