import React, { useRef } from 'react';
import { Animated, Pressable } from 'react-native';

interface AnimatedPressProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
  containerStyle?: any;
  disabled?: boolean;
}

export function AnimatedPress({
  children,
  onPress,
  style,
  containerStyle,
  disabled,
}: AnimatedPressProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handleIn = () =>
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start();

  const handleOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      onPressIn={handleIn}
      onPressOut={handleOut}
      style={[{ opacity: disabled ? 0.45 : 1 }, containerStyle]}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
