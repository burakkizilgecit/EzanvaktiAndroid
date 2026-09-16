"use no memo";
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetData } from './widgetTaskHandler';

// "Green" theme — deep emerald card with gold border/frame, inspired by the dome mockup
const BG        : any = '#11453F';
const BORDER    : any = '#D9B36E';
const GOLD      : any = '#D9B36E';
const TEXT      : any = '#E4F0EC';
const TEXT_DIM  : any = '#8FB6AE';
const DIVIDER   : any = 'rgba(255,255,255,0.08)';
const PILL_TEXT : any = '#241A06';

export function PrayerWidgetLight({ times, activeIndex, dateStr, dayStr, city }: WidgetData) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        backgroundColor: BG,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: BORDER,
        padding: 14,
      }}
    >
      {/* Header */}
      <FlexWidget style={{ flexDirection: 'column', alignItems: 'center', marginBottom: 6 }}>
        <TextWidget text="🌙✨" style={{ fontSize: 14, color: GOLD, marginBottom: 2 }} />
        <TextWidget text="Ezan Vakitleri" style={{ fontSize: 16, fontWeight: 'bold', color: TEXT }} />
        <TextWidget text={`${dateStr}  |  ${dayStr}`} style={{ fontSize: 10, color: TEXT_DIM, marginTop: 2 }} />
      </FlexWidget>

      {/* Prayer list */}
      <FlexWidget style={{ flexDirection: 'column', flex: 1 }}>
        {times.map((p, i) => {
          const isActive = i === activeIndex;
          const nextActive = i + 1 === activeIndex;
          const isLast = i === times.length - 1;
          const showDivider = !isLast && !isActive && !nextActive;
          return (
            <FlexWidget key={p.key} style={{ flexDirection: 'column' }}>
              <FlexWidget
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
              {showDivider && (
                <FlexWidget style={{ height: 1, backgroundColor: DIVIDER, marginVertical: 1 }} />
              )}
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
