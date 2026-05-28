import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../themes';
import { spacing, borderRadius } from '../../themes/tokens';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'cube-outline',
  title,
  message,
  actionLabel,
  onAction,
  style,
}) => {
  const colors = useColors();

  return (
    <View
      style={[
        styles.container,
        style,
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: `${colors.background.tertiary}`,
            borderColor: colors.border.secondary,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={40}
          color={colors.text.muted}
        />
      </View>
      {title && (
        <Text
          style={[
            styles.title,
            { color: colors.text.primary },
          ]}
        >
          {title}
        </Text>
      )}
      <Text
        style={[
          styles.message,
          { color: colors.text.secondary },
        ]}
      >
        {message}
      </Text>
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          style={[
            styles.action,
            {
              backgroundColor: colors.primary,
              marginTop: spacing[6],
            },
          ]}
        >
          <Text
            style={[
              styles.actionText,
              { color: colors.background.primary },
            ]}
          >
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
    minHeight: 300,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
    borderWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  action: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    borderRadius: borderRadius.lg,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export default EmptyState;
