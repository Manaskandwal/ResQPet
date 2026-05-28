import React, { useState } from 'react';
import { StyleSheet, Text, View, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../themes';
import { spacing, borderRadius, typography } from '../../themes/tokens';
import { useNavigation } from '../../navigation/navigation';
import Screen from '../../components/Screen';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { AnimatedPress } from '../../components/AnimatedPress';

export function LocationSettingsScreen() {
  const colors = useColors();
  const navigation = useNavigation();
  const [backgroundTracking, setBackgroundTracking] = useState(true);
  const [highAccuracy, setHighAccuracy] = useState(true);

  return (
    <Screen
      scrollable
      title="GPS Settings"
      subtitle="Configure high-frequency live tracking variables for real-time dispatches"
      style={{ backgroundColor: colors.background.primary }}
    >
      {/* Header back navigation */}
      <View style={styles.headerNav}>
        <AnimatedPress onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={[styles.backBtnText, { color: colors.primary }]}>Back</Text>
        </AnimatedPress>
      </View>

      {/* Info card */}
      <Card variant="glass" style={styles.infoCard}>
        <Ionicons name="location" size={32} color={colors.primary} />
        <Text style={[styles.infoTitle, { color: colors.text.primary }]}>GPS Synchronization</Text>
        <Text style={[styles.infoDesc, { color: colors.text.secondary }]}>
          Live coordinate tracking allows clinical dispatch boards and citizens to track your ETA in real time. Disabling GPS options can delay transfer routes.
        </Text>
      </Card>

      {/* Configuration Card */}
      <Card variant="elevated" style={styles.configCard}>
        {/* Toggle 1 */}
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.toggleTitle, { color: colors.text.primary }]}>Background Tracking</Text>
            <Text style={[styles.toggleSub, { color: colors.text.secondary }]}>
              Keep streaming coordinates when the app is running in background.
            </Text>
          </View>
          <Switch
            value={backgroundTracking}
            onValueChange={setBackgroundTracking}
            trackColor={{ false: colors.background.tertiary, true: `${colors.primary}50` }}
            thumbColor={backgroundTracking ? colors.primary : colors.text.muted}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border.primary }]} />

        {/* Toggle 2 */}
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.toggleTitle, { color: colors.text.primary }]}>High Accuracy Mode</Text>
            <Text style={[styles.toggleSub, { color: colors.text.secondary }]}>
              Enable high-precision GPS positioning (consumes more battery).
            </Text>
          </View>
          <Switch
            value={highAccuracy}
            onValueChange={setHighAccuracy}
            trackColor={{ false: colors.background.tertiary, true: `${colors.primary}50` }}
            thumbColor={highAccuracy ? colors.primary : colors.text.muted}
          />
        </View>

        <Button
          variant="primary"
          icon={<Ionicons name="checkmark-circle" size={16} color={colors.background.primary} />}
          onPress={() => Alert.alert('Preferences Saved', 'Your GPS tracking variables have been synchronized.')}
          style={{ marginTop: spacing[4] }}
        >
          Save GPS Config
        </Button>
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
  infoCard: {
    padding: spacing[4],
    alignItems: 'center',
    textAlign: 'center',
    gap: spacing[2],
    marginBottom: spacing[5],
  },
  infoTitle: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
  },
  infoDesc: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
  },
  configCard: {
    padding: spacing[4],
    gap: spacing[4],
    marginBottom: spacing[8],
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[4],
  },
  toggleTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
  },
  toggleSub: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    marginTop: 2,
    lineHeight: 16,
  },
  divider: {
    height: 1,
  },
});

export default LocationSettingsScreen;
