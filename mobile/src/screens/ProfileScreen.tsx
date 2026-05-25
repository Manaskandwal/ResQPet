import React, { useState } from 'react';
import { View, Text, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { api } from '../services/api';
import { C, S } from '../styles/theme';
import { User } from '../types';
import { AnimatedPress } from '../components/AnimatedPress';
import {
  ScreenShell,
  SurfaceCard,
  FormField,
} from '../components/SharedComponents';

const roleLabel: Record<string, string> = {
  user: 'Citizen',
  ngo: 'NGO',
  hospital: 'Hospital',
  ambulance: 'Ambulance',
  admin: 'Admin',
};

export default function ProfileScreen({ user, setUser }: { user: User; setUser: (u: User) => void }) {
  const [form, setForm] = useState({
    name: user.name || '',
    phone: user.phone || '',
    orgName: user.orgName || '',
    address: user.location?.address || '',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/user/profile', form);
      setUser(data.user);
      Alert.alert('✅ Profile saved', 'Your changes have been saved.');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || e.message);
    } finally {
      setSaving(false);
    }
  };

  const initial = user.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <ScreenShell>
      {/* Avatar */}
      <View style={S.profileHeader}>
        <View style={S.profileAvatar}>
          <Text style={S.profileAvatarText}>{initial}</Text>
        </View>
        <Text style={S.profileName}>{user.orgName || user.name}</Text>
        <View style={S.roleBadge}>
          <Text style={S.roleBadgeText}>{roleLabel[user.role] || user.role}</Text>
        </View>
        {!user.isApproved && user.role !== 'user' && (
          <View style={[S.roleBadge, { backgroundColor: `${C.warning}20`, borderColor: `${C.warning}40` }]}>
            <Text style={[S.roleBadgeText, { color: C.warning }]}>⏳ Pending Approval</Text>
          </View>
        )}
        <Text style={S.profileEmail}>{user.email}</Text>
      </View>

      <SurfaceCard>
        <Text style={S.cardSectionTitle}>✏️ Edit Profile</Text>
        <FormField
          label="Name"
          value={form.name}
          onChangeText={(name) => setForm({ ...form, name })}
          placeholder="Full name"
          icon="person-outline"
        />
        <FormField
          label="Phone"
          value={form.phone}
          onChangeText={(phone) => setForm({ ...form, phone })}
          placeholder="+91 ..."
          icon="call-outline"
          keyboardType="phone-pad"
        />
        {user.role !== 'user' && (
          <FormField
            label={user.role === 'hospital' ? 'Hospital Name' : 'Organisation Name'}
            value={form.orgName}
            onChangeText={(orgName) => setForm({ ...form, orgName })}
            placeholder={user.role === 'hospital' ? 'Hospital name' : 'Organisation name'}
            icon="business-outline"
          />
        )}
        <FormField
          label="Address"
          value={form.address}
          onChangeText={(address) => setForm({ ...form, address })}
          placeholder="City, State"
          icon="location-outline"
        />
        <AnimatedPress onPress={save} disabled={saving} style={S.btnPrimary}>
          {saving ? (
            <ActivityIndicator color={C.bgMain} size="small" />
          ) : (
            <>
              <Ionicons name="save-outline" size={18} color={C.bgMain} />
              <Text style={S.btnPrimaryText}>Save Changes</Text>
            </>
          )}
        </AnimatedPress>
      </SurfaceCard>
    </ScreenShell>
  );
}
