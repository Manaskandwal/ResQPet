import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  RefreshControl,
  ViewStyle,
} from 'react-native';
import { useColors } from '../themes';
import { spacing } from '../themes/tokens';

interface ScreenProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  scrollable?: boolean;
  refreshControl?: React.ReactElement<any>;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  safeArea?: boolean;
  statusBarStyle?: 'light' | 'dark';
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  title,
  subtitle,
  scrollable = true,
  refreshControl,
  style,
  contentContainerStyle,
  safeArea = true,
  statusBarStyle,
}) => {
  const colors = useColors();
  const barStyle = statusBarStyle || (colors.name === 'dark' ? 'light' : 'dark');

  const Content = scrollable ? (
    <ScrollView
      style={[styles.scrollView, style]}
      contentContainerStyle={[
        styles.content,
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
    >
      {(title || subtitle) && (
        <View style={styles.header}>
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
          {subtitle && (
            <Text
              style={[
                styles.subtitle,
                { color: colors.text.secondary },
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>
      )}
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background.primary },
        style,
      ]}
    >
      {(title || subtitle) && (
        <View style={styles.header}>
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
          {subtitle && (
            <Text
              style={[
                styles.subtitle,
                { color: colors.text.secondary },
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>
      )}
      {children}
    </View>
  );

  if (safeArea) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor: colors.background.primary },
        ]}
      >
        <StatusBar
          barStyle={barStyle === 'light' ? 'light-content' : 'dark-content'}
          backgroundColor={colors.background.primary}
        />
        {Content}
      </SafeAreaView>
    );
  }

  return Content;
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: spacing[4],
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  header: {
    marginBottom: spacing[5],
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: spacing[1],
    lineHeight: 20,
  },
});

export default Screen;
