import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  Dimensions,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import {
  useFonts,
  Manrope_400Regular,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import axios, { AxiosInstance } from 'axios';
import { io, Socket } from 'socket.io-client';
import RazorpayCheckout from 'react-native-razorpay';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

WebBrowser.maybeCompleteAuthSession();

const { width: SW } = Dimensions.get('window');

// ─── Config ────────────────────────────────────────────────────────────────
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://resqpet-backend.onrender.com/api';
const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || API_URL.replace('/api', '');
const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '';
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
const MAP_STYLE_URL = process.env.EXPO_PUBLIC_MAP_STYLE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

const TOKEN_KEY = 'vetscue_token';
const ADMIN_TOKEN_KEY = 'vetscue_admin_token';
const USER_KEY = 'vetscue_user';

// ─── Design Tokens ──────────────────────────────────────────────────────────
const C = {
  bgMain: '#0e0e0e',
  bgSurface: '#1c1b1b',
  bgElevated: '#242323',
  bgHover: '#2a2a2a',
  brand: '#76d6d5',
  brandDark: '#5cb8b7',
  brandDim: '#76d6d5',
  brandRgb: '118,214,213',
  textMain: '#e5e2e1',
  textMuted: '#879392',
  borderMain: 'rgba(255,255,255,0.06)',
  borderSurface: 'rgba(255,255,255,0.10)',
  success: '#4ade80',
  warning: '#fbbf24',
  error: '#f87171',
  info: '#60a5fa',
  white: '#ffffff',
} as const;

// ─── Types ──────────────────────────────────────────────────────────────────
type Role = 'user' | 'ngo' | 'hospital' | 'ambulance' | 'admin';
type Tab = 'home' | 'cases' | 'map' | 'wallet' | 'alerts' | 'admin' | 'profile';

type User = {
  _id: string;
  name: string;
  email: string;
  role: Role;
  isAdmin?: boolean;
  isApproved?: boolean;
  walletBalance?: number;
  orgName?: string;
  phone?: string;
  vehicleNumber?: string;
  location?: { lat?: number; lng?: number; address?: string };
  impersonating?: unknown;
};

type Rescue = {
  _id: string;
  description: string;
  status: string;
  animalType?: string;
  location?: { lat?: number; lng?: number; address?: string };
  createdAt?: string;
  images?: string[];
  video?: string | null;
  amountRaised?: number;
  estimatedCost?: number;
  fundraiser?: { status?: string; requestedGoal?: number; adminNotes?: string };
  bill?: { totalAmount?: number; paidStatus?: string };
  assignedNGO?: { name?: string; orgName?: string; phone?: string };
  assignedHospital?: { name?: string; orgName?: string; phone?: string };
  assignedAmbulance?: { name?: string; vehicleNumber?: string; phone?: string };
};

// ─── API Client ─────────────────────────────────────────────────────────────
const api: AxiosInstance = axios.create({ baseURL: API_URL, timeout: 20000 });

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Helpers ────────────────────────────────────────────────────────────────
const statusColor = (status?: string): string => {
  if (!status) return C.textMuted;
  if (['completed', 'resolved_on_spot', 'delivered', 'approved'].includes(status)) return C.success;
  if (['pending', 'hospital_broadcasted', 'ambulance_pinged', 'fundraiser_active'].includes(status)) return C.warning;
  if (['cancelled', 'closed_unresolved', 'rejected'].includes(status)) return C.error;
  return C.brand;
};

const statusBg = (status?: string): string => {
  const c = statusColor(status);
  return `${c}1A`; // ~10% opacity
};

const compactDate = (value?: string): string => {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const roleLabel: Record<Role, string> = {
  user: 'Citizen',
  ngo: 'NGO',
  hospital: 'Hospital',
  ambulance: 'Ambulance',
  admin: 'Admin',
};

const titleForRole: Record<Role, string> = {
  user: 'Citizen Rescue',
  ngo: 'NGO Response Board',
  hospital: 'Hospital Desk',
  ambulance: 'Ambulance Crew',
  admin: 'Admin Command',
};

// ─── Animated Pressable ─────────────────────────────────────────────────────
function AnimatedPress({
  children,
  onPress,
  style,
  containerStyle,
  disabled,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
  containerStyle?: any;
  disabled?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const handleIn = () =>
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start();
  const handleOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      onPressIn={handleIn}
      onPressOut={handleOut}
      style={[{ opacity: disabled ? 0.45 : 1 }, containerStyle]}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

// ─── Root App ───────────────────────────────────────────────────────────────
export default function App() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  const [token, setToken] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);
  const [tab, setTab] = useState<Tab>('home');
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    api.interceptors.request.use(async (config) => {
      const stored = await SecureStore.getItemAsync(TOKEN_KEY);
      if (stored) config.headers.Authorization = `Bearer ${stored}`;
      return config;
    });
  }, []);

  const persistSession = useCallback(async (nextUser: User, nextToken: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, nextToken);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
    setTab('home');
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch {}
    const pushToken = await SecureStore.getItemAsync('vetscue_push_token');
    if (pushToken) {
      try { await api.delete('/user/push-token', { data: { token: pushToken } }); } catch {}
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(ADMIN_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    setToken(null);
    setAdminToken(null);
    setUser(null);
    socketRef.current?.disconnect();
  }, []);

  const refreshMe = useCallback(async () => {
    const { data } = await api.get('/auth/me');
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
    return data.user as User;
  }, []);

  const registerPushToken = useCallback(async () => {
    if (!Device.isDevice) return;
    const permission = await Notifications.requestPermissionsAsync();
    if (!permission.granted) return;
    const push = await Notifications.getDevicePushTokenAsync();
    await api.post('/user/push-token', {
      token: push.data,
      platform: Platform.OS,
      deviceId: Device.osInternalBuildId || Device.deviceName || '',
    });
    await SecureStore.setItemAsync('vetscue_push_token', push.data);
  }, []);

  useEffect(() => {
    const boot = async () => {
      try {
        const [storedToken, storedAdminToken, storedUser] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(ADMIN_TOKEN_KEY),
          SecureStore.getItemAsync(USER_KEY),
        ]);
        if (storedToken) {
          setToken(storedToken);
          setAdminToken(storedAdminToken);
          if (storedUser) setUser(JSON.parse(storedUser));
          await refreshMe();
        }
      } catch {
        await logout();
      } finally {
        setBooting(false);
      }
    };
    boot();
  }, [logout, refreshMe]);

  useEffect(() => {
    if (!token || !user) return;
    registerPushToken().catch(() => undefined);
    const socket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ['websocket'],
      auth: { token },
    });
    socketRef.current = socket;
    socket.on('connect', () => socket.emit('join', { userId: user._id, role: user.role }));
    socket.on('new_rescue_alert', (p) => Alert.alert('🚨 New rescue nearby', p?.description || 'A new case needs attention.'));
    socket.on('new_dispatch_alert', (p) => Alert.alert('🚑 New dispatch', p?.description || 'A new ambulance dispatch is available.'));
    socket.on('status_update', (p) => Alert.alert('📋 Case updated', p?.message || `Status changed to ${p?.status}`));
    return () => { socket.disconnect(); };
  }, [registerPushToken, token, user]);

  if (booting || !fontsLoaded) return <SplashScreen />;
  if (!token || !user) return <AuthScreen onLogin={persistSession} />;


  return (
    <SafeAreaView style={S.safe}>
      <ExpoStatusBar style="light" backgroundColor={C.bgMain} />
      <StatusBar barStyle="light-content" backgroundColor={C.bgMain} />
      <View style={S.shell}>
        <AppHeader
          user={user}
          adminToken={adminToken}
          onLogout={logout}
          onStopImpersonating={async () => {
            const original = await SecureStore.getItemAsync(ADMIN_TOKEN_KEY);
            if (!original) return;
            await SecureStore.setItemAsync(TOKEN_KEY, original);
            await SecureStore.deleteItemAsync(ADMIN_TOKEN_KEY);
            setAdminToken(null);
            setToken(original);
            await refreshMe();
          }}
        />
        <MainScreen
          user={user}
          tab={tab}
          socket={socketRef.current}
          setTab={setTab}
          setUser={setUser}
          setToken={setToken}
          setAdminToken={setAdminToken}
        />
        <TabBar role={user.role} tab={tab} setTab={setTab} />
      </View>
    </SafeAreaView>
  );
}

// ─── Splash ─────────────────────────────────────────────────────────────────
function SplashScreen() {
  const pulse = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.6, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  return (
    <View style={[S.center, { backgroundColor: C.bgMain }]}>
      <Animated.View style={[S.brandLogo, { opacity: pulse }]}>
        <Text style={{ fontSize: 32 }}>🐾</Text>
      </Animated.View>
      <Text style={S.splashTitle}>VetsCue</Text>
      <Text style={S.splashSub}>Connecting care. Saving lives.</Text>
      <ActivityIndicator style={{ marginTop: 32 }} color={C.brand} size="small" />
    </View>
  );
}

// ─── Auth Screen ─────────────────────────────────────────────────────────────
function AuthScreen({ onLogin }: { onLogin: (user: User, token: string) => Promise<void> }) {
  const [mode, setMode] = useState<'landing' | 'login' | 'register'>('landing');
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    role: 'user' as Role,
    phone: '', orgName: '', regNumber: '', address: '', vehicleNumber: '', hospitalType: 'private',
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
    run().catch((error) => Alert.alert('Google login failed', error.response?.data?.message || error.message));
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

        <ScrollView
          contentContainerStyle={S.landingContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <View style={S.heroContainer}>
            <View style={S.authGlow} pointerEvents="none" />
            <View style={[S.pilotBadge, { marginBottom: 16, alignSelf: 'center' }]}>
              <View style={S.pilotDot} />
              <Text style={S.pilotText}>Pilot Launch · Shahdara & NE Delhi</Text>
            </View>
            
            <Text style={S.heroTitleText}>
              The Ultimate{'\n'}Sanctuary.{'\n'}
              <Text style={{ color: C.brand }}>For Every Pet</Text>{'\n'}
              & Guardian.
            </Text>
            
            <Text style={S.heroDescText}>
              Discover a complete ecosystem for pet life: seamless adoption, world-class health services, a vibrant community, and rapid emergency response.{'\n'}
              <Text style={{ color: C.brand, fontWeight: '700' }}>One Hybrid Platform. Endless Care.</Text>
            </Text>

            <View style={S.heroActionButtons}>
              <AnimatedPress 
                onPress={() => { setForm({ ...form, role: 'user' }); setMode('register'); }} 
                style={S.btnPrimary}
              >
                <Text style={S.btnPrimaryText}>🐾 Report a Rescue</Text>
              </AnimatedPress>
              
              <View style={S.row}>
                <AnimatedPress 
                  onPress={() => { setForm({ ...form, role: 'ngo' }); setMode('register'); }} 
                  containerStyle={{ flex: 1 }}
                  style={[S.btnOutline, { paddingVertical: 14 }]}
                >
                  <Text style={S.btnOutlineText}>🌿 NGO Partner</Text>
                </AnimatedPress>
                <AnimatedPress 
                  onPress={() => { setForm({ ...form, role: 'ambulance' }); setMode('register'); }} 
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
              A community-driven flow linking citizens with NGOs, bringing comprehensive care to stray and domestic pets alike.
            </Text>

            <View style={S.stepsStack}>
              {[
                { icon: '📝', title: '1. Report', desc: 'Spot a stray or pet in distress and log a request with location.' },
                { icon: '🤝', title: '2. Respond', desc: 'Nearby verified partners are notified and can accept if available.' },
                { icon: '⚡', title: '3. Escalate', desc: 'System alerts available partners who try their best to provide a response.' },
                { icon: '✅', title: '4. Resolve', desc: 'Partner resolves the case. Our future roadmap connects you with vets!' },
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
                { icon: '🚑', title: 'Emergency Ambulance', desc: 'Book a dedicated animal ambulance for emergencies. Instant dispatch, live tracking.', border: '#fb7185' },
                { icon: '👨‍⚕️', title: 'Consult a Vet', desc: 'Connect with verified veterinary doctors via video or chat. Available 24/7.', border: '#60a5fa' },
                { icon: '🛍️', title: 'Pet Marketplace', desc: 'Quality pet care products, medicines and food — delivered to your door.', border: '#c084fc' },
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
              Whether you are a citizen, NGO, hospital, or ambulance partner -- VetsCue helps you act fast.
            </Text>
            <View style={S.ctaActions}>
              <AnimatedPress 
                onPress={() => { setForm({ ...form, role: 'user' }); setMode('register'); }} 
                containerStyle={{ flex: 1 }}
                style={[S.btnPrimary, { backgroundColor: '#ffffff' }]}
              >
                <Text style={[S.btnPrimaryText, { color: C.bgMain }]}>Report Rescue</Text>
              </AnimatedPress>
              <AnimatedPress 
                onPress={() => { setForm({ ...form, role: 'ngo' }); setMode('register'); }} 
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
              <TouchableOpacity onPress={() => { setForm({ ...form, role: 'user' }); setMode('register'); }}>
                <Text style={S.footerLinkText}>Register</Text>
              </TouchableOpacity>
              <Text style={S.footerDivider}>•</Text>
              <TouchableOpacity onPress={() => Alert.alert('Support', 'Contact us at support@vetscue.com')}>
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
        contentContainerStyle={[S.authContainer, (mode === 'login' || mode === 'register') && { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 16, gap: 10 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Decorative radial glow */}
        <View style={S.authGlow} pointerEvents="none" />

        {/* Brand */}
        {mode === 'login' ? (
          <View style={{ alignItems: 'center', gap: 4, marginTop: 4, marginBottom: 4 }}>
            <View style={[S.brandLogo, { width: 44, height: 44, borderRadius: 12, shadowOpacity: 0.1, elevation: 2 }]}>
              <Text style={{ fontSize: 20 }}>🐾</Text>
            </View>
            <Text style={[S.authTitle, { fontSize: 22, letterSpacing: -0.5, marginTop: 2 }]}>Welcome back</Text>
            <Text style={[S.authSubtitle, { fontSize: 13, lineHeight: 18, color: C.textMuted }]}>Sign in to continue rescue operations</Text>
          </View>
        ) : (
          <View style={{ alignItems: 'center', gap: 4, marginTop: 4, marginBottom: 4 }}>
            <View style={[S.brandLogo, { width: 44, height: 44, borderRadius: 12, shadowOpacity: 0.1, elevation: 2 }]}>
              <Text style={{ fontSize: 20 }}>🐾</Text>
            </View>
            <Text style={[S.authTitle, { fontSize: 22, letterSpacing: -0.5, marginTop: 2 }]}>Create Account</Text>
            <Text style={[S.authSubtitle, { fontSize: 13, lineHeight: 18, color: C.textMuted }]}>Join the VetsCue rescue network</Text>
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
              <FormField label="Full Name" value={form.name} onChangeText={(name) => setForm({ ...form, name })} placeholder="Your name" icon="person-outline" />
              
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
                        style={[
                          S.roleCard,
                          isSelected && S.roleCardActive
                        ]}
                      >
                        <View style={S.roleCardHeader}>
                          <Text style={S.roleCardIcon}>{item.icon}</Text>
                          {isSelected && (
                            <View style={S.roleCardBadge}>
                              <Ionicons name="checkmark-circle" size={14} color={C.brand} />
                            </View>
                          )}
                        </View>
                        <Text style={[S.roleCardTitle, isSelected && S.roleCardTitleActive]}>{item.label}</Text>
                        <Text style={S.roleCardDesc}>{item.desc}</Text>
                      </AnimatedPress>
                    );
                  })}
                </View>
              </View>
            </>
          )}

          <FormField label="Email" value={form.email} onChangeText={(email) => setForm({ ...form, email })} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" icon="mail-outline" />
          <FormField label="Password" value={form.password} onChangeText={(password) => setForm({ ...form, password })} secureTextEntry placeholder="••••••••" icon="lock-closed-outline" />

          {mode === 'register' && form.role !== 'user' && (
            <>
              <FormField label="Organisation Name" value={form.orgName} onChangeText={(orgName) => setForm({ ...form, orgName })} placeholder="Your org name" icon="business-outline" />
              <FormField label="Reg. Number" value={form.regNumber} onChangeText={(regNumber) => setForm({ ...form, regNumber })} placeholder="Registration number" icon="document-text-outline" />
              <FormField label="Phone" value={form.phone} onChangeText={(phone) => setForm({ ...form, phone })} keyboardType="phone-pad" placeholder="+91 ..." icon="call-outline" />
              <FormField label="Address" value={form.address} onChangeText={(address) => setForm({ ...form, address })} placeholder="City, State" icon="location-outline" />
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
                        <Text style={[S.chipText, form.hospitalType === t && S.chipTextActive, { textTransform: 'capitalize' }]}>{t}</Text>
                      </AnimatedPress>
                    ))}
                  </View>
                </View>
              )}
              {form.role === 'ambulance' && (
                <FormField label="Vehicle Number" value={form.vehicleNumber} onChangeText={(vehicleNumber) => setForm({ ...form, vehicleNumber })} placeholder="DL 01 AB 1234" icon="car-outline" />
              )}
            </>
          )}

          <AnimatedPress onPress={submit} disabled={loading} style={S.btnPrimary}>
            {loading ? (
              <ActivityIndicator color="#0e0e0e" size="small" />
            ) : (
              <>
                <Ionicons name={mode === 'login' ? 'log-in' : 'person-add'} size={18} color={C.bgMain} />
                <Text style={S.btnPrimaryText}>{mode === 'login' ? 'Sign In' : 'Create Account'}</Text>
              </>
            )}
          </AnimatedPress>

          <View style={S.dividerRow}>
            <View style={S.dividerLine} />
            <Text style={S.dividerText}>or continue with</Text>
            <View style={S.dividerLine} />
          </View>

          <AnimatedPress onPress={() => promptGoogle()} disabled={!GOOGLE_WEB_CLIENT_ID && !GOOGLE_ANDROID_CLIENT_ID} style={S.btnGoogle}>
            <Ionicons name="logo-google" size={18} color="#EA4335" />
            <Text style={S.btnGoogleText}>Continue with Google</Text>
          </AnimatedPress>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Main Screen Router ──────────────────────────────────────────────────────
function MainScreen(props: {
  user: User; tab: Tab; socket: Socket | null;
  setTab: (t: Tab) => void; setUser: (u: User) => void;
  setToken: (t: string) => void; setAdminToken: (t: string) => void;
}) {
  const { user, tab } = props;
  if (tab === 'cases') return <CasesScreen user={user} />;
  if (tab === 'map') return <MapScreen user={user} socket={props.socket} />;
  if (tab === 'wallet') return <WalletScreen user={user} setUser={props.setUser} />;
  if (tab === 'alerts') return <NotificationsScreen />;
  if (tab === 'profile') return <ProfileScreen user={user} setUser={props.setUser} />;
  if (tab === 'admin' || user.role === 'admin') {
    return <AdminScreen setToken={props.setToken} setAdminToken={props.setAdminToken} setUser={props.setUser} />;
  }
  if (user.role === 'ngo') return <NgoHome />;
  if (user.role === 'hospital') return <HospitalHome />;
  if (user.role === 'ambulance') return <AmbulanceHome socket={props.socket} />;
  return <CitizenHome setTab={props.setTab} />;
}

// ─── Citizen Home ────────────────────────────────────────────────────────────
function CitizenHome({ setTab }: { setTab: (t: Tab) => void }) {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => {
    api.get('/public/stats').then(({ data }) => setStats(data.stats)).catch(() => undefined);
  }, []);

  return (
    <ScreenShell>
      {/* Hero gradient card */}
      <View style={S.heroCard}>
        <View style={S.heroGlow} pointerEvents="none" />
        <Text style={S.heroKicker}>🐾 Rescue Network</Text>
        <Text style={S.heroTitle}>Rescue Command</Text>
        <Text style={S.heroSub}>Submit rescues, track help, fund urgent care, and follow impact stories.</Text>
        <View style={S.heroActions}>
          <AnimatedPress onPress={() => setTab('cases')} style={[S.btnPrimary, { flex: 1 }]}>
            <Ionicons name="add-circle" size={18} color={C.bgMain} />
            <Text style={S.btnPrimaryText}>Report Animal</Text>
          </AnimatedPress>
          <AnimatedPress onPress={() => setTab('wallet')} style={[S.btnOutline, { flex: 1 }]}>
            <Ionicons name="wallet-outline" size={18} color={C.brand} />
            <Text style={S.btnOutlineText}>Wallet</Text>
          </AnimatedPress>
        </View>
      </View>

      {/* Stats grid */}
      <SectionHeader title="Platform Stats" />
      <View style={S.statsGrid}>
        <StatCard label="Total Rescues" value={stats?.totalRequests ?? '—'} icon="paw" color={C.brand} />
        <StatCard label="Completed" value={stats?.completedRequests ?? '—'} icon="checkmark-circle" color={C.success} />
        <StatCard label="NGOs Active" value={stats?.totalNGOs ?? '—'} icon="leaf" color={C.info} />
        <StatCard label="Citizens" value={stats?.totalUsers ?? '—'} icon="people" color={C.warning} />
      </View>

      <FundraisersSection compact />
      <ImpactFeed />
    </ScreenShell>
  );
}

// ─── Cases Screen ─────────────────────────────────────────────────────────────
function CasesScreen({ user }: { user: User }) {
  if (user.role === 'user') return <UserCases />;
  if (user.role === 'ngo') return <NgoCases />;
  if (user.role === 'hospital') return <HospitalCases />;
  if (user.role === 'ambulance') return <AmbulanceCases />;
  return <AdminRescues />;
}

// ─── User Cases ───────────────────────────────────────────────────────────────
function UserCases() {
  const [rescues, setRescues] = useState<Rescue[]>([]);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [animalType, setAnimalType] = useState('dog');
  const [media, setMedia] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/rescue/mine');
      setRescues(data.rescues || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pickMedia = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission needed', 'Allow media access to attach rescue evidence.');
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
    });
    if (!result.canceled) setMedia(result.assets.slice(0, 6));
  };

  const submitRescue = async () => {
    if (!description.trim()) return;
    setSubmitting(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) { Alert.alert('Location needed', 'Location is required to route rescuers.'); return; }
      const pos = await Location.getCurrentPositionAsync({});
      const fd = new FormData();
      fd.append('description', description);
      fd.append('animalType', animalType);
      fd.append('lat', String(pos.coords.latitude));
      fd.append('lng', String(pos.coords.longitude));
      fd.append('willingToPay', 'false');
      fd.append('willingToGo', 'false');
      media.forEach((asset, i) => {
        fd.append('media', {
          uri: asset.uri,
          name: asset.fileName || `rescue-${i}.${asset.type === 'video' ? 'mp4' : 'jpg'}`,
          type: asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
        } as any);
      });
      await api.post('/rescue', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setDescription('');
      setMedia([]);
      await load();
      Alert.alert('✅ Rescue submitted', 'Responders have been alerted.');
    } catch (e: any) {
      Alert.alert('Failed', e.response?.data?.message || e.message);
    } finally { setSubmitting(false); }
  };

  return (
    <ScreenShell refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={C.brand} />}>
      <ScreenHeader title="My Rescues" subtitle="Submit and track your rescue requests" />

      {/* Submit form */}
      <SurfaceCard>
        <Text style={S.cardSectionTitle}>📋 New Rescue Report</Text>
        <FormField
          label="What happened?"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the animal's condition and location..."
          multiline
          icon="document-text-outline"
        />
        <View style={{ marginBottom: 8 }}>
          <Text style={S.fieldLabel}>Animal Type</Text>
          <View style={S.chipRow}>
            {['dog', 'cat', 'bird', 'other'].map((t) => (
              <AnimatedPress key={t} onPress={() => setAnimalType(t)} style={[S.chip, animalType === t && S.chipActive]}>
                <Text style={[S.chipText, animalType === t && S.chipTextActive]}>
                  {t === 'dog' ? '🐕' : t === 'cat' ? '🐈' : t === 'bird' ? '🐦' : '🐾'} {t}
                </Text>
              </AnimatedPress>
            ))}
          </View>
        </View>
        <AnimatedPress onPress={pickMedia} style={S.btnOutline}>
          <Ionicons name="images-outline" size={18} color={C.brand} />
          <Text style={S.btnOutlineText}>{media.length > 0 ? `${media.length} file(s) selected` : 'Attach Photos / Video'}</Text>
        </AnimatedPress>
        <AnimatedPress onPress={submitRescue} disabled={!description.trim() || submitting} style={S.btnPrimary}>
          {submitting ? <ActivityIndicator color={C.bgMain} size="small" /> : (
            <>
              <Ionicons name="navigate" size={18} color={C.bgMain} />
              <Text style={S.btnPrimaryText}>Submit at Current Location</Text>
            </>
          )}
        </AnimatedPress>
      </SurfaceCard>

      {/* Rescue list */}
      {rescues.length > 0 && (
        <>
          <SectionHeader title={`Your Rescues (${rescues.length})`} />
          {rescues.map((r) => (
            <RescueCard key={r._id} rescue={r} actions={<UserRescueActions rescue={r} onDone={load} />} />
          ))}
        </>
      )}
    </ScreenShell>
  );
}

function UserRescueActions({ rescue, onDone }: { rescue: Rescue; onDone: () => void }) {
  const [cost, setCost] = useState('');
  return (
    <View style={S.actionGroup}>
      <AnimatedPress onPress={async () => { await api.put(`/rescue/${rescue._id}/cancel`); onDone(); }} style={S.btnDanger}>
        <Ionicons name="close-circle-outline" size={16} color={C.error} />
        <Text style={S.btnDangerText}>Cancel Rescue</Text>
      </AnimatedPress>
      <View style={S.row}>
        <TextInput
          style={[S.input, { flex: 1 }]}
          value={cost}
          onChangeText={setCost}
          placeholder="Estimated cost (₹)"
          placeholderTextColor={C.textMuted}
          keyboardType="numeric"
        />
        <AnimatedPress onPress={async () => {
          if (!cost) return;
          await api.put(`/rescue/${rescue._id}/fundraiser`, { estimatedCost: Number(cost) });
          setCost('');
          onDone();
        }} disabled={!cost} style={[S.btnOutline, { marginLeft: 8 }]}>
          <Ionicons name="heart-outline" size={16} color={C.brand} />
          <Text style={S.btnOutlineText}>Fundraiser</Text>
        </AnimatedPress>
      </View>
      {rescue.bill?.paidStatus === 'pending' && (
        <AnimatedPress onPress={async () => { await api.post(`/rescue/${rescue._id}/pay-bill`); onDone(); }} style={S.btnPrimary}>
          <Ionicons name="card" size={16} color={C.bgMain} />
          <Text style={S.btnPrimaryText}>Pay Hospital Bill</Text>
        </AnimatedPress>
      )}
    </View>
  );
}

// ─── NGO Home / Cases ─────────────────────────────────────────────────────────
function NgoHome() {
  const [analytics, setAnalytics] = useState<any>(null);
  useEffect(() => {
    api.get('/ngo/analytics').then(({ data }) => setAnalytics(data.analytics || data)).catch(() => undefined);
  }, []);
  return (
    <ScreenShell>
      <ScreenHeader title="NGO Response Board" subtitle="Nearby reports, active treatment, escalation & follow-ups" />
      <View style={S.statsGrid}>
        <StatCard label="Nearby" value={analytics?.nearbyCases ?? '—'} icon="location" color={C.brand} />
        <StatCard label="Active" value={analytics?.activeCases ?? '—'} icon="pulse" color={C.warning} />
        <StatCard label="Completed" value={analytics?.completedCases ?? '—'} icon="checkmark-circle" color={C.success} />
        <StatCard label="Impact" value={analytics?.impactCases ?? '—'} icon="heart" color={C.error} />
      </View>
      <NgoCases />
    </ScreenShell>
  );
}

function NgoCases() {
  const [nearby, setNearby] = useState<Rescue[]>([]);
  const [mine, setMine] = useState<Rescue[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'nearby' | 'mine'>('nearby');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nearbyRes, mineRes] = await Promise.all([api.get('/ngo/nearby'), api.get('/ngo/my-cases')]);
      setNearby(nearbyRes.data.cases || nearbyRes.data.rescues || []);
      setMine(mineRes.data.cases || mineRes.data.rescues || []);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const list = activeTab === 'nearby' ? nearby : mine;

  return (
    <ScreenShell refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={C.brand} />}>
      <SegmentedControl
        options={[{ key: 'nearby', label: `Nearby (${nearby.length})` }, { key: 'mine', label: `My Cases (${mine.length})` }]}
        active={activeTab}
        onChange={(k) => setActiveTab(k as any)}
      />
      {list.length === 0 ? (
        <EmptyState icon="leaf" message="No cases in this section" />
      ) : (
        list.map((r) => <RescueCard key={r._id} rescue={r} actions={<NgoActions rescue={r} onDone={load} />} />)
      )}
    </ScreenShell>
  );
}

function NgoActions({ rescue, onDone }: { rescue: Rescue; onDone: () => void }) {
  const [followUp, setFollowUp] = useState('');
  const act = async (path: string, body?: any) => {
    try {
      await api[path.startsWith('/ngo') ? 'post' : 'put'](path, body || {});
      onDone();
    } catch (e: any) { Alert.alert('Error', e.response?.data?.message || e.message); }
  };
  return (
    <View style={S.actionGroup}>
      <View style={S.row}>
        <AnimatedPress onPress={() => act(`/rescue/${rescue._id}/accept-ngo`, { type: 'immediate', transportType: 'self' })} style={[S.btnPrimary, { flex: 1 }]}>
          <Ionicons name="checkmark-circle" size={16} color={C.bgMain} />
          <Text style={S.btnPrimaryText}>Accept</Text>
        </AnimatedPress>
        <AnimatedPress onPress={() => act(`/rescue/${rescue._id}/reject-ngo`)} style={[S.btnDanger, { flex: 1, marginLeft: 8 }]}>
          <Ionicons name="close-circle-outline" size={16} color={C.error} />
          <Text style={S.btnDangerText}>Reject</Text>
        </AnimatedPress>
      </View>
      <View style={S.row}>
        <AnimatedPress onPress={() => act(`/rescue/${rescue._id}/ngo-status`, { status: 'on_the_way' })} style={[S.btnOutline, { flex: 1 }]}>
          <Ionicons name="walk-outline" size={16} color={C.brand} />
          <Text style={S.btnOutlineText}>On the Way</Text>
        </AnimatedPress>
        <AnimatedPress onPress={() => act(`/rescue/${rescue._id}/resolve-ngo`)} style={[S.btnOutline, { flex: 1, marginLeft: 8 }]}>
          <Ionicons name="medkit-outline" size={16} color={C.brand} />
          <Text style={S.btnOutlineText}>Resolve On Spot</Text>
        </AnimatedPress>
      </View>
      <AnimatedPress onPress={() => act(`/rescue/${rescue._id}/escalate-ngo`, { transportType: 'ambulance' })} style={S.btnOutline}>
        <Ionicons name="business-outline" size={16} color={C.brand} />
        <Text style={S.btnOutlineText}>Escalate to Hospital</Text>
      </AnimatedPress>
      <View style={S.row}>
        <TextInput
          style={[S.input, { flex: 1 }]}
          value={followUp}
          onChangeText={setFollowUp}
          placeholder="Follow-up note or date..."
          placeholderTextColor={C.textMuted}
        />
        <AnimatedPress onPress={async () => {
          await api.post(`/rescue/${rescue._id}/followup`, { scheduleDate: followUp || new Date().toISOString(), notes: followUp });
          setFollowUp('');
          onDone();
        }} style={[S.btnOutline, { marginLeft: 8 }]}>
          <Ionicons name="calendar-outline" size={16} color={C.brand} />
          <Text style={S.btnOutlineText}>Add</Text>
        </AnimatedPress>
      </View>
    </View>
  );
}

// ─── Hospital Home / Cases ────────────────────────────────────────────────────
function HospitalHome() {
  return (
    <ScreenShell>
      <ScreenHeader title="Hospital Desk" subtitle="Accept escalations, manage treatment, bill cases & coordinate ambulances" />
      <HospitalCases />
    </ScreenShell>
  );
}

function HospitalCases() {
  const [escalated, setEscalated] = useState<Rescue[]>([]);
  const [mine, setMine] = useState<Rescue[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'escalated' | 'mine'>('escalated');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, b] = await Promise.all([api.get('/hospital/escalated'), api.get('/hospital/my-cases')]);
      setEscalated(a.data.cases || a.data.rescues || []);
      setMine(b.data.cases || b.data.rescues || []);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const list = activeTab === 'escalated' ? escalated : mine;

  return (
    <ScreenShell refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={C.brand} />}>
      <SegmentedControl
        options={[{ key: 'escalated', label: `Escalated (${escalated.length})` }, { key: 'mine', label: `My Cases (${mine.length})` }]}
        active={activeTab}
        onChange={(k) => setActiveTab(k as any)}
      />
      {list.length === 0 ? (
        <EmptyState icon="medkit" message="No cases in this section" />
      ) : (
        list.map((r) => <RescueCard key={r._id} rescue={r} actions={<HospitalActions rescue={r} onDone={load} />} />)
      )}
      <FleetManager />
    </ScreenShell>
  );
}

function HospitalActions({ rescue, onDone }: { rescue: Rescue; onDone: () => void }) {
  const [bill, setBill] = useState('');
  const [note, setNote] = useState('');
  return (
    <View style={S.actionGroup}>
      <View style={S.row}>
        <AnimatedPress onPress={async () => { await api.put(`/hospital/rescue/${rescue._id}/accept-broadcast`); onDone(); }} style={[S.btnPrimary, { flex: 1 }]}>
          <Ionicons name="checkmark-done" size={16} color={C.bgMain} />
          <Text style={S.btnPrimaryText}>Accept</Text>
        </AnimatedPress>
        <AnimatedPress onPress={async () => { await api.put(`/hospital/rescue/${rescue._id}/reject-broadcast`); onDone(); }} style={[S.btnDanger, { flex: 1, marginLeft: 8 }]}>
          <Ionicons name="close" size={16} color={C.error} />
          <Text style={S.btnDangerText}>Reject</Text>
        </AnimatedPress>
      </View>
      <View style={S.row}>
        <TextInput style={[S.input, { flex: 1 }]} value={note} onChangeText={setNote} placeholder="Treatment note..." placeholderTextColor={C.textMuted} />
        <AnimatedPress onPress={async () => {
          await api.put(`/hospital/rescue/${rescue._id}/treatment`, { treatmentStatus: 'under_treatment', hospitalNote: note });
          setNote(''); onDone();
        }} style={[S.btnOutline, { marginLeft: 8 }]}>
          <Ionicons name="pulse" size={16} color={C.brand} />
          <Text style={S.btnOutlineText}>Update</Text>
        </AnimatedPress>
      </View>
      <View style={S.row}>
        <TextInput style={[S.input, { flex: 1 }]} value={bill} onChangeText={setBill} placeholder="Bill amount (₹)" placeholderTextColor={C.textMuted} keyboardType="numeric" />
        <AnimatedPress onPress={async () => {
          await api.post(`/hospital/rescue/${rescue._id}/bill`, { items: [{ name: 'Treatment', amount: Number(bill) }], totalAmount: Number(bill), sentTo: 'user' });
          setBill(''); onDone();
        }} disabled={!bill} style={[S.btnPrimary, { marginLeft: 8 }]}>
          <Ionicons name="receipt" size={16} color={C.bgMain} />
          <Text style={S.btnPrimaryText}>Send Bill</Text>
        </AnimatedPress>
      </View>
    </View>
  );
}

function FleetManager() {
  const [ambulances, setAmbulances] = useState<User[]>([]);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const load = useCallback(async () => {
    const { data } = await api.get('/hospital/ambulances');
    setAmbulances(data.ambulances || []);
  }, []);
  useEffect(() => { load().catch(() => undefined); }, [load]);
  return (
    <View>
      <SectionHeader title="🚑 Fleet Manager" />
      <SurfaceCard>
        <View style={S.row}>
          <TextInput style={[S.input, { flex: 1 }]} value={vehicleNumber} onChangeText={setVehicleNumber} placeholder="Vehicle number (e.g. DL 01 AB 1234)" placeholderTextColor={C.textMuted} />
          <AnimatedPress onPress={async () => {
            if (!vehicleNumber) return;
            await api.post('/hospital/onboard-ambulance', { vehicleNumber, name: `Ambulance ${vehicleNumber}` });
            setVehicleNumber(''); load();
          }} disabled={!vehicleNumber} style={[S.btnPrimary, { marginLeft: 8 }]}>
            <Ionicons name="add" size={16} color={C.bgMain} />
            <Text style={S.btnPrimaryText}>Add</Text>
          </AnimatedPress>
        </View>
        {ambulances.map((a) => (
          <View key={a._id} style={S.listRow}>
            <View style={S.listRowIcon}>
              <Ionicons name="car" size={16} color={C.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.listRowTitle}>{a.vehicleNumber || a.name}</Text>
              <Text style={S.listRowSub}>{a.isApproved ? 'Approved' : 'Pending approval'}</Text>
            </View>
            <StatusPill status={a.isApproved ? 'approved' : 'pending'} />
          </View>
        ))}
      </SurfaceCard>
    </View>
  );
}

// ─── Ambulance Home / Cases ───────────────────────────────────────────────────
function AmbulanceHome({ socket }: { socket: Socket | null }) {
  return (
    <ScreenShell>
      <ScreenHeader title="Ambulance Crew" subtitle="Accept dispatches, stream location & update transport progress" />
      <AmbulanceCases socket={socket} />
    </ScreenShell>
  );
}

function AmbulanceCases({ socket }: { socket?: Socket | null }) {
  const [assigned, setAssigned] = useState<Rescue[]>([]);
  const [pinged, setPinged] = useState<Rescue[]>([]);
  const [history, setHistory] = useState<Rescue[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'pinged' | 'assigned' | 'history'>('pinged');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, p, h] = await Promise.all([api.get('/ambulance/assigned'), api.get('/ambulance/pinged'), api.get('/ambulance/history')]);
      setAssigned([...(a.data.task ? [a.data.task] : a.data.tasks || a.data.rescues || [])]);
      setPinged(p.data.tasks || p.data.rescues || []);
      setHistory(h.data.history || h.data.rescues || []);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const streamLocation = async (rescueId?: string) => {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) return Alert.alert('Location needed', 'Location is required for ambulance tracking.');
    const pos = await Location.getCurrentPositionAsync({});
    await api.put('/ambulance/location', { lat: pos.coords.latitude, lng: pos.coords.longitude });
    if (rescueId) {
      socket?.emit('ambulance_location_update', { rescueRequestId: rescueId, lat: pos.coords.latitude, lng: pos.coords.longitude });
    }
    Alert.alert('📍 Location shared', 'Your latest location was sent.');
  };

  const lists: Record<string, Rescue[]> = { pinged, assigned, history };
  const list = lists[activeTab] || [];

  return (
    <ScreenShell refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={C.brand} />}>
      <SegmentedControl
        options={[
          { key: 'pinged', label: `Pings (${pinged.length})` },
          { key: 'assigned', label: `Assigned (${assigned.length})` },
          { key: 'history', label: 'History' },
        ]}
        active={activeTab}
        onChange={(k) => setActiveTab(k as any)}
      />
      {list.length === 0 ? (
        <EmptyState icon="car" message="No items in this section" />
      ) : (
        list.map((r) => (
          <RescueCard key={r._id} rescue={r} actions={
            activeTab === 'pinged' ? (
              <View style={S.row}>
                <AnimatedPress onPress={async () => { await api.put(`/ambulance/rescue/${r._id}/accept-ping`); load(); }} style={[S.btnPrimary, { flex: 1 }]}>
                  <Ionicons name="checkmark-circle" size={16} color={C.bgMain} />
                  <Text style={S.btnPrimaryText}>Accept Ping</Text>
                </AnimatedPress>
                <AnimatedPress onPress={async () => { await api.put(`/ambulance/rescue/${r._id}/reject-ping`); load(); }} style={[S.btnDanger, { flex: 1, marginLeft: 8 }]}>
                  <Ionicons name="close-circle-outline" size={16} color={C.error} />
                  <Text style={S.btnDangerText}>Reject</Text>
                </AnimatedPress>
              </View>
            ) : activeTab === 'assigned' ? (
              <View style={S.actionGroup}>
                <AnimatedPress onPress={() => streamLocation(r._id)} style={S.btnPrimary}>
                  <Ionicons name="navigate" size={16} color={C.bgMain} />
                  <Text style={S.btnPrimaryText}>Share Live Location</Text>
                </AnimatedPress>
                <View style={S.chipRow}>
                  {['en_route', 'picked_up', 'delivered'].map((status) => (
                    <AnimatedPress key={status} onPress={async () => { await api.put(`/ambulance/rescue/${r._id}/status`, { status }); load(); }} style={S.chip}>
                      <Text style={S.chipText}>{status.replace('_', ' ')}</Text>
                    </AnimatedPress>
                  ))}
                </View>
              </View>
            ) : undefined
          } />
        ))
      )}
    </ScreenShell>
  );
}

// ─── Wallet Screen ────────────────────────────────────────────────────────────
function WalletScreen({ user, setUser }: { user: User; setUser: (u: User) => void }) {
  const [amount, setAmount] = useState('500');
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/user/wallet');
      setWallet(data);
      setUser({ ...user, walletBalance: data.walletBalance });
    } finally { setLoading(false); }
  }, [setUser, user]);
  useEffect(() => { load().catch(() => undefined); }, [load]);

  const topUp = async () => {
    try {
      const value = Number(amount);
      const { data } = await api.post('/payment/create-order', { amount: value });
      if (!RazorpayCheckout || typeof RazorpayCheckout.open !== 'function') {
        throw new Error('Razorpay native checkout is not available in the Expo Go client. Use "Mock top-up" below.');
      }
      const payment = await RazorpayCheckout.open({
        key: RAZORPAY_KEY_ID || data.keyId,
        amount: data.order.amount,
        currency: data.order.currency || 'INR',
        order_id: data.order.id,
        name: 'VetsCue Wallet',
        description: 'Wallet top-up',
        prefill: { email: user.email, name: user.name, contact: user.phone || '' },
        theme: { color: C.brand },
      });
      await api.post('/payment/verify', payment);
      await load();
      Alert.alert('✅ Wallet updated', 'Payment verified successfully.');
    } catch (error: any) {
      Alert.alert('Payment', `${error.message}\n\nFor testing, use the Mock top-up button.`);
    }
  };

  const balance = wallet?.walletBalance ?? user.walletBalance ?? 0;

  return (
    <ScreenShell refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={C.brand} />}>
      <ScreenHeader title="Wallet" subtitle="Manage your balance and transactions" />

      {/* Balance card */}
      <View style={S.balanceCard}>
        <View style={S.balanceGlow} pointerEvents="none" />
        <Text style={S.balanceLabel}>Available Balance</Text>
        <Text style={S.balanceAmount}>₹{balance.toLocaleString('en-IN')}</Text>
        <Text style={S.balanceSub}>VetsCue Wallet</Text>
      </View>

      <SurfaceCard>
        <Text style={S.cardSectionTitle}>💳 Top Up Wallet</Text>
        <FormField
          label="Amount (₹)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="Enter amount"
          icon="cash-outline"
        />
        <View style={S.row}>
          {['100', '500', '1000', '2000'].map((v) => (
            <AnimatedPress key={v} onPress={() => setAmount(v)} style={[S.chip, amount === v && S.chipActive]}>
              <Text style={[S.chipText, amount === v && S.chipTextActive]}>₹{v}</Text>
            </AnimatedPress>
          ))}
        </View>
        <AnimatedPress onPress={topUp} style={S.btnPrimary}>
          <Ionicons name="card" size={18} color={C.bgMain} />
          <Text style={S.btnPrimaryText}>Top up with Razorpay</Text>
        </AnimatedPress>
        <AnimatedPress onPress={async () => { await api.post('/payment/mock-topup', { amount: Number(amount) }); load(); }} style={S.btnOutline}>
          <Ionicons name="flask-outline" size={18} color={C.brand} />
          <Text style={S.btnOutlineText}>Mock Top-up (Dev)</Text>
        </AnimatedPress>
      </SurfaceCard>

      <SectionHeader title="Transaction History" />
      {(wallet?.transactions || []).length === 0 ? (
        <EmptyState icon="receipt" message="No transactions yet" />
      ) : (
        <SurfaceCard>
          {(wallet?.transactions || []).map((tx: any) => (
            <View key={tx._id} style={S.listRow}>
              <View style={[S.listRowIcon, { backgroundColor: tx.type === 'credit' ? `${C.success}20` : `${C.error}20` }]}>
                <Ionicons
                  name={tx.type === 'credit' ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
                  size={18}
                  color={tx.type === 'credit' ? C.success : C.error}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.listRowTitle}>{tx.description || tx.type}</Text>
                <Text style={S.listRowSub}>{compactDate(tx.createdAt)}</Text>
              </View>
              <Text style={[S.listRowTitle, { color: tx.type === 'credit' ? C.success : C.error }]}>
                {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
              </Text>
            </View>
          ))}
        </SurfaceCard>
      )}

      <FundraisersSection />
    </ScreenShell>
  );
}

// ─── Notifications Screen ─────────────────────────────────────────────────────
function NotificationsScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await api.get('/notifications'); setData(res.data); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load().catch(() => undefined); }, [load]);

  return (
    <ScreenShell refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={C.brand} />}>
      <View style={S.row}>
        <ScreenHeader title="Notifications" subtitle={`${data?.unreadCount ?? 0} unread`} />
        <AnimatedPress onPress={async () => { await api.put('/notifications/read-all'); load(); }} style={[S.btnOutline, { alignSelf: 'center', marginTop: 0 }]}>
          <Ionicons name="checkmark-done" size={16} color={C.brand} />
          <Text style={S.btnOutlineText}>Mark all read</Text>
        </AnimatedPress>
      </View>

      {(data?.notifications || []).length === 0 ? (
        <EmptyState icon="notifications-off" message="All clear — no notifications" />
      ) : (
        <SurfaceCard>
          {(data?.notifications || []).map((n: any, i: number) => (
            <View key={n._id}>
              <TouchableOpacity onPress={async () => { await api.put(`/notifications/${n._id}/read`); load(); }} activeOpacity={0.7}>
                <View style={[S.notifRow, !n.isRead && S.notifRowUnread]}>
                  <View style={[S.listRowIcon, { backgroundColor: n.isRead ? C.bgHover : `${C.brand}20` }]}>
                    <Ionicons name={n.isRead ? 'notifications-outline' : 'notifications'} size={18} color={n.isRead ? C.textMuted : C.brand} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[S.listRowTitle, !n.isRead && { color: C.textMain }]}>{n.title}</Text>
                    <Text style={S.listRowSub} numberOfLines={2}>{n.message}</Text>
                    <Text style={[S.listRowSub, { marginTop: 2 }]}>{compactDate(n.createdAt)}</Text>
                  </View>
                  {!n.isRead && <View style={S.unreadDot} />}
                </View>
              </TouchableOpacity>
              {i < (data?.notifications || []).length - 1 && <View style={S.separator} />}
            </View>
          ))}
        </SurfaceCard>
      )}
    </ScreenShell>
  );
}

// ─── Profile Screen ───────────────────────────────────────────────────────────
function ProfileScreen({ user, setUser }: { user: User; setUser: (u: User) => void }) {
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
    } finally { setSaving(false); }
  };

  const updateLocation = async () => {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) return;
    const pos = await Location.getCurrentPositionAsync({});
    const { data } = await api.put('/user/profile', { location: { lat: pos.coords.latitude, lng: pos.coords.longitude } });
    setUser(data.user);
    Alert.alert('📍 Location updated', 'Your location has been updated.');
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
          <Text style={S.roleBadgeText}>{roleLabel[user.role]}</Text>
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
        <FormField label="Name" value={form.name} onChangeText={(name) => setForm({ ...form, name })} placeholder="Full name" icon="person-outline" />
        <FormField label="Phone" value={form.phone} onChangeText={(phone) => setForm({ ...form, phone })} placeholder="+91 ..." icon="call-outline" keyboardType="phone-pad" />
        {user.role !== 'user' && (
          <FormField label="Organisation" value={form.orgName} onChangeText={(orgName) => setForm({ ...form, orgName })} placeholder="Organisation name" icon="business-outline" />
        )}
        <FormField label="Address" value={form.address} onChangeText={(address) => setForm({ ...form, address })} placeholder="City, State" icon="location-outline" />
        <AnimatedPress onPress={save} disabled={saving} style={S.btnPrimary}>
          {saving ? <ActivityIndicator color={C.bgMain} size="small" /> : (
            <>
              <Ionicons name="save-outline" size={18} color={C.bgMain} />
              <Text style={S.btnPrimaryText}>Save Changes</Text>
            </>
          )}
        </AnimatedPress>
        <AnimatedPress onPress={updateLocation} style={S.btnOutline}>
          <Ionicons name="locate-outline" size={18} color={C.brand} />
          <Text style={S.btnOutlineText}>Update to Current Location</Text>
        </AnimatedPress>
      </SurfaceCard>
    </ScreenShell>
  );
}

// ─── Admin Screen ─────────────────────────────────────────────────────────────
function AdminScreen({ setToken, setAdminToken, setUser }: {
  setToken: (t: string) => void; setAdminToken: (t: string) => void; setUser: (u: User) => void;
}) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [pending, setPending] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [fundraisers, setFundraisers] = useState<Rescue[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'fundraisers' | 'users' | 'rescues'>('overview');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, p, u, f] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/pending-approvals'),
        api.get('/admin/users?limit=50'),
        api.get('/admin/fundraisers'),
      ]);
      setAnalytics(a.data.analytics);
      setPending(p.data.users || []);
      setUsers(u.data.users || []);
      setFundraisers(f.data.fundraisers || []);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load().catch(() => undefined); }, [load]);

  const impersonate = async (userId: string) => {
    const current = await SecureStore.getItemAsync(TOKEN_KEY);
    const { data } = await api.post('/auth/impersonate', { userId });
    if (current) await SecureStore.setItemAsync(ADMIN_TOKEN_KEY, current);
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
    setAdminToken(current || '');
    setToken(data.token);
    setUser(data.user);
  };

  return (
    <ScreenShell refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={C.brand} />}>
      <ScreenHeader title="Admin Command" subtitle="Manage the entire VetsCue ecosystem" />

      {/* Stats grid */}
      <View style={S.statsGrid}>
        <StatCard label="Users" value={analytics?.totalUsers ?? '—'} icon="people" color={C.brand} />
        <StatCard label="Requests" value={analytics?.totalRequests ?? '—'} icon="document-text" color={C.info} />
        <StatCard label="Pending" value={analytics?.pendingApprovals ?? '—'} icon="time" color={C.warning} />
        <StatCard label="Donations" value={`₹${analytics?.totalDonations ?? '—'}`} icon="heart" color={C.success} />
      </View>

      {/* Tab selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}>
        {[
          { key: 'overview', label: '📊 Overview' },
          { key: 'approvals', label: `✅ Approvals (${pending.length})` },
          { key: 'fundraisers', label: `❤️ Fundraisers` },
          { key: 'users', label: `👥 Users` },
          { key: 'rescues', label: `🐾 Rescues` },
        ].map(({ key, label }) => (
          <AnimatedPress key={key} onPress={() => setActiveTab(key as any)} style={[S.chip, activeTab === key && S.chipActive]}>
            <Text style={[S.chipText, activeTab === key && S.chipTextActive]}>{label}</Text>
          </AnimatedPress>
        ))}
      </ScrollView>

      {activeTab === 'approvals' && (
        pending.length === 0 ? <EmptyState icon="checkmark-circle" message="No pending approvals" /> :
        pending.map((u) => (
          <View key={u._id} style={S.listRow}>
            <View style={S.listRowIcon}>
              <Ionicons name="business" size={16} color={C.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.listRowTitle}>{u.orgName || u.name}</Text>
              <Text style={S.listRowSub}>{u.role} · {u.email}</Text>
            </View>
            <AnimatedPress onPress={async () => { await api.put(`/admin/approve/${u._id}`, { approve: true }); load(); }} style={[S.btnPrimary, { paddingHorizontal: 12, paddingVertical: 8 }]}>
              <Ionicons name="checkmark" size={14} color={C.bgMain} />
              <Text style={[S.btnPrimaryText, { fontSize: 12 }]}>Approve</Text>
            </AnimatedPress>
          </View>
        ))
      )}

      {activeTab === 'fundraisers' && (
        fundraisers.length === 0 ? <EmptyState icon="heart" message="No fundraisers to review" /> :
        fundraisers.map((r) => (
          <RescueCard key={r._id} rescue={r} actions={
            <View style={S.row}>
              <AnimatedPress onPress={async () => { await api.put(`/admin/rescue/${r._id}/fundraiser/review`, { action: 'approve' }); load(); }} style={[S.btnPrimary, { flex: 1 }]}>
                <Ionicons name="checkmark" size={16} color={C.bgMain} />
                <Text style={S.btnPrimaryText}>Approve</Text>
              </AnimatedPress>
              <AnimatedPress onPress={async () => { await api.put(`/admin/rescue/${r._id}/fundraiser/review`, { action: 'reject' }); load(); }} style={[S.btnDanger, { flex: 1, marginLeft: 8 }]}>
                <Ionicons name="close" size={16} color={C.error} />
                <Text style={S.btnDangerText}>Reject</Text>
              </AnimatedPress>
            </View>
          } />
        ))
      )}

      {activeTab === 'users' && (
        users.length === 0 ? <EmptyState icon="people" message="No users found" /> :
        users.map((u) => (
          <View key={u._id} style={S.listRow}>
            <View style={S.avatarSmall}>
              <Text style={S.avatarSmallText}>{u.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.listRowTitle}>{u.orgName || u.name}</Text>
              <Text style={S.listRowSub}>{u.role} · {u.email}</Text>
            </View>
            <AnimatedPress onPress={() => impersonate(u._id)} style={[S.btnOutline, { paddingHorizontal: 10, paddingVertical: 8 }]}>
              <Ionicons name="swap-horizontal" size={14} color={C.brand} />
              <Text style={[S.btnOutlineText, { fontSize: 12 }]}>Switch</Text>
            </AnimatedPress>
          </View>
        ))
      )}

      {(activeTab === 'overview' || activeTab === 'rescues') && <AdminRescues />}
    </ScreenShell>
  );
}

function AdminRescues() {
  const [rescues, setRescues] = useState<Rescue[]>([]);
  const load = useCallback(async () => {
    const { data } = await api.get('/admin/rescue-requests?limit=50');
    setRescues(data.rescues || []);
  }, []);
  useEffect(() => { load().catch(() => undefined); }, [load]);
  return (
    <View>
      <SectionHeader title="🛡️ Rescue Overrides" />
      {rescues.length === 0 ? <EmptyState icon="shield" message="No rescues to override" /> : (
        rescues.map((r) => (
          <RescueCard key={r._id} rescue={r} actions={
            <View style={S.chipRow}>
              {['completed', 'cancelled', 'closed_unresolved'].map((status) => (
                <AnimatedPress key={status} onPress={async () => { await api.put(`/admin/rescue/${r._id}/override`, { status }); load(); }} style={S.chip}>
                  <Text style={S.chipText}>{status.replace(/_/g, ' ')}</Text>
                </AnimatedPress>
              ))}
            </View>
          } />
        ))
      )}
    </View>
  );
}

// ─── Map Screen ───────────────────────────────────────────────────────────────
function MapScreen({ user, socket }: { user: User; socket: Socket | null }) {
  const [position, setPosition] = useState<Location.LocationObjectCoords | null>(null);
  const [capturing, setCapturing] = useState(false);

  const capture = async () => {
    setCapturing(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) return;
      const loc = await Location.getCurrentPositionAsync({});
      setPosition(loc.coords);
      if (user.role === 'ambulance') {
        await api.put('/ambulance/location', { lat: loc.coords.latitude, lng: loc.coords.longitude });
        socket?.emit('ambulance_location_update', { lat: loc.coords.latitude, lng: loc.coords.longitude });
      } else {
        await api.put('/user/profile', { location: { lat: loc.coords.latitude, lng: loc.coords.longitude } });
      }
      Alert.alert('📍 Location captured', 'Your location has been updated.');
    } finally { setCapturing(false); }
  };

  return (
    <ScreenShell>
      <ScreenHeader title="Location & Map" subtitle="Rescue routing using OpenStreetMap — no billing" />

      <View style={S.mapContainer}>
        {position ? (
          <WebView
            style={S.webMap}
            originWhitelist={['*']}
            source={{ html: leafletHtml(position.latitude, position.longitude) }}
          />
        ) : (
          <View style={S.mapPlaceholder}>
            <Text style={{ fontSize: 48 }}>🗺️</Text>
            <Text style={S.mapPlaceholderText}>No location captured yet</Text>
            <Text style={[S.mapPlaceholderText, { fontSize: 13, marginTop: 4 }]}>Tap below to pin your current location</Text>
          </View>
        )}
      </View>

      {position && (
        <SurfaceCard>
          <View style={S.row}>
            <Ionicons name="location" size={18} color={C.brand} />
            <Text style={[S.listRowTitle, { marginLeft: 8 }]}>
              {position.latitude.toFixed(6)}, {position.longitude.toFixed(6)}
            </Text>
          </View>
        </SurfaceCard>
      )}

      <AnimatedPress onPress={capture} disabled={capturing} style={S.btnPrimary}>
        {capturing ? <ActivityIndicator color={C.bgMain} size="small" /> : (
          <>
            <Ionicons name="locate" size={18} color={C.bgMain} />
            <Text style={S.btnPrimaryText}>Capture Current Location</Text>
          </>
        )}
      </AnimatedPress>
    </ScreenShell>
  );
}

function leafletHtml(lat: number, lng: number) {
  const tileUrl = MAP_STYLE_URL.includes('{z}') ? MAP_STYLE_URL : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><style>html,body,#map{height:100%;margin:0;background:#0e0e0e}.leaflet-control-attribution{font-size:10px}</style></head><body><div id="map"></div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>const map=L.map('map',{zoomControl:false}).setView([${lat},${lng}],15);L.tileLayer('${tileUrl}',{maxZoom:19,attribution:'OSM'}).addTo(map);const icon=L.divIcon({html:'<div style="width:24px;height:24px;background:rgba(118,214,213,0.9);border:3px solid #5cb8b7;border-radius:50%;box-shadow:0 0 12px rgba(118,214,213,0.6);"></div>',className:'',iconSize:[24,24],iconAnchor:[12,12]});L.marker([${lat},${lng}],{icon}).addTo(map);</script></body></html>`;
}

// ─── Fundraisers Section ──────────────────────────────────────────────────────
function FundraisersSection({ compact = false }: { compact?: boolean }) {
  const [items, setItems] = useState<Rescue[]>([]);
  const [amount, setAmount] = useState('100');

  useEffect(() => {
    api.get('/donation/fundraisers').then(({ data }) => setItems(data.fundraisers || [])).catch(() => undefined);
  }, []);

  if (compact && items.length === 0) return null;

  const list = compact ? items.slice(0, 3) : items;

  return (
    <View>
      <SectionHeader title="❤️ Active Fundraisers" />
      {list.length === 0 ? (
        <EmptyState icon="heart" message="No active fundraisers" />
      ) : (
        list.map((rescue) => {
          const progress = Math.min(((rescue.amountRaised || 0) / (rescue.estimatedCost || 1)) * 100, 100);
          return (
            <SurfaceCard key={rescue._id}>
              {rescue.images?.[0] && (
                <Image source={{ uri: rescue.images[0] }} style={S.fundraiserImg} />
              )}
              <Text style={S.listRowTitle} numberOfLines={2}>{rescue.description}</Text>
              <View style={S.progressRow}>
                <Text style={[S.listRowSub, { color: C.brand }]}>Raised: ₹{rescue.amountRaised || 0}</Text>
                <Text style={[S.listRowSub, { color: C.warning }]}>Goal: ₹{rescue.estimatedCost}</Text>
              </View>
              <View style={S.progressTrack}>
                <View style={[S.progressFill, { width: `${progress}%` as any }]} />
              </View>
              <Text style={[S.listRowSub, { textAlign: 'right', marginTop: 2 }]}>{progress.toFixed(0)}% FUNDED</Text>
              {!compact && (
                <View style={S.row}>
                  <TextInput
                    style={[S.input, { flex: 1 }]}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    placeholder="Amount (₹)"
                    placeholderTextColor={C.textMuted}
                  />
                  <AnimatedPress onPress={async () => {
                    await api.post('/donation/donate-wallet', { rescueId: rescue._id, amount: Number(amount) });
                    Alert.alert('❤️ Donation sent', 'Thank you for your contribution!');
                  }} style={[S.btnPrimary, { marginLeft: 8 }]}>
                    <Ionicons name="heart" size={16} color={C.bgMain} />
                    <Text style={S.btnPrimaryText}>Donate</Text>
                  </AnimatedPress>
                </View>
              )}
            </SurfaceCard>
          );
        })
      )}
    </View>
  );
}

// ─── Impact Feed ──────────────────────────────────────────────────────────────
function ImpactFeed() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    api.get('/rescue/impact/feed').then(({ data }) => setItems(data.feed || [])).catch(() => undefined);
  }, []);
  if (!items.length) return null;
  return (
    <View>
      <SectionHeader title="✨ Impact Stories" />
      {items.slice(0, 3).map((item) => (
        <SurfaceCard key={item._id}>
          {item.beforeImage && <Image source={{ uri: item.beforeImage }} style={S.fundraiserImg} />}
          <Text style={S.listRowTitle}>{item.helperName}</Text>
          <Text style={S.listRowSub}>{item.afterSummary || item.description}</Text>
        </SurfaceCard>
      ))}
    </View>
  );
}

// ─── Rescue Card ──────────────────────────────────────────────────────────────
function RescueCard({ rescue, actions }: { rescue: Rescue; actions?: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <SurfaceCard>
      {/* Header */}
      <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
        <View style={S.rescueCardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={S.listRowTitle} numberOfLines={2}>{rescue.description}</Text>
            <Text style={S.listRowSub}>{compactDate(rescue.createdAt)}</Text>
          </View>
          <StatusPill status={rescue.status} />
        </View>
      </TouchableOpacity>

      {rescue.images?.[0] && (
        <Image source={{ uri: rescue.images[0] }} style={S.rescueImg} />
      )}

      <View style={S.row}>
        <Ionicons name="location-outline" size={14} color={C.textMuted} />
        <Text style={[S.listRowSub, { flex: 1, marginLeft: 4 }]} numberOfLines={1}>
          {rescue.location?.address || [rescue.location?.lat, rescue.location?.lng].filter(Boolean).join(', ') || 'Location attached'}
        </Text>
      </View>

      {!!rescue.estimatedCost && (
        <View>
          <View style={S.progressRow}>
            <Text style={[S.listRowSub, { color: C.brand }]}>₹{rescue.amountRaised || 0} raised</Text>
            <Text style={[S.listRowSub, { color: C.warning }]}>₹{rescue.estimatedCost} goal</Text>
          </View>
          <View style={S.progressTrack}>
            <View style={[S.progressFill, { width: `${Math.min(((rescue.amountRaised || 0) / rescue.estimatedCost) * 100, 100)}%` as any }]} />
          </View>
        </View>
      )}

      {/* Assigned info */}
      {rescue.assignedNGO && (
        <View style={S.row}>
          <Ionicons name="leaf-outline" size={14} color={C.brand} />
          <Text style={[S.listRowSub, { marginLeft: 4 }]}>NGO: {rescue.assignedNGO.orgName || rescue.assignedNGO.name}</Text>
        </View>
      )}

      {/* Actions */}
      {actions && <View style={S.separator} />}
      {actions}
    </SurfaceCard>
  );
}

// ─── App Header ───────────────────────────────────────────────────────────────
function AppHeader({ user, adminToken, onLogout, onStopImpersonating }: {
  user: User; adminToken: string | null; onLogout: () => void; onStopImpersonating: () => void;
}) {
  const initial = user.name?.charAt(0)?.toUpperCase() || 'U';
  return (
    <View style={S.appHeader}>
      {/* Left: brand */}
      <View style={S.appHeaderLeft}>
        <View style={S.headerBrandIcon}>
          <Text style={{ fontSize: 16 }}>🐾</Text>
        </View>
        <View>
          <Text style={S.appHeaderBrand}>VetsCue</Text>
          <Text style={S.appHeaderRole}>{titleForRole[user.role]}</Text>
        </View>
      </View>

      {/* Right: actions */}
      <View style={S.appHeaderRight}>
        {adminToken && (
          <AnimatedPress onPress={onStopImpersonating} style={S.impersonatePill}>
            <Ionicons name="return-down-back" size={12} color={C.warning} />
            <Text style={S.impersonateText}>Exit View</Text>
          </AnimatedPress>
        )}
        {!user.isApproved && user.role !== 'user' && (
          <View style={S.pendingPill}>
            <View style={S.pendingDot} />
            <Text style={S.pendingText}>Pending</Text>
          </View>
        )}
        <AnimatedPress onPress={onLogout} style={S.iconBtn}>
          <Ionicons name="log-out-outline" size={18} color={C.textMuted} />
        </AnimatedPress>
        <View style={S.headerAvatar}>
          <Text style={S.headerAvatarText}>{initial}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────
function TabBar({ role, tab, setTab }: { role: Role; tab: Tab; setTab: (t: Tab) => void }) {
  const tabs: { tab: Tab; label: string; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap }[] = [
    { tab: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
    { tab: 'cases', label: role === 'admin' ? 'Cases' : 'Work', icon: 'list-outline', activeIcon: 'list' },
    { tab: 'map', label: 'Map', icon: 'map-outline', activeIcon: 'map' },
    { tab: 'alerts', label: 'Alerts', icon: 'notifications-outline', activeIcon: 'notifications' },
    { tab: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
  ];
  if (role === 'user' || role === 'ngo') tabs.splice(3, 0, { tab: 'wallet', label: 'Wallet', icon: 'wallet-outline', activeIcon: 'wallet' });
  if (role === 'admin') tabs.splice(2, 0, { tab: 'admin', label: 'Admin', icon: 'shield-outline', activeIcon: 'shield' });

  return (
    <View style={S.tabBarWrapper}>
      <View style={S.tabBar}>
        {tabs.map((item) => {
          const isActive = tab === item.tab;
          return (
            <AnimatedPress key={item.tab} onPress={() => setTab(item.tab)} style={S.tabItem}>
              <View style={[S.tabIconWrap, isActive && S.tabIconWrapActive]}>
                <Ionicons
                  name={isActive ? item.activeIcon : item.icon}
                  size={isActive ? 22 : 20}
                  color={isActive ? C.bgMain : C.textMuted}
                />
              </View>
              <Text style={[S.tabLabel, isActive && S.tabLabelActive]}>{item.label}</Text>
            </AnimatedPress>
          );
        })}
      </View>
    </View>
  );
}

// ─── Shared UI Components ─────────────────────────────────────────────────────

function ScreenShell({ children, refreshControl }: { children: React.ReactNode; refreshControl?: React.ReactElement }) {
  return (
    <ScrollView
      style={S.screenShell}
      contentContainerStyle={S.screenContent}
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl as any}
    >
      {children}
    </ScrollView>
  );
}

function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={S.screenHeader}>
      <Text style={S.screenTitle}>{title}</Text>
      {subtitle && <Text style={S.screenSubtitle}>{subtitle}</Text>}
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={S.sectionTitle}>{title}</Text>;
}

function SurfaceCard({ children }: { children: React.ReactNode }) {
  return <View style={S.surfaceCard}>{children}</View>;
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: keyof typeof Ionicons.glyphMap; color: string }) {
  return (
    <View style={[S.statCard, { borderColor: `${color}25` }]}>
      <View style={[S.statIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={S.statValue}>{value}</Text>
      <Text style={S.statLabel}>{label}</Text>
    </View>
  );
}

function StatusPill({ status }: { status?: string }) {
  const color = statusColor(status);
  const bg = `${color}20`;
  return (
    <View style={[S.statusPill, { backgroundColor: bg, borderColor: `${color}40` }]}>
      <Text style={[S.statusPillText, { color }]}>{(status || 'unknown').replace(/_/g, ' ')}</Text>
    </View>
  );
}

function FormField({ label, icon, ...props }: { label: string; icon?: keyof typeof Ionicons.glyphMap } & React.ComponentProps<typeof TextInput>) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={S.formField}>
      <Text style={S.fieldLabel}>{label}</Text>
      <View style={[S.inputWrap, focused && S.inputWrapFocused]}>
        {icon && <Ionicons name={icon} size={16} color={focused ? C.brand : C.textMuted} style={{ marginLeft: 12 }} />}
        <TextInput
          style={[S.fieldInput, props.multiline && { minHeight: 90, textAlignVertical: 'top', paddingTop: 12 }]}
          placeholderTextColor={C.textMuted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
      </View>
    </View>
  );
}

function SegmentedControl({ options, active, onChange }: {
  options: { key: string; label: string }[];
  active: string;
  onChange: (k: string) => void;
}) {
  return (
    <View style={S.segControl}>
      {options.map((o) => (
        <AnimatedPress key={o.key} onPress={() => onChange(o.key)} style={[S.segControlItem, active === o.key && S.segControlItemActive]}>
          <Text style={[S.segControlText, active === o.key && S.segControlTextActive]}>{o.label}</Text>
        </AnimatedPress>
      ))}
    </View>
  );
}

function EmptyState({ icon, message }: { icon: keyof typeof Ionicons.glyphMap; message: string }) {
  return (
    <View style={S.emptyState}>
      <Ionicons name={icon} size={40} color={C.textMuted} style={{ opacity: 0.4 }} />
      <Text style={S.emptyStateText}>{message}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bgMain,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  shell: { flex: 1, backgroundColor: C.bgMain },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bgMain },

  // Splash
  splashTitle: { fontSize: 36, fontWeight: '800', color: C.textMain, marginTop: 16, letterSpacing: -1 },
  splashSub: { fontSize: 15, color: C.textMuted, marginTop: 6 },

  // Brand logo
  brandLogo: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: C.bgElevated, borderWidth: 1, borderColor: `${C.brand}30`,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.brand, shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },

  // Auth
  authContainer: { padding: 24, gap: 24, paddingBottom: 48 },
  authGlow: {
    position: 'absolute', top: -100, left: SW / 2 - 200,
    width: 400, height: 400, borderRadius: 200,
    backgroundColor: C.brand, opacity: 0.04,
  },
  authBrand: { alignItems: 'center', gap: 16, paddingTop: 32 },
  pilotBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 5,
    backgroundColor: `${C.brand}12`, borderWidth: 1, borderColor: `${C.brand}30`,
    borderRadius: 999,
  },
  pilotDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.brand },
  pilotText: { fontSize: 11, fontWeight: '700', color: C.brand },
  authTitle: { fontSize: 40, fontWeight: '800', color: C.textMain, letterSpacing: -2 },
  authSubtitle: { fontSize: 15, color: C.textMuted, textAlign: 'center', lineHeight: 22 },
  authCard: { backgroundColor: C.bgSurface, borderRadius: 24, padding: 14, gap: 10, borderWidth: 1, borderColor: C.borderSurface },

  // Segments
  segment: { flexDirection: 'row', backgroundColor: C.bgElevated, borderRadius: 12, padding: 4, gap: 4 },
  segItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 9 },
  segItemActive: { backgroundColor: C.brand },
  segText: { fontSize: 14, fontWeight: '700', color: C.textMuted },
  segTextActive: { color: C.bgMain },

  // Chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.borderSurface,
  },
  chipActive: { backgroundColor: C.brand, borderColor: C.brand },
  chipText: { fontSize: 13, fontWeight: '700', color: C.textMuted, textTransform: 'capitalize' },
  chipTextActive: { color: C.bgMain },

  // Buttons
  btnPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.brand, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20,
    shadowColor: C.brand, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  btnPrimaryText: { fontSize: 15, fontWeight: '800', color: C.bgMain },
  btnOutline: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'transparent', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 18,
    borderWidth: 1.5, borderColor: `${C.brand}60`,
  },
  btnOutlineText: { fontSize: 14, fontWeight: '700', color: C.brand },
  btnDanger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: `${C.error}10`, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 18,
    borderWidth: 1, borderColor: `${C.error}30`,
  },
  btnDangerText: { fontSize: 14, fontWeight: '700', color: C.error },
  btnGoogle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: C.bgElevated, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 20,
    borderWidth: 1, borderColor: C.borderSurface,
  },
  btnGoogleText: { fontSize: 14, fontWeight: '700', color: C.textMain },

  // Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.borderMain },
  dividerText: { fontSize: 12, color: C.textMuted, fontWeight: '600' },

  // Form
  formField: { gap: 4 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.bgElevated, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.borderSurface,
    overflow: 'hidden',
  },
  inputWrapFocused: { borderColor: `${C.brand}60` },
  fieldInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, color: C.textMain, fontSize: 15 },
  input: {
    backgroundColor: C.bgElevated, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    color: C.textMain, fontSize: 14, borderWidth: 1.5, borderColor: C.borderSurface,
  },

  // Header
  appHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 12,
    backgroundColor: C.bgSurface,
    borderBottomWidth: 1, borderBottomColor: C.borderSurface,
  },
  appHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerBrandIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: C.bgElevated,
    borderWidth: 1, borderColor: `${C.brand}30`,
    alignItems: 'center', justifyContent: 'center',
  },
  appHeaderBrand: { fontSize: 16, fontWeight: '800', color: C.brand, letterSpacing: -0.5 },
  appHeaderRole: { fontSize: 11, color: C.textMuted, fontWeight: '600' },
  appHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  impersonatePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
    backgroundColor: `${C.warning}15`, borderWidth: 1, borderColor: `${C.warning}30`,
  },
  impersonateText: { fontSize: 10, fontWeight: '700', color: C.warning },
  pendingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
    backgroundColor: `${C.warning}15`, borderWidth: 1, borderColor: `${C.warning}30`,
  },
  pendingDot: { width: 5, height: 5, borderRadius: 999, backgroundColor: C.warning },
  pendingText: { fontSize: 10, fontWeight: '700', color: C.warning },
  iconBtn: {
    width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.borderSurface,
  },
  headerAvatar: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center',
    shadowColor: C.brand, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  headerAvatarText: { fontSize: 14, fontWeight: '800', color: C.bgMain },

  // Tab bar
  tabBarWrapper: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 20 : 12, paddingTop: 8,
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: C.bgSurface,
    borderWidth: 1, borderColor: C.borderSurface,
    borderRadius: 20, paddingVertical: 10, paddingHorizontal: 8,
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: -4 },
    elevation: 20,
  },
  tabItem: { alignItems: 'center', gap: 4, minWidth: 48 },
  tabIconWrap: { width: 42, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tabIconWrapActive: { backgroundColor: C.brand, shadowColor: C.brand, shadowOpacity: 0.5, shadowRadius: 8, elevation: 4 },
  tabLabel: { fontSize: 10, fontWeight: '700', color: C.textMuted, letterSpacing: 0.2 },
  tabLabelActive: { color: C.brand },

  // Screen
  screenShell: { flex: 1, backgroundColor: C.bgMain },
  screenContent: { padding: 16, paddingBottom: 120, gap: 16 },
  screenHeader: { gap: 4 },
  screenTitle: { fontSize: 28, fontWeight: '900', color: C.textMain, letterSpacing: -1 },
  screenSubtitle: { fontSize: 14, color: C.textMuted, lineHeight: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1 },

  // Hero card
  heroCard: {
    backgroundColor: C.bgSurface, borderRadius: 24, padding: 22,
    borderWidth: 1, borderColor: `${C.brand}20`, gap: 10, overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute', top: -60, right: -60, width: 200, height: 200,
    borderRadius: 100, backgroundColor: C.brand, opacity: 0.06,
  },
  heroKicker: { fontSize: 11, fontWeight: '800', color: C.brand, textTransform: 'uppercase', letterSpacing: 1.5 },
  heroTitle: { fontSize: 26, fontWeight: '900', color: C.textMain, letterSpacing: -0.5 },
  heroSub: { fontSize: 14, color: C.textMuted, lineHeight: 20 },
  heroActions: { flexDirection: 'row', gap: 12, marginTop: 6 },

  // Stats grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: (SW - 42) / 2, backgroundColor: C.bgSurface, borderRadius: 16,
    padding: 16, gap: 8, borderWidth: 1,
  },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 24, fontWeight: '900', color: C.textMain, letterSpacing: -0.5 },
  statLabel: { fontSize: 12, fontWeight: '600', color: C.textMuted },

  // Surface card
  surfaceCard: {
    backgroundColor: C.bgSurface, borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: C.borderSurface, gap: 12,
  },
  cardSectionTitle: { fontSize: 14, fontWeight: '800', color: C.brand, textTransform: 'uppercase', letterSpacing: 1 },

  // List rows
  listRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10,
  },
  listRowIcon: {
    width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.bgElevated,
  },
  listRowTitle: { fontSize: 14, fontWeight: '700', color: C.textMain },
  listRowSub: { fontSize: 12, color: C.textMuted, marginTop: 2 },

  // Separator
  separator: { height: 1, backgroundColor: C.borderMain, marginVertical: 4 },

  // Status pill
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  statusPillText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Notifications
  notifRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10 },
  notifRowUnread: { backgroundColor: `${C.brand}08`, borderRadius: 12, padding: 10 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.brand, marginTop: 4 },

  // Profile
  profileHeader: { alignItems: 'center', gap: 10, paddingVertical: 8 },
  profileAvatar: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center',
    shadowColor: C.brand, shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
  },
  profileAvatarText: { fontSize: 32, fontWeight: '800', color: C.bgMain },
  profileName: { fontSize: 22, fontWeight: '800', color: C.textMain, letterSpacing: -0.5 },
  profileEmail: { fontSize: 13, color: C.textMuted },
  roleBadge: {
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999,
    backgroundColor: `${C.brand}15`, borderWidth: 1, borderColor: `${C.brand}30`,
  },
  roleBadgeText: { fontSize: 12, fontWeight: '700', color: C.brand },

  // Balance card
  balanceCard: {
    backgroundColor: C.bgSurface, borderRadius: 24, padding: 28, alignItems: 'center',
    borderWidth: 1, borderColor: `${C.brand}25`, overflow: 'hidden', gap: 6,
  },
  balanceGlow: {
    position: 'absolute', top: -50, width: 200, height: 200, borderRadius: 100,
    backgroundColor: C.brand, opacity: 0.05,
  },
  balanceLabel: { fontSize: 12, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  balanceAmount: { fontSize: 42, fontWeight: '900', color: C.brand, letterSpacing: -2 },
  balanceSub: { fontSize: 12, color: C.textMuted, fontWeight: '600' },

  // Rescue card
  rescueCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  rescueImg: { width: '100%', height: 160, borderRadius: 12, backgroundColor: C.bgElevated },

  // Fundraiser
  fundraiserImg: { width: '100%', height: 140, borderRadius: 12, backgroundColor: C.bgElevated },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressTrack: { height: 6, backgroundColor: C.bgElevated, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: C.brand, borderRadius: 3 },

  // Map
  mapContainer: { height: 280, borderRadius: 20, overflow: 'hidden', backgroundColor: C.bgElevated, borderWidth: 1, borderColor: C.borderSurface },
  webMap: { width: '100%', height: 280 },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  mapPlaceholderText: { fontSize: 15, color: C.textMuted, fontWeight: '600' },

  // Actions
  actionGroup: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  // Segmented Control
  segControl: {
    flexDirection: 'row', backgroundColor: C.bgElevated, borderRadius: 14, padding: 4, gap: 4,
    borderWidth: 1, borderColor: C.borderSurface,
  },
  segControlItem: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 },
  segControlItemActive: { backgroundColor: C.brand },
  segControlText: { fontSize: 13, fontWeight: '700', color: C.textMuted },
  segControlTextActive: { color: C.bgMain },

  // Empty state
  emptyState: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  emptyStateText: { fontSize: 14, color: C.textMuted, fontWeight: '600' },

  // Avatar small
  avatarSmall: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: `${C.brand}20`, alignItems: 'center', justifyContent: 'center',
  },
  avatarSmallText: { fontSize: 16, fontWeight: '800', color: C.brand },

  // New Landing & Modern Onboarding Styles
  landingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.borderMain,
    backgroundColor: C.bgMain,
  },
  landingBrand: {
    fontSize: 18,
    fontWeight: '800',
    color: C.brand,
    letterSpacing: -0.5,
  },
  landingContent: {
    padding: 16,
    paddingBottom: 48,
    gap: 24,
  },
  heroContainer: {
    backgroundColor: C.bgSurface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: C.borderSurface,
    overflow: 'hidden',
    alignItems: 'center',
    gap: 16,
  },
  heroTitleText: {
    fontSize: 32,
    fontWeight: '900',
    color: C.textMain,
    textAlign: 'center',
    letterSpacing: -1,
    lineHeight: 40,
  },
  heroDescText: {
    fontSize: 14,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  heroActionButtons: {
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  trustItem: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMuted,
  },
  landingSection: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: C.brand,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  landingSectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: C.textMain,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  landingSectionSub: {
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  stepsStack: {
    gap: 12,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bgSurface,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: C.borderSurface,
  },
  stepIcon: {
    fontSize: 24,
    width: 32,
    textAlign: 'center',
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.textMain,
  },
  stepDesc: {
    fontSize: 12,
    color: C.textMuted,
    lineHeight: 18,
    marginTop: 2,
  },
  statsSection: {
    marginTop: 8,
  },
  statLandingCard: {
    width: '48%',
    backgroundColor: C.bgSurface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.borderSurface,
    alignItems: 'center',
    gap: 4,
  },
  statLandingValue: {
    fontSize: 28,
    fontWeight: '900',
    color: C.brand,
  },
  statLandingLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMuted,
  },
  roadmapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bgSurface,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1.5,
  },
  ctaBannerCard: {
    backgroundColor: C.bgSurface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: `${C.brand}30`,
    overflow: 'hidden',
    alignItems: 'center',
    gap: 12,
    marginVertical: 8,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: C.textMain,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  ctaDesc: {
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  ctaActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  ctaGlow: {
    position: 'absolute',
    bottom: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: C.brand,
    opacity: 0.05,
  },
  landingFooter: {
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: C.borderMain,
  },
  footerBrandText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textMuted,
  },
  footerLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.brand,
  },
  footerDivider: {
    fontSize: 10,
    color: C.textMuted,
  },
  pilotBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: `${C.brand}15`,
    borderWidth: 1,
    borderColor: `${C.brand}30`,
  },
  pilotTextSmall: {
    fontSize: 9,
    fontWeight: '800',
    color: C.brand,
    textTransform: 'uppercase',
  },
  btnSignInSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: C.bgElevated,
    borderWidth: 1,
    borderColor: C.borderSurface,
  },
  btnSignInSmallText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.brand,
  },
  authHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: C.bgElevated,
    borderWidth: 1,
    borderColor: C.borderSurface,
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.brand,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  roleCard: {
    backgroundColor: C.bgElevated,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1.5,
    borderColor: C.borderSurface,
    gap: 3,
  },
  roleCardActive: {
    backgroundColor: `rgba(${C.brandRgb}, 0.05)`,
    borderColor: C.brand,
    shadowColor: C.brand,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  roleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleCardIcon: {
    fontSize: 16,
  },
  roleCardBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: C.textMain,
  },
  roleCardTitleActive: {
    color: C.brand,
  },
  roleCardDesc: {
    fontSize: 9,
    color: C.textMuted,
    lineHeight: 12,
  },
});
