import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useColors } from '../../themes';
import { spacing, borderRadius } from '../../themes/tokens';

interface TimelineProps {
  steps: {
    title: string;
    description?: string;
    status: 'completed' | 'active' | 'pending';
    timestamp?: string;
  }[];
  style?: ViewStyle;
}

export const Timeline: React.FC<TimelineProps> = ({ steps, style }) => {
  const colors = useColors();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'active':
        return colors.primary;
      default:
        return colors.text.muted;
    }
  };

  return (
    <View style={style}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const statusColor = getStatusColor(step.status);

        return (
          <View key={index} style={styles.step}>
            <View style={styles.leftColumn}>
              <View
                style={[
                  styles.node,
                  {
                    backgroundColor:
                      step.status === 'pending'
                        ? colors.background.tertiary
                        : statusColor,
                    borderColor:
                      step.status === 'pending'
                        ? colors.border.secondary
                        : statusColor,
                  },
                ]}
              >
                {step.status === 'completed' && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
                {step.status === 'active' && (
                  <View style={styles.pulse}>
                    <View
                      style={[
                        styles.pulseDot,
                        { backgroundColor: colors.background.primary },
                      ]}
                    />
                  </View>
                )}
              </View>
              {!isLast && (
                <View
                  style={[
                    styles.line,
                    {
                      backgroundColor:
                        step.status === 'completed'
                          ? colors.success
                          : colors.border.secondary,
                    },
                  ]}
                />
              )}
            </View>
            <View
              style={[
                styles.content,
                { opacity: step.status === 'pending' ? 0.6 : 1 },
              ]}
            >
              <Text
                style={[
                  styles.title,
                  { color: colors.text.primary },
                ]}
              >
                {step.title}
              </Text>
              {step.description && (
                <Text
                  style={[
                    styles.description,
                    { color: colors.text.secondary },
                  ]}
                >
                  {step.description}
                </Text>
              )}
              {step.timestamp && (
                <Text
                  style={[
                    styles.timestamp,
                    { color: colors.text.muted },
                  ]}
                >
                  {step.timestamp}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  step: {
    flexDirection: 'row',
    minHeight: 80,
  },
  leftColumn: {
    alignItems: 'center',
    width: 40,
  },
  node: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  pulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: -4,
    marginBottom: -4,
  },
  content: {
    flex: 1,
    paddingLeft: spacing[3],
    paddingBottom: spacing[5],
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    marginTop: spacing[1],
    lineHeight: 18,
  },
  timestamp: {
    fontSize: 11,
    marginTop: spacing[1.5],
    fontWeight: '600',
  },
});

export default Timeline;
