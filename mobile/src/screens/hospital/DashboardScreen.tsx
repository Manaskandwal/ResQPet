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
  const [escalated, setEscalated] = useState<any[]>([]);
  const [myCases, setMyCases] = useState<any[]>([]);
  const [ambulances, setAmbulances] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [escalatedRes, myCasesRes, fleetRes] = await Promise.all([
        api.get('/hospital/escalated'),
        api.get('/hospital/my-cases'),
        api.get('/hospital/ambulances'),
      ]);
      setEscalated(escalatedRes.data.cases || escalatedRes.data.rescues || []);
      setMyCases(myCasesRes.data.cases || myCasesRes.data.rescues || []);
      setAmbulances(fleetRes.data.ambulances || []);
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
          <Text style={[styles.kickerText, { color: colors.primary }]}>🏥 CLINICAL DESK</Text>
        </View>
        <Text style={[styles.heroTitle, { color: colors.text.primary }]}>Medical Hub</Text>
        <Text style={[styles.heroDesc, { color: colors.text.secondary }]}>
          Manage emergency hospital admissions, prescribe treatments, issue digital billing receipts, and coordinate ambulance fleets.
        </Text>
        <View style={styles.actionRow}>
          <AnimatedPress
            onPress={() => navigation.push('MyCases')}
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="medkit" size={18} color={colors.background.primary} />
            <Text style={[styles.actionBtnText, { color: colors.background.primary }]}>Ward Cases</Text>
          </AnimatedPress>
          <AnimatedPress
            onPress={() => navigation.push('Fleet')}
            style={[styles.actionBtnOutline, { borderColor: colors.primary }]}
          >
            <Ionicons name="car-outline" size={18} color={colors.primary} />
            <Text style={[styles.actionBtnOutlineText, { color: colors.primary }]}>Manage Fleet</Text>
          </AnimatedPress>
        </View>
      </Card>

      {/* Metrics Section */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Intake Metrics</Text>
      </View>
      <View style={styles.statsGrid}>
        <StatCard
          label="Pending dispatches"
          value={escalated.length.toString()}
          icon="alert-circle"
          iconColor={colors.warning}
          style={{ width: '48.5%' }}
        />
        <StatCard
          label="Active Admissions"
          value={myCases.length.toString()}
          icon="pulse"
          iconColor={colors.primary}
          style={{ width: '48.5%' }}
        />
        <StatCard
          label="Ambulance Fleet"
          value={ambulances.length.toString()}
          icon="car"
          iconColor={colors.info}
          style={{ width: '48.5%', marginTop: 10 }}
        />
        <StatCard
          label="Treated Spot"
          value={myCases.filter(c => c.status === 'completed').length.toString()}
          icon="heart"
          iconColor={colors.success}
          style={{ width: '48.5%', marginTop: 10 }}
        />
      </View>

      {/* Primary menu shortcuts */}
      <View style={{ gap: 12, marginTop: 24 }}>
        <AnimatedPress
          onPress={() => navigation.push('MyCases')}
          style={[styles.menuRow, { backgroundColor: colors.background.secondary }]}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="medical-outline" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.menuTitle, { color: colors.text.primary }]}>Triage & Admissions</Text>
              <Text style={[styles.menuSub, { color: colors.text.secondary }]}>Accept escalated dispatches or view patient charts</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
        </AnimatedPress>

        <AnimatedPress
          onPress={() => navigation.push('Fleet')}
          style={[styles.menuRow, { backgroundColor: colors.background.secondary }]}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconIcon, { backgroundColor: `${colors.info}15` }]}>
              <Ionicons name="car-sport-outline" size={20} color={colors.info} />
            </View>
            <View>
              <Text style={[styles.menuTitle, { color: colors.text.primary }]}>Ambulance Dispatch Hub</Text>
              <Text style={[styles.menuSub, { color: colors.text.secondary }]}>Onboard vehicles and monitor active drivers</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
        </AnimatedPress>

        <AnimatedPress
          onPress={() => navigation.push('History')}
          style={[styles.menuRow, { backgroundColor: colors.background.secondary }]}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconIcon, { backgroundColor: `${colors.success}15` }]}>
              <Ionicons name="archive-outline" size={20} color={colors.success} />
            </View>
            <View>
              <Text style={[styles.menuTitle, { color: colors.text.primary }]}>Patient Archive</Text>
              <Text style={[styles.menuSub, { color: colors.text.secondary }]}>Audit historic bills, treated dogs, and records</Text>
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
