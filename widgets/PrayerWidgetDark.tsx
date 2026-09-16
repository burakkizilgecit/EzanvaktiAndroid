"use no memo";
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetData } from './widgetTaskHandler';

// "Blue" theme — deep navy card with gold accents, inspired by the lantern mockup
const BG        : any = '#0C1524';
const GOLD      : any = '#D9B36E';
const TEXT      : any = '#C9CFE0';
const TEXT_DIM  : any = '#74809B';
const PILL_TEXT : any = '#241A06';

export function PrayerWidgetDark({ times, activeIndex, dateStr, dayStr, city }: WidgetData) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        backgroundColor: BG,
        borderRadius: 22,
        padding: 14,
      }}
    >
      {/* Header */}
      <TextWidget text="Ezan Vakitleri" style={{ fontSize: 17, fontWeight: 'bold', color: GOLD, marginBottom: 2 }} />
      <TextWidget text={`${dateStr}  |  ${dayStr}`} style={{ fontSize: 11, color: TEXT_DIM, marginBottom: 8 }} />

      {/* Prayer list */}
      <FlexWidget style={{ flexDirection: 'column', flex: 1 }}>
        {times.map((p, i) => {
          const isActive = i === activeIndex;
          return (
            <FlexWidget
              key={p.key}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: isActive ? GOLD : 'transparent',
                borderRadius: isActive ? 14 : 0,
                paddingHorizontal: 8,
                paddingVertical: isActive ? 9 : 5,
                marginTop: isActive ? 4 : 0,
                marginBottom: isActive ? 2 : 0,
              }}
            >
              <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextWidget text={p.emoji} style={{ fontSize: isActive ? 16 : 13, marginRight: 8 }} />
                <TextWidget
                  text={p.label}
                  style={{
                    fontSize: isActive ? 15 : 13,
                    color: isActive ? PILL_TEXT : TEXT,
                    fontWeight: isActive ? 'bold' : 'normal',
                  }}
                />
              </FlexWidget>
              <TextWidget
                text={p.time}
                style={{
                  fontSize: isActive ? 16 : 13,
                  color: isActive ? PILL_TEXT : TEXT,
                  fontWeight: isActive ? 'bold' : 'normal',
                }}
              />
            </FlexWidget>
          );
        })}
      </FlexWidget>

      {/* Footer */}
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 6 }}>
        <TextWidget text="📍 " style={{ fontSize: 10, color: TEXT_DIM }} />
        <TextWidget text={city} style={{ fontSize: 10, color: TEXT_DIM }} />
      </FlexWidget>
    </FlexWidget>
  );
}
