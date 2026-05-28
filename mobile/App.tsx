import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  SafeAreaView,
  StatusBar,
  View,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as WebBrowser from 'expo-web-browser';
import {
  useFonts,
  Manrope_400Regular,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { io, Socket } from 'socket.io-client';

// Services
import {
  api,
  setApiToken,
  SOCKET_URL,
  TOKEN_KEY,
  ADMIN_TOKEN_KEY,
  USER_KEY,
} from './src/services/api';

// Styles & Tokens
import { C, S } from './src/styles/theme';

// Types
import { Role, Tab, User } from './src/types';

// Components
import { SplashScreen, AppHeader, TabBar } from './src/components/SharedComponents';

// Navigation & Router
import { NavigationProvider, AnimatedStackNavigator } from './src/navigation/navigation';
import { ThemeProvider } from './src/themes';

// Screens
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { RoleSelectionScreen } from './src/screens/auth/RoleSelectionScreen';
import { RegisterScreen } from './src/screens/auth/RegisterScreen';
import { CitizenHome, CasesScreen } from './src/screens/CitizenScreen';
import WalletScreen from './src/screens/WalletScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import { ProfileScreen, SettingsScreen, AIChatScreen } from './src/screens/shared';
import {
  AdminDashboard,
  AdminApprovals,
  AdminUsers,
  AdminRescues,
  AdminFundraisers,
  AdminAuditLogs,
  AdminAnalytics,
} from './src/screens/admin';
import {
  NgoDashboard,
  NearbyCasesScreen,
  NgoMyCases,
  NgoCaseDetail,
  NgoFundraiserRequest,
  NgoFollowups,
} from './src/screens/ngo';
import {
  HospitalDashboard,
  HospitalMyCases,
  HospitalCaseDetail,
  HospitalBilling,
  HospitalFleet,
  HospitalAmbulanceTracking,
  HospitalHistory,
} from './src/screens/hospital';
import {
  AmbulanceDashboard,
  AmbulanceTask,
  AmbulanceHistory,
  AmbulanceLocationSettings,
} from './src/screens/ambulance';

WebBrowser.maybeCompleteAuthSession();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function MainScreen(props: {
  user: User;
  tab: Tab;
  socket: Socket | null;
  setTab: (t: Tab) => void;
  setUser: (u: User) => void;
  setToken: (t: string) => void;
  setAdminToken: (t: string) => void;
  onLogout: () => void;
}) {
  const { user, tab } = props;

  // 1. Global shared Profile tab override
  if (tab === 'profile') {
    return (
      <NavigationProvider key={tab} initialScreen="Profile">
        <AnimatedStackNavigator
          routes={[
            { name: 'Profile', component: () => <ProfileScreen user={user} setUser={props.setUser} /> },
            { name: 'Settings', component: () => <SettingsScreen onLogout={props.onLogout} /> },
            { name: 'AIChat', component: AIChatScreen },
          ]}
        />
      </NavigationProvider>
    );
  }

  // 2. Role-specific modular Navigation stacks (with tab key-resetting support)
  if (user.role === 'admin' || tab === 'admin') {
    return (
      <NavigationProvider key={tab} initialScreen={tab === 'cases' ? 'AdminRescues' : 'AdminDashboard'}>
        <AnimatedStackNavigator
          routes={[
            { name: 'AdminDashboard', component: () => <AdminDashboard setToken={props.setToken} setAdminToken={props.setAdminToken} setUser={props.setUser} /> },
            { name: 'AdminApprovals', component: AdminApprovals },
            { name: 'AdminUsers', component: () => <AdminUsers setToken={props.setToken} setAdminToken={props.setAdminToken} setUser={props.setUser} /> },
            { name: 'AdminRescues', component: AdminRescues },
            { name: 'AdminFundraisers', component: AdminFundraisers },
            { name: 'AdminAuditLogs', component: AdminAuditLogs },
            { name: 'AdminAnalytics', component: AdminAnalytics },
          ]}
        />
      </NavigationProvider>
    );
  }

  if (user.role === 'ngo') {
    return (
      <NavigationProvider key={tab} initialScreen={tab === 'cases' ? 'MyCases' : 'NgoDashboard'}>
        <AnimatedStackNavigator
          routes={[
            { name: 'NgoDashboard', component: NgoDashboard },
            { name: 'NearbyCases', component: NearbyCasesScreen },
            { name: 'MyCases', component: NgoMyCases },
            { name: 'CaseDetail', component: NgoCaseDetail },
            { name: 'FundraiserRequest', component: NgoFundraiserRequest },
            { name: 'Followups', component: NgoFollowups },
          ]}
        />
      </NavigationProvider>
    );
  }

  if (user.role === 'hospital') {
    return (
      <NavigationProvider key={tab} initialScreen={tab === 'cases' ? 'MyCases' : 'HospitalDashboard'}>
        <AnimatedStackNavigator
          routes={[
            { name: 'HospitalDashboard', component: HospitalDashboard },
            { name: 'MyCases', component: HospitalMyCases },
            { name: 'CaseDetail', component: HospitalCaseDetail },
            { name: 'Billing', component: HospitalBilling },
            { name: 'Fleet', component: HospitalFleet },
            { name: 'AmbulanceTracking', component: HospitalAmbulanceTracking },
            { name: 'History', component: HospitalHistory },
          ]}
        />
      </NavigationProvider>
    );
  }

  if (user.role === 'ambulance') {
    return (
      <NavigationProvider key={tab} initialScreen={tab === 'cases' ? 'Task' : 'AmbulanceDashboard'}>
        <AnimatedStackNavigator
          routes={[
            { name: 'AmbulanceDashboard', component: AmbulanceDashboard },
            { name: 'Task', component: AmbulanceTask },
            { name: 'History', component: AmbulanceHistory },
            { name: 'LocationSettings', component: AmbulanceLocationSettings },
          ]}
        />
      </NavigationProvider>
    );
  }

  // 3. Citizen (user) standalone tabs fallback
  if (tab === 'cases') return <CasesScreen user={user} />;
  if (tab === 'wallet') return <WalletScreen user={user} setUser={props.setUser} />;
  if (tab === 'alerts') return <NotificationsScreen />;

  return <CitizenHome setTab={props.setTab} />;
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

  const persistSession = useCallback(async (nextUser: User, nextToken: string) => {
    setApiToken(nextToken);
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
      // Ignore network errors on logout
    }
    const pushToken = await SecureStore.getItemAsync('vetscue_push_token');
    if (pushToken) {
      try {
        await api.delete('/user/push-token', { data: { token: pushToken } });
      } catch {
        // Ignore quietly
      }
    }
    setApiToken(null);
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
          setApiToken(storedToken);
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
    socket.on('new_rescue_alert', (p) =>
      Alert.alert('🚨 New rescue nearby', p?.description || 'A new case needs attention.')
    );
    socket.on('new_dispatch_alert', (p) =>
      Alert.alert('🚑 New dispatch', p?.description || 'A new ambulance dispatch is available.')
    );
    socket.on('status_update', (p) =>
      Alert.alert('📋 Case updated', p?.message || `Status changed to ${p?.status}`)
    );
    return () => {
      socket.disconnect();
    };
  }, [registerPushToken, token, user]);

  const content = (() => {
    if (booting || !fontsLoaded) return <SplashScreen />;
    if (!token || !user) {
      return (
        <NavigationProvider initialScreen="Login">
          <AnimatedStackNavigator
            routes={[
              { name: 'Login', component: () => <LoginScreen onLogin={persistSession} /> },
              { name: 'RoleSelection', component: RoleSelectionScreen },
              { name: 'Register', component: () => <RegisterScreen onLogin={persistSession} /> },
            ]}
          />
        </NavigationProvider>
      );
    }

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
              setApiToken(original);
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
            onLogout={logout}
          />
          <TabBar role={user.role} tab={tab} setTab={setTab} />
        </View>
      </SafeAreaView>
    );
  })();

  return <ThemeProvider>{content}</ThemeProvider>;
}
