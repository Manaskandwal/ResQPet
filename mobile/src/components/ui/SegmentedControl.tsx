import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useColors } from '../../themes';
import { spacing, borderRadius } from '../../themes/tokens';

interface Segment {
  key: string;
  label: string;
  badge?: number;
}

interface SegmentedControlProps {
  segments: Segment[];
  activeSegment: string;
  onChange: (key: string) => void;
  variant?: 'default' | 'pills';
  scrollable?: boolean;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  segments,
  activeSegment,
  onChange,
  variant = 'default',
  scrollable = false,
}) => {
  const colors = useColors();

  const renderSegment = (segment: Segment) => {
    const isActive = activeSegment === segment.key;

    return (
      <TouchableOpacity
        key={segment.key}
        onPress={() => onChange(segment.key)}
        style={[
          styles.segment,
          variant === 'pills' && styles.pillSegment,
          {
            backgroundColor:
              variant === 'default'
                ? isActive
                  ? colors.primary
                  : 'transparent'
                : isActive
                ? colors.primary
                : colors.background.tertiary,
          },
        ]}
      >
        <Text
          style={[
            styles.label,
            {
              color:
                isActive || variant === 'pills'
                  ? colors.background.primary
                  : colors.text.secondary,
            },
          ]}
        >
          {segment.label}
        </Text>
        {segment.badge && segment.badge > 0 && (
          <View
            style={[
              styles.badge,
              {
                backgroundColor:
                  isActive ? colors.background.primary : colors.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                {
                  color:
                    isActive ? colors.primary : colors.background.primary,
                },
              ]}
            >
              {segment.badge}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {segments.map(renderSegment)}
      </ScrollView>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background.tertiary },
      ]}
    >
      {segments.map(renderSegment)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    padding: 4,
    gap: 4,
  },
  scrollContainer: {
    flexDirection: 'row',
    gap: spacing[2],
    paddingVertical: spacing[1],
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2.5],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.md,
    gap: spacing[1.5],
  },
  pillSegment: {
    borderRadius: borderRadius.full,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
});

export default SegmentedControl;
