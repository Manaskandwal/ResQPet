import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../themes';
import { spacing, borderRadius } from '../../themes/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlideProps {
  step: number;
  totalSteps: number;
  title: string;
  description: string;
  icon: string;
  onSkip: () => void;
  onNext: () => void;
  isLast?: boolean;
}

const OnboardingSlide: React.FC<OnboardingSlideProps> = ({
  step,
  totalSteps,
  title,
  description,
  icon,
  onSkip,
  onNext,
  isLast = false,
}) => {
  const colors = useColors();

  return (
    <View
      style={[
        styles.slide,
        { width: SCREEN_WIDTH, backgroundColor: colors.background.primary },
      ]}
    >
      {/* Header with Skip */}
      <View style={styles.header}>
        <View style={styles.progressDots}>
          {Array.from({ length: totalSteps }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === step
                      ? colors.primary
                      : colors.background.tertiary,
                  width: index === step ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>
        <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
          <Text style={[styles.skipText, { color: colors.text.secondary }]}>
            Skip
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Icon Container */}
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: `${colors.primary}15`,
              borderColor: `${colors.primary}30`,
            },
          ]}
        >
          <Text style={styles.iconEmoji}>{icon}</Text>
        </View>

        {/* Title */}
        <Text
          style={[
            styles.title,
            { color: colors.text.primary },
          ]}
        >
          {title}
        </Text>

        {/* Description */}
        <Text
          style={[
            styles.description,
            { color: colors.text.secondary },
          ]}
        >
          {description}
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {/* Step Counter */}
        <View style={styles.stepCounter}>
          <Text style={[styles.stepText, { color: colors.primary }]}>
            {step + 1}
          </Text>
          <Text style={[styles.stepDivider, { color: colors.text.muted }]}>
            /
          </Text>
          <Text style={[styles.stepTotal, { color: colors.text.muted }]}>
            {totalSteps}
          </Text>
        </View>

        {/* Next Button */}
        <TouchableOpacity
          onPress={onNext}
          style={[
            styles.nextButton,
            { backgroundColor: colors.primary },
          ]}
        >
          <Text
            style={[
              styles.nextText,
              { color: colors.background.primary },
            ]}
          >
            {isLast ? 'Get Started' : 'Continue'}
          </Text>
          <Ionicons
            name={isLast ? 'arrow-forward' : 'chevron-forward'}
            size={20}
            color={colors.background.primary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    paddingHorizontal: spacing[6],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing[12],
    paddingBottom: spacing[6],
  },
  progressDots: {
    flexDirection: 'row',
    gap: spacing[1.5],
  },
  dot: {
    height: 8,
    borderRadius: borderRadius.full,
  },
  skipButton: {
    padding: spacing[2],
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[4],
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[8],
    borderWidth: 2,
  },
  iconEmoji: {
    fontSize: 56,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: spacing[3],
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing[2],
  },
  footer: {
    paddingBottom: spacing[10],
    alignItems: 'center',
    gap: spacing[6],
  },
  stepCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  stepText: {
    fontSize: 18,
    fontWeight: '800',
  },
  stepDivider: {
    fontSize: 16,
    fontWeight: '600',
  },
  stepTotal: {
    fontSize: 14,
    fontWeight: '600',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[8],
    borderRadius: borderRadius['2xl'],
    width: '100%',
  },
  nextText: {
    fontSize: 16,
    fontWeight: '800',
  },
});

export default OnboardingSlide;
