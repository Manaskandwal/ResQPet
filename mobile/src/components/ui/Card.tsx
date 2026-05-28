import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useColors } from '../../themes';
import { spacing, borderRadius } from '../../themes/tokens';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'elevated' | 'outlined';
  style?: ViewStyle;
  padding?: keyof typeof spacing;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  style,
  padding = 4,
}) => {
  const colors = useColors();

  const getVariantStyles = () => {
    switch (variant) {
      case 'glass':
        return {
          backgroundColor: `${colors.background.tertiary}80`,
          borderColor: `${colors.border.secondary}60`,
          borderWidth: 1,
        };
      case 'elevated':
        return {
          backgroundColor: colors.background.elevated,
          borderColor: colors.border.secondary,
          borderWidth: 1,
          elevation: 4,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.border.secondary,
          borderWidth: 1.5,
        };
      default:
        return {
          backgroundColor: colors.background.secondary,
          borderColor: colors.border.secondary,
          borderWidth: 1,
        };
    }
  };

  return (
    <View
      style={[
        styles.card,
        getVariantStyles(),
        { padding: spacing[padding] },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
});

export default Card;
