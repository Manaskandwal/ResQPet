import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  Animated,
} from 'react-native';
import { useColors } from '../../themes';
import { spacing, borderRadius } from '../../themes/tokens';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  variant?: 'text' | 'rect' | 'circle';
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  variant = 'rect',
  style,
}) => {
  const colors = useColors();
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  const getBorderRadius = () => {
    switch (variant) {
      case 'text':
        return borderRadius.sm;
      case 'circle':
        return borderRadius.full;
      default:
        return borderRadius.md;
    }
  };

  const getHeight = () => {
    if (variant === 'circle' && typeof width === 'number') {
      return width;
    }
    return height;
  };

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: variant === 'circle' ? (getHeight() as any) : width,
          height: getHeight(),
          borderRadius: getBorderRadius(),
          backgroundColor: colors.background.tertiary,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
};

interface SkeletonCardProps {
  lines?: number;
  hasImage?: boolean;
  imageHeight?: number;
  style?: ViewStyle;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  lines = 3,
  hasImage = false,
  imageHeight = 160,
  style,
}) => {
  const colors = useColors();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.background.secondary,
          borderColor: colors.border.secondary,
        },
        style,
      ]}
    >
      {hasImage && (
        <Skeleton
          height={imageHeight}
          variant="rect"
          style={{ marginBottom: spacing[3] }}
        />
      )}
      <Skeleton
        width="70%"
        height={20}
        style={{ marginBottom: spacing[2] }}
      />
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? '60%' : '100%'}
          height={14}
          style={{ marginBottom: spacing[2] }}
        />
      ))}
    </View>
  );
};

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...',
}) => {
  const colors = useColors();

  return (
    <View
      style={[
        styles.loadingScreen,
        { backgroundColor: colors.background.primary },
      ]}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      <Text
        style={[styles.loadingText, { color: colors.text.secondary }]}
      >
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  card: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing[4],
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing[4],
    fontSize: 14,
    fontWeight: '600',
  },
});

export default Skeleton;
