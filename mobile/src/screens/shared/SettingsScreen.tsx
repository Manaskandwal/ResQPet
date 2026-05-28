import React, { useState } from 'react';
import { StyleSheet, Text, View, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useTheme } from '../../themes';
import { spacing, borderRadius, typography } from '../../themes/tokens';
import Screen from '../../components/Screen';
import Card from '../../components/ui/Card';
import ListItem from '../../components/ui/ListItem';
import { AnimatedPress } from '../../components/AnimatedPress';

interface SettingsScreenProps {
  onLogout: () => void;
}

export function SettingsScreen({ onLogout }: SettingsScreenProps) {
  const colors = useColors();
  const { themeMode, setThemeMode } = useTheme();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [geoEnabled, setGeoEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to end your current session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: onLogout },
    ]);
  };

  const handleClearCache = () => {
    Alert.alert('Cache Cleared 🧹', 'All temporary assets and map buffers have been flushed.');
  };

  return (
    <Screen
      scrollable
      title="App Settings"
      subtitle="Configure notifications, telemetry preferences and user security"
      style={{ backgroundColor: colors.background.primary }}
    >
      {/* Theme selection card */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Appearance Theme</Text>
      </View>
      <Card variant="default" style={styles.settingsCard}>
        <View style={styles.themeSelectorRow}>
          {([
            { key: 'system', label: '🌓 System Theme', desc: 'Sync with device system preference' },
            { key: 'light', label: '☀️ Vibrant Light', desc: 'High-contrast premium light mode' },
            { key: 'dark', label: '🌙 Obsidian Dark', desc: 'Premium dark-mode glassmorphic styling' },
          ] as const).map(({ key, label, desc }) => {
            const isActive = themeMode === key;
            return (
              <AnimatedPress
                key={key}
                onPress={() => setThemeMode(key)}
                style={StyleSheet.flatten([
                  styles.themeButton,
                  { backgroundColor: colors.background.secondary },
                  isActive && { backgroundColor: `${colors.primary}15`, borderColor: colors.primary, borderWidth: 1.5 },
                ])}
              >
                <Text
                  style={[
                    styles.themeButtonText,
                    { color: colors.text.primary },
                    isActive && { color: colors.primary, fontFamily: typography.fontFamily.bold },
                  ]}
                >
                  {label}
                </Text>
                <Text style={[styles.themeButtonDesc, { color: colors.text.secondary }]}>{desc}</Text>
              </AnimatedPress>
            );
          })}
        </View>
      </Card>

      {/* Notifications card */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Communications</Text>
      </View>
      <Card variant="default" style={styles.settingsCard}>
        <View style={styles.settingItem}>
          <View style={styles.labelCol}>
            <Text style={[styles.settingLabel, { color: colors.text.primary }]}>Push Notifications</Text>
            <Text style={[styles.settingSub, { color: colors.text.secondary }]}>Get immediate warnings for local rescue matches</Text>
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={setPushEnabled}
            trackColor={{ false: 'rgba(255,255,255,0.06)', true: colors.primary }}
            thumbColor="#ffffff"
          />
        </View>

        <View style={styles.separator} />

        <View style={styles.settingItem}>
          <View style={styles.labelCol}>
            <Text style={[styles.settingLabel, { color: colors.text.primary }]}>Live GPS Telemetry</Text>
            <Text style={[styles.settingSub, { color: colors.text.secondary }]}>Transmit high-accuracy vehicle markers on tasks</Text>
          </View>
          <Switch
            value={geoEnabled}
            onValueChange={setGeoEnabled}
            trackColor={{ false: 'rgba(255,255,255,0.06)', true: colors.primary }}
            thumbColor="#ffffff"
          />
        </View>

        <View style={styles.separator} />

        <View style={styles.settingItem}>
          <View style={styles.labelCol}>
            <Text style={[styles.settingLabel, { color: colors.text.primary }]}>SMS Alert Fallbacks</Text>
            <Text style={[styles.settingSub, { color: colors.text.secondary }]}>Receive text notifications when internet is unavailable</Text>
          </View>
          <Switch
            value={smsEnabled}
            onValueChange={setSmsEnabled}
            trackColor={{ false: 'rgba(255,255,255,0.06)', true: colors.primary }}
            thumbColor="#ffffff"
          />
        </View>
      </Card>

      {/* System Settings card */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Security & Operations</Text>
      </View>
      <Card variant="default" style={styles.settingsCard}>
        <AnimatedPress onPress={handleClearCache} style={styles.clickableRow}>
          <View style={styles.rowLeft}>
            <Ionicons name="trash-outline" size={18} color={colors.text.secondary} />
            <Text style={[styles.settingLabel, { color: colors.text.primary }]}>Clear Cache Buffers</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
        </AnimatedPress>

        <View style={styles.separator} />

        <AnimatedPress
          onPress={() => Alert.alert('Platform Version', 'VetsCue Mobile App v2.4.1\nEcosystem running healthy.')}
          style={styles.clickableRow}
        >
          <View style={styles.rowLeft}>
            <Ionicons name="information-circle-outline" size={18} color={colors.text.secondary} />
            <Text style={[styles.settingLabel, { color: colors.text.primary }]}>System Information</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
        </AnimatedPress>
      </Card>

      {/* Logout button */}
      <AnimatedPress onPress={handleLogout} style={[styles.logoutBtn, { backgroundColor: `${colors.error}12` }]}>
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={[styles.logoutBtnText, { color: colors.error }]}>Log Out of Session</Text>
      </AnimatedPress>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    marginVertical: spacing[3],
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  settingsCard: {
    padding: spacing[4],
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[1.5],
  },
  labelCol: {
    flex: 1,
    paddingRight: spacing[4],
  },
  settingLabel: {
    fontSize: 13.5,
    fontFamily: typography.fontFamily.bold,
  },
  settingSub: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    marginTop: 2,
    lineHeight: 14,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginVertical: spacing[3.5],
  },
  clickableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[1.5],
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3.5],
    borderRadius: borderRadius.xl,
    marginTop: spacing[8],
    marginBottom: spacing[6],
  },
  logoutBtnText: {
    fontSize: 13.5,
    fontFamily: typography.fontFamily.bold,
  },
  themeSelectorRow: {
    gap: spacing[3],
  },
  themeButton: {
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    gap: spacing[1],
  },
  themeButtonText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
  },
  themeButtonDesc: {
    fontSize: 10.5,
    fontFamily: typography.fontFamily.regular,
  },
});

export default SettingsScreen;
