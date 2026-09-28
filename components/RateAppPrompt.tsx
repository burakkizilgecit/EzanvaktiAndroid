import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Linking, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../i18n';
import {
  LEGACY_RATED_KEY,
  LATER_SNOOZE_MS,
  RATING_PROMPT_KEY,
  completeRatingPrompt,
  normalizeRatingPromptState,
  recordEligibleLaunch,
  shouldShowRatingPrompt,
  snoozeRatingPrompt,
  type RatingPromptState,
} from '../services/ratingPromptService';

export function RateAppPrompt({ enabled }: { enabled: boolean }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [promptState, setPromptState] = useState<RatingPromptState | null>(null);
  const sessionRecorded = useRef(false);
  useEffect(() => {
    if (!enabled || sessionRecorded.current) return;
    sessionRecorded.current = true;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    Promise.all([
      AsyncStorage.getItem(RATING_PROMPT_KEY),
      AsyncStorage.getItem(LEGACY_RATED_KEY),
    ]).then(async ([raw, legacyRated]) => {
      let parsed: Partial<RatingPromptState> | null = null;
      try { parsed = raw ? JSON.parse(raw) : null; } catch { parsed = null; }
      const stored = normalizeRatingPromptState(parsed);
      const next = legacyRated === 'true' ? completeRatingPrompt(stored) : recordEligibleLaunch(stored);
      await AsyncStorage.setItem(RATING_PROMPT_KEY, JSON.stringify(next));
      if (!active) return;
      setPromptState(next);
      if (shouldShowRatingPrompt(next)) timer = setTimeout(() => setVisible(true), 1200);
    }).catch(console.warn);
    return () => { active = false; if (timer) clearTimeout(timer); };
  }, [enabled]);
  const persist = async (state: RatingPromptState) => {
    setPromptState(state);
    await AsyncStorage.setItem(RATING_PROMPT_KEY, JSON.stringify(state));
  };
  const openStore = async () => {
    const next = completeRatingPrompt(promptState ?? normalizeRatingPromptState(null));
    await Promise.all([
      persist(next),
      AsyncStorage.setItem(LEGACY_RATED_KEY, 'true'),
    ]);
    setVisible(false);
    const iosId = Constants.expoConfig?.extra?.iosAppStoreId || '6813445296';
    const url = Platform.OS === 'ios' ? `https://apps.apple.com/app/id${iosId}?action=write-review` : 'https://play.google.com/store/apps/details?id=com.islamicibadet.app';
    await Linking.openURL(url).catch(console.warn);
  };
  const remindLater = async () => {
    const next = snoozeRatingPrompt(promptState ?? normalizeRatingPromptState(null), LATER_SNOOZE_MS);
    await persist(next);
    setVisible(false);
  };
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
    <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <View style={[styles.icon, { backgroundColor: colors.goldGlow }]}><Ionicons name="star" size={34} color={colors.gold} /></View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('ratePromptTitle')}</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>{t('ratePromptDesc')}</Text>
        <TouchableOpacity style={[styles.primary, { backgroundColor: colors.gold }]} onPress={() => void openStore()}>
          <Ionicons name="star-outline" size={19} color={colors.textInverse} /><Text style={[styles.primaryText, { color: colors.textInverse }]}>{t('ratePromptAction')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.later} onPress={() => void remindLater()}><Text style={[styles.laterText, { color: colors.textSecondary }]}>{t('ratePromptLater')}</Text></TouchableOpacity>
      </View>
    </View>
  </Modal>;
}
const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 380, borderRadius: 24, borderWidth: 1, padding: 24, alignItems: 'center' },
  icon: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 21, lineHeight: 28, fontWeight: '800', textAlign: 'center' },
  body: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8, marginBottom: 22 },
  primary: { width: '100%', height: 50, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryText: { fontSize: 15, fontWeight: '800' },
  later: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 2 },
  laterText: { fontSize: 14, fontWeight: '600' },
});
