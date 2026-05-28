import React, { useEffect, useState, useCallback } from 'react';
import { RefreshControl, StyleSheet, Text, View, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../themes';
import { spacing, borderRadius, typography } from '../../themes/tokens';
import { api } from '../../services/api';
import { useNavigation } from '../../navigation/navigation';
import Screen from '../../components/Screen';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { AnimatedPress } from '../../components/AnimatedPress';
import { Rescue } from '../../types';

export function DashboardScreen() {
  const colors = useColors();
  const navigation = useNavigation();
  const [pinged, setPinged] = useState<Rescue[]>([]);
  const [assigned, setAssigned] = useState<Rescue[]>([]);
  const [history, setHistory] = useState<Rescue[]>([]);
  const [loading, setLoading] = useState(false);
  const [onDuty, setOnDuty] = useState(true);

  const fetchAmbulanceData = useCallback(async () => {
    setLoading(true);
    try {
      const [assignedRes, pingedRes, historyRes] = await Promise.all([
        api.get('/ambulance/assigned'),
        api.get('/ambulance/pinged'),
        api.get('/ambulance/history'),
      ]);
      setAssigned([...(assignedRes.data.task ? [assignedRes.data.task] : assignedRes.data.tasks || assignedRes.data.rescues || [])]);
      setPinged(pingedRes.data.tasks || pingedRes.data.rescues || []);
      setHistory(historyRes.data.history || historyRes.data.rescues || []);
    } catch (e) {
      // Ignore quietly
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAmbulanceData();
  }, [fetchAmbulanceData]);

  const handleDutyToggle = (value: boolean) => {
    setOnDuty(value);
    Alert.alert('Status Updated', value ? 'You are now ON DUTY.' : 'You are now OFF DUTY.');
  };

  const handleAccept = async (rescueId: string) => {
    try {
      await api.put(`/ambulance/rescue/${rescueId}/accept-ping`);
      Alert.alert('Success 🎉', 'Dispatch accepted! Navigation task active.');
      fetchAmbulanceData();
    } catch (e) {
      // Handle error
    }
  };

  const handleReject = async (rescueId: string) => {
    try {
      await api.put(`/ambulance/rescue/${rescueId}/reject-ping`);
      fetchAmbulanceData();
    } catch (e) {
      // Handle error
    }
  };

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchAmbulanceData} tintColor={colors.primary} />
      }
      style={{ backgroundColor: colors.background.primary }}
    >
      {/* Duty switch overlay */}
      <Card variant="glass" style={styles.dutyCard}>
        <View style={styles.dutyLeft}>
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: onDuty ? colors.success : colors.text.muted },
            ]}
          />
          <View>
            <Text style={[styles.dutyTitle, { color: colors.text.primary }]}>
              {onDuty ? 'ON DUTY' : 'OFF DUTY'}
            </Text>
            <Text style={[styles.dutySub, { color: colors.text.secondary }]}>
              {onDuty ? 'Receiving emergency dispatch pings' : 'Dispatches offline'}
            </Text>
          </View>
        </View>
        <Switch
          value={onDuty}
          onValueChange={handleDutyToggle}
          trackColor={{ false: colors.background.tertiary, true: `${colors.success}50` }}
          thumbColor={onDuty ? colors.success : colors.text.muted}
        />
      </Card>

      {/* Metrics Row */}
      <View style={styles.statsGrid}>
        <StatCard
          label="New dispatches"
          value={pinged.length.toString()}
          icon="alert-circle"
          iconColor={colors.warning}
          style={{ width: '48.5%' }}
        />
        <StatCard
          label="Completed runs"
          value={history.length.toString()}
          icon="checkmark-circle"
          iconColor={colors.success}
          style={{ width: '48.5%' }}
        />
      </View>

      {/* Action tasks */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Emergency dispatches</Text>
      </View>

      {assigned.length > 0 ? (
        <Card variant="elevated" style={styles.activeTaskCard}>
          <View style={styles.taskHeader}>
            <Ionicons name="warning" size={24} color={colors.warning} style={styles.pulseIcon} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.activeTaskTitle, { color: colors.text.primary }]}>
                Active Assigned Task
              </Text>
              <Text style={[styles.activeTaskSub, { color: colors.text.secondary }]}>
                {assigned[0].description}
              </Text>
            </View>
          </View>
          <Button
            variant="primary"
            icon={<Ionicons name="navigate" size={16} color={colors.background.primary} />}
            onPress={() => navigation.push('Task', { rescueId: assigned[0]._id })}
            style={{ marginTop: spacing[3] }}
          >
            Launch Navigation Map
          </Button>
        </Card>
      ) : pinged.length > 0 ? (
        <View style={{ gap: 12 }}>
          {pinged.map((ping) => (
            <Card
              key={ping._id}
              variant="elevated"
              style={StyleSheet.flatten([styles.pingCard, { backgroundColor: colors.background.secondary }])}
            >
              <Text style={[styles.pingTitle, { color: colors.text.primary }]}>
                {ping.description}
              </Text>
              <Text style={[styles.pingLoc, { color: colors.text.secondary }]}>
                📍 {ping.location?.address || 'GPS Location attached'}
              </Text>
              <View style={styles.pingActions}>
                <Button
                  variant="primary"
                  size="small"
                  icon={<Ionicons name="checkmark" size={16} color={colors.background.primary} />}
                  onPress={() => handleAccept(ping._id)}
                  style={{ flex: 1 }}
                >
                  Accept Dispatch
                </Button>
                <Button
                  variant="danger"
                  size="small"
                  icon={<Ionicons name="close" size={16} color={colors.error} />}
                  onPress={() => handleReject(ping._id)}
                  style={{ flex: 0.3 }}
                >
                  Reject
                </Button>
              </View>
            </Card>
          ))}
        </View>
      ) : (
        <EmptyState
          icon="car-outline"
          title="Queue Clear"
          message="No pending emergency rescue pings. Keep your duty status ON to receive live dispatches."
        />
      )}

      {/* Menu / Settings links */}
      <View style={{ gap: 12, marginTop: 24, marginBottom: spacing[8] }}>
        <AnimatedPress
          onPress={() => navigation.push('History')}
          style={[styles.menuRow, { backgroundColor: colors.background.secondary }]}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconIcon, { backgroundColor: `${colors.success}15` }]}>
              <Ionicons name="archive-outline" size={20} color={colors.success} />
            </View>
            <View>
              <Text style={[styles.menuTitle, { color: colors.text.primary }]}>Completed Trips History</Text>
              <Text style={[styles.menuSub, { color: colors.text.secondary }]}>View past completed ambulance dispatches and miles</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
        </AnimatedPress>

        <AnimatedPress
          onPress={() => navigation.push('LocationSettings')}
          style={[styles.menuRow, { backgroundColor: colors.background.secondary }]}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconIcon, { backgroundColor: `${colors.info}15` }]}>
              <Ionicons name="locate-outline" size={20} color={colors.info} />
            </View>
            <View>
              <Text style={[styles.menuTitle, { color: colors.text.primary }]}>Live GPS Config</Text>
              <Text style={[styles.menuSub, { color: colors.text.secondary }]}>Configure high-frequency sharing variables</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
        </AnimatedPress>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  dutyCard: {
    padding: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[5],
  },
  dutyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dutyTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
  },
  dutySub: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
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
  activeTaskCard: {
    padding: spacing[4],
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  pulseIcon: {
    width: 24,
    height: 24,
  },
  activeTaskTitle: {
    fontSize: 15,
    fontFamily: typography.fontFamily.bold,
  },
  activeTaskSub: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    marginTop: 2,
  },
  pingCard: {
    padding: spacing[4],
    gap: spacing[2],
  },
  pingTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
  },
  pingLoc: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
  },
  pingActions: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[2],
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
