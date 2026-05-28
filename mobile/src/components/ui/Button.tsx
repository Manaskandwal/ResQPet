import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { useColors } from '../../themes';
import { spacing, borderRadius, typography } from '../../themes/tokens';
import { AnimatedPress } from '../AnimatedPress';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outlined' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}) => {
  const colors = useColors();

  const getVariantStyles = (): { button: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'secondary':
        return {
          button: {
            backgroundColor: `${colors.text.secondary}20`,
            borderColor: `${colors.border.secondary}40`,
            borderWidth: 1,
          },
          text: { color: colors.text.primary },
        };
      case 'outlined':
        return {
          button: {
            backgroundColor: 'transparent',
            borderColor: colors.primary,
            borderWidth: 1.5,
          },
          text: { color: colors.primary },
        };
      case 'danger':
        return {
          button: {
            backgroundColor: `${colors.error}15`,
            borderColor: `${colors.error}40`,
            borderWidth: 1,
          },
          text: { color: colors.error },
        };
      case 'ghost':
        return {
          button: {
            backgroundColor: 'transparent',
          },
          text: { color: colors.primary },
        };
      default: // primary
        return {
          button: {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
            elevation: 4,
          },
          text: { color: colors.background.primary },
        };
    }
  };

  const getSizeStyles = (): { button: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'small':
        return {
          button: {
            paddingVertical: spacing[2],
            paddingHorizontal: spacing[4],
            borderRadius: borderRadius.md,
          },
          text: {
            fontSize: typography.sizes.sm,
          },
        };
      case 'large':
        return {
          button: {
            paddingVertical: spacing[4],
            paddingHorizontal: spacing[8],
            borderRadius: borderRadius.xl,
          },
          text: {
            fontSize: typography.sizes.lg,
          },
        };
      default: // medium
        return {
          button: {
            paddingVertical: spacing[3],
            paddingHorizontal: spacing[6],
            borderRadius: borderRadius.lg,
          },
          text: {
            fontSize: typography.sizes.base,
          },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <AnimatedPress
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        variantStyles.button,
        sizeStyles.button,
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === 'primary'
              ? colors.background.primary
              : variant === 'danger'
              ? colors.error
              : colors.primary
          }
        />
      ) : (
        <>
          {icon && <React.Fragment>{icon}</React.Fragment>}
          <Text
            style={[
              styles.text,
              variantStyles.text,
              sizeStyles.text,
              textStyle,
            ]}
          >
            {children}
          </Text>
        </>
      )}
    </AnimatedPress>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  text: {
    fontFamily: typography.fontFamily.bold,
    textAlign: 'center',
  },
});

export default Button;
