import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { SpeechController } from '../../services/speechController';
import { SPACING, RADIUS, FONT_SIZE } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { DUAS, DUA_CATEGORIES, getDuaTitle, getDuaTranslation, type Dua } from '../../data/duas';
import { useTranslation } from '../../i18n';

const makeStyles = (colors: any, fs: (n: number) => number) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: colors.textPrimary, fontSize: fs(FONT_SIZE.xl), fontWeight: '700' },
  headerSub: { color: colors.textMuted, fontSize: fs(FONT_SIZE.sm) },
  categoryScroll: { flexGrow: 0, flexShrink: 0 },
  duaList: { flex: 1 },
  categories: { alignItems: 'center', paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm, gap: SPACING.sm, flexDirection: 'row' },
  catBtn: { flexShrink: 0, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2, borderRadius: RADIUS.full, backgroundColor: colors.cardBg, borderColor: colors.cardBorder, borderWidth: 1 },
  catBtnActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  catLabel: { color: colors.textSecondary, fontSize: fs(FONT_SIZE.sm), fontWeight: '700' },
  catLabelActive: { color: colors.background },
  duaCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.cardBg, borderColor: colors.cardBorder, borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACING.md },
  duaCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  duaIconBox: { width: 44, height: 44, borderRadius: RADIUS.sm, backgroundColor: 'rgba(200,168,83,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  duaInfo: { flex: 1 },
  duaTitle: { color: colors.textPrimary, fontSize: fs(FONT_SIZE.md), fontWeight: '600' },
  duaSource: { color: colors.textMuted, fontSize: fs(FONT_SIZE.xs), marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.cardBg, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.lg, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  modalTitle: { color: colors.gold, fontSize: fs(FONT_SIZE.lg), fontWeight: '700', flex: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  playBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.gold, borderRadius: 18 },
  playBtnActive: { backgroundColor: colors.gold, opacity: 0.8 },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, borderRadius: 18 },
  arabicBox: { backgroundColor: colors.background, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md },
  arabicText: { color: colors.textPrimary, fontSize: fs(FONT_SIZE.lg), lineHeight: 34, textAlign: 'right' },
  divider: { height: 1, backgroundColor: colors.cardBorder, marginBottom: SPACING.md },
  turkishText: { color: colors.textSecondary, fontSize: fs(FONT_SIZE.md), lineHeight: 24, marginBottom: SPACING.md },
  sourceBox: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.xl },
  sourceText: { color: colors.gold, fontSize: fs(FONT_SIZE.sm) },
});

export default function DuasScreen() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedDua, setSelectedDua] = useState<Dua | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const speech = useRef(new SpeechController());
  const pausedRef = useRef(false);
  const isPlayingRef = useRef(false);
  const { t, language } = useTranslation();
  const { colors, fs } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors, fs), [colors, fs]);

  const filtered = activeCategory === 'all' ? DUAS : DUAS.filter(d => d.category === activeCategory);

  useFocusEffect(React.useCallback(() => {
    const controller = speech.current;
    return () => {
      isPlayingRef.current = false; pausedRef.current = false;
      setIsPlaying(false);
      void controller.stop().catch(console.warn);
    };
  }, []));

  const playFullDua = () => {
    if (!selectedDua) return;
    if (isPlayingRef.current) {
      isPlayingRef.current = false; pausedRef.current = true; setIsPlaying(false);
      void speech.current.pause().catch(console.warn);
      return;
    }
    isPlayingRef.current = true; setIsPlaying(true);
    if (pausedRef.current) {
      pausedRef.current = false;
      void speech.current.resume();
      return;
    }
    const parts = [{text: selectedDua.arabic, language: 'ar'}];
    if (language !== 'ar') parts.push({text: getDuaTranslation(selectedDua, language), language});
    void speech.current.play(parts, () => {
      isPlayingRef.current = false; pausedRef.current = false; setIsPlaying(false);
    });
  };

  const closeDua = () => {
    isPlayingRef.current = false; pausedRef.current = false;
    setIsPlaying(false); setSelectedDua(null);
    void speech.current.stop().catch(console.warn);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('duasTitle')}</Text>
        <Text style={styles.headerSub}>{DUAS.length} {t('duasTitle').toLowerCase()}</Text>
      </View>

      {/* Category Filter */}
      <ScrollView horizontal style={styles.categoryScroll} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
        {DUA_CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeCategory === cat.id }}
            style={[styles.catBtn, activeCategory === cat.id && styles.catBtnActive]}
            onPress={() => setActiveCategory(cat.id)}
          >
            <Text numberOfLines={1} style={[styles.catLabel, activeCategory === cat.id && styles.catLabelActive]}>
              {t(cat.labelKey as any)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        style={styles.duaList}
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: SPACING.md }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.duaCard} onPress={() => setSelectedDua(item)}>
            <View style={styles.duaCardLeft}>
              <View style={styles.duaIconBox}>
                <MaterialCommunityIcons name="hands-pray" size={22} color={colors.gold} />
              </View>
              <View style={styles.duaInfo}>
                <Text style={styles.duaTitle}>{getDuaTitle(item, language)}</Text>
                <Text style={styles.duaSource}>{item.source}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
      />

      {/* Dua Detail Modal */}
      <Modal visible={!!selectedDua} animationType="slide" transparent onRequestClose={closeDua}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedDua ? getDuaTitle(selectedDua, language) : ''}</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={isPlaying ? t('audioPause') : t('audioResume')}
                  onPress={playFullDua}
                  style={[styles.playBtn, isPlaying && styles.playBtnActive]}
                >
                  <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={18}
                    color={colors.background}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={closeDua}
                  style={styles.closeBtn}
                >
                  <Ionicons name="close" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.arabicBox}>
                <Text style={styles.arabicText}>{selectedDua?.arabic}</Text>
              </View>
              <View style={styles.divider} />
              <Text style={styles.turkishText}>{selectedDua ? getDuaTranslation(selectedDua, language) : ''}</Text>
              <View style={styles.sourceBox}>
                <MaterialCommunityIcons name="book-open-variant" size={16} color={colors.gold} />
                <Text style={styles.sourceText}>{selectedDua?.source}</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
