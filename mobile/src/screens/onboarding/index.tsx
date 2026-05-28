import React, { useState, useRef } from 'react';
import {
  View,
  FlatList,
  Animated,
  Dimensions,
} from 'react-native';
import { useColors } from '../../themes';
import OnboardingSlide from './OnboardingSlide';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
  onSkip: () => void;
}

const onboardingData = [
  {
    title: 'Welcome to VetsCue',
    description:
      'Join a compassionate community dedicated to rescuing and caring for animals in need. Together, we can make a difference.',
    icon: '🐾',
  },
  {
    title: 'Report & Connect',
    description:
      'Spot an animal in distress? Report it instantly with location and photos. We will connect you with nearby NGOs and volunteers.',
    icon: '📱',
  },
  {
    title: 'Track & Support',
    description:
      'Follow rescue progress in real-time. Support fundraisers, donate to cases, and be part of the solution.',
    icon: '💚',
  },
  {
    title: 'Join the Movement',
    description:
      'Whether you are a citizen, NGO, hospital, or ambulance partner - there is a role for you in saving lives.',
    icon: '🤝',
  },
];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onComplete,
  onSkip,
}) => {
  const colors = useColors();
  const [currentStep, setCurrentStep] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentStep < onboardingData.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentStep + 1,
        animated: true,
      });
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const slideIndex = Math.round(
          event.nativeEvent.contentOffset.x / SCREEN_WIDTH
        );
        setCurrentStep(slideIndex);
      },
    }
  );

  const renderItem = ({
    item,
    index,
  }: {
    item: (typeof onboardingData)[0];
    index: number;
  }) => (
    <OnboardingSlide
      step={index}
      totalSteps={onboardingData.length}
      title={item.title}
      description={item.description}
      icon={item.icon}
      onSkip={handleSkip}
      onNext={handleNext}
      isLast={index === onboardingData.length - 1}
    />
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background.primary,
      }}
    >
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        scrollEnabled={true}
      />
    </View>
  );
};

export default OnboardingScreen;
