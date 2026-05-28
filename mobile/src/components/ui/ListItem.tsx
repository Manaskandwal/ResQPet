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

interface ListItemProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBgColor?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'card';
  style?: ViewStyle;
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  icon,
  iconColor,
  iconBgColor,
  rightElement,
  onPress,
  disabled = false,
  variant = 'default',
  style,
}) => {
  const colors = useColors();

  const Content = (
    <View
      style={[
        styles.container,
        variant === 'card' && {
          backgroundColor: colors.background.secondary,
          borderColor: colors.border.secondary,
          borderWidth: 1,
          borderRadius: borderRadius.lg,
          padding: spacing[4],
        },
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon && (
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: iconBgColor || `${colors.primary}15`,
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={22}
            color={iconColor || colors.primary}
          />
        </View>
      )}
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            { color: colors.text.primary },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[
              styles.subtitle,
              { color: colors.text.secondary },
            ]}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement || (onPress && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.text.muted}
        />
      ))}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {Content}
      </TouchableOpacity>
    );
  }

  return Content;
};

interface SectionHeaderProps {
  title: string;
  action?: { label: string; onPress: () => void };
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  action,
}) => {
  const colors = useColors();

  return (
    <View style={styles.headerContainer}>
      <Text
        style={[
          styles.headerTitle,
          { color: colors.text.secondary },
        ]}
      >
        {title}
      </Text>
      {action && (
        <TouchableOpacity onPress={action.onPress}>
          <Text
            style={[
              styles.headerAction,
              { color: colors.primary },
            ]}
          >
            {action.label}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: spacing[0.5],
  },
  disabled: {
    opacity: 0.5,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerAction: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default ListItem;
