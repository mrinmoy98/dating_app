import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';

interface ActionButtonProps {
  icon: React.ReactNode;
  color: string;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  onPress: () => void;
}

export default function ActionButton({
  icon,
  color,
  size = 'large',
  style,
  onPress,
}: ActionButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.9);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const sizeStyles = {
    small: {
      width: 44,
      height: 44,
    },
    medium: {
      width: 56,
      height: 56,
    },
    large: {
      width: 64,
      height: 64,
    },
  };

  return (
    <Animated.View style={[animatedStyle, { backgroundColor: color, borderRadius: 50 }, sizeStyles[size], styles.button, style]}>
      <Pressable
        style={styles.buttonContent}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {icon}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});