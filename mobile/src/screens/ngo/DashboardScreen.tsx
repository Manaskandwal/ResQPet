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

export function DashboardScreen() {
  const colors = useColors();
  const navigation = useNavigation();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/ngo/analytics');
      setAnalytics(data.analytics || data);
    } catch (e) {
      // Ignore quietly
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
      {/* Luminous Header / Hero Banner */}
      <Card variant="glass" style={styles.heroCard}>
        <View style={styles.heroGlow} pointerEvents="none" />
        <View style={styles.kickerBadge}>
          <Text style={[styles.kickerText, { color: colors.primary }]}>🛡️ NGO Guardian Portal</Text>
        </View>
        <Text style={[styles.heroTitle, { color: colors.text.primary }]}>Response Board</Text>
        <Text style={[styles.heroDesc, { color: colors.text.secondary }]}>
          Coordinate emergency animal rescues, manage hospital admissions, track active cases, and issue fundraising updates.
        </Text>
        <View style={styles.actionRow}>
          <AnimatedPress
            onPress={() => navigation.push('NearbyCases')}
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="compass" size={18} color={colors.background.primary} />
            <Text style={[styles.actionBtnText, { color: colors.background.primary }]}>Launch Radar</Text>
          </AnimatedPress>
          <AnimatedPress
            onPress={() => navigation.push('MyCases')}
            style={[styles.actionBtnOutline, { borderColor: colors.primary }]}
          >
            <Ionicons name="medkit-outline" size={18} color={colors.primary} />
            <Text style={[styles.actionBtnOutlineText, { color: colors.primary }]}>My Cases</Text>
          </AnimatedPress>
        </View>
      </Card>

      {/* Metrics Section */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Response Metrics</Text>
      </View>
      <View style={styles.statsGrid}>
        <StatCard
          label="Nearby cases"
          value={analytics?.nearbyCases ?? '0'}
          icon="location"
          iconColor={colors.primary}
          style={{ width: '48.5%' }}
        />
        <StatCard
          label="Active Cases"
          value={analytics?.activeCases ?? '0'}
          icon="pulse"
          iconColor={colors.warning}
          style={{ width: '48.5%' }}
        />
        <StatCard
          label="Completed"
          value={analytics?.completedCases ?? '0'}
          icon="checkmark-circle"
          iconColor={colors.success}
          style={{ width: '48.5%', marginTop: 10 }}
        />
        <StatCard
          label="Total Saved"
          value={analytics?.impactCases ?? '0'}
          icon="heart"
          iconColor={colors.error}
          style={{ width: '48.5%', marginTop: 10 }}
        />
      </View>

      {/* Menu / Navigations */}
      <View style={{ gap: 12, marginTop: 24 }}>
        <AnimatedPress
          onPress={() => navigation.push('NearbyCases')}
          style={[styles.menuRow, { backgroundColor: colors.background.secondary }]}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="compass-outline" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.menuTitle, { color: colors.text.primary }]}>Nearby Incident Alerts</Text>
              <Text style={[styles.menuSub, { color: colors.text.secondary }]}>Accept pending dispatches or stray reports</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
        </AnimatedPress>

        <AnimatedPress
          onPress={() => navigation.push('MyCases')}
          style={[styles.menuRow, { backgroundColor: colors.background.secondary }]}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconIcon, { backgroundColor: `${colors.warning}15` }]}>
              <Ionicons name="medical-outline" size={20} color={colors.warning} />
            </View>
            <View>
              <Text style={[styles.menuTitle, { color: colors.text.primary }]}>My Active Rescues</Text>
              <Text style={[styles.menuSub, { color: colors.text.secondary }]}>Log medical progress, escalate or close reports</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
        </AnimatedPress>

        <AnimatedPress
          onPress={() => navigation.push('Followups')}
          style={[styles.menuRow, { backgroundColor: colors.background.secondary }]}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconIcon, { backgroundColor: `${colors.success}15` }]}>
              <Ionicons name="calendar-outline" size={20} color={colors.success} />
            </View>
            <View>
              <Text style={[styles.menuTitle, { color: colors.text.primary }]}>Post-Rescue Followups</Text>
              <Text style={[styles.menuSub, { color: colors.text.secondary }]}>Schedule visits or check shelter recovery cases</Text>
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
  actionRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[2],
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
  },
  actionBtnText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
  },
  actionBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
  },
  actionBtnOutlineText: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
  },
  sectionHeader: {
    marginVertical: spacing[2],
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
  iconIcon: {
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
});

export default DashboardScreen;
