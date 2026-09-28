import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { usePrayerStore } from '../store/usePrayerStore';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../i18n';

export function LocationNotice() {
  const location = usePrayerStore(s => s.location);
  const loading = usePrayerStore(s => s.locationLoading);
  const refresh = usePrayerStore(s => s.refreshLocation);
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  if (location) return null;
  return <View accessibilityLiveRegion="polite" style={{ padding: 16, gap: 8, alignItems: 'center' }}>
    <Text style={{ color: colors.textPrimary, textAlign: 'center' }}>{t(loading ? 'homeLoading' : 'locationUnavailable')}</Text>
    {loading ? <ActivityIndicator color={colors.gold} /> : (
      <View style={{ flexDirection: 'row', gap: 20 }}>
        <TouchableOpacity accessibilityRole="button" onPress={() => refresh().catch(console.warn)} style={{ padding: 10 }}>
          <Text style={{ color: colors.gold }}>{t('retry')}</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" onPress={() => router.push('/select-location')} style={{ padding: 10 }}>
          <Text style={{ color: colors.gold, fontWeight: '700' }}>{t('locationChooseManually')}</Text>
        </TouchableOpacity>
      </View>
    )}
  </View>;
}
