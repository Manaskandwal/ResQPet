import React, { useEffect, useState } from 'react';
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

export function HomeScreen() {
  const colors = useColors();
  const navigation = useNavigation();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/public/stats');
      setStats(data.stats);
    } catch (e) {
      // Ignore quietly or show fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchStats} tintColor={colors.primary} />
      }
      style={{ backgroundColor: colors.background.primary }}
    >
      {/* Bioluminescent Header / Hero Banner */}
      <Card variant="glass" style={styles.heroCard}>
        <View style={styles.heroGlow} pointerEvents="none" />
        <View style={styles.kickerBadge}>
          <Text style={[styles.kickerText, { color: colors.primary }]}>🐾 Saving Lives Together</Text>
        </View>
        <Text style={[styles.heroTitle, { color: colors.text.primary }]}>Rescue Command</Text>
        <Text style={[styles.heroDesc, { color: colors.text.secondary }]}>
          Instantly report distressed stray animals, track ongoing rescues, support fundraisers, and watch the impact.
        </Text>
        <View style={styles.actionRow}>
          <AnimatedPress
            onPress={() => navigation.push('SubmitRescue')}
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add-circle" size={18} color={colors.background.primary} />
            <Text style={[styles.actionBtnText, { color: colors.background.primary }]}>Report Rescue</Text>
          </AnimatedPress>
          <AnimatedPress
            onPress={() => navigation.navigate('wallet')}
            style={[styles.actionBtnOutline, { borderColor: colors.primary }]}
          >
            <Ionicons name="wallet-outline" size={18} color={colors.primary} />
            <Text style={[styles.actionBtnOutlineText, { color: colors.primary }]}>My Wallet</Text>
          </AnimatedPress>
        </View>
      </Card>

      {/* Statistics Section */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Ecosystem Metrics</Text>
      </View>
      <View style={styles.statsGrid}>
        <StatCard
          label="Total Rescues"
          value={stats?.totalRequests ?? '—'}
          icon="paw"
          iconColor={colors.primary}
          style={{ width: '48.5%' }}
        />
        <StatCard
          label="Safely Saved"
          value={stats?.completedRequests ?? '—'}
          icon="checkmark-circle"
          iconColor={colors.success}
          style={{ width: '48.5%' }}
        />
        <StatCard
          label="Active NGOs"
          value={stats?.totalNGOs ?? '—'}
          icon="leaf"
          iconColor={colors.info}
          style={{ width: '48.5%', marginTop: 10 }}
        />
        <StatCard
          label="Rescuers"
          value={stats?.totalUsers ?? '—'}
          icon="people"
          iconColor={colors.warning}
          style={{ width: '48.5%', marginTop: 10 }}
        />
      </View>

      {/* Secondary CTAs Section */}
      <View style={{ gap: 12, marginTop: 16 }}>
        <AnimatedPress
          onPress={() => navigation.push('Fundraisers')}
          style={[styles.menuRow, { backgroundColor: colors.background.secondary }]}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconIcon, { backgroundColor: `${colors.warning}15` }]}>
              <Ionicons name="heart" size={20} color={colors.warning} />
            </View>
            <View>
              <Text style={[styles.menuTitle, { color: colors.text.primary }]}>Active Crowdfunds</Text>
              <Text style={[styles.menuSub, { color: colors.text.secondary }]}>Contribute towards pet surgeries & hospital bills</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
        </AnimatedPress>

        <AnimatedPress
          onPress={() => navigation.push('ImpactFeed')}
          style={[styles.menuRow, { backgroundColor: colors.background.secondary }]}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconIcon, { backgroundColor: `${colors.success}15` }]}>
              <Ionicons name="sparkles" size={20} color={colors.success} />
            </View>
            <View>
              <Text style={[styles.menuTitle, { color: colors.text.primary }]}>Impact Stories</Text>
              <Text style={[styles.menuSub, { color: colors.text.secondary }]}>Read success stories of animals you helped protect</Text>
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
    backgroundColor: 'rgba(118,214,213,0.12)',
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

export default HomeScreen;
