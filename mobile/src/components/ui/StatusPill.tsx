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

interface StatusPillProps {
  status: string;
  size?: 'small' | 'medium';
  style?: ViewStyle;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  size = 'medium',
  style,
}) => {
  const colors = useColors();

  const getStatusConfig = () => {
    const statusLower = status.toLowerCase().replace(/_/g, ' ');

    // Completed/Success statuses
    if (
      ['completed', 'resolved', 'delivered', 'approved', 'active'].some((s) =>
        statusLower.includes(s)
      )
    ) {
      return {
        color: colors.success,
        bgColor: `${colors.success}20`,
        borderColor: `${colors.success}40`,
      };
    }

    // Pending/Warning statuses
    if (
      ['pending', 'broadcasted', 'pinged', 'fundraiser', 'on the way'].some(
        (s) => statusLower.includes(s)
      )
    ) {
      return {
        color: colors.warning,
        bgColor: `${colors.warning}20`,
        borderColor: `${colors.warning}40`,
      };
    }

    // Error/Cancelled statuses
    if (
      ['cancelled', 'unresolved', 'rejected', 'closed', 'failed'].some((s) =>
        statusLower.includes(s)
      )
    ) {
      return {
        color: colors.error,
        bgColor: `${colors.error}20`,
        borderColor: `${colors.error}40`,
      };
    }

    // Info/Processing statuses
    if (
      ['en route', 'picked up', 'assigned', 'accepted'].some((s) =>
        statusLower.includes(s)
      )
    ) {
      return {
        color: colors.info,
        bgColor: `${colors.info}20`,
        borderColor: `${colors.info}40`,
      };
    }

    // Default/Brand
    return {
      color: colors.primary,
      bgColor: `${colors.primary}20`,
      borderColor: `${colors.primary}40`,
    };
  };

  const config = getStatusConfig();

  const formatStatus = (status: string) => {
    return status
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
          paddingHorizontal: size === 'small' ? spacing[2.5] : spacing[3],
          paddingVertical: size === 'small' ? spacing[1] : spacing[1.5],
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: config.color,
            fontSize: size === 'small' ? 10 : 11,
          },
        ]}
      >
        {formatStatus(status)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  text: {
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default StatusPill;
