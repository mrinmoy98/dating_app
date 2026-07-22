import React, { useCallback, useRef } from "react";
import {
  Animated,
  GestureResponderEvent,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from "react-native";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps extends Omit<PressableProps, "style"> {
  style?: StyleProp<ViewStyle>;
  /** How far it shrinks while held. 1 = no scale. */
  scaleTo?: number;
  /** Dim while held, like Instagram's buttons. */
  dimTo?: number;
  /** Android ripple colour; pass null to disable. */
  ripple?: string | null;
  children?: React.ReactNode;
}

/**
 * Touch feedback that matches Instagram / Facebook: the target springs down a
 * few percent and dims the instant your finger lands, then springs back when it
 * lifts. Use it anywhere a plain Pressable felt "dead" to the touch.
 */
export default function PressableScale({
  style,
  scaleTo = 0.96,
  dimTo = 0.75,
  ripple = "rgba(0,0,0,0.08)",
  children,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const animate = useCallback(
    (pressed: boolean) => {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: pressed ? scaleTo : 1,
          useNativeDriver: true,
          speed: 40,
          bounciness: 4,
        }),
        Animated.timing(opacity, {
          toValue: pressed ? dimTo : 1,
          duration: pressed ? 60 : 120,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [scale, opacity, scaleTo, dimTo],
  );

  return (
    // One element, so the caller's flexDirection / gap / padding still apply.
    <AnimatedPressable
      {...rest}
      android_ripple={ripple ? { color: ripple, borderless: false } : undefined}
      onPressIn={(e: GestureResponderEvent) => {
        animate(true);
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        animate(false);
        onPressOut?.(e);
      }}
      style={[style, { transform: [{ scale }], opacity }]}
    >
      {children}
    </AnimatedPressable>
  );
}
