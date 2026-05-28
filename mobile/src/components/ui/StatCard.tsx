import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../themes';
import { spacing, borderRadius } from '../../themes/tokens';

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  trend?: { value: number; positive: boolean };
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export const StatCard: React.FC<StatCardProps> = ({
  value,
  label,
  icon = 'stats-chart',
  iconColor,
  trend,
  size = 'medium',
  style,
}) => {
  const colors = useColors();

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { padding: spacing[3], iconSize: 16, valueSize: 20, labelSize: 11 };
      case 'medium':
        return { padding: spacing[4], iconSize: 20, valueSize: 28, labelSize: 12 };
      case 'large':
        return { padding: spacing[5], iconSize: 24, valueSize: 36, labelSize: 13 };
      default:
        return { padding: spacing[4], iconSize: 20, valueSize: 28, labelSize: 12 };
    }
  };

  const sizeStyles = getSizeStyles();
  const iconBgColor = iconColor ? `${iconColor}15` : `${colors.primary}15`;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background.secondary,
          borderColor: colors.border.secondary,
          padding: sizeStyles.padding,
        },
        style,
      ]}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: iconBgColor },
          ]}
        >
          <Ionicons
            name={icon}
            size={sizeStyles.iconSize}
            color={iconColor || colors.primary}
          />
        </View>
        {trend && (
          <View style={styles.trend}>
            <Ionicons
              name={trend.positive ? 'trending-up' : 'trending-down'}
              size={14}
              color={trend.positive ? colors.success : colors.error}
            />
            <Text
              style={[
                styles.trendText,
                {
                  color: trend.positive ? colors.success : colors.error,
                },
              ]}
            >
              {trend.value}%
            </Text>
          </View>
        )}
      </View>
      <Text
        style={[
          styles.value,
          {
            color: colors.text.primary,
            fontSize: sizeStyles.valueSize,
            marginTop: spacing[2],
          },
        ]}
      >
        {value}
      </Text>
      <Text
        style={[
          styles.label,
          {
            color: colors.text.secondary,
            fontSize: sizeStyles.labelSize,
            marginTop: spacing[1],
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

interface ProgressCardProps {
  title: string;
  current: number;
  total: number;
  unit?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  title,
  current,
  total,
  unit = '',
  icon = 'flag',
  style,
}) => {
  const colors = useColors();
  const percentage = Math.min((current / total) * 100, 100);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background.secondary,
          borderColor: colors.border.secondary,
          padding: spacing[4],
        },
        style,
      ]}
    >
      <View style={styles.progressHeader}>
        <View style={styles.progressIconContainer}>
          <Ionicons
            name={icon}
            size={20}
            color={colors.primary}
          />
        </View>
        <Text
          style={[
            styles.progressTitle,
            { color: colors.text.primary },
          ]}
        >
          {title}
        </Text>
      </View>
      <View style={styles.progressInfo}>
        <Text
          style={[
            styles.progressValue,
            { color: colors.primary },
          ]}
        >
          {current.toLocaleString()}{unit}
        </Text>
        <Text
          style={[
            styles.progressTotal,
            { color: colors.text.secondary },
          ]}
        >
          of {total.toLocaleString()}{unit}
        </Text>
      </View>
      <View
        style={[
          styles.progressBar,
          { backgroundColor: colors.background.tertiary },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: colors.primary,
              width: `${percentage}%`,
            },
          ]}
        />
      </View>
      <Text
        style={[
          styles.progressPercentage,
          { color: colors.text.secondary },
        ]}
      >
        {percentage.toFixed(0)}% complete
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  trendText: {
    fontSize: 12,
    fontWeight: '700',
  },
  value: {
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  label: {
    fontWeight: '600',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  progressIconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(118,214,213,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  progressValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  progressTotal: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  progressPercentage: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: spacing[2],
    textAlign: 'right',
  },
});

export default StatCard;
