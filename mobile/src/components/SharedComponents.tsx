import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, S, statusColor } from '../styles/theme';
import { Role, Tab, User } from '../types';
import { AnimatedPress } from './AnimatedPress';

// ─── Role Title Map ──────────────────────────────────────────────────────────
export const titleForRole: Record<Role, string> = {
  user: 'Citizen Rescue',
  ngo: 'NGO Response Board',
  hospital: 'Hospital Desk',
  ambulance: 'Ambulance Crew',
  admin: 'Admin Command',
};

// ─── Splash Screen ───────────────────────────────────────────────────────────
export function SplashScreen() {
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

// ─── App Header ───────────────────────────────────────────────────────────────
export function AppHeader({
  user,
  adminToken,
  onLogout,
  onStopImpersonating,
}: {
  user: User;
  adminToken: string | null;
  onLogout: () => void;
  onStopImpersonating: () => void;
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
export function TabBar({
  role,
  tab,
  setTab,
}: {
  role: Role;
  tab: Tab;
  setTab: (t: Tab) => void;
}) {
  const tabs: {
    tab: Tab;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    activeIcon: keyof typeof Ionicons.glyphMap;
  }[] = [
    { tab: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
    { tab: 'cases', label: role === 'admin' ? 'Cases' : 'Work', icon: 'list-outline', activeIcon: 'list' },
    { tab: 'alerts', label: 'Alerts', icon: 'notifications-outline', activeIcon: 'notifications' },
    { tab: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
  ];
  if (role === 'user' || role === 'ngo') {
    tabs.splice(2, 0, { tab: 'wallet', label: 'Wallet', icon: 'wallet-outline', activeIcon: 'wallet' });
  }
  if (role === 'admin') {
    tabs.splice(2, 0, { tab: 'admin', label: 'Admin', icon: 'shield-outline', activeIcon: 'shield' });
  }

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

// ─── Screen Shell & Layouts ───────────────────────────────────────────────────
export function ScreenShell({
  children,
  refreshControl,
}: {
  children: React.ReactNode;
  refreshControl?: React.ReactElement;
}) {
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

export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={S.screenHeader}>
      <Text style={S.screenTitle}>{title}</Text>
      {subtitle && <Text style={S.screenSubtitle}>{subtitle}</Text>}
    </View>
  );
}

export function SectionHeader({ title }: { title: string }) {
  return <Text style={S.sectionTitle}>{title}</Text>;
}

export function SurfaceCard({ children }: { children: React.ReactNode }) {
  return <View style={S.surfaceCard}>{children}</View>;
}

export function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
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

export function StatusPill({ status }: { status?: string }) {
  const color = statusColor(status);
  const bg = `${color}20`;
  return (
    <View style={[S.statusPill, { backgroundColor: bg, borderColor: `${color}40` }]}>
      <Text style={[S.statusPillText, { color }]}>{(status || 'unknown').replace(/_/g, ' ')}</Text>
    </View>
  );
}

export function FormField({
  label,
  icon,
  ...props
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
} & React.ComponentProps<typeof TextInput>) {
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

export function SegmentedControl({
  options,
  active,
  onChange,
}: {
  options: { key: string; label: string }[];
  active: string;
  onChange: (k: string) => void;
}) {
  return (
    <View style={S.segControl}>
      {options.map((o) => (
        <AnimatedPress
          key={o.key}
          onPress={() => onChange(o.key)}
          style={[S.segControlItem, active === o.key && S.segControlItemActive]}
        >
          <Text style={[S.segControlText, active === o.key && S.segControlTextActive]}>{o.label}</Text>
        </AnimatedPress>
      ))}
    </View>
  );
}

export function EmptyState({
  icon,
  message,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  message: string;
}) {
  return (
    <View style={S.emptyState}>
      <Ionicons name={icon} size={40} color={C.textMuted} style={{ opacity: 0.4 }} />
      <Text style={S.emptyStateText}>{message}</Text>
    </View>
  );
}
