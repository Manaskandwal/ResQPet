import React, { useState, useEffect } from 'react';
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
import * as Google from 'expo-auth-session/providers/google';
import { C, S } from '../../styles/theme';
import { api, GOOGLE_ANDROID_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from '../../services/api';
import { AnimatedPress } from '../../components/AnimatedPress';
import { FormField } from '../../components/SharedComponents';
import { useNavigation } from '../../navigation/navigation';
import { User } from '../../types';

interface LoginScreenProps {
  onLogin: (user: User, token: string) => Promise<void>;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [, googleResponse, promptGoogle] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || 'dummy-android-client-id',
  });

  useEffect(() => {
    const run = async () => {
      if (googleResponse?.type !== 'success') return;
      const credential = googleResponse.authentication?.idToken;
      if (!credential) return;
      setLoading(true);
      try {
        const { data } = await api.post('/auth/google', { credential });
        await onLogin(data.user, data.token);
      } catch (error: any) {
        Alert.alert('Google login failed', error.response?.data?.message || error.message);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [googleResponse, onLogin]);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      return Alert.alert('Error', 'Please fill in all credentials.');
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      await onLogin(data.user, data.token);
    } catch (error: any) {
      Alert.alert('Login failed', error.response?.data?.message || error.message);
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

        {/* Brand Header */}
        <View style={{ alignItems: 'center', gap: 6, marginTop: 12, marginBottom: 8 }}>
          <View style={[S.brandLogo, { width: 48, height: 48, borderRadius: 14 }]}>
            <Text style={{ fontSize: 22 }}>🐾</Text>
          </View>
          <Text style={[S.authTitle, { fontSize: 24, textAlign: 'center' }]}>Welcome Back</Text>
          <Text style={[S.authSubtitle, { fontSize: 13, color: C.textMuted }]}>
            Sign in to continue emergency rescue operations
          </Text>
        </View>

        {/* Input Card */}
        <View style={S.authCard}>
          <FormField
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="you@example.com"
            icon="mail-outline"
          />

          <FormField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            icon="lock-closed-outline"
          />

          <AnimatedPress onPress={handleSignIn} disabled={loading} style={[S.btnPrimary, { marginTop: 8 }]}>
            {loading ? (
              <ActivityIndicator color={C.bgMain} size="small" />
            ) : (
              <>
                <Ionicons name="log-in-outline" size={18} color={C.bgMain} />
                <Text style={S.btnPrimaryText}>Sign In</Text>
              </>
            )}
          </AnimatedPress>

          <View style={S.dividerRow}>
            <View style={S.dividerLine} />
            <Text style={S.dividerText}>or continue with</Text>
            <View style={S.dividerLine} />
          </View>

          <AnimatedPress
            onPress={() => promptGoogle()}
            disabled={loading || (!GOOGLE_WEB_CLIENT_ID && !GOOGLE_ANDROID_CLIENT_ID)}
            style={S.btnGoogle}
          >
            <Ionicons name="logo-google" size={16} color="#EA4335" />
            <Text style={S.btnGoogleText}>Continue with Google</Text>
          </AnimatedPress>
        </View>

        {/* Redirect Footer */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 }}>
          <Text style={{ color: C.textMuted, fontSize: 13 }}>New to Vetscue?</Text>
          <TouchableOpacity onPress={() => navigation.push('RoleSelection')}>
            <Text style={{ color: C.brand, fontWeight: '700', fontSize: 13 }}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
