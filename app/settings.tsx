import Constants from 'expo-constants';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, StatusBar, Modal, Linking, ActivityIndicator, Platform, AppState,
 Alert } from 'react-native';
import { SoundPreviewController, type PreviewState } from '../services/soundPreviewController';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTutorialStore } from '../store/useTutorialStore';
import { type NotificationSound, useSettingsStore, type AppSettings } from '../store/useSettingsStore';
import { useTranslation, type Language } from '../i18n';
import { pickSystemRingtone, pickAudioFile } from '../services/soundPickerService';
import { sendTestNotification, setupCustomNotificationChannel } from '../services/notificationService';
import { useTheme } from '../context/ThemeContext';
import { SPACING, RADIUS, FONT_SIZE } from '../constants/theme';

const SOUNDS: { key: NotificationSound; labelKey: string; descKey: string; icon: string; file: any }[] = [
  {
    key: 'ezan',
    labelKey: 'soundEzan',
    descKey: 'soundEzanDesc',
    icon: 'mosque',
    file: require('../assets/sounds/ezan.mp3'),
  },
  {
    key: 'ilahi',
    labelKey: 'soundIlahi',
    descKey: 'soundIlahiDesc',
    icon: 'music-note',
    file: require('../assets/sounds/ilahi.mp3'),
  },
];

const PRIVACY_POLICY_URL = 'https://burakkizilgecit.github.io/islamicibadet-privacy/privacy-policy.html';
const APP_VERSION = Constants.expoConfig?.version ?? '1.0.1';

type NotifKey = keyof AppSettings['notifications'];

interface SettingItem {
  key: NotifKey;
  labelKey: string;
  descKey: string;
  icon: string;
  androidOnly?: boolean;
}

const NOTIFICATION_SETTINGS: SettingItem[] = [
  { key: 'prayerTimes',   labelKey: 'notifPrayerTimes',   descKey: 'notifPrayerTimesDesc',   icon: 'clock-time-five-outline' },
  { key: 'earlyReminder', labelKey: 'notifEarlyReminder', descKey: 'notifEarlyReminderDesc', icon: 'bell-ring-outline' },
  { key: 'dailyHadith',   labelKey: 'notifDailyHadith',   descKey: 'notifDailyHadithDesc',   icon: 'format-quote-close' },
  { key: 'dailyDua',      labelKey: 'notifDailyDua',      descKey: 'notifDailyDuaDesc',      icon: 'hands-pray' },
  { key: 'dhikrReminder', labelKey: 'notifDhikr',         descKey: 'notifDhikrDesc',         icon: 'circle-outline' },
  { key: 'islamicDays',   labelKey: 'notifIslamicDays',   descKey: 'notifIslamicDaysDesc',   icon: 'calendar-star' },
  { key: 'optionalPrayers', labelKey: 'notifOptionalPrayers', descKey: 'notifOptionalPrayersDesc', icon: 'weather-sunset-up' },
  { key: 'persistentPrayerTimes', labelKey: 'notifPersistentPrayerTimes', descKey: 'notifPersistentPrayerTimesDesc', icon: 'format-list-bulleted', androidOnly: true },
];

// ── Time Picker ──────────────────────────────────────────────────────────────

interface TimeParts { h: number; m: number }

function parseTime(t: string): TimeParts {
  const [h, m] = t.split(':').map(Number);
  return { h: isNaN(h) ? 0 : h, m: isNaN(m) ? 0 : m };
}
function fmt(p: TimeParts) {
  return `${String(p.h).padStart(2, '0')}:${String(p.m).padStart(2, '0')}`;
}

interface TimePickerProps {
  visible: boolean;
  startTime: string;
  endTime: string;
  onSave: (start: string, end: string) => void;
  onClose: () => void;
  colors: any;
  dynStyles: ReturnType<typeof makeStyles>;
}

function TimeWheel({ value, field, which, onAdjust, colors, dynStyles }: {
  value: number;
  field: 'h' | 'm';
  which: 'start' | 'end';
  onAdjust: (which: 'start' | 'end', field: 'h' | 'm', delta: number) => void;
  colors: any;
  dynStyles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={dynStyles.wheel}>
      <TouchableOpacity onPress={() => onAdjust(which, field, 1)} style={dynStyles.wheelBtn} hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}>
        <Ionicons name="chevron-up" size={22} color={colors.gold} />
      </TouchableOpacity>
      <Text style={[dynStyles.wheelValue, { color: colors.textPrimary }]}>{String(value).padStart(2, '0')}</Text>
      <TouchableOpacity onPress={() => onAdjust(which, field, -1)} style={dynStyles.wheelBtn} hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}>
        <Ionicons name="chevron-down" size={22} color={colors.gold} />
      </TouchableOpacity>
    </View>
  );
}

function TimePicker({ visible, startTime, endTime, onSave, onClose, colors, dynStyles }: TimePickerProps) {
  const { t } = useTranslation();
  const [start, setStart] = useState<TimeParts>(parseTime(startTime));
  const [end, setEnd] = useState<TimeParts>(parseTime(endTime));

  const adjust = (which: 'start' | 'end', field: 'h' | 'm', delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const max = field === 'h' ? 24 : 60;
    const setter = which === 'start' ? setStart : setEnd;
    setter(prev => ({ ...prev, [field]: (prev[field] + delta + max) % max }));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[dynStyles.pickerOverlay, { backgroundColor: colors.overlay }]}>
        <View style={[dynStyles.pickerCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <Text style={[dynStyles.pickerTitle, { color: colors.textPrimary }]}>{t('settingsSilentHours')}</Text>
          <Text style={[dynStyles.pickerHint, { color: colors.textMuted }]}>{t('settingsSilentNote')}</Text>

          <View style={dynStyles.pickerRow}>
            {/* Start */}
            <View style={dynStyles.pickerSection}>
              <Text style={[dynStyles.pickerLabel, { color: colors.textSecondary }]}>{t('settingsSilentStart')}</Text>
              <View style={dynStyles.timeDisplay}>
                <TimeWheel value={start.h} field="h" which="start" onAdjust={adjust} colors={colors} dynStyles={dynStyles} />
                <Text style={[dynStyles.timeSep, { color: colors.gold }]}>:</Text>
                <TimeWheel value={start.m} field="m" which="start" onAdjust={adjust} colors={colors} dynStyles={dynStyles} />
              </View>
            </View>

            <View style={dynStyles.pickerArrow}>
              <Ionicons name="arrow-forward" size={20} color={colors.textMuted} />
            </View>

            {/* End */}
            <View style={dynStyles.pickerSection}>
              <Text style={[dynStyles.pickerLabel, { color: colors.textSecondary }]}>{t('settingsSilentEnd')}</Text>
              <View style={dynStyles.timeDisplay}>
                <TimeWheel value={end.h} field="h" which="end" onAdjust={adjust} colors={colors} dynStyles={dynStyles} />
                <Text style={[dynStyles.timeSep, { color: colors.gold }]}>:</Text>
                <TimeWheel value={end.m} field="m" which="end" onAdjust={adjust} colors={colors} dynStyles={dynStyles} />
              </View>
            </View>
          </View>

          <View style={dynStyles.pickerBtns}>
            <TouchableOpacity style={[dynStyles.pickerCancelBtn, { backgroundColor: colors.cardBorder }]} onPress={onClose}>
              <Text style={[dynStyles.pickerCancelText, { color: colors.textSecondary }]}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[dynStyles.pickerSaveBtn, { backgroundColor: colors.gold }]}
              onPress={() => { onSave(fmt(start), fmt(end)); onClose(); }}
            >
              <Text style={[dynStyles.pickerSaveText, { color: colors.background }]}>{t('save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── makeStyles ───────────────────────────────────────────────────────────────

const makeStyles = (colors: any, fs: (n: number) => number) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: colors.textPrimary, fontSize: fs(FONT_SIZE.xl), fontWeight: '700' },
  sectionTitle: { color: colors.gold, fontSize: fs(FONT_SIZE.xs), fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: SPACING.xs, marginTop: SPACING.lg },
  sectionDesc: { color: colors.textMuted, fontSize: fs(FONT_SIZE.xs), marginBottom: SPACING.sm },
  card: { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, borderWidth: 1, borderRadius: RADIUS.lg, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2, gap: SPACING.sm },
  rowBorder: { borderBottomColor: colors.cardBorder, borderBottomWidth: 1 },
  settingIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(200,168,83,0.12)', alignItems: 'center', justifyContent: 'center' },
  settingInfo: { flex: 1 },
  settingLabel: { color: colors.textPrimary, fontSize: fs(FONT_SIZE.sm), fontWeight: '500' },
  settingDesc2: { color: colors.textMuted, fontSize: fs(FONT_SIZE.xs), marginTop: 1 },
  testNotificationButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, minHeight: 50, borderTopWidth: 1, borderTopColor: colors.cardBorder, paddingHorizontal: SPACING.md },
  testNotificationText: { color: colors.gold, fontSize: fs(FONT_SIZE.sm), fontWeight: '700' },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  valueText: { color: colors.textSecondary, fontSize: fs(FONT_SIZE.xs) },
  timeBadge: { backgroundColor: 'rgba(200,168,83,0.15)', borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(200,168,83,0.3)' },
  timeBadgeText: { color: colors.gold, fontSize: fs(FONT_SIZE.sm), fontWeight: '700', fontVariant: ['tabular-nums'] },
  timeDash: { color: colors.textMuted, fontSize: fs(FONT_SIZE.sm) },
  appInfo: { alignItems: 'center', marginTop: SPACING.xl, marginBottom: SPACING.xl, gap: SPACING.xs },
  appName: { color: colors.textSecondary, fontSize: fs(FONT_SIZE.md), fontWeight: '600' },
  appVersion: { color: colors.textMuted, fontSize: fs(FONT_SIZE.xs) },
  appCopyright: { color: colors.textMuted, fontSize: 10 },

  soundRow:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2, gap: SPACING.sm },
  soundIconBox:      { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(200,168,83,0.12)', alignItems: 'center', justifyContent: 'center' },
  soundIconBoxActive:{ backgroundColor: colors.gold },
  previewBtn:        { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  previewBtnActive:  { opacity: 1 },
  radioOuter:        { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  radioOuterActive:  { borderColor: colors.gold },
  radioInner:        { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.gold },

  langCard:          { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  langBtn:           { flex: 1, alignItems: 'center', paddingVertical: SPACING.md, borderRadius: RADIUS.lg, backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.cardBorder, gap: 4 },
  langBtnActive:     { borderColor: colors.gold, backgroundColor: 'rgba(200,168,83,0.1)' },
  langFlag:          { fontSize: 22 },
  langLabel:         { color: colors.textSecondary, fontSize: fs(FONT_SIZE.xs), fontWeight: '600' },
  langLabelActive:   { color: colors.gold, fontWeight: '800' },
  langDot:           { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.gold },

  soundPickerRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 4, gap: SPACING.sm },
  soundPickerIconBox:{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(200,168,83,0.12)', alignItems: 'center', justifyContent: 'center' },

  // Time Picker Modal
  pickerOverlay:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pickerCard:     { width: '88%', borderRadius: RADIUS.xl, borderWidth: 1, padding: SPACING.lg },
  pickerTitle:    { fontSize: fs(FONT_SIZE.lg), fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  pickerHint:     { fontSize: fs(FONT_SIZE.xs), textAlign: 'center', marginBottom: SPACING.lg },
  pickerRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg },
  pickerSection:  { alignItems: 'center', flex: 1 },
  pickerLabel:    { fontSize: fs(FONT_SIZE.xs), fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.sm },
  timeDisplay:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeSep:        { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  pickerArrow:    { paddingHorizontal: SPACING.sm, marginTop: 20 },
  wheel:          { alignItems: 'center', gap: SPACING.xs },
  wheelBtn:       { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  wheelValue:     { fontSize: 32, fontWeight: '700', fontVariant: ['tabular-nums'], minWidth: 44, textAlign: 'center' },
  pickerBtns:     { flexDirection: 'row', gap: SPACING.sm },
  pickerCancelBtn:{ flex: 1, padding: SPACING.sm + 2, borderRadius: RADIUS.lg, alignItems: 'center' },
  pickerCancelText:{ fontSize: fs(FONT_SIZE.sm), fontWeight: '600' },
  pickerSaveBtn:  { flex: 1, padding: SPACING.sm + 2, borderRadius: RADIUS.lg, alignItems: 'center' },
  pickerSaveText: { fontSize: fs(FONT_SIZE.sm), fontWeight: '700' },

  // Appearance section
  themeRow:          { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  themeBtn:          { flex: 1, borderRadius: RADIUS.lg, borderWidth: 1.5, overflow: 'hidden', alignItems: 'center', paddingVertical: SPACING.sm },
  themeBtnActive:    { borderWidth: 2 },
  themePreviewBox:   { width: '100%', height: 52, justifyContent: 'center', paddingHorizontal: SPACING.sm, gap: 4 },
  themeBar:          { height: 6, borderRadius: 3, width: '45%' },
  themeLine:         { height: 4, borderRadius: 2 },
  themeBtnLabel:     { fontSize: fs(FONT_SIZE.xs), fontWeight: '700', paddingVertical: SPACING.xs },

  fontRow:           { gap: SPACING.xs },
  fontBtn:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, gap: SPACING.md },
  fontBtnActive:     { borderWidth: 1.5 },
  fontBtnAa:         { fontWeight: '700', width: 44, textAlign: 'center' },
  fontBtnLabel:      { flex: 1, fontWeight: '500' },
});

// ── Screen ───────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, fs } = useTheme();
  const { settings, toggleNotification, updateSettings } = useSettingsStore();
  const { reset: resetTutorial } = useTutorialStore();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const [isSoundLoading, setIsSoundLoading] = useState(false);
  const [isTestNotificationLoading, setIsTestNotificationLoading] = useState(false);

  const [preview, setPreview] = useState<PreviewState>({key: null, status: 'idle'});
  const [previewController] = useState(() => new SoundPreviewController(setPreview, console.warn));
  useEffect(() => {
    previewController.setErrorHandler(error => {
      console.warn('Sound preview failed', error);
      Alert.alert(t('errorTitle'), t('errorSoundPreview'));
    });
  }, [previewController, t]);
  const styles = useMemo(() => makeStyles(colors, fs), [colors, fs]);
  const stopPreview = useCallback(() => previewController.stop().catch(console.warn), [previewController]);
  useFocusEffect(useCallback(() => () => { void stopPreview(); }, [stopPreview]));
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => { if (state !== 'active') void stopPreview(); });
    return () => sub.remove();
  }, [stopPreview]);

  const previewControls = (key: string, source: number | {uri: string}) => {
    const active = preview.key === key;
    const running = active && (preview.status === 'playing' || preview.status === 'loading');
    return <View style={{flexDirection: 'row', alignItems: 'center'}}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('audioPlay')} disabled={running}
        style={[styles.previewBtn, {opacity: running ? 0.5 : 1}]} onPress={() => void previewController.play(key, source)}>
        {active && preview.status === 'loading' ? <ActivityIndicator size="small" color={colors.gold} />
          : <Ionicons name="play-circle-outline" size={28} color={colors.gold} />}
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('audioPause')} disabled={!running}
        style={[styles.previewBtn, {opacity: running ? 1 : 0.35}]} onPress={() => previewController.pause()}>
        <Ionicons name="pause-circle-outline" size={28} color={colors.gold} />
      </TouchableOpacity>
    </View>;
  };

  const applyCustomSound = async (uri: string, name: string) => {
    setShowSoundPicker(false);
    setIsSoundLoading(true);
    try {
      await setupCustomNotificationChannel(uri);
      updateSettings({ notificationSound: 'custom', customSoundUri: uri, customSoundName: name });
    } catch {
      Alert.alert(t('errorTitle'), t('errorSoundSetup'));
    } finally {
      setIsSoundLoading(false);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handlePickRingtone = async () => {
    if (Platform.OS !== 'android') {
      Alert.alert(t('infoTitle'), t('infoAndroidOnly'));
      return;
    }
    setShowSoundPicker(false);
    const picked = await pickSystemRingtone();
    if (picked) await applyCustomSound(picked.uri, picked.name);
  };

  const handlePickAudioFile = async () => {
    setShowSoundPicker(false);
    const picked = await pickAudioFile();
    if (picked) await applyCustomSound(picked.uri, picked.name);
  };



  const handleLanguageChange = (lang: Language) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateSettings({ language: lang });
  };

  const handleReplayTutorial = async () => {
    await resetTutorial();
    router.replace('/tutorial' as any);
  };

  const handleVibrationToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateSettings({ vibration: !settings.vibration });
  };

  const handleTestNotification = async () => {
    if (isTestNotificationLoading) return;
    setIsTestNotificationLoading(true);
    try {
      const scheduled = await sendTestNotification(settings, t('notificationTestTitle'), t('notificationTestBody'));
      Alert.alert(t(scheduled ? 'notificationTestTitle' : 'errorTitle'), t(scheduled ? 'notificationTestScheduled' : 'notificationPermissionNeeded'));
    } catch (error) {
      console.warn('Test notification failed', error);
      Alert.alert(t('errorTitle'), t('retry'));
    } finally {
      setIsTestNotificationLoading(false);
    }
  };

  const currentTheme = settings.theme ?? 'dark';
  const currentFontSize = settings.fontSize ?? 'normal';
  const visibleNotificationSettings = NOTIFICATION_SETTINGS.filter(item => !item.androidOnly || Platform.OS === 'android');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle={colors.textPrimary === '#F8F9FC' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <TimePicker
        visible={showTimePicker}
        startTime={settings.silentHours.start}
        endTime={settings.silentHours.end}
        onSave={(start, end) => updateSettings({ silentHours: { start, end } })}
        onClose={() => setShowTimePicker(false)}
        colors={colors}
        dynStyles={styles}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settingsTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Sound Picker Modal */}
      <Modal visible={showSoundPicker} transparent animationType="fade" onRequestClose={() => setShowSoundPicker(false)}>
        <View style={[styles.pickerOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.pickerCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Text style={[styles.pickerTitle, { color: colors.textPrimary }]}>{t('soundPickerTitle')}</Text>
            <Text style={[styles.pickerHint, { color: colors.textMuted }]}>{t('soundPickerDesc')}</Text>

            <TouchableOpacity style={styles.soundPickerRow} onPress={handlePickRingtone} activeOpacity={0.7}>
              <View style={styles.soundPickerIconBox}>
                <Ionicons name="musical-notes-outline" size={22} color={colors.gold} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{t('soundFromRingtone')}</Text>
                <Text style={styles.settingDesc2}>{t('soundFromRingtoneDesc')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <View style={{ height: 1, backgroundColor: colors.cardBorder, marginVertical: SPACING.xs }} />

            <TouchableOpacity style={styles.soundPickerRow} onPress={handlePickAudioFile} activeOpacity={0.7}>
              <View style={styles.soundPickerIconBox}>
                <Ionicons name="folder-open-outline" size={22} color={colors.gold} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{t('soundFromFile')}</Text>
                <Text style={styles.settingDesc2}>{t('soundFromFileDesc')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.pickerCancelBtn, { marginTop: SPACING.md, backgroundColor: colors.cardBorder }]} onPress={() => setShowSoundPicker(false)}>
              <Text style={[styles.pickerCancelText, { color: colors.textSecondary }]}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: SPACING.md }}>

        {/* ── Appearance ── */}
        <Text style={styles.sectionTitle}>{t('settingsAppearance')}</Text>
        <Text style={styles.sectionDesc}>{t('settingsAppearanceDesc')}</Text>

        {/* Theme selection */}
        <View style={styles.themeRow}>
          {/* Dark */}
          <TouchableOpacity
            style={[
              styles.themeBtn,
              { backgroundColor: '#141B2D', borderColor: currentTheme === 'dark' ? '#D4A84B' : '#1E2A40' },
              currentTheme === 'dark' && styles.themeBtnActive,
            ]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); updateSettings({ theme: 'dark' }); }}
            activeOpacity={0.8}
          >
            <View style={[styles.themePreviewBox, { backgroundColor: '#080C16' }]}>
              <View style={[styles.themeBar, { backgroundColor: '#D4A84B' }]} />
              <View style={[styles.themeLine, { backgroundColor: '#8B95B0', width: '75%' }]} />
              <View style={[styles.themeLine, { backgroundColor: '#4E5A75', width: '55%' }]} />
            </View>
            <Text style={[styles.themeBtnLabel, { color: currentTheme === 'dark' ? '#D4A84B' : '#8B95B0' }]}>{t('themeDarkMode')}</Text>
          </TouchableOpacity>

          {/* Light */}
          <TouchableOpacity
            style={[
              styles.themeBtn,
              { backgroundColor: '#FFFFFF', borderColor: currentTheme === 'light' ? '#C4922A' : '#E0D5C2' },
              currentTheme === 'light' && styles.themeBtnActive,
            ]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); updateSettings({ theme: 'light' }); }}
            activeOpacity={0.8}
          >
            <View style={[styles.themePreviewBox, { backgroundColor: '#FBF8F2' }]}>
              <View style={[styles.themeBar, { backgroundColor: '#C4922A' }]} />
              <View style={[styles.themeLine, { backgroundColor: '#6B5438', width: '75%' }]} />
              <View style={[styles.themeLine, { backgroundColor: '#A8916A', width: '55%' }]} />
            </View>
            <Text style={[styles.themeBtnLabel, { color: currentTheme === 'light' ? '#C4922A' : '#6B5438' }]}>{t('themeLightMode')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          accessibilityRole="radio"
          accessibilityState={{ checked: currentTheme === 'system' }}
          onPress={() => updateSettings({ theme: 'system' })}
          style={{ minHeight: 48, padding: 12, marginBottom: SPACING.sm, borderWidth: 1, borderRadius: RADIUS.lg, borderColor: currentTheme === 'system' ? colors.gold : colors.cardBorder }}
        >
          <Text style={{ color: currentTheme === 'system' ? colors.gold : colors.textPrimary }}>{t('settingsThemeSystem')}</Text>
        </TouchableOpacity>

        {/* Font size selection */}
        <View style={[styles.fontRow, { marginBottom: SPACING.md }]}>
          {([
            { key: 'normal', labelKey: 'fontNormal', aaSize: 15 },
            { key: 'large', labelKey: 'fontLarge', aaSize: 20 },
            { key: 'xlarge', labelKey: 'fontXLarge', aaSize: 26 },
          ] as { key: 'normal' | 'large' | 'xlarge'; labelKey: string; aaSize: number }[]).map(item => {
            const active = currentFontSize === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.fontBtn,
                  { backgroundColor: active ? colors.goldGlow : colors.cardBg, borderColor: active ? colors.gold : colors.cardBorder },
                  active && styles.fontBtnActive,
                ]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); updateSettings({ fontSize: item.key }); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.fontBtnAa, { fontSize: item.aaSize, color: active ? colors.gold : colors.textPrimary }]}>Aa</Text>
                <Text style={[styles.fontBtnLabel, { fontSize: fs(FONT_SIZE.sm), color: active ? colors.gold : colors.textSecondary }]}>{t(item.labelKey as any)}</Text>
                {active && <Ionicons name="checkmark-circle" size={18} color={colors.gold} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Notification Settings */}
        <Text style={styles.sectionTitle}>{t('settingsNotifications')}</Text>
        <Text style={styles.sectionDesc}>{t('settingsNotificationsDesc')}</Text>
        <View style={styles.card}>
          {visibleNotificationSettings.map((item, i) => (
            <View key={item.key} style={[styles.settingRow, i < visibleNotificationSettings.length - 1 && styles.rowBorder]}>
              <View style={styles.settingIcon}>
                <MaterialCommunityIcons name={item.icon as any} size={20} color={colors.gold} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{t(item.labelKey as any)}</Text>
                <Text style={styles.settingDesc2}>{t(item.descKey as any)}</Text>
              </View>
              <Switch
                value={settings.notifications[item.key]}
                onValueChange={() => toggleNotification(item.key)}
                trackColor={{ false: colors.cardBorder, true: colors.gold + '66' }}
                thumbColor={settings.notifications[item.key] ? colors.gold : colors.textMuted}
              />
            </View>
          ))}
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.testNotificationButton}
            onPress={() => void handleTestNotification()}
            disabled={isTestNotificationLoading}
          >
            {isTestNotificationLoading
              ? <ActivityIndicator size="small" color={colors.gold} />
              : <Ionicons name="notifications-circle-outline" size={22} color={colors.gold} />}
            <View style={{ flex: 1 }}>
              <Text style={styles.testNotificationText}>{t('notificationTestButton')}</Text>
              <Text style={styles.settingDesc2}>{t('notificationTestDesc')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Language */}
        <Text style={styles.sectionTitle}>{t('settingsLanguage')}</Text>
        <Text style={styles.sectionDesc}>{t('settingsLanguageDesc')}</Text>
        <View style={styles.langCard}>
          {(['tr', 'en', 'ar'] as Language[]).map((lang) => {
            const active = (settings.language ?? 'tr') === lang;
            const label = lang === 'tr' ? 'Türkçe' : lang === 'en' ? 'English' : 'العربية';
            const flag  = lang === 'tr' ? '🇹🇷' : lang === 'en' ? '🇬🇧' : '🇸🇦';
            return (
              <TouchableOpacity
                key={lang}
                style={[styles.langBtn, active && styles.langBtnActive]}
                onPress={() => handleLanguageChange(lang)}
                activeOpacity={0.75}
              >
                <Text style={styles.langFlag}>{flag}</Text>
                <Text style={[styles.langLabel, active && styles.langLabelActive]}>{label}</Text>
                {active && <View style={styles.langDot} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Notification Sound */}
        <Text style={styles.sectionTitle}>{t('settingsSound')}</Text>
        <Text style={styles.sectionDesc}>{t('settingsSoundDesc')}</Text>
        <View style={styles.card}>
          <View style={[styles.soundRow, styles.rowBorder]}>
            <TouchableOpacity accessibilityRole="radio" accessibilityState={{checked: settings.notificationSound === 'default'}} style={{flex: 1, flexDirection: 'row', alignItems: 'center'}} onPress={() => { void stopPreview(); updateSettings({notificationSound: 'default'}); }}>
              <View style={[styles.soundIconBox, settings.notificationSound === 'default' && styles.soundIconBoxActive]}><Ionicons name="notifications-outline" size={20} color={settings.notificationSound === 'default' ? colors.background : colors.gold} /></View>
              <View style={styles.settingInfo}><Text style={[styles.settingLabel, settings.notificationSound === 'default' && {color: colors.gold}]}>{t('defaultSound')}</Text><Text style={styles.settingDesc2}>{t('defaultSoundDesc')}</Text></View>
              <View style={[styles.radioOuter, settings.notificationSound === 'default' && styles.radioOuterActive]}>{settings.notificationSound === 'default' && <View style={styles.radioInner} />}</View>
            </TouchableOpacity>
          </View>
          {SOUNDS.map(s => {
            const active = settings.notificationSound === s.key;
            return <View key={s.key} style={[styles.soundRow, styles.rowBorder]}>
              <TouchableOpacity accessibilityRole="radio" accessibilityState={{checked: active}}
                style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}
                onPress={() => { void stopPreview(); updateSettings({notificationSound: s.key}); }}>
                <View style={[styles.soundIconBox, active && styles.soundIconBoxActive]}>
                  <MaterialCommunityIcons name={s.icon as any} size={20} color={active ? colors.background : colors.gold} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, active && {color: colors.gold}]}>{t(s.labelKey as any)}</Text>
                  <Text style={styles.settingDesc2}>{t(s.descKey as any)}</Text>
                </View>
                <View style={[styles.radioOuter, active && styles.radioOuterActive]}>{active && <View style={styles.radioInner} />}</View>
              </TouchableOpacity>
              {previewControls(s.key, s.file)}
            </View>;
          })}
          <View style={styles.soundRow}>
            <TouchableOpacity style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}
              onPress={() => { void stopPreview(); setShowSoundPicker(true); }}>
              <View style={styles.soundIconBox}>
                {isSoundLoading ? <ActivityIndicator size="small" color={colors.gold} /> : <Ionicons name="phone-portrait-outline" size={20} color={colors.gold} />}
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{settings.notificationSound === 'custom' && settings.customSoundUri ? settings.customSoundName : t('soundFromPhone')}</Text>
                <Text style={styles.settingDesc2}>{t('soundFromPhoneDesc')}</Text>
              </View>
            </TouchableOpacity>
            {settings.customSoundUri && previewControls('custom', {uri: settings.customSoundUri})}
          </View>
        </View>

        {/* Other Settings */}
        <Text style={styles.sectionTitle}>{t('settingsOther')}</Text>
        <View style={styles.card}>
          {/* Silent Hours */}
          <TouchableOpacity
            style={[styles.settingRow, styles.rowBorder]}
            onPress={() => setShowTimePicker(true)}
            activeOpacity={0.7}
          >
            <View style={styles.settingIcon}>
              <Ionicons name="moon-outline" size={20} color={colors.gold} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t('settingsSilentHours')}</Text>
              <Text style={styles.settingDesc2}>{t('settingsSilentHoursDesc')}</Text>
            </View>
            <View style={styles.valueRow}>
              <View style={styles.timeBadge}>
                <Text style={styles.timeBadgeText}>{settings.silentHours.start}</Text>
              </View>
              <Text style={styles.timeDash}>–</Text>
              <View style={styles.timeBadge}>
                <Text style={styles.timeBadgeText}>{settings.silentHours.end}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: 4 }} />
            </View>
          </TouchableOpacity>

          {/* Vibration */}
          <View style={[styles.settingRow, styles.rowBorder]}>
            <View style={styles.settingIcon}>
              <Ionicons name="phone-portrait-outline" size={20} color={colors.gold} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t('settingsVibration')}</Text>
              <Text style={styles.settingDesc2}>{t('settingsVibrationDesc', { state: t(settings.vibration ? 'settingsVibrationOn' : 'settingsVibrationOff') })}</Text>
            </View>
            <Switch
              value={settings.vibration}
              onValueChange={handleVibrationToggle}
              trackColor={{ false: colors.cardBorder, true: colors.gold + '66' }}
              thumbColor={settings.vibration ? colors.gold : colors.textMuted}
            />
          </View>

          {/* Calculation Method */}
          <View style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <Ionicons name="location-outline" size={20} color={colors.gold} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t('settingsCalculation')}</Text>
              <Text style={styles.settingDesc2}>{t('settingsCalcDesc')}</Text>
            </View>
            <View style={styles.valueRow}>
              <Text style={styles.valueText}>{settings.calculationMethod}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
          </View>
        </View>

        {Platform.OS === 'android' && <TouchableOpacity
          accessibilityRole="button" style={[styles.card, styles.settingRow]}
          onPress={() => Linking.openURL('https://play.google.com/store/apps/details?id=com.islamicibadet.app')
            .catch(() => Alert.alert(t('errorTitle'), t('retry')))}>
          <View style={styles.settingIcon}><Ionicons name="star-outline" size={20} color={colors.gold} /></View>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>{t('settingsRate')}</Text>
            <Text style={styles.settingDesc2}>{t('settingsRateDesc')}</Text>
          </View>
          <Ionicons name="open-outline" size={18} color={colors.textMuted} />
        </TouchableOpacity>}

        {/* About */}
        <Text style={styles.sectionTitle}>{t('settingsAbout')}</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={[styles.settingRow, styles.rowBorder]}
            onPress={handleReplayTutorial}
            activeOpacity={0.7}
          >
            <View style={styles.settingIcon}>
              <Ionicons name="play-circle-outline" size={20} color={colors.gold} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t('settingsTutorial')}</Text>
              <Text style={styles.settingDesc2}>{t('settingsTutorialDesc')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingRow, styles.rowBorder]}
            onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
            activeOpacity={0.7}
          >
            <View style={styles.settingIcon}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.gold} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t('settingsPrivacy')}</Text>
              <Text style={styles.settingDesc2}>{t('settingsPrivacyDesc')}</Text>
            </View>
            <Ionicons name="open-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <Ionicons name="information-circle-outline" size={20} color={colors.gold} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t('settingsVersion')}</Text>
              <Text style={styles.settingDesc2}>{t('appName')} v{APP_VERSION}</Text>
            </View>
          </View>
        </View>

        <View style={styles.appInfo}>
          <MaterialCommunityIcons name="mosque" size={32} color={colors.gold} style={{ opacity: 0.5 }} />
          <Text style={styles.appName}>{t('appName')}</Text>
          <Text style={styles.appVersion}>{t('settingsVersionValue', { version: APP_VERSION })}</Text>
          <Text style={styles.appCopyright}>{t('settingsCopyright')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
