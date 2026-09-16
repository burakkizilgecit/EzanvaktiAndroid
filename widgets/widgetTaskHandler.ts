"use no memo";
import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrayerWidgetDark } from './PrayerWidgetDark';
import { PrayerWidgetLight } from './PrayerWidgetLight';
import { calculatePrayerTimes, formatPrayerTime } from '../services/prayerService';

export interface WidgetData {
  times: { key: string; label: string; time: string; emoji: string }[];
  activeIndex: number;
  dateStr: string;
  dayStr: string;
  city: string;
}

const PRAYER_META = [
  { key: 'fajr',    label: 'İmsak',   emoji: '🌙' },
  { key: 'sunrise', label: 'Güneş',   emoji: '🌅' },
  { key: 'dhuhr',   label: 'Öğle',    emoji: '☀' },
  { key: 'asr',     label: 'İkindi',  emoji: '🌤' },
  { key: 'maghrib', label: 'Akşam',   emoji: '🌆' },
  { key: 'isha',    label: 'Yatsı',   emoji: '🌙' },
] as const;

const TR_MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const TR_DAYS   = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];

async function getWidgetData(): Promise<WidgetData> {
  try {
    const raw = await AsyncStorage.getItem('user_location');
    const loc = raw ? JSON.parse(raw) : null;
    if (!loc) throw new Error('Location unavailable');
    const now = new Date();
    const prayerTimes = calculatePrayerTimes(loc.lat, loc.lng, now);

    const times = PRAYER_META.map(m => ({
      key:   m.key,
      label: m.label,
      emoji: m.emoji,
      time:  formatPrayerTime((prayerTimes as any)[m.key]),
    }));

    // Active = last prayer whose time has passed (i.e. current prayer window)
    const nowMs = now.getTime();
    let activeIndex = 0;
    for (let i = 0; i < PRAYER_META.length; i++) {
      if ((prayerTimes as any)[PRAYER_META[i].key].getTime() <= nowMs) {
        activeIndex = i;
      }
    }

    const dateStr = `${now.getDate()} ${TR_MONTHS[now.getMonth()]} ${now.getFullYear()}`;
    const dayStr  = TR_DAYS[now.getDay()];

    return { times, activeIndex, dateStr, dayStr, city: loc.city ?? 'İstanbul' };
  } catch {
    const now = new Date();
    return {
      times: PRAYER_META.map(m => ({ key: m.key, label: m.label, emoji: m.emoji, time: '--:--' })),
      activeIndex: -1,
      dateStr: `${now.getDate()} ${TR_MONTHS[now.getMonth()]} ${now.getFullYear()}`,
      dayStr: TR_DAYS[now.getDay()],
      city: 'Konum bilgisi bulunamamaktadır',
    };
  }
}

export async function renderWidgetForUpdate() {
  const data = await getWidgetData();
  return {
    dark:  React.createElement(PrayerWidgetDark,  data),
    light: React.createElement(PrayerWidgetLight, data),
  };
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const data = await getWidgetData();
      props.renderWidget({
        dark:  React.createElement(PrayerWidgetDark,  data),
        light: React.createElement(PrayerWidgetLight, data),
      });
      break;
    }
    default:
      break;
  }
}
