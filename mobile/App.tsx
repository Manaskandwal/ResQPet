import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import axios, { AxiosInstance } from 'axios';
import { io, Socket } from 'socket.io-client';
import RazorpayCheckout from 'react-native-razorpay';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

WebBrowser.maybeCompleteAuthSession();

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://resqpet-backend.onrender.com/api';
const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || API_URL.replace('/api', '');
const RAZORPAY_KEY_ID = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '';
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
const MAP_STYLE_URL = process.env.EXPO_PUBLIC_MAP_STYLE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

const TOKEN_KEY = 'vetscue_token';
const ADMIN_TOKEN_KEY = 'vetscue_admin_token';
const USER_KEY = 'vetscue_user';

type Role = 'user' | 'ngo' | 'hospital' | 'ambulance' | 'admin';

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

type Tab = 'home' | 'cases' | 'map' | 'wallet' | 'alerts' | 'admin' | 'profile';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 20000,
});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const titleForRole: Record<Role, string> = {
  user: 'Citizen Rescue',
  ngo: 'NGO Response',
  hospital: 'Hospital Desk',
  ambulance: 'Ambulance Crew',
  admin: 'Admin Command',
};

const statusColor = (status?: string) => {
  if (!status) return '#64748b';
  if (['completed', 'resolved_on_spot', 'delivered', 'approved'].includes(status)) return '#047857';
  if (['pending', 'hospital_broadcasted', 'ambulance_pinged', 'fundraiser_active'].includes(status)) return '#b45309';
  if (['cancelled', 'closed_unresolved', 'rejected'].includes(status)) return '#b91c1c';
  return '#0f766e';
};

const compactDate = (value?: string) => {
  if (!value) return '';
  return new Date(value).toLocaleString();
};

export default function App() {
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
    try {
      await api.post('/auth/logout');
    } catch {
      // Local logout should still complete if the network is unavailable.
    }
    const currentPushToken = await SecureStore.getItemAsync('vetscue_push_token');
    if (currentPushToken) {
      try {
        await api.delete('/user/push-token', { data: { token: currentPushToken } });
      } catch {
        // Push-token cleanup is best effort.
      }
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
    socket.on('connect', () => {
      socket.emit('join', { userId: user._id, role: user.role });
    });
    socket.on('new_rescue_alert', (payload) => {
      Alert.alert('New rescue nearby', payload?.description || 'A new case needs attention.');
    });
    socket.on('new_dispatch_alert', (payload) => {
      Alert.alert('New dispatch', payload?.description || 'A new ambulance dispatch is available.');
    });
    socket.on('status_update', (payload) => {
      Alert.alert('Case updated', payload?.message || `Status changed to ${payload?.status}`);
    });

    return () => {
      socket.disconnect();
    };
  }, [registerPushToken, token, user]);

  if (booting) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0f766e" />
        <Text style={styles.muted}>Opening VetsCue</Text>
      </View>
    );
  }

  if (!token || !user) {
    return <AuthScreen onLogin={persistSession} />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoStatusBar style="dark" />
      <View style={styles.shell}>
        <Header user={user} adminToken={adminToken} onLogout={logout} onStopImpersonating={async () => {
          const original = await SecureStore.getItemAsync(ADMIN_TOKEN_KEY);
          if (!original) return;
          await SecureStore.setItemAsync(TOKEN_KEY, original);
          await SecureStore.deleteItemAsync(ADMIN_TOKEN_KEY);
          setAdminToken(null);
          setToken(original);
          await refreshMe();
        }} />
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

function AuthScreen({ onLogin }: { onLogin: (user: User, token: string) => Promise<void> }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
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
      const payload = mode === 'login'
        ? { email: form.email, password: form.password }
        : form;
      const { data } = await api.post(endpoint, payload);
      await onLogin(data.user, data.token);
    } catch (error: any) {
      Alert.alert(mode === 'login' ? 'Login failed' : 'Registration failed', error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.auth}>
        <View style={styles.brandMark}>
          <Ionicons name="medical" size={34} color="#ffffff" />
        </View>
        <Text style={styles.heroTitle}>VetsCue</Text>
        <Text style={styles.heroCopy}>Native rescue coordination for citizens, NGOs, hospitals, ambulances, and admins.</Text>

        <View style={styles.segment}>
          <Pressable style={[styles.segmentItem, mode === 'login' && styles.segmentActive]} onPress={() => setMode('login')}>
            <Text style={[styles.segmentText, mode === 'login' && styles.segmentTextActive]}>Login</Text>
          </Pressable>
          <Pressable style={[styles.segmentItem, mode === 'register' && styles.segmentActive]} onPress={() => setMode('register')}>
            <Text style={[styles.segmentText, mode === 'register' && styles.segmentTextActive]}>Register</Text>
          </Pressable>
        </View>

        {mode === 'register' && (
          <>
            <Field label="Name" value={form.name} onChangeText={(name) => setForm({ ...form, name })} />
            <RolePicker role={form.role} setRole={(role) => setForm({ ...form, role })} />
          </>
        )}
        <Field label="Email" value={form.email} keyboardType="email-address" autoCapitalize="none" onChangeText={(email) => setForm({ ...form, email })} />
        <Field label="Password" value={form.password} secureTextEntry onChangeText={(password) => setForm({ ...form, password })} />

        {mode === 'register' && form.role !== 'user' && (
          <>
            <Field label="Organisation" value={form.orgName} onChangeText={(orgName) => setForm({ ...form, orgName })} />
            <Field label="Registration number" value={form.regNumber} onChangeText={(regNumber) => setForm({ ...form, regNumber })} />
            <Field label="Phone" value={form.phone} keyboardType="phone-pad" onChangeText={(phone) => setForm({ ...form, phone })} />
            <Field label="Address" value={form.address} onChangeText={(address) => setForm({ ...form, address })} />
            {form.role === 'hospital' && (
              <View style={styles.row}>
                {['government', 'private'].map((type) => (
                  <Chip key={type} label={type} active={form.hospitalType === type} onPress={() => setForm({ ...form, hospitalType: type })} />
                ))}
              </View>
            )}
            {form.role === 'ambulance' && (
              <Field label="Vehicle number" value={form.vehicleNumber} onChangeText={(vehicleNumber) => setForm({ ...form, vehicleNumber })} />
            )}
          </>
        )}

        <PrimaryButton label={loading ? 'Please wait' : mode === 'login' ? 'Login' : 'Create account'} icon="log-in" onPress={submit} disabled={loading} />
        <SecondaryButton label="Continue with Google" icon="logo-google" onPress={() => promptGoogle()} disabled={!GOOGLE_WEB_CLIENT_ID && !GOOGLE_ANDROID_CLIENT_ID} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MainScreen(props: {
  user: User;
  tab: Tab;
  socket: Socket | null;
  setTab: (tab: Tab) => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setAdminToken: (token: string) => void;
}) {
  const { user, tab } = props;
  if (tab === 'cases') return <CasesScreen user={user} />;
  if (tab === 'map') return <MapTools user={user} socket={props.socket} />;
  if (tab === 'wallet') return <WalletScreen user={user} setUser={props.setUser} />;
  if (tab === 'alerts') return <NotificationsScreen />;
  if (tab === 'profile') return <ProfileScreen user={user} setUser={props.setUser} />;
  if (tab === 'admin' || user.role === 'admin') return <AdminScreen setToken={props.setToken} setAdminToken={props.setAdminToken} setUser={props.setUser} />;
  if (user.role === 'ngo') return <NgoHome />;
  if (user.role === 'hospital') return <HospitalHome />;
  if (user.role === 'ambulance') return <AmbulanceHome socket={props.socket} />;
  return <CitizenHome setTab={props.setTab} />;
}

function CitizenHome({ setTab }: { setTab: (tab: Tab) => void }) {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => {
    api.get('/public/stats').then(({ data }) => setStats(data.stats)).catch(() => undefined);
  }, []);
  return (
    <ScrollPanel>
      <Text style={styles.screenTitle}>Rescue Command</Text>
      <Text style={styles.screenCopy}>Submit a rescue, track help, fund urgent care, and follow completed impact stories.</Text>
      <View style={styles.grid}>
        <Metric label="Rescues" value={stats?.totalRequests ?? '--'} />
        <Metric label="Completed" value={stats?.completedRequests ?? '--'} />
        <Metric label="NGOs" value={stats?.totalNGOs ?? '--'} />
        <Metric label="Citizens" value={stats?.totalUsers ?? '--'} />
      </View>
      <PrimaryButton label="Submit rescue" icon="add-circle" onPress={() => setTab('cases')} />
      <SecondaryButton label="Open wallet" icon="wallet" onPress={() => setTab('wallet')} />
      <Fundraisers compact />
      <ImpactFeed />
    </ScrollPanel>
  );
}

function CasesScreen({ user }: { user: User }) {
  if (user.role === 'user') return <UserCases />;
  if (user.role === 'ngo') return <NgoCases />;
  if (user.role === 'hospital') return <HospitalCases />;
  if (user.role === 'ambulance') return <AmbulanceCases />;
  return <AdminRescues />;
}

function UserCases() {
  const [rescues, setRescues] = useState<Rescue[]>([]);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [animalType, setAnimalType] = useState('dog');
  const [media, setMedia] = useState<ImagePicker.ImagePickerAsset[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/rescue/mine');
      setRescues(data.rescues || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert('Permission needed', 'Allow media access to attach rescue evidence.');
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
    });
    if (!result.canceled) setMedia(result.assets.slice(0, 6));
  };

  const submitRescue = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return Alert.alert('Location needed', 'Location is required to route rescuers.');
    const position = await Location.getCurrentPositionAsync({});
    const fd = new FormData();
    fd.append('description', description);
    fd.append('animalType', animalType);
    fd.append('lat', String(position.coords.latitude));
    fd.append('lng', String(position.coords.longitude));
    fd.append('willingToPay', 'false');
    fd.append('willingToGo', 'false');
    media.forEach((asset, index) => {
      fd.append('media', {
        uri: asset.uri,
        name: asset.fileName || `rescue-${index}.${asset.type === 'video' ? 'mp4' : 'jpg'}`,
        type: asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
      } as any);
    });
    await api.post('/rescue', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    setDescription('');
    setMedia([]);
    await load();
    Alert.alert('Rescue submitted', 'Responders have been alerted.');
  };

  return (
    <ScrollPanel refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <Text style={styles.screenTitle}>My Rescues</Text>
      <Field label="What happened?" value={description} multiline onChangeText={setDescription} />
      <View style={styles.row}>
        {['dog', 'cat', 'other'].map((type) => <Chip key={type} label={type} active={animalType === type} onPress={() => setAnimalType(type)} />)}
      </View>
      <SecondaryButton label={`${media.length} media selected`} icon="images" onPress={pickMedia} />
      <PrimaryButton label="Submit rescue at current location" icon="navigate" onPress={submitRescue} disabled={!description.trim()} />
      {rescues.map((rescue) => <RescueCard key={rescue._id} rescue={rescue} actions={<UserRescueActions rescue={rescue} onDone={load} />} />)}
    </ScrollPanel>
  );
}

function UserRescueActions({ rescue, onDone }: { rescue: Rescue; onDone: () => void }) {
  const [cost, setCost] = useState('');
  return (
    <View style={styles.cardActions}>
      <SecondaryButton label="Cancel" icon="close-circle" onPress={async () => {
        await api.put(`/rescue/${rescue._id}/cancel`);
        onDone();
      }} />
      <Field label="Fundraiser cost" value={cost} keyboardType="numeric" onChangeText={setCost} />
      <SecondaryButton label="Make fundraiser" icon="heart" onPress={async () => {
        await api.put(`/rescue/${rescue._id}/fundraiser`, { estimatedCost: Number(cost) });
        setCost('');
        onDone();
      }} disabled={!cost} />
      {rescue.bill?.paidStatus === 'pending' && <PrimaryButton label="Pay hospital bill" icon="card" onPress={async () => {
        await api.post(`/rescue/${rescue._id}/pay-bill`);
        onDone();
      }} />}
    </View>
  );
}

function NgoHome() {
  const [analytics, setAnalytics] = useState<any>(null);
  useEffect(() => { api.get('/ngo/analytics').then(({ data }) => setAnalytics(data.analytics || data)).catch(() => undefined); }, []);
  return (
    <ScrollPanel>
      <Text style={styles.screenTitle}>NGO Response Board</Text>
      <Text style={styles.screenCopy}>Nearby reports, active treatment, escalation, follow-ups, and fundraiser requests.</Text>
      <View style={styles.grid}>
        <Metric label="Nearby" value={analytics?.nearbyCases ?? '--'} />
        <Metric label="Active" value={analytics?.activeCases ?? '--'} />
        <Metric label="Completed" value={analytics?.completedCases ?? '--'} />
        <Metric label="Impact" value={analytics?.impactCases ?? '--'} />
      </View>
      <NgoCases />
    </ScrollPanel>
  );
}

function NgoCases() {
  const [nearby, setNearby] = useState<Rescue[]>([]);
  const [mine, setMine] = useState<Rescue[]>([]);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nearbyRes, mineRes] = await Promise.all([api.get('/ngo/nearby'), api.get('/ngo/my-cases')]);
      setNearby(nearbyRes.data.cases || nearbyRes.data.rescues || []);
      setMine(mineRes.data.cases || mineRes.data.rescues || []);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  return (
    <ScrollPanel refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <Text style={styles.sectionTitle}>Nearby Cases</Text>
      {nearby.map((rescue) => <RescueCard key={rescue._id} rescue={rescue} actions={<NgoActions rescue={rescue} onDone={load} />} />)}
      <Text style={styles.sectionTitle}>My Cases</Text>
      {mine.map((rescue) => <RescueCard key={rescue._id} rescue={rescue} actions={<NgoActions rescue={rescue} onDone={load} />} />)}
    </ScrollPanel>
  );
}

function NgoActions({ rescue, onDone }: { rescue: Rescue; onDone: () => void }) {
  const [followUp, setFollowUp] = useState('');
  const act = async (path: string, body?: any) => {
    await api[path.startsWith('/ngo') ? 'post' : 'put'](path, body || {});
    onDone();
  };
  return (
    <View style={styles.cardActions}>
      <PrimaryButton label="Accept" icon="checkmark-circle" onPress={() => act(`/rescue/${rescue._id}/accept-ngo`, { type: 'immediate', transportType: 'self' })} />
      <SecondaryButton label="Reject" icon="remove-circle" onPress={() => act(`/rescue/${rescue._id}/reject-ngo`)} />
      <SecondaryButton label="On the way" icon="walk" onPress={() => act(`/rescue/${rescue._id}/ngo-status`, { status: 'on_the_way' })} />
      <SecondaryButton label="Resolve on spot" icon="medkit" onPress={() => act(`/rescue/${rescue._id}/resolve-ngo`)} />
      <SecondaryButton label="Escalate" icon="business" onPress={() => act(`/rescue/${rescue._id}/escalate-ngo`, { transportType: 'ambulance' })} />
      <Field label="Follow-up date or note" value={followUp} onChangeText={setFollowUp} />
      <SecondaryButton label="Add follow-up" icon="calendar" onPress={async () => {
        await api.post(`/rescue/${rescue._id}/followup`, { scheduleDate: followUp || new Date().toISOString(), notes: followUp });
        setFollowUp('');
        onDone();
      }} />
    </View>
  );
}

function HospitalHome() {
  return (
    <ScrollPanel>
      <Text style={styles.screenTitle}>Hospital Desk</Text>
      <Text style={styles.screenCopy}>Accept escalations, manage treatment, bill cases, and coordinate ambulances.</Text>
      <HospitalCases />
    </ScrollPanel>
  );
}

function HospitalCases() {
  const [escalated, setEscalated] = useState<Rescue[]>([]);
  const [mine, setMine] = useState<Rescue[]>([]);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, b] = await Promise.all([api.get('/hospital/escalated'), api.get('/hospital/my-cases')]);
      setEscalated(a.data.cases || a.data.rescues || []);
      setMine(b.data.cases || b.data.rescues || []);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  return (
    <ScrollPanel refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <Text style={styles.sectionTitle}>Escalated</Text>
      {escalated.map((rescue) => <RescueCard key={rescue._id} rescue={rescue} actions={<HospitalActions rescue={rescue} onDone={load} />} />)}
      <Text style={styles.sectionTitle}>Hospital Cases</Text>
      {mine.map((rescue) => <RescueCard key={rescue._id} rescue={rescue} actions={<HospitalActions rescue={rescue} onDone={load} />} />)}
      <FleetManager />
    </ScrollPanel>
  );
}

function HospitalActions({ rescue, onDone }: { rescue: Rescue; onDone: () => void }) {
  const [bill, setBill] = useState('');
  const [note, setNote] = useState('');
  return (
    <View style={styles.cardActions}>
      <PrimaryButton label="Accept broadcast" icon="checkmark-done" onPress={async () => { await api.put(`/hospital/rescue/${rescue._id}/accept-broadcast`); onDone(); }} />
      <SecondaryButton label="Reject broadcast" icon="close" onPress={async () => { await api.put(`/hospital/rescue/${rescue._id}/reject-broadcast`); onDone(); }} />
      <Field label="Treatment note" value={note} onChangeText={setNote} />
      <SecondaryButton label="Update treatment" icon="pulse" onPress={async () => {
        await api.put(`/hospital/rescue/${rescue._id}/treatment`, { treatmentStatus: 'under_treatment', hospitalNote: note });
        setNote('');
        onDone();
      }} />
      <Field label="Bill amount" value={bill} keyboardType="numeric" onChangeText={setBill} />
      <PrimaryButton label="Send bill" icon="receipt" disabled={!bill} onPress={async () => {
        await api.post(`/hospital/rescue/${rescue._id}/bill`, { items: [{ name: 'Treatment', amount: Number(bill) }], totalAmount: Number(bill), sentTo: 'user' });
        setBill('');
        onDone();
      }} />
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
      <Text style={styles.sectionTitle}>Fleet</Text>
      <Field label="New ambulance vehicle number" value={vehicleNumber} onChangeText={setVehicleNumber} />
      <SecondaryButton label="Onboard ambulance" icon="car" disabled={!vehicleNumber} onPress={async () => {
        await api.post('/hospital/onboard-ambulance', { vehicleNumber, name: `Ambulance ${vehicleNumber}` });
        setVehicleNumber('');
        load();
      }} />
      {ambulances.map((a) => <SimpleRow key={a._id} title={a.vehicleNumber || a.name} subtitle={a.isApproved ? 'Approved' : 'Pending approval'} />)}
    </View>
  );
}

function AmbulanceHome({ socket }: { socket: Socket | null }) {
  return (
    <ScrollPanel>
      <Text style={styles.screenTitle}>Ambulance Crew</Text>
      <Text style={styles.screenCopy}>Accept dispatches, stream location, and update transport progress.</Text>
      <AmbulanceCases socket={socket} />
    </ScrollPanel>
  );
}

function AmbulanceCases({ socket }: { socket?: Socket | null }) {
  const [assigned, setAssigned] = useState<Rescue[]>([]);
  const [pinged, setPinged] = useState<Rescue[]>([]);
  const [history, setHistory] = useState<Rescue[]>([]);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, p, h] = await Promise.all([api.get('/ambulance/assigned'), api.get('/ambulance/pinged'), api.get('/ambulance/history')]);
      setAssigned([...(a.data.task ? [a.data.task] : a.data.tasks || a.data.rescues || [])]);
      setPinged(p.data.tasks || p.data.rescues || []);
      setHistory(h.data.history || h.data.rescues || []);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const streamLocation = async (rescueId?: string) => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return Alert.alert('Location needed', 'Location is required for ambulance tracking.');
    const position = await Location.getCurrentPositionAsync({});
    await api.put('/ambulance/location', { lat: position.coords.latitude, lng: position.coords.longitude });
    if (rescueId) {
      socket?.emit('ambulance_location_update', {
        rescueRequestId: rescueId,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    }
    Alert.alert('Location shared', 'Your latest location was sent.');
  };

  return (
    <ScrollPanel refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <Text style={styles.sectionTitle}>Dispatch Pings</Text>
      {pinged.map((rescue) => <RescueCard key={rescue._id} rescue={rescue} actions={<View style={styles.cardActions}>
        <PrimaryButton label="Accept ping" icon="checkmark-circle" onPress={async () => { await api.put(`/ambulance/rescue/${rescue._id}/accept-ping`); load(); }} />
        <SecondaryButton label="Reject" icon="close-circle" onPress={async () => { await api.put(`/ambulance/rescue/${rescue._id}/reject-ping`); load(); }} />
      </View>} />)}
      <Text style={styles.sectionTitle}>Assigned</Text>
      {assigned.map((rescue) => <RescueCard key={rescue._id} rescue={rescue} actions={<View style={styles.cardActions}>
        <PrimaryButton label="Share location" icon="navigate" onPress={() => streamLocation(rescue._id)} />
        {['en_route', 'picked_up', 'delivered'].map((status) => (
          <SecondaryButton key={status} label={status.replace('_', ' ')} icon="flag" onPress={async () => { await api.put(`/ambulance/rescue/${rescue._id}/status`, { status }); load(); }} />
        ))}
      </View>} />)}
      <Text style={styles.sectionTitle}>History</Text>
      {history.map((rescue) => <RescueCard key={rescue._id} rescue={rescue} />)}
    </ScrollPanel>
  );
}

function WalletScreen({ user, setUser }: { user: User; setUser: (user: User) => void }) {
  const [amount, setAmount] = useState('500');
  const [wallet, setWallet] = useState<any>(null);
  const load = useCallback(async () => {
    const { data } = await api.get('/user/wallet');
    setWallet(data);
    setUser({ ...user, walletBalance: data.walletBalance });
  }, [setUser, user]);
  useEffect(() => { load().catch(() => undefined); }, [load]);

  const topUp = async () => {
    try {
      const value = Number(amount);
      const { data } = await api.post('/payment/create-order', { amount: value });
      
      if (!RazorpayCheckout || typeof RazorpayCheckout.open !== 'function') {
        throw new Error('Razorpay native checkout is not available in the Expo Go client. Please use the "Mock top-up" button below instead.');
      }
      
      const payment = await RazorpayCheckout.open({
        key: RAZORPAY_KEY_ID || data.keyId,
        amount: data.order.amount,
        currency: data.order.currency || 'INR',
        order_id: data.order.id,
        name: 'VetsCue Wallet',
        description: 'Wallet top-up',
        prefill: { email: user.email, name: user.name, contact: user.phone || '' },
        theme: { color: '#0f766e' },
      });
      await api.post('/payment/verify', payment);
      await load();
      Alert.alert('Wallet updated', 'Payment verified successfully.');
    } catch (error: any) {
      const errorMsg = error.message || 'An error occurred during Razorpay checkout.';
      Alert.alert(
        'Payment Action',
        `${errorMsg}\n\nFor Expo Go testing, please use the separate "Mock top-up" button instead.`
      );
    }
  };

  return (
    <ScrollPanel>
      <Text style={styles.screenTitle}>Wallet</Text>
      <Metric label="Balance" value={`Rs ${wallet?.walletBalance ?? user.walletBalance ?? 0}`} />
      <Field label="Top-up amount" value={amount} keyboardType="numeric" onChangeText={setAmount} />
      <PrimaryButton label="Top up with Razorpay" icon="card" onPress={topUp} />
      <SecondaryButton label="Mock top-up" icon="flask" onPress={async () => { await api.post('/payment/mock-topup', { amount: Number(amount) }); load(); }} />
      <Text style={styles.sectionTitle}>Transactions</Text>
      {(wallet?.transactions || []).map((tx: any) => <SimpleRow key={tx._id} title={`${tx.type} Rs ${tx.amount}`} subtitle={tx.description} />)}
      <Fundraisers />
    </ScrollPanel>
  );
}

function NotificationsScreen() {
  const [data, setData] = useState<any>(null);
  const load = useCallback(async () => {
    const res = await api.get('/notifications');
    setData(res.data);
  }, []);
  useEffect(() => { load().catch(() => undefined); }, [load]);
  return (
    <ScrollPanel>
      <Text style={styles.screenTitle}>Alerts</Text>
      <Metric label="Unread" value={data?.unreadCount ?? 0} />
      <SecondaryButton label="Mark all read" icon="checkmark-done" onPress={async () => { await api.put('/notifications/read-all'); load(); }} />
      {(data?.notifications || []).map((n: any) => (
        <Pressable key={n._id} style={[styles.card, !n.isRead && styles.unread]} onPress={async () => { await api.put(`/notifications/${n._id}/read`); load(); }}>
          <Text style={styles.cardTitle}>{n.title}</Text>
          <Text style={styles.cardText}>{n.message}</Text>
          <Text style={styles.cardMeta}>{compactDate(n.createdAt)}</Text>
        </Pressable>
      ))}
    </ScrollPanel>
  );
}

function ProfileScreen({ user, setUser }: { user: User; setUser: (user: User) => void }) {
  const [form, setForm] = useState({
    name: user.name || '',
    phone: user.phone || '',
    orgName: user.orgName || '',
    address: user.location?.address || '',
  });
  const save = async () => {
    const { data } = await api.put('/user/profile', form);
    setUser(data.user);
    Alert.alert('Profile saved');
  };
  const updateLocation = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return;
    const position = await Location.getCurrentPositionAsync({});
    const { data } = await api.put('/user/profile', { location: { lat: position.coords.latitude, lng: position.coords.longitude } });
    setUser(data.user);
    Alert.alert('Location updated');
  };
  return (
    <ScrollPanel>
      <Text style={styles.screenTitle}>Profile</Text>
      <Field label="Name" value={form.name} onChangeText={(name) => setForm({ ...form, name })} />
      <Field label="Phone" value={form.phone} onChangeText={(phone) => setForm({ ...form, phone })} />
      {user.role !== 'user' && <Field label="Organisation" value={form.orgName} onChangeText={(orgName) => setForm({ ...form, orgName })} />}
      <Field label="Address" value={form.address} onChangeText={(address) => setForm({ ...form, address })} />
      <PrimaryButton label="Save profile" icon="save" onPress={save} />
      <SecondaryButton label="Use current location" icon="locate" onPress={updateLocation} />
    </ScrollPanel>
  );
}

function AdminScreen({ setToken, setAdminToken, setUser }: { setToken: (token: string) => void; setAdminToken: (token: string) => void; setUser: (user: User) => void }) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [pending, setPending] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [fundraisers, setFundraisers] = useState<Rescue[]>([]);
  const load = useCallback(async () => {
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
    <ScrollPanel>
      <Text style={styles.screenTitle}>Admin Command</Text>
      <View style={styles.grid}>
        <Metric label="Users" value={analytics?.totalUsers ?? '--'} />
        <Metric label="Requests" value={analytics?.totalRequests ?? '--'} />
        <Metric label="Pending" value={analytics?.pendingApprovals ?? '--'} />
        <Metric label="Donations" value={`Rs ${analytics?.totalDonations ?? '--'}`} />
      </View>
      <Text style={styles.sectionTitle}>Approvals</Text>
      {pending.map((u) => <SimpleRow key={u._id} title={u.orgName || u.name} subtitle={`${u.role} - ${u.email}`} right={<PrimaryButton compact label="Approve" icon="checkmark" onPress={async () => { await api.put(`/admin/approve/${u._id}`, { approve: true }); load(); }} />} />)}
      <Text style={styles.sectionTitle}>Fundraisers</Text>
      {fundraisers.map((r) => <RescueCard key={r._id} rescue={r} actions={<View style={styles.cardActions}>
        <PrimaryButton label="Approve" icon="checkmark" onPress={async () => { await api.put(`/admin/rescue/${r._id}/fundraiser/review`, { action: 'approve' }); load(); }} />
        <SecondaryButton label="Reject" icon="close" onPress={async () => { await api.put(`/admin/rescue/${r._id}/fundraiser/review`, { action: 'reject' }); load(); }} />
      </View>} />)}
      <Text style={styles.sectionTitle}>Users</Text>
      {users.map((u) => <SimpleRow key={u._id} title={u.orgName || u.name} subtitle={`${u.role} - ${u.email}`} right={<SecondaryButton compact label="Switch" icon="swap-horizontal" onPress={() => impersonate(u._id)} />} />)}
      <AdminRescues />
    </ScrollPanel>
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
      <Text style={styles.sectionTitle}>Rescue Overrides</Text>
      {rescues.map((rescue) => <RescueCard key={rescue._id} rescue={rescue} actions={<View style={styles.cardActions}>
        {['completed', 'cancelled', 'closed_unresolved'].map((status) => <SecondaryButton key={status} label={status} icon="create" onPress={async () => { await api.put(`/admin/rescue/${rescue._id}/override`, { status }); load(); }} />)}
      </View>} />)}
    </View>
  );
}

function MapTools({ user, socket }: { user: User; socket: Socket | null }) {
  const [position, setPosition] = useState<Location.LocationObjectCoords | null>(null);
  const capture = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return;
    const loc = await Location.getCurrentPositionAsync({});
    setPosition(loc.coords);
    if (user.role === 'ambulance') {
      await api.put('/ambulance/location', { lat: loc.coords.latitude, lng: loc.coords.longitude });
      socket?.emit('ambulance_location_update', { lat: loc.coords.latitude, lng: loc.coords.longitude });
    } else {
      await api.put('/user/profile', { location: { lat: loc.coords.latitude, lng: loc.coords.longitude } });
    }
  };
  return (
    <ScrollPanel>
      <Text style={styles.screenTitle}>Location</Text>
      <Text style={styles.screenCopy}>OpenStreetMap is embedded in the native app for rescue routing and ambulance tracking without Google Maps billing.</Text>
      <View style={styles.mapPanel}>
        {position ? (
          <WebView
            style={styles.webMap}
            originWhitelist={['*']}
            source={{ html: leafletHtml(position.latitude, position.longitude) }}
          />
        ) : (
          <>
            <Ionicons name="map" size={48} color="#0f766e" />
            <Text style={styles.cardTitle}>No location captured yet</Text>
          </>
        )}
      </View>
      {position && <Text style={styles.cardMeta}>{position.latitude.toFixed(5)}, {position.longitude.toFixed(5)}</Text>}
      <PrimaryButton label="Capture current location" icon="locate" onPress={capture} />
    </ScrollPanel>
  );
}

function leafletHtml(lat: number, lng: number) {
  const tileUrl = MAP_STYLE_URL.includes('{z}') ? MAP_STYLE_URL : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  return `
<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>html,body,#map{height:100%;margin:0}.leaflet-control-attribution{font-size:10px}</style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map', { zoomControl: false }).setView([${lat}, ${lng}], 15);
    L.tileLayer('${tileUrl}', { maxZoom: 19, attribution: 'OpenStreetMap' }).addTo(map);
    L.marker([${lat}, ${lng}]).addTo(map);
  </script>
</body>
</html>`;
}

function Fundraisers({ compact = false }: { compact?: boolean }) {
  const [items, setItems] = useState<Rescue[]>([]);
  const [amount, setAmount] = useState('100');
  useEffect(() => { api.get('/donation/fundraisers').then(({ data }) => setItems(data.fundraisers || [])).catch(() => undefined); }, []);
  if (compact && items.length === 0) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>Fundraisers</Text>
      {items.slice(0, compact ? 3 : undefined).map((rescue) => (
        <RescueCard key={rescue._id} rescue={rescue} actions={<View style={styles.cardActions}>
          <Field label="Wallet donation" value={amount} keyboardType="numeric" onChangeText={setAmount} />
          <PrimaryButton label="Donate wallet" icon="heart" onPress={async () => {
            await api.post('/donation/donate-wallet', { rescueId: rescue._id, amount: Number(amount) });
            Alert.alert('Donation sent');
          }} />
        </View>} />
      ))}
    </View>
  );
}

function ImpactFeed() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { api.get('/rescue/impact/feed').then(({ data }) => setItems(data.feed || [])).catch(() => undefined); }, []);
  if (!items.length) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>Impact</Text>
      {items.slice(0, 3).map((item) => (
        <View key={item._id} style={styles.card}>
          {item.beforeImage && <Image source={{ uri: item.beforeImage }} style={styles.image} />}
          <Text style={styles.cardTitle}>{item.helperName}</Text>
          <Text style={styles.cardText}>{item.afterSummary || item.description}</Text>
        </View>
      ))}
    </View>
  );
}

function Header({ user, adminToken, onLogout, onStopImpersonating }: { user: User; adminToken: string | null; onLogout: () => void; onStopImpersonating: () => void }) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.kicker}>{titleForRole[user.role]}</Text>
        <Text style={styles.headerTitle}>{user.orgName || user.name}</Text>
        {!user.isApproved && user.role !== 'user' && <Text style={styles.pending}>Pending admin approval</Text>}
      </View>
      <View style={styles.headerActions}>
        {adminToken && <IconButton icon="return-down-back" onPress={onStopImpersonating} />}
        <IconButton icon="log-out-outline" onPress={onLogout} />
      </View>
    </View>
  );
}

function TabBar({ role, tab, setTab }: { role: Role; tab: Tab; setTab: (tab: Tab) => void }) {
  const tabs: { tab: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { tab: 'home', label: 'Home', icon: 'home' },
    { tab: 'cases', label: role === 'admin' ? 'Cases' : 'Work', icon: 'list' },
    { tab: 'map', label: 'Map', icon: 'map' },
    { tab: 'alerts', label: 'Alerts', icon: 'notifications' },
    { tab: 'profile', label: 'Profile', icon: 'person' },
  ];
  if (role === 'user' || role === 'ngo') tabs.splice(3, 0, { tab: 'wallet', label: 'Wallet', icon: 'wallet' });
  if (role === 'admin') tabs.splice(2, 0, { tab: 'admin', label: 'Admin', icon: 'shield' });
  return (
    <View style={styles.tabBar}>
      {tabs.map((item) => (
        <Pressable key={item.tab} style={styles.tabItem} onPress={() => setTab(item.tab)}>
          <Ionicons name={item.icon} size={20} color={tab === item.tab ? '#0f766e' : '#64748b'} />
          <Text style={[styles.tabText, tab === item.tab && styles.tabTextActive]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function RescueCard({ rescue, actions }: { rescue: Rescue; actions?: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>{rescue.description}</Text>
        <Text style={[styles.badge, { color: statusColor(rescue.status), borderColor: statusColor(rescue.status) }]}>{rescue.status}</Text>
      </View>
      {!!rescue.images?.[0] && <Image source={{ uri: rescue.images[0] }} style={styles.image} />}
      <Text style={styles.cardText}>{rescue.location?.address || [rescue.location?.lat, rescue.location?.lng].filter(Boolean).join(', ') || 'Location available in case detail'}</Text>
      <Text style={styles.cardMeta}>{compactDate(rescue.createdAt)}</Text>
      {!!rescue.estimatedCost && <Text style={styles.cardMeta}>Raised Rs {rescue.amountRaised || 0} of Rs {rescue.estimatedCost}</Text>}
      {actions}
    </View>
  );
}

function Field(props: React.ComponentProps<typeof TextInput> & { label: string }) {
  const { label, style, ...rest } = props;
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor="#94a3b8" style={[styles.input, props.multiline && styles.inputMulti, style]} {...rest} />
    </View>
  );
}

function RolePicker({ role, setRole }: { role: Role; setRole: (role: Role) => void }) {
  return (
    <View style={styles.rowWrap}>
      {(['user', 'ngo', 'hospital', 'ambulance'] as Role[]).map((item) => <Chip key={item} label={item} active={role === item} onPress={() => setRole(item)} />)}
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function PrimaryButton({ label, icon, onPress, disabled, compact }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void; disabled?: boolean; compact?: boolean }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={[styles.primaryButton, compact && styles.compactButton, disabled && styles.disabled]}>
      <Ionicons name={icon} size={18} color="#ffffff" />
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ label, icon, onPress, disabled, compact }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void; disabled?: boolean; compact?: boolean }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={[styles.secondaryButton, compact && styles.compactButton, disabled && styles.disabled]}>
      <Ionicons name={icon} size={18} color="#0f766e" />
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function IconButton({ icon, onPress }: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.iconButton}>
      <Ionicons name={icon} size={20} color="#0f172a" />
    </Pressable>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function SimpleRow({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <View style={styles.rowCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.cardText}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

function ScrollPanel({ children, refreshControl }: { children: React.ReactNode; refreshControl?: React.ReactElement }) {
  return (
    <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} refreshControl={refreshControl as any}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  shell: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    gap: 12,
  },
  muted: {
    color: '#64748b',
  },
  auth: {
    padding: 24,
    gap: 14,
  },
  brandMark: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#0f766e',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  heroTitle: {
    fontSize: 40,
    fontWeight: '800',
    color: '#0f172a',
  },
  heroCopy: {
    fontSize: 16,
    lineHeight: 23,
    color: '#475569',
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    padding: 4,
    borderRadius: 8,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentActive: {
    backgroundColor: '#ffffff',
  },
  segmentText: {
    fontWeight: '700',
    color: '#64748b',
  },
  segmentTextActive: {
    color: '#0f172a',
  },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kicker: {
    color: '#0f766e',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 20,
    color: '#0f172a',
    fontWeight: '800',
  },
  pending: {
    color: '#b45309',
    fontSize: 12,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 16,
    paddingBottom: 120,
    gap: 14,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
  },
  screenCopy: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metric: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 14,
  },
  metricValue: {
    fontSize: 22,
    color: '#0f172a',
    fontWeight: '900',
  },
  metricLabel: {
    color: '#64748b',
    fontWeight: '700',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 14,
    gap: 10,
  },
  unread: {
    borderColor: '#0f766e',
    backgroundColor: '#ecfdf5',
  },
  cardHeader: {
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '800',
  },
  cardText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  cardMeta: {
    fontSize: 12,
    color: '#64748b',
  },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontWeight: '800',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rowCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fieldWrap: {
    gap: 6,
  },
  label: {
    color: '#334155',
    fontWeight: '800',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: '#0f172a',
    fontSize: 15,
  },
  inputMulti: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  chip: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  chipActive: {
    backgroundColor: '#0f766e',
    borderColor: '#0f766e',
  },
  chipText: {
    color: '#334155',
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  primaryButton: {
    minHeight: 46,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#0f766e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '900',
  },
  secondaryButton: {
    minHeight: 46,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#0f766e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#0f766e',
    fontWeight: '900',
  },
  compactButton: {
    minHeight: 38,
    paddingVertical: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  cardActions: {
    gap: 8,
  },
  tabBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    gap: 3,
    minWidth: 48,
  },
  tabText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '800',
  },
  tabTextActive: {
    color: '#0f766e',
  },
  mapPanel: {
    minHeight: 260,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
    overflow: 'hidden',
  },
  webMap: {
    width: '100%',
    height: 260,
  },
});
