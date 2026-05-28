import React, { useState } from 'react';
import { StyleSheet, Text, View, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../themes';
import { spacing, borderRadius, typography } from '../../themes/tokens';
import { api } from '../../services/api';
import { useNavigation } from '../../navigation/navigation';
import Screen from '../../components/Screen';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import StatusPill from '../../components/ui/StatusPill';
import { AnimatedPress } from '../../components/AnimatedPress';
import { User } from '../../types';

interface ProfileScreenProps {
  user: User;
  setUser: (u: User) => void;
}

const roleLabels: Record<string, string> = {
  user: 'Citizen',
  ngo: 'NGO Companion',
  hospital: 'Hospital Staff',
  ambulance: 'Ambulance Driver',
  admin: 'Ecosystem Overseer',
};

export function ProfileScreen({ user, setUser }: ProfileScreenProps) {
  const colors = useColors();
  const navigation = useNavigation();
  const [form, setForm] = useState({
    name: user.name || '',
    phone: user.phone || '',
    orgName: user.orgName || '',
    address: user.location?.address || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Required Field', 'Name cannot be empty.');
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.put('/user/profile', form);
      setUser(data.user);
      Alert.alert('Profile Saved ✅', 'Your settings have been successfully updated.');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to update profile settings.');
    } finally {
      setSaving(false);
    }
  };

  const initial = (user.name || 'U').charAt(0).toUpperCase();

  return (
    <Screen
      scrollable
      title="My Profile"
      subtitle="Manage your personal details and organization settings"
      style={{ backgroundColor: colors.background.primary }}
    >
      {/* Profile Card Header */}
      <Card variant="glass" style={styles.profileHeaderCard}>
        <View style={styles.headerGlow} pointerEvents="none" />
        <View style={styles.headerLayout}>
          <View style={[styles.avatarCircle, { backgroundColor: `${colors.primary}15` }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>{initial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: colors.text.primary }]}>
              {user.orgName || user.name}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.text.secondary }]}>
              {user.email}
            </Text>
            <View style={styles.badgeRow}>
              <View style={[styles.roleBadge, { backgroundColor: `${colors.primary}12` }]}>
                <Text style={[styles.roleBadgeText, { color: colors.primary }]}>
                  🛡️ {roleLabels[user.role] || user.role}
                </Text>
              </View>
              {!user.isApproved && user.role !== 'user' && (
                <StatusPill status="pending" />
              )}
            </View>
          </View>
        </View>
      </Card>

      {/* Editing Form */}
      <Card variant="default" style={styles.formCard}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>✏️ Account Information</Text>
        
        <View style={styles.formContainer}>
          <Input
            label="Full Name"
            placeholder="e.g. John Doe"
            value={form.name}
            onChangeText={(v) => setForm({ ...form, name: v })}
            icon="person-outline"
          />

          <Input
            label="Contact Number"
            placeholder="e.g. +91 99999 88888"
            value={form.phone}
            onChangeText={(v) => setForm({ ...form, phone: v })}
            icon="call-outline"
            keyboardType="phone-pad"
          />

          {user.role !== 'user' && (
            <Input
              label={user.role === 'hospital' ? 'Clinical Hospital Name' : 'NGO Organisation Name'}
              placeholder="Enter official verified name"
              value={form.orgName}
              onChangeText={(v) => setForm({ ...form, orgName: v })}
              icon="business-outline"
            />
          )}

          <Input
            label="Location Address"
            placeholder="City, State, Country"
            value={form.address}
            onChangeText={(v) => setForm({ ...form, address: v })}
            icon="location-outline"
          />

          <Button
            variant="primary"
            loading={saving}
            onPress={handleSave}
            icon={<Ionicons name="save-outline" size={16} color={colors.background.primary} />}
            style={{ marginTop: spacing[3] }}
          >
            Save Profile Settings
          </Button>
        </View>
      </Card>

      {/* Preferences & Help Shortcuts */}
      <Card variant="default" style={styles.menuCard}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>⚙️ App Preferences</Text>
        <View style={styles.menuContainer}>
          <AnimatedPress
            onPress={() => navigation.push('AIChat')}
            style={styles.menuRow}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="sparkles" size={18} color={colors.primary} />
              <Text style={[styles.menuText, { color: colors.text.primary }]}>VetsCue AI Assistant</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
          </AnimatedPress>

          <View style={styles.separator} />

          <AnimatedPress
            onPress={() => navigation.push('Settings')}
            style={styles.menuRow}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="settings" size={18} color={colors.info} />
              <Text style={[styles.menuText, { color: colors.text.primary }]}>Preferences & Systems</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
          </AnimatedPress>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileHeaderCard: {
    padding: spacing[5],
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    marginBottom: spacing[5],
  },
  headerGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#76d6d5',
    opacity: 0.08,
  },
  headerLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontFamily: typography.fontFamily.extraBold,
  },
  profileName: {
    fontSize: 18,
    fontFamily: typography.fontFamily.extraBold,
    letterSpacing: -0.5,
  },
  profileEmail: {
    fontSize: 12.5,
    fontFamily: typography.fontFamily.regular,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[2.5],
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[2.5],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.full,
  },
  roleBadgeText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
  },
  formCard: {
    padding: spacing[4],
    marginBottom: spacing[6],
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing[3],
  },
  formContainer: {
    gap: spacing[3.5],
  },
  menuCard: {
    padding: spacing[4],
    marginBottom: spacing[6],
  },
  menuContainer: {
    marginTop: spacing[2],
    gap: spacing[3],
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[1.5],
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  menuText: {
    fontSize: 13.5,
    fontFamily: typography.fontFamily.bold,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
});

export default ProfileScreen;
