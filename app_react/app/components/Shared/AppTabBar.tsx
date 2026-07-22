import Colors from "@/data/Colors";
import { AntDesign, Entypo, Feather, Octicons } from "@expo/vector-icons";
import type { MaterialTopTabBarProps } from "@react-navigation/material-top-tabs";
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ACTIVE = Colors.RASPBERRY_SIPS;
const INACTIVE = "#9aa0ac";

const ICONS: Record<string, (color: string, size: number) => React.ReactNode> = {
  Discover: (c, s) => <Octicons name="flame" size={s} color={c} />,
  Reels: (c, s) => <Feather name="film" size={s} color={c} />,
  Matches: (c, s) => <Entypo name="heart-outlined" size={s} color={c} />,
  Messages: (c, s) => <Feather name="message-circle" size={s} color={c} />,
  Profile: (c, s) => <AntDesign name="user" size={s} color={c} />,
};

/** One tab: icon springs on press and pops when it becomes active. */
function TabButton({
  name,
  focused,
  onPress,
  onLongPress,
}: {
  name: string;
  focused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const scale = useRef(new Animated.Value(focused ? 1 : 0.92)).current;

  // Selecting a tab pops the icon.
  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1 : 0.92,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  }, [focused, scale]);

  const press = (pressed: boolean) =>
    Animated.spring(scale, {
      toValue: pressed ? 0.84 : focused ? 1 : 0.92,
      useNativeDriver: true,
      speed: 45,
      bounciness: 6,
    }).start();

  return (
    <Pressable
      style={styles.tab}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => press(true)}
      onPressOut={() => press(false)}
      android_ripple={{ color: "rgba(0,0,0,0.06)", borderless: true, radius: 34 }}
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={name}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {ICONS[name]?.(focused ? ACTIVE : INACTIVE, 24)}
      </Animated.View>
      <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
        {name}
      </Text>
    </Pressable>
  );
}

/**
 * Bottom bar for the swipeable tab navigator. Swiping between screens drives
 * the same `state.index`, so the active icon animates whether you tap or slide.
 */
export default function AppTabBar({ state, navigation }: MaterialTopTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        return (
          <TabButton
            key={route.key}
            name={route.name}
            focused={focused}
            onPress={() => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            onLongPress={() =>
              navigation.emit({ type: "tabLongPress", target: route.key })
            }
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e6e6ea",
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3 },
  label: { fontSize: 10.5, color: INACTIVE, fontWeight: "600" },
  labelActive: { color: ACTIVE, fontWeight: "700" },
});
