import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Animated, BackHandler, StyleSheet, View, ViewStyle } from 'react-native';

export type NavigationParams = any;

interface NavigationContextType {
  currentScreen: string;
  history: string[];
  params: NavigationParams;
  navigate: (screen: string, params?: NavigationParams) => void;
  push: (screen: string, params?: NavigationParams) => void;
  goBack: () => boolean;
  reset: (screen: string, params?: NavigationParams) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode; initialScreen: string }> = ({
  children,
  initialScreen,
}) => {
  const [currentScreen, setCurrentScreen] = useState<string>(initialScreen);
  const [history, setHistory] = useState<string[]>([initialScreen]);
  const [params, setParams] = useState<NavigationParams>({});

  const navigate = (screen: string, screenParams?: NavigationParams) => {
    setParams(screenParams || {});
    setCurrentScreen(screen);
    setHistory([screen]); // Reset history stack for tab changes
  };

  const push = (screen: string, screenParams?: NavigationParams) => {
    setParams(screenParams || {});
    setHistory((prev) => [...prev, screen]);
    setCurrentScreen(screen);
  };

  const goBack = (): boolean => {
    if (history.length <= 1) {
      return false; // Can't go back further
    }
    const newHistory = [...history];
    newHistory.pop(); // Remove current screen
    const prevScreen = newHistory[newHistory.length - 1];
    setHistory(newHistory);
    setCurrentScreen(prevScreen);
    setParams({}); // Optionally reset params
    return true;
  };

  const reset = (screen: string, screenParams?: NavigationParams) => {
    setParams(screenParams || {});
    setCurrentScreen(screen);
    setHistory([screen]);
  };

  // Handle hardware back button on Android
  useEffect(() => {
    const handleBackButton = () => {
      return goBack(); // Return true if we handled it, false to exit app
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackButton);
    return () => {
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      } else {
        (BackHandler as any).removeEventListener('hardwareBackPress', handleBackButton);
      }
    };
  }, [history]);

  return (
    <NavigationContext.Provider value={{ currentScreen, history, params, navigate, push, goBack, reset }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

interface ScreenRoute {
  name: string;
  component: React.ComponentType<any>;
}

interface AnimatedStackNavigatorProps {
  routes: ScreenRoute[];
  style?: ViewStyle;
}

export const AnimatedStackNavigator: React.FC<AnimatedStackNavigatorProps> = ({ routes, style }) => {
  const { currentScreen } = useNavigation();
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reset to right side, then slide left to center (premium iOS slide transition)
    slideAnim.setValue(1);
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [currentScreen]);

  const activeRoute = routes.find((r) => r.name === currentScreen);
  if (!activeRoute) {
    console.warn(`Screen "${currentScreen}" not found in routes.`);
    return null;
  }

  const ActiveComponent = activeRoute.component;

  const animatedStyle = {
    transform: [
      {
        translateX: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 300], // Translate 300px from right to left
        }),
      },
    ],
    opacity: slideAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.5], // Subtle fade alongside slide
    }),
  };

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[styles.screenContainer, animatedStyle]}>
        <ActiveComponent />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  screenContainer: {
    flex: 1,
  },
});
