import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useColors } from '../../themes';
import { spacing, borderRadius } from '../../themes/tokens';

interface BadgeProps {
  count?: number;
  variant?: 'default' | 'dot' | 'pulse';
  color?: 'primary' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium';
  maxCount?: number;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  count,
  variant = 'default',
  color = 'primary',
  size = 'medium',
  maxCount = 99,
  style,
}) => {
  const colors = useColors();

  const getColor = () => {
    switch (color) {
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'error':
        return colors.error;
      default:
        return colors.primary;
    }
  };

  const getSize = () => {
    switch (size) {
      case 'small':
        return { minWidth: 16, height: 16, fontSize: 10 };
      case 'medium':
        return { minWidth: 20, height: 20, fontSize: 11 };
      default:
        return { minWidth: 20, height: 20, fontSize: 11 };
    }
  };

  const sizeStyles = getSize();

  if (variant === 'dot') {
    return (
      <View
        style={[
          styles.dot,
          {
            backgroundColor: getColor(),
            width: sizeStyles.height * 0.6,
            height: sizeStyles.height * 0.6,
          },
          style,
        ]}
      />
    );
  }

  const displayCount = count && count > maxCount ? `${maxCount}+` : count;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: getColor(),
          minWidth: sizeStyles.minWidth,
          height: sizeStyles.height,
          borderRadius: sizeStyles.height / 2,
        },
        style,
      ]}
    >
      {count !== undefined && (
        <Text
          style={[
            styles.text,
            {
              color: colors.background.primary,
              fontSize: sizeStyles.fontSize,
            },
          ]}
        >
          {displayCount}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
    paddingHorizontal: 6,
  },
  dot: {
    borderRadius: 100,
  },
});

export default Badge;
