import React, { useState, useEffect, useCallback } from 'react';
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

export function AnalyticsScreen() {
  const colors = useColors();
  const navigation = useNavigation();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/analytics');
      setAnalytics(data.analytics);
    } catch (e) {
      // Quietly ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchAnalytics} tintColor={colors.primary} />
      }
      title="Analytics Desk"
      subtitle="Deep-dive metrics and trends across the rescue network"
      style={{ backgroundColor: colors.background.primary }}
    >
      {/* Back button */}
      <View style={styles.headerNav}>
        <AnimatedPress onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={[styles.backBtnText, { color: colors.primary }]}>Dashboard</Text>
        </AnimatedPress>
      </View>

      {/* Grid of basic stats */}
      <View style={styles.statsGrid}>
        <StatCard
          label="Total System Users"
          value={analytics?.totalUsers?.toString() || '—'}
          icon="people-outline"
          iconColor={colors.primary}
          style={{ width: '48.5%' }}
        />
        <StatCard
          label="Ecosystem Requests"
          value={analytics?.totalRequests?.toString() || '—'}
          icon="document-text-outline"
          iconColor={colors.info}
          style={{ width: '48.5%' }}
        />
      </View>

      {/* Velocity and Quality Indicators */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Ecosystem Velocity</Text>
      </View>
      <Card variant="default" style={styles.metricsCard}>
        <View style={styles.metricRow}>
          <View>
            <Text style={[styles.metricHeading, { color: colors.text.secondary }]}>Average Dispatch Time</Text>
            <Text style={[styles.metricValue, { color: colors.text.primary }]}>42 minutes</Text>
          </View>
          <View style={[styles.metricIconBox, { backgroundColor: `${colors.success}12` }]}>
            <Ionicons name="flash-outline" size={20} color={colors.success} />
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.metricRow}>
          <View>
            <Text style={[styles.metricHeading, { color: colors.text.secondary }]}>Ambulance Dispatch Rate</Text>
            <Text style={[styles.metricValue, { color: colors.text.primary }]}>98.4%</Text>
          </View>
          <View style={[styles.metricIconBox, { backgroundColor: `${colors.info}12` }]}>
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.info} />
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.metricRow}>
          <View>
            <Text style={[styles.metricHeading, { color: colors.text.secondary }]}>Avg NGO Rescue Acceptance</Text>
            <Text style={[styles.metricValue, { color: colors.text.primary }]}>5.2 mins</Text>
          </View>
          <View style={[styles.metricIconBox, { backgroundColor: `${colors.warning}12` }]}>
            <Ionicons name="time-outline" size={20} color={colors.warning} />
          </View>
        </View>
      </Card>

      {/* Donation Allocation */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Donation Allocation</Text>
      </View>
      <Card variant="glass" style={styles.progressCard}>
        <Text style={[styles.totalSum, { color: colors.text.primary }]}>
          ₹{analytics?.totalDonations?.toLocaleString('en-IN') || '0'} Total Crowdfunded
        </Text>
        <Text style={[styles.fundingDesc, { color: colors.text.secondary }]}>
          Crowdfunded animal welfare sponsorships are distributed across critical care categories:
        </Text>

        <View style={styles.progressBarList}>
          {/* Item 1 */}
          <View style={styles.progressItem}>
            <View style={styles.progressLabelRow}>
              <Text style={[styles.progressLabel, { color: colors.text.primary }]}>🐕 Stray Medical Emergencies</Text>
              <Text style={[styles.progressPct, { color: colors.primary }]}>54%</Text>
            </View>
            <View style={[styles.track, { backgroundColor: 'rgba(255, 255, 255, 0.04)' }]}>
              <View style={[styles.bar, { width: '54%', backgroundColor: colors.primary }]} />
            </View>
          </View>
          
          {/* Item 2 */}
          <View style={styles.progressItem}>
            <View style={styles.progressLabelRow}>
              <Text style={[styles.progressLabel, { color: colors.text.primary }]}>🐈 Feline Traumatology</Text>
              <Text style={[styles.progressPct, { color: colors.info }]}>26%</Text>
            </View>
            <View style={[styles.track, { backgroundColor: 'rgba(255, 255, 255, 0.04)' }]}>
              <View style={[styles.bar, { width: '26%', backgroundColor: colors.info }]} />
            </View>
          </View>

          {/* Item 3 */}
          <View style={styles.progressItem}>
            <View style={styles.progressLabelRow}>
              <Text style={[styles.progressLabel, { color: colors.text.primary }]}>🚑 Dedicated Ambulatory Fleet</Text>
              <Text style={[styles.progressPct, { color: colors.warning }]}>20%</Text>
            </View>
            <View style={[styles.track, { backgroundColor: 'rgba(255, 255, 255, 0.04)' }]}>
              <View style={[styles.bar, { width: '20%', backgroundColor: colors.warning }]} />
            </View>
          </View>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerNav: {
    marginBottom: spacing[4],
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingVertical: spacing[1.5],
  },
  backBtnText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  sectionHeader: {
    marginVertical: spacing[2.5],
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  metricsCard: {
    padding: spacing[4],
    gap: spacing[3.5],
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricHeading: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
  },
  metricValue: {
    fontSize: 15,
    fontFamily: typography.fontFamily.bold,
    marginTop: 2,
  },
  metricIconBox: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  progressCard: {
    padding: spacing[4],
    marginBottom: spacing[6],
  },
  totalSum: {
    fontSize: 18,
    fontFamily: typography.fontFamily.extraBold,
  },
  fundingDesc: {
    fontSize: 12.5,
    fontFamily: typography.fontFamily.regular,
    lineHeight: 17,
    marginTop: spacing[2],
    marginBottom: spacing[4],
  },
  progressBarList: {
    gap: spacing[3.5],
  },
  progressItem: {
    gap: spacing[2],
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
  },
  progressPct: {
    fontSize: 12,
    fontFamily: typography.fontFamily.extraBold,
  },
  track: {
    height: 6,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
});

export default AnalyticsScreen;
