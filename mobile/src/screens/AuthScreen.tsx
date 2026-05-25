import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import { C, S } from '../styles/theme';
import { Role, User } from '../types';
import { api, GOOGLE_ANDROID_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from '../services/api';
import { AnimatedPress } from '../components/AnimatedPress';
import { FormField } from '../components/SharedComponents';

interface AuthScreenProps {
  onLogin: (user: User, token: string) => Promise<void>;
}

export function AuthScreen({ onLogin }: AuthScreenProps) {
  const [mode, setMode] = useState<'landing' | 'login' | 'register'>('landing');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as Role,
    phone: '',
    orgName: '',
    regNumber: '',
    address: '',
    vehicleNumber: '',
    hospitalType: 'private',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const backAction = () => {
      if (mode !== 'landing') {
        setMode('landing');
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [mode]);

  const [, googleResponse, promptGoogle] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || 'dummy-android-client-id',
  });

  useEffect(() => {
    const run = async () => {
      if (googleResponse?.type !== 'success') return;
      const credential = googleResponse.authentication?.idToken;
      if (!credential) return;
      const { data } = await api.post('/auth/google', { credential });
      await onLogin(data.user, data.token);
    };
    run().catch((error: any) =>
      Alert.alert('Google login failed', error.response?.data?.message || error.message)
    );
  }, [googleResponse, onLogin]);

  const submit = async () => {
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload = mode === 'login' ? { email: form.email, password: form.password } : form;
      const { data } = await api.post(endpoint, payload);
      await onLogin(data.user, data.token);
    } catch (error: any) {
      Alert.alert(
        mode === 'login' ? 'Login failed' : 'Registration failed',
        error.response?.data?.message || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'landing') {
    return (
      <SafeAreaView style={[S.safe, { backgroundColor: C.bgMain }]}>
        <ExpoStatusBar style="light" backgroundColor={C.bgMain} />
        <StatusBar barStyle="light-content" backgroundColor={C.bgMain} />

        {/* Landing Header */}
        <View style={S.landingHeader}>
          <View style={S.appHeaderLeft}>
            <View style={S.headerBrandIcon}>
              <Text style={{ fontSize: 16 }}>🐾</Text>
            </View>
            <Text style={S.landingBrand}>VetsCue</Text>
            <View style={S.pilotBadgeSmall}>
              <Text style={S.pilotTextSmall}>Pilot</Text>
            </View>
          </View>
          <AnimatedPress onPress={() => setMode('login')} style={S.btnSignInSmall}>
            <Text style={S.btnSignInSmallText}>Sign In</Text>
          </AnimatedPress>
        </View>

        <ScrollView contentContainerStyle={S.landingContent} showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          <View style={S.heroContainer}>
            <View style={S.authGlow} pointerEvents="none" />
            <View style={[S.pilotBadge, { marginBottom: 16, alignSelf: 'center' }]}>
              <View style={S.pilotDot} />
              <Text style={S.pilotText}>Pilot Launch · Shahdara & NE Delhi</Text>
            </View>

            <Text style={S.heroTitleText}>
              The Ultimate{'\n'}Sanctuary.{'\n'}
              <Text style={{ color: C.brand }}>For Every Pet</Text>{'\n'}& Guardian.
            </Text>

            <Text style={S.heroDescText}>
              Discover a complete ecosystem for pet life: seamless adoption, world-class health
              services, a vibrant community, and rapid emergency response.{'\n'}
              <Text style={{ color: C.brand, fontWeight: '700' }}>
                One Hybrid Platform. Endless Care.
              </Text>
            </Text>

            <View style={S.heroActionButtons}>
              <AnimatedPress
                onPress={() => {
                  setForm({ ...form, role: 'user' });
                  setMode('register');
                }}
                style={S.btnPrimary}
              >
                <Text style={S.btnPrimaryText}>🐾 Report a Rescue</Text>
              </AnimatedPress>

              <View style={S.row}>
                <AnimatedPress
                  onPress={() => {
                    setForm({ ...form, role: 'ngo' });
                    setMode('register');
                  }}
                  containerStyle={{ flex: 1 }}
                  style={[S.btnOutline, { paddingVertical: 14 }]}
                >
                  <Text style={S.btnOutlineText}>🌿 NGO Partner</Text>
                </AnimatedPress>
                <AnimatedPress
                  onPress={() => {
                    setForm({ ...form, role: 'ambulance' });
                    setMode('register');
                  }}
                  containerStyle={{ flex: 1 }}
                  style={[S.btnOutline, { paddingVertical: 14 }]}
                >
                  <Text style={S.btnOutlineText}>🚑 Ambulance</Text>
                </AnimatedPress>
              </View>
            </View>

            <View style={S.trustRow}>
              <Text style={S.trustItem}>✓ Free to use</Text>
              <Text style={S.trustItem}>✓ Best-effort aid</Text>
              <Text style={S.trustItem}>✓ Verified Network</Text>
            </View>
          </View>

          {/* How It Works */}
          <View style={S.landingSection}>
            <Text style={S.sectionLabel}>How It Works</Text>
            <Text style={S.landingSectionTitle}>Building a unified pet ecosystem</Text>
            <Text style={S.landingSectionSub}>
              A community-driven flow linking citizens with NGOs, bringing comprehensive care to stray
              and domestic pets alike.
            </Text>

            <View style={S.stepsStack}>
              {[
                {
                  icon: '📝',
                  title: '1. Report',
                  desc: 'Spot a stray or pet in distress and log a request with location.',
                },
                {
                  icon: '🤝',
                  title: '2. Respond',
                  desc: 'Nearby verified partners are notified and can accept if available.',
                },
                {
                  icon: '⚡',
                  title: '3. Escalate',
                  desc: 'System alerts available partners who try their best to provide a response.',
                },
                {
                  icon: '✅',
                  title: '4. Resolve',
                  desc: 'Partner resolves the case. Our future roadmap connects you with vets!',
                },
              ].map((step, idx) => (
                <View key={idx} style={S.stepCard}>
                  <Text style={S.stepIcon}>{step.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={S.stepTitle}>{step.title}</Text>
                    <Text style={S.stepDesc}>{step.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Pilot Stats */}
          <View style={[S.landingSection, S.statsSection]}>
            <div style={{ display: 'none' }}>Pilot Stats</div>
            <View style={S.statsGrid}>
              {[
                { value: '2', label: 'Initial Districts' },
                { value: '5+', label: 'NGO Partners' },
                { value: '1', label: 'Ecosystem' },
                { value: '∞', label: 'Care Options' },
              ].map((stat, idx) => (
                <View key={idx} style={S.statLandingCard}>
                  <Text style={S.statLandingValue}>{stat.value}</Text>
                  <Text style={S.statLandingLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* What's Next (Future Roadmap) */}
          <View style={S.landingSection}>
            <Text style={S.sectionLabel}>What's Next</Text>
            <Text style={S.landingSectionTitle}>Expanding into full pet care</Text>

            <View style={S.stepsStack}>
              {[
                {
                  icon: '🚑',
                  title: 'Emergency Ambulance',
                  desc: 'Book a dedicated animal ambulance for emergencies. Instant dispatch, live tracking.',
                  border: '#fb7185',
                },
                {
                  icon: '👨‍⚕️',
                  title: 'Consult a Vet',
                  desc: 'Connect with verified veterinary doctors via video or chat. Available 24/7.',
                  border: '#60a5fa',
                },
                {
                  icon: '🛍️',
                  title: 'Pet Marketplace',
                  desc: 'Quality pet care products, medicines and food — delivered to your door.',
                  border: '#c084fc',
                },
              ].map((card, idx) => (
                <View key={idx} style={[S.roadmapCard, { borderColor: card.border }]}>
                  <Text style={S.stepIcon}>{card.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={S.stepTitle}>{card.title}</Text>
                    <Text style={S.stepDesc}>{card.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* CTA */}
          <View style={S.ctaBannerCard}>
            <View style={S.ctaGlow} pointerEvents="none" />
            <Text style={S.ctaTitle}>Be the first responder in your community</Text>
            <Text style={S.ctaDesc}>
              Whether you are a citizen, NGO, hospital, or ambulance partner -- VetsCue helps you act
              fast.
            </Text>
            <View style={S.ctaActions}>
              <AnimatedPress
                onPress={() => {
                  setForm({ ...form, role: 'user' });
                  setMode('register');
                }}
                containerStyle={{ flex: 1 }}
                style={[S.btnPrimary, { backgroundColor: '#ffffff' }]}
              >
                <Text style={[S.btnPrimaryText, { color: C.bgMain }]}>Report Rescue</Text>
              </AnimatedPress>
              <AnimatedPress
                onPress={() => {
                  setForm({ ...form, role: 'ngo' });
                  setMode('register');
                }}
                containerStyle={{ flex: 1 }}
                style={[S.btnOutline, { borderColor: '#ffffff' }]}
              >
                <Text style={[S.btnOutlineText, { color: '#ffffff' }]}>Join Platform</Text>
              </AnimatedPress>
            </View>
          </View>

          {/* Landing Footer */}
          <View style={S.landingFooter}>
            <Text style={S.footerBrandText}>🐾 VetsCue · Pilot Delhi</Text>
            <View style={S.footerLinksRow}>
              <TouchableOpacity onPress={() => setMode('login')}>
                <Text style={S.footerLinkText}>Sign In</Text>
              </TouchableOpacity>
              <Text style={S.footerDivider}>•</Text>
              <TouchableOpacity
                onPress={() => {
                  setForm({ ...form, role: 'user' });
                  setMode('register');
                }}
              >
                <Text style={S.footerLinkText}>Register</Text>
              </TouchableOpacity>
              <Text style={S.footerDivider}>•</Text>
              <TouchableOpacity
                onPress={() => Alert.alert('Support', 'Contact us at support@vetscue.com')}
              >
                <Text style={S.footerLinkText}>Support</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[S.safe, { backgroundColor: C.bgMain }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.bgMain} />
      <ScrollView
        contentContainerStyle={[
          S.authContainer,
          (mode === 'login' || mode === 'register') && {
            paddingHorizontal: 16,
            paddingTop: 6,
            paddingBottom: 16,
            gap: 10,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Decorative radial glow */}
        <View style={S.authGlow} pointerEvents="none" />

        {/* Brand */}
        {mode === 'login' ? (
          <View style={{ alignItems: 'center', gap: 4, marginTop: 4, marginBottom: 4 }}>
            <View
              style={[
                S.brandLogo,
                { width: 44, height: 44, borderRadius: 12, shadowOpacity: 0.1, elevation: 2 },
              ]}
            >
              <Text style={{ fontSize: 20 }}>🐾</Text>
            </View>
            <Text style={[S.authTitle, { fontSize: 22, letterSpacing: -0.5, marginTop: 2 }]}>
              Welcome back
            </Text>
            <Text style={[S.authSubtitle, { fontSize: 13, lineHeight: 18, color: C.textMuted }]}>
              Sign in to continue rescue operations
            </Text>
          </View>
        ) : (
          <View style={{ alignItems: 'center', gap: 4, marginTop: 4, marginBottom: 4 }}>
            <View
              style={[
                S.brandLogo,
                { width: 44, height: 44, borderRadius: 12, shadowOpacity: 0.1, elevation: 2 },
              ]}
            >
              <Text style={{ fontSize: 20 }}>🐾</Text>
            </View>
            <Text style={[S.authTitle, { fontSize: 22, letterSpacing: -0.5, marginTop: 2 }]}>
              Create Account
            </Text>
            <Text style={[S.authSubtitle, { fontSize: 13, lineHeight: 18, color: C.textMuted }]}>
              Join the VetsCue rescue network
            </Text>
          </View>
        )}

        {/* Segment */}
        <View style={S.authCard}>
          <View style={S.segment}>
            {(['login', 'register'] as const).map((m) => (
              <AnimatedPress
                key={m}
                onPress={() => setMode(m)}
                containerStyle={{ flex: 1 }}
                style={[S.segItem, mode === m && S.segItemActive]}
              >
                <Text style={[S.segText, mode === m && S.segTextActive]}>
                  {m === 'login' ? 'Sign In' : 'Register'}
                </Text>
              </AnimatedPress>
            ))}
          </View>

          {mode === 'register' && (
            <>
              <FormField
                label="Full Name"
                value={form.name}
                onChangeText={(name) => setForm({ ...form, name })}
                placeholder="Your name"
                icon="person-outline"
              />

              <View style={{ marginBottom: 12 }}>
                <Text style={[S.fieldLabel, { marginBottom: 8 }]}>Select Account Type</Text>
                <View style={S.roleGrid}>
                  {[
                    { value: 'user', label: 'Citizen', icon: '👤', desc: 'Report and save animals' },
                    { value: 'ngo', label: 'NGO', icon: '🌿', desc: 'Rescue organization' },
                    { value: 'hospital', label: 'Hospital', icon: '🏥', desc: 'Animal medical center' },
                    { value: 'ambulance', label: 'Ambulance', icon: '🚑', desc: 'Emergency logistics' },
                  ].map((item) => {
                    const isSelected = form.role === item.value;
                    return (
                      <AnimatedPress
                        key={item.value}
                        onPress={() => setForm({ ...form, role: item.value as Role })}
                        containerStyle={{ width: '48.5%', marginBottom: 10 }}
                        style={[S.roleCard, isSelected && S.roleCardActive]}
                      >
                        <View style={S.roleCardHeader}>
                          <Text style={S.roleCardIcon}>{item.icon}</Text>
                          {isSelected && (
                            <View style={S.roleCardBadge}>
                              <Ionicons name="checkmark-circle" size={14} color={C.brand} />
                            </View>
                          )}
                        </View>
                        <Text style={[S.roleCardTitle, isSelected && S.roleCardTitleActive]}>
                          {item.label}
                        </Text>
                        <Text style={S.roleCardDesc}>{item.desc}</Text>
                      </AnimatedPress>
                    );
                  })}
                </View>
              </View>
            </>
          )}

          <FormField
            label="Email"
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

          {mode === 'register' && form.role !== 'user' && (
            <>
              <FormField
                label="Organisation Name"
                value={form.orgName}
                onChangeText={(orgName) => setForm({ ...form, orgName })}
                placeholder="Your org name"
                icon="business-outline"
              />
              <FormField
                label="Reg. Number"
                value={form.regNumber}
                onChangeText={(regNumber) => setForm({ ...form, regNumber })}
                placeholder="Registration number"
                icon="document-text-outline"
              />
              <FormField
                label="Phone"
                value={form.phone}
                onChangeText={(phone) => setForm({ ...form, phone })}
                keyboardType="phone-pad"
                placeholder="+91 ..."
                icon="call-outline"
              />
              <FormField
                label="Address"
                value={form.address}
                onChangeText={(address) => setForm({ ...form, address })}
                placeholder="City, State"
                icon="location-outline"
              />
              {form.role === 'hospital' && (
                <View style={{ marginBottom: 4 }}>
                  <Text style={S.fieldLabel}>Hospital Type</Text>
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
              {form.role === 'ambulance' && (
                <FormField
                  label="Vehicle Number"
                  value={form.vehicleNumber}
                  onChangeText={(vehicleNumber) => setForm({ ...form, vehicleNumber })}
                  placeholder="DL 01 AB 1234"
                  icon="car-outline"
                />
              )}
            </>
          )}

          <AnimatedPress onPress={submit} disabled={loading} style={S.btnPrimary}>
            {loading ? (
              <ActivityIndicator color="#0e0e0e" size="small" />
            ) : (
              <>
                <Ionicons
                  name={mode === 'login' ? 'log-in' : 'person-add'}
                  size={18}
                  color={C.bgMain}
                />
                <Text style={S.btnPrimaryText}>{mode === 'login' ? 'Sign In' : 'Create Account'}</Text>
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
            disabled={!GOOGLE_WEB_CLIENT_ID && !GOOGLE_ANDROID_CLIENT_ID}
            style={S.btnGoogle}
          >
            <Ionicons name="logo-google" size={18} color="#EA4335" />
            <Text style={S.btnGoogleText}>Continue with Google</Text>
          </AnimatedPress>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
