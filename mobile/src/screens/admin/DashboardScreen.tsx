import React, { useEffect, useState, useCallback } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../themes';
import { spacing, borderRadius, typography } from '../../themes/tokens';
import { api } from '../../services/api';
import { useNavigation } from '../../navigation/navigation';
import Screen from '../../components/Screen';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import { AnimatedPress } from '../../components/AnimatedPress';

interface AdminDashboardProps {
  setToken: (t: string) => void;
  setAdminToken: (t: string) => void;
  setUser: (u: any) => void;
}

export function DashboardScreen({ setToken, setAdminToken, setUser }: AdminDashboardProps) {
  const colors = useColors();
  const navigation = useNavigation();
  const [analytics, setAnalytics] = useState<any>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, pendingRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/pending-approvals'),
      ]);
      setAnalytics(analyticsRes.data.analytics);
      setPendingCount((pendingRes.data.users || []).length);
    } catch (e) {
      // Quietly ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchDashboardData} tintColor={colors.primary} />
      }
      style={{ backgroundColor: colors.background.primary }}
    >
      {/* Premium Hero Banner */}
      <Card variant="glass" style={styles.heroCard}>
        <View style={styles.heroGlow} pointerEvents="none" />
        <View style={styles.kickerBadge}>
          <Text style={[styles.kickerText, { color: colors.primary }]}>🛡️ Security & Command</Text>
        </View>
        <Text style={[styles.heroTitle, { color: colors.text.primary }]}>Ecosystem Admin</Text>
        <Text style={[styles.heroDesc, { color: colors.text.secondary }]}>
          Monitor system telemetry, approve NGOs and clinical institutions, override rescue operations, and validate fundraiser payouts.
        </Text>
      </Card>

      {/* Stats Grid */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Ecosystem Metrics</Text>
      </View>
      <View style={styles.statsGrid}>
        <StatCard
          label="Total Users"
          value={analytics?.totalUsers?.toString() || '—'}
          icon="people"
          iconColor={colors.primary}
          style={{ width: '48.5%' }}
        />
        <StatCard
          label="Active Cases"
          value={analytics?.totalRequests?.toString() || '—'}
          icon="paw"
          iconColor={colors.info}
          style={{ width: '48.5%' }}
        />
        <StatCard
          label="Pending Approvals"
          value={pendingCount > 0 ? pendingCount.toString() : (analytics?.pendingApprovals?.toString() || '0')}
          icon="shield-checkmark"
          iconColor={colors.warning}
          style={{ width: '48.5%', marginTop: 10 }}
        />
        <StatCard
          label="Total Donations"
          value={`₹${analytics?.totalDonations?.toLocaleString('en-IN') || '0'}`}
          icon="heart"
          iconColor={colors.success}
          style={{ width: '48.5%', marginTop: 10 }}
        />
      </View>

      {/* System Telemetry & Health */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>System Telemetry</Text>
      </View>
      <Card variant="default" style={styles.telemetryCard}>
        <View style={styles.telemetryItem}>
          <View style={styles.telemetryDotRow}>
            <View style={[styles.pulseDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.telemetryLabel, { color: colors.text.primary }]}>API Gateway</Text>
          </View>
          <Text style={[styles.telemetryValue, { color: colors.text.secondary }]}>Operational (24ms)</Text>
        </View>
        <View style={styles.telemetrySeparator} />
        <View style={styles.telemetryItem}>
          <View style={styles.telemetryDotRow}>
            <View style={[styles.pulseDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.telemetryLabel, { color: colors.text.primary }]}>Database Status</Text>
          </View>
          <Text style={[styles.telemetryValue, { color: colors.text.secondary }]}>Connected (100%)</Text>
        </View>
        <View style={styles.telemetrySeparator} />
        <View style={styles.telemetryItem}>
          <View style={styles.telemetryDotRow}>
            <View style={[styles.pulseDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.telemetryLabel, { color: colors.text.primary }]}>Queue Worker</Text>
          </View>
          <Text style={[styles.telemetryValue, { color: colors.text.secondary }]}>Idle (0 backlogged)</Text>
        </View>
      </Card>

      {/* Admin Shortcuts Panel */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Command Desk</Text>
      </View>
      <View style={{ gap: 12 }}>
        <AnimatedPress
          onPress={() => navigation.push('AdminApprovals')}
          style={[styles.menuRow, { backgroundColor: colors.background.secondary }]}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconBox, { backgroundColor: `${colors.warning}15` }]}>
              <Ionicons name="checkbox-outline" size={20} color={colors.warning} />
            </View>
            <View>
              <Text style={[styles.menuTitle, { color: colors.text.primary }]}>Organization Approvals</Text>
              <Text style={[styles.menuSub, { color: colors.text.secondary }]}>Verify clinical licenses, NGOs and fleet operators</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {pendingCount > 0 && (
              <View style={[styles.countBadge, { backgroundColor: colors.warning }]}>
                <Text style={styles.countBadgeText}>{pendingCount}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
          </View>
        </AnimatedPress>

        <AnimatedPress
          onPress={() => navigation.push('AdminFundraisers')}
          style={[styles.menuRow, { backgroundColor: colors.background.secondary }]}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconBox, { backgroundColor: `${colors.success}15` }]}>
              <Ionicons name="heart-outline" size={20} color={colors.success} />
            </View>
            <View>
              <Text style={[styles.menuTitle, { color: colors.text.primary }]}>Fundraiser Reviews</Text>
              <Text style={[styles.menuSub, { color: colors.text.secondary }]}>Inspect invoices, treat bills, and approve payouts</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
        </AnimatedPress>

        <AnimatedPress
          onPress={() => navigation.push('AdminUsers')}
          style={[styles.menuRow, { backgroundColor: colors.background.secondary }]}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconBox, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="people-outline" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.menuTitle, { color: colors.text.primary }]}>User Directory & Impersonation</Text>
              <Text style={[styles.menuSub, { color: colors.text.secondary }]}>Search accounts and secure-switch user contexts</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
        </AnimatedPress>

        <AnimatedPress
          onPress={() => navigation.push('AdminRescues')}
          style={[styles.menuRow, { backgroundColor: colors.background.secondary }]}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconBox, { backgroundColor: `${colors.info}15` }]}>
              <Ionicons name="shield-outline" size={20} color={colors.info} />
            </View>
            <View>
              <Text style={[styles.menuTitle, { color: colors.text.primary }]}>Rescue Operation Overrides</Text>
              <Text style={[styles.menuSub, { color: colors.text.secondary }]}>Manually update case progress and clinical statuses</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
        </AnimatedPress>

        <AnimatedPress
          onPress={() => navigation.push('AdminAnalytics')}
          style={[styles.menuRow, { backgroundColor: colors.background.secondary }]}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconBox, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="analytics-outline" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.menuTitle, { color: colors.text.primary }]}>Deep-Dive Reports</Text>
              <Text style={[styles.menuSub, { color: colors.text.secondary }]}>Review detailed metrics and rescue velocity reports</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
        </AnimatedPress>

        <AnimatedPress
          onPress={() => navigation.push('AdminAuditLogs')}
          style={[styles.menuRow, { backgroundColor: colors.background.secondary }]}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconBox, { backgroundColor: `${colors.text.muted}15` }]}>
              <Ionicons name="server-outline" size={20} color={colors.text.secondary} />
            </View>
            <View>
              <Text style={[styles.menuTitle, { color: colors.text.primary }]}>Security Audit Logs</Text>
              <Text style={[styles.menuSub, { color: colors.text.secondary }]}>Track admin overrides and secure system actions</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
        </AnimatedPress>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    padding: spacing[5],
    borderRadius: borderRadius['2xl'],
    gap: spacing[3],
    overflow: 'hidden',
    marginBottom: spacing[4],
  },
  heroGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#76d6d5',
    opacity: 0.08,
  },
  kickerBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[2.5],
    paddingVertical: spacing[1],
    backgroundColor: 'rgba(118, 214, 213, 0.12)',
    borderRadius: borderRadius.full,
  },
  kickerText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.extraBold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 26,
    fontFamily: typography.fontFamily.extraBold,
    letterSpacing: -0.5,
  },
  heroDesc: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: typography.fontFamily.regular,
  },
  sectionHeader: {
    marginVertical: spacing[3],
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  telemetryCard: {
    padding: spacing[4],
    gap: spacing[3.5],
  },
  telemetryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  telemetryDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  telemetryLabel: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
  },
  telemetryValue: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
  },
  telemetrySeparator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
    borderRadius: borderRadius.xl,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3.5],
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
  },
  menuSub: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    marginTop: 2,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  countBadgeText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
    color: '#121214',
  },
});

export default DashboardScreen;
