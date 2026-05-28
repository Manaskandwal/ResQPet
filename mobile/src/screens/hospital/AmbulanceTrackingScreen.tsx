import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../themes';
import { spacing, borderRadius, typography } from '../../themes/tokens';
import { useNavigation } from '../../navigation/navigation';
import Screen from '../../components/Screen';
import Card from '../../components/ui/Card';
import { AnimatedPress } from '../../components/AnimatedPress';

export function AmbulanceTrackingScreen() {
  const colors = useColors();
  const navigation = useNavigation();

  return (
    <Screen
      scrollable={false}
      title="Fleet Tracking"
      subtitle="Monitor live coordinates of dispatches en-route to partner clinics"
      style={{ backgroundColor: colors.background.primary }}
    >
      {/* Header back navigation */}
      <View style={styles.headerNav}>
        <AnimatedPress onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={[styles.backBtnText, { color: colors.primary }]}>Back</Text>
        </AnimatedPress>
      </View>

      {/* Live radar mock */}
      <Card variant="glass" style={styles.trackingContainer}>
        <View style={[styles.radarCenter, { backgroundColor: `${colors.primary}15` }]}>
          <Ionicons name="compass" size={48} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text.primary }]}>Live GPS Active</Text>
        <Text style={[styles.desc, { color: colors.text.secondary }]}>
          Ambulance DL 01 AB 1234 is transporting a wounded dog to your hospital. Current ETA: 8 minutes.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerNav: {
    marginBottom: spacing[4],
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingVertical: spacing[1.5],
  },
  backBtnText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
  },
  trackingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
    gap: spacing[4],
  },
  radarCenter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
  },
  desc: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
  },
});

export default AmbulanceTrackingScreen;
