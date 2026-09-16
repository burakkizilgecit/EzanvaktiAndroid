import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { HOME_COLORS } from "../constants/homeTheme";
import { useTranslation } from "../i18n";

const TABS = [
  { route: "index", label: "tabHome", icon: "home-outline" },
  { route: "prayer-times", label: "tabPrayer", icon: "time-outline" },
  { route: "qibla", label: "tabQibla", icon: "compass-outline" },
  { route: "dhikr", label: "tabDhikr", icon: "circle-outline" },
  { route: "mosques", label: "tabMosques", icon: "mosque" },
  { route: "more", label: "tabMenu", icon: "menu-outline" },
] as const;
export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { isDark, fs } = useTheme();
  const colors = isDark ? HOME_COLORS.dark : HOME_COLORS.light;
  const { t, language } = useTranslation();
  const insets = useSafeAreaInsets();
  const focused = state.routes[state.index].name;
  return (
    <View
      style={[
        styles.bar,
        {
          flexDirection: language === "ar" ? "row-reverse" : "row",
          backgroundColor: colors.tabBar,
          borderColor: colors.cardBorder,
          paddingBottom: Math.max(8, insets.bottom),
        },
      ]}
    >
      {TABS.map((tab) => {
        const route = state.routes.find((r) => r.name === tab.route);
        if (!route) return null;
        const active =
          focused === tab.route ||
          (tab.route === "more" && ["duas"].includes(focused));
        const color = active ? colors.gold : colors.tabInactive;
        return (
          <TouchableOpacity
            key={tab.route}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={t(tab.label)}
            style={styles.tab}
            onLongPress={() =>
              navigation.emit({ type: "tabLongPress", target: route.key })
            }
            onPress={() => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (focused !== tab.route && !event.defaultPrevented)
                navigation.navigate(route.name);
            }}
          >
            <View
              style={[
                styles.icon,
                active && { backgroundColor: colors.goldGlow },
              ]}
            >
              {(tab.route === "dhikr" || tab.route === "mosques") ? (
                <MaterialCommunityIcons
                  name={tab.route === "mosques" ? "mosque" : "circle-outline"}
                  size={24}
                  color={color}
                />
              ) : (
                <Ionicons
                  name={tab.icon as keyof typeof Ionicons.glyphMap}
                  size={24}
                  color={color}
                />
              )}
            </View>
            <Text style={{ fontSize: fs(10), color, textAlign: "center" }}>
              {t(tab.label)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  bar: { borderTopWidth: 1, paddingTop: 6 },
  tab: {
    flex: 1,
    minHeight: 54,
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 2,
  },
  icon: {
    width: 44,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
