import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../i18n';

type Props = { enabled: boolean; onCheckComplete: (updateAvailable: boolean) => void };

export function AppUpdatePrompt({ enabled, onCheckComplete }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    if (__DEV__ || Platform.OS === 'web') { onCheckComplete(false); return; }
    let active = true;
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Update check timed out')), 8000));
    Promise.race([
      import('expo-in-app-updates').then(module => module.checkForUpdate()),
      timeout,
    ]).then(result => {
      if (!active) return;
      const available = result.updateAvailable === true;
      setVisible(available);
      onCheckComplete(available);
    }).catch(error => {
      console.warn('Store update check failed', error);
      if (active) onCheckComplete(false);
    });
    return () => { active = false; };
  }, [enabled, onCheckComplete]);

  const startUpdate = async () => {
    setUpdating(true);
    try {
      const updates = await import('expo-in-app-updates');
      const started = await updates.startUpdate();
      if (!started) throw new Error('Store did not start the update flow');
      setVisible(false);
    } catch (error) {
      console.warn('Store update could not be started', error);
      Alert.alert(t('errorTitle'), t('updatePromptError'));
    } finally {
      setUpdating(false);
    }
  };

  return <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
    <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <View style={[styles.icon, { backgroundColor: colors.goldGlow }]}><Ionicons name="cloud-download-outline" size={36} color={colors.gold} /></View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('updatePromptTitle')}</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>{t('updatePromptDesc')}</Text>
        <TouchableOpacity disabled={updating} style={[styles.primary, { backgroundColor: colors.gold, opacity: updating ? 0.7 : 1 }]} onPress={() => void startUpdate()}>
          {updating ? <ActivityIndicator color={colors.textInverse} /> : <Ionicons name="download-outline" size={19} color={colors.textInverse} />}
          <Text style={[styles.primaryText, { color: colors.textInverse }]}>{t('updatePromptAction')}</Text>
        </TouchableOpacity>
        <TouchableOpacity disabled={updating} style={styles.later} onPress={() => setVisible(false)}><Text style={[styles.laterText, { color: colors.textSecondary }]}>{t('updatePromptLater')}</Text></TouchableOpacity>
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
  primaryText: { fontSize: 15, fontWeight: '800' }, later: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 2 }, laterText: { fontSize: 14, fontWeight: '600' },
});
