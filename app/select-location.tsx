import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, TextInput, ActivityIndicator, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useTranslation } from '../i18n';
import { SPACING, RADIUS, FONT_SIZE } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { usePrayerStore } from '../store/usePrayerStore';
import { TURKISH_CITIES, type CityCoords } from '../data/turkishCities';

export default function SelectLocationScreen() {
  const { t } = useTranslation();
  const { colors, fs } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors, fs), [colors, fs]);
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<'denied' | 'deniedForever' | 'servicesOff' | 'failed' | null>(null);
  const location = usePrayerStore(s => s.location);
  const locationSource = usePrayerStore(s => s.locationSource);
  const setManualLocation = usePrayerStore(s => s.setManualLocation);
  const switchToGps = usePrayerStore(s => s.useAutoLocation);

  const filtered = useMemo(() => {
    const q = search.toLocaleLowerCase('tr').trim();
    if (!q) return TURKISH_CITIES;
    return TURKISH_CITIES.filter(c => c.name.toLocaleLowerCase('tr').includes(q));
  }, [search]);

  const handleSelect = (city: CityCoords) => {
    setManualLocation(city.lat, city.lng, city.name).then(() => router.back());
  };

  const handleUseGps = async () => {
    setGpsLoading(true);
    setGpsError(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setGpsError(permission.canAskAgain === false ? 'deniedForever' : 'denied');
        return;
      }
      const servicesOn = await Location.hasServicesEnabledAsync().catch(() => true);
      if (!servicesOn) {
        try {
          // Shows the native "turn on device location" prompt; resolves once the user enables it.
          await Location.enableNetworkProviderAsync();
        } catch {
          setGpsError('servicesOff');
          return;
        }
      }
      await switchToGps();
      if (usePrayerStore.getState().locationError) {
        setGpsError('failed');
        return;
      }
      router.back();
    } finally {
      setGpsLoading(false);
    }
  };

  const renderCity = ({ item }: { item: CityCoords }) => {
    const active = locationSource === 'manual' && location?.city === item.name;
    return (
      <TouchableOpacity style={[styles.cityRow, active && styles.cityRowActive]} onPress={() => handleSelect(item)} activeOpacity={0.75}>
        <MaterialCommunityIcons name="city-variant-outline" size={20} color={active ? colors.gold : colors.textMuted} />
        <Text style={[styles.cityName, active && { color: colors.gold, fontWeight: '700' }]}>{item.name}</Text>
        {active && <Ionicons name="checkmark-circle" size={18} color={colors.gold} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('selectLocationTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.hint}>{t('selectLocationHint')}</Text>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.textMuted} style={{ marginRight: SPACING.xs }} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder={t('selectLocationSearch')}
          placeholderTextColor={colors.textMuted}
        />
        {search !== '' && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.gpsBtn} onPress={handleUseGps} activeOpacity={0.8} disabled={gpsLoading}>
        {gpsLoading ? <ActivityIndicator color={colors.gold} size="small" /> : <Ionicons name="locate" size={18} color={colors.gold} />}
        <Text style={styles.gpsBtnText}>{t('selectLocationUseGps')}</Text>
        {!gpsLoading && locationSource === 'auto' && <Ionicons name="checkmark-circle" size={16} color={colors.gold} />}
      </TouchableOpacity>

      {gpsError && (
        <View style={styles.gpsErrorBox}>
          <Ionicons name="warning-outline" size={16} color={colors.red} />
          <Text style={styles.gpsErrorText}>
            {t(
              gpsError === 'denied' ? 'selectLocationPermissionDenied'
                : gpsError === 'deniedForever' ? 'selectLocationPermissionDeniedForever'
                : gpsError === 'servicesOff' ? 'selectLocationServicesOff'
                : 'selectLocationGpsFailed'
            )}
          </Text>
          {gpsError === 'deniedForever' && Platform.OS === 'android' && (
            <TouchableOpacity onPress={() => Linking.openSettings()}>
              <Text style={styles.gpsErrorAction}>{t('selectLocationOpenSettings')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={c => c.name}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: SPACING.xl }}
        renderItem={renderCity}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="map-marker-question-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>{t('selectLocationEmpty')}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const makeStyles = (colors: any, fs: (n: number) => number) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: colors.textPrimary, fontSize: FONT_SIZE.lg, fontWeight: '700' },
  hint: { color: colors.textMuted, fontSize: FONT_SIZE.xs, paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: SPACING.md, marginBottom: SPACING.sm, backgroundColor: colors.cardBg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: SPACING.sm },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: FONT_SIZE.sm, paddingVertical: SPACING.sm },
  gpsBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginHorizontal: SPACING.md, marginBottom: SPACING.sm, backgroundColor: 'rgba(200,168,83,0.12)', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: 'rgba(200,168,83,0.25)', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2 },
  gpsBtnText: { color: colors.gold, fontSize: FONT_SIZE.sm, fontWeight: '600', flex: 1 },
  gpsErrorBox: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.xs, marginHorizontal: SPACING.md, marginBottom: SPACING.sm, backgroundColor: 'rgba(192,57,43,0.1)', borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(192,57,43,0.3)', padding: SPACING.sm },
  gpsErrorText: { color: colors.red, fontSize: FONT_SIZE.xs, flex: 1 },
  gpsErrorAction: { color: colors.red, fontSize: FONT_SIZE.xs, fontWeight: '700', textDecorationLine: 'underline' },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 4 },
  cityRowActive: { backgroundColor: 'rgba(200,168,83,0.08)' },
  cityName: { color: colors.textPrimary, fontSize: FONT_SIZE.sm, flex: 1 },
  divider: { height: 1, backgroundColor: colors.cardBorder, marginHorizontal: SPACING.md },
  empty: { alignItems: 'center', paddingVertical: SPACING.xl, gap: SPACING.sm },
  emptyText: { color: colors.textMuted, fontSize: FONT_SIZE.sm },
});
