import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, S } from '../../styles/theme';
import { Role } from '../../types';
import { AnimatedPress } from '../../components/AnimatedPress';
import { useNavigation } from '../../navigation/navigation';

export function RoleSelectionScreen() {
  const navigation = useNavigation();
  const [selectedRole, setSelectedRole] = useState<Role>('user');

  const roles = [
    { value: 'user' as Role, label: 'Citizen', icon: '👤', desc: 'Report stray or domestic pets in distress' },
    { value: 'ngo' as Role, label: 'NGO Responder', icon: '🌿', desc: 'Accept rescues, deploy volunteers & aid' },
    { value: 'hospital' as Role, label: 'Hospital/Vet', icon: '🏥', desc: 'Accept ward intakes & manage clinical care' },
    { value: 'ambulance' as Role, label: 'Ambulance Crew', icon: '🚑', desc: 'Accept dispatches, track routes & transport' },
  ];

  const handleContinue = () => {
    navigation.push('Register', { role: selectedRole });
  };

  return (
    <SafeAreaView style={[S.safe, { backgroundColor: C.bgMain }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.bgMain} />
      <ScrollView contentContainerStyle={S.authContainer} showsVerticalScrollIndicator={false}>
        <View style={S.authGlow} pointerEvents="none" />

        {/* Back Button */}
        <View style={S.authHeaderRow}>
          <AnimatedPress onPress={() => navigation.goBack()} style={S.backButton}>
            <Ionicons name="arrow-back" size={14} color={C.brand} />
            <Text style={S.backButtonText}>Back</Text>
          </AnimatedPress>
        </View>

        {/* Header Title */}
        <View style={{ gap: 8, marginTop: 8, marginBottom: 12 }}>
          <View style={[S.brandLogo, { width: 56, height: 56, borderRadius: 16 }]}>
            <Text style={{ fontSize: 24 }}>🐾</Text>
          </View>
          <Text style={S.authTitle}>Select your role</Text>
          <Text style={[S.authSubtitle, { textAlign: 'left' }]}>
            Choose how you would like to participate in the VetsCue emergency rescue network.
          </Text>
        </View>

        {/* Role Cards Grid */}
        <View style={S.roleGrid}>
          {roles.map((item) => {
            const isSelected = selectedRole === item.value;
            return (
              <AnimatedPress
                key={item.value}
                onPress={() => setSelectedRole(item.value)}
                containerStyle={{ width: '48.5%', marginBottom: 12 }}
                style={[S.roleCard, isSelected && S.roleCardActive, { paddingVertical: 16 }]}
              >
                <View style={S.roleCardHeader}>
                  <Text style={{ fontSize: 24 }}>{item.icon}</Text>
                  {isSelected && (
                    <View style={S.roleCardBadge}>
                      <Ionicons name="checkmark-circle" size={16} color={C.brand} />
                    </View>
                  )}
                </View>
                <Text style={[S.roleCardTitle, isSelected && S.roleCardTitleActive, { fontSize: 14, marginTop: 8 }]}>
                  {item.label}
                </Text>
                <Text style={[S.roleCardDesc, { fontSize: 10, lineHeight: 14, marginTop: 4 }]}>
                  {item.desc}
                </Text>
              </AnimatedPress>
            );
          })}
        </View>

        {/* Continue CTA */}
        <AnimatedPress onPress={handleContinue} style={[S.btnPrimary, { marginTop: 16 }]}>
          <Text style={S.btnPrimaryText}>Continue to Register</Text>
          <Ionicons name="arrow-forward" size={16} color={C.bgMain} />
        </AnimatedPress>
      </ScrollView>
    </SafeAreaView>
  );
}
