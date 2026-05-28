import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, S } from '../../styles/theme';
import { api } from '../../services/api';
import { AnimatedPress } from '../../components/AnimatedPress';
import { FormField } from '../../components/SharedComponents';
import { useNavigation } from '../../navigation/navigation';
import { Role, User } from '../../types';

interface RegisterScreenProps {
  onLogin: (user: User, token: string) => Promise<void>;
}

export function RegisterScreen({ onLogin }: RegisterScreenProps) {
  const navigation = useNavigation();
  const role: Role = navigation.params?.role || 'user';

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: role,
    phone: '',
    orgName: '',
    regNumber: '',
    address: '',
    vehicleNumber: '',
    hospitalType: 'private',
  });
  const [loading, setLoading] = useState(false);

  const getRoleLabel = (r: Role) => {
    switch (r) {
      case 'ngo': return 'NGO Partner';
      case 'hospital': return 'Hospital/Clinic';
      case 'ambulance': return 'Ambulance Partner';
      default: return 'Citizen Rescue';
    }
  };

  const submit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      return Alert.alert('Error', 'Please fill in name, email, and password.');
    }
    if (role !== 'user') {
      if (!form.orgName.trim() || !form.regNumber.trim() || !form.phone.trim() || !form.address.trim()) {
        return Alert.alert('Error', 'Please fill in all organization details.');
      }
      if (role === 'ambulance' && !form.vehicleNumber.trim()) {
        return Alert.alert('Error', 'Please fill in the vehicle registration number.');
      }
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      await onLogin(data.user, data.token);
    } catch (error: any) {
      Alert.alert('Registration failed', error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[S.safe, { backgroundColor: C.bgMain }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.bgMain} />
      <ScrollView
        contentContainerStyle={[S.authContainer, { paddingTop: 20 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={S.authGlow} pointerEvents="none" />

        {/* Back Button & Header */}
        <View style={S.authHeaderRow}>
          <AnimatedPress onPress={() => navigation.goBack()} style={S.backButton}>
            <Ionicons name="arrow-back" size={14} color={C.brand} />
            <Text style={S.backButtonText}>Change Role</Text>
          </AnimatedPress>
        </View>

        <View style={{ gap: 4, marginTop: 4, marginBottom: 8 }}>
          <Text style={[S.authTitle, { fontSize: 26 }]}>Create Account</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ color: C.textMuted, fontSize: 13 }}>Registering as a</Text>
            <View style={[S.pilotBadgeSmall, { backgroundColor: `${C.brand}10` }]}>
              <Text style={S.pilotTextSmall}>{getRoleLabel(role)}</Text>
            </View>
          </View>
        </View>

        {/* Input Card */}
        <View style={S.authCard}>
          <FormField
            label="Full Name"
            value={form.name}
            onChangeText={(name) => setForm({ ...form, name })}
            placeholder="John Doe"
            icon="person-outline"
          />

          <FormField
            label="Email Address"
            value={form.email}
            onChangeText={(email) => setForm({ ...form, email })}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="you@example.com"
            icon="mail-outline"
          />

          <FormField
            label="Password"
            value={form.password}
            onChangeText={(password) => setForm({ ...form, password })}
            secureTextEntry
            placeholder="••••••••"
            icon="lock-closed-outline"
          />

          {role !== 'user' && (
            <>
              <FormField
                label="Organisation Name"
                value={form.orgName}
                onChangeText={(orgName) => setForm({ ...form, orgName })}
                placeholder="Save Animals Foundation"
                icon="business-outline"
              />
              <FormField
                label="Registration Number"
                value={form.regNumber}
                onChangeText={(regNumber) => setForm({ ...form, regNumber })}
                placeholder="Reg ID / Govt License"
                icon="document-text-outline"
              />
              <FormField
                label="Phone Number"
                value={form.phone}
                onChangeText={(phone) => setForm({ ...form, phone })}
                keyboardType="phone-pad"
                placeholder="+91 XXXXX XXXXX"
                icon="call-outline"
              />
              <FormField
                label="Office Address"
                value={form.address}
                onChangeText={(address) => setForm({ ...form, address })}
                placeholder="City, State"
                icon="location-outline"
              />

              {role === 'hospital' && (
                <View style={{ marginBottom: 4 }}>
                  <Text style={S.fieldLabel}>Hospital Category</Text>
                  <View style={S.chipRow}>
                    {['government', 'private'].map((t) => (
                      <AnimatedPress
                        key={t}
                        onPress={() => setForm({ ...form, hospitalType: t })}
                        containerStyle={{ flex: 1 }}
                        style={[S.chip, { alignItems: 'center' }, form.hospitalType === t && S.chipActive]}
                      >
                        <Text
                          style={[
                            S.chipText,
                            form.hospitalType === t && S.chipTextActive,
                            { textTransform: 'capitalize' },
                          ]}
                        >
                          {t}
                        </Text>
                      </AnimatedPress>
                    ))}
                  </View>
                </View>
              )}

              {role === 'ambulance' && (
                <FormField
                  label="Ambulance Vehicle Number"
                  value={form.vehicleNumber}
                  onChangeText={(vehicleNumber) => setForm({ ...form, vehicleNumber })}
                  placeholder="DL 01 AB 1234"
                  icon="car-outline"
                />
              )}
            </>
          )}

          <AnimatedPress onPress={submit} disabled={loading} style={[S.btnPrimary, { marginTop: 12 }]}>
            {loading ? (
              <ActivityIndicator color={C.bgMain} size="small" />
            ) : (
              <>
                <Ionicons name="person-add-outline" size={18} color={C.bgMain} />
                <Text style={S.btnPrimaryText}>Create Account</Text>
              </>
            )}
          </AnimatedPress>
        </View>

        {/* Redirect Footer */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 }}>
          <Text style={{ color: C.textMuted, fontSize: 13 }}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.reset('Login')}>
            <Text style={{ color: C.brand, fontWeight: '700', fontSize: 13 }}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
