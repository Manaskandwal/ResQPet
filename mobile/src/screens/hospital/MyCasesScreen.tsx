import React, { useEffect, useState, useCallback } from 'react';
import { RefreshControl, StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../themes';
import { spacing, borderRadius, typography } from '../../themes/tokens';
import { api } from '../../services/api';
import { Rescue } from '../../types';
import { useNavigation } from '../../navigation/navigation';
import Screen from '../../components/Screen';
import SegmentedControl from '../../components/ui/SegmentedControl';
import EmptyState from '../../components/ui/EmptyState';
import { RescueCard } from '../../components/RescueCard';
import { AnimatedPress } from '../../components/AnimatedPress';
import Button from '../../components/ui/Button';

export function MyCasesScreen() {
  const colors = useColors();
  const navigation = useNavigation();
  const [escalated, setEscalated] = useState<Rescue[]>([]);
  const [myCases, setMyCases] = useState<Rescue[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('escalated');

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const [escalatedRes, myCasesRes] = await Promise.all([
        api.get('/hospital/escalated'),
        api.get('/hospital/my-cases'),
      ]);
      setEscalated(escalatedRes.data.cases || escalatedRes.data.rescues || []);
      setMyCases(myCasesRes.data.cases || myCasesRes.data.rescues || []);
    } catch (e) {
      // Quietly ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const handleAccept = async (rescueId: string) => {
    try {
      await api.put(`/hospital/rescue/${rescueId}/accept-broadcast`);
      fetchCases();
    } catch (e) {
      // Handle error
    }
  };

  const handleReject = async (rescueId: string) => {
    try {
      await api.put(`/hospital/rescue/${rescueId}/reject-broadcast`);
      fetchCases();
    } catch (e) {
      // Handle error
    }
  };

  const list = activeTab === 'escalated' ? escalated : myCases;

  const tabOptions = [
    { key: 'escalated', label: `Broadcasts (${escalated.length})` },
    { key: 'myCases', label: `Ward List (${myCases.length})` },
  ];

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchCases} tintColor={colors.primary} />
      }
      title="Clinic Intakes"
      subtitle="Accept hospital ambulance transfers or manage admitted animal wards"
      style={{ backgroundColor: colors.background.primary }}
    >
      {/* Category Tabs */}
      <View style={styles.segmentedTabs}>
        <SegmentedControl
          segments={tabOptions}
          activeSegment={activeTab}
          onChange={setActiveTab}
        />
      </View>

      {/* Case Listings */}
      {list.length > 0 ? (
        <View style={styles.listContainer}>
          {list.map((r) => (
            <View
              key={r._id}
              style={[styles.caseContainer, { backgroundColor: colors.background.secondary }]}
            >
              <AnimatedPress
                onPress={() => navigation.push('CaseDetail', { rescueId: r._id })}
                style={{ flex: 1 }}
              >
                <RescueCard rescue={r} />
              </AnimatedPress>

              {activeTab === 'escalated' && (
                <View style={styles.actionRow}>
                  <Button
                    variant="primary"
                    size="small"
                    icon={<Ionicons name="checkmark-done" size={16} color={colors.background.primary} />}
                    onPress={() => handleAccept(r._id)}
                    style={{ flex: 1 }}
                  >
                    Accept Broadcast
                  </Button>
                  <Button
                    variant="danger"
                    size="small"
                    icon={<Ionicons name="close" size={16} color={colors.error} />}
                    onPress={() => handleReject(r._id)}
                    style={{ flex: 0.4 }}
                  >
                    Decline
                  </Button>
                </View>
              )}
            </View>
          ))}
        </View>
      ) : (
        <EmptyState
          icon="medkit-outline"
          title={activeTab === 'escalated' ? 'No Pending Broadcasts' : 'Ward is Empty'}
          message={
            activeTab === 'escalated'
              ? 'No incoming emergency ambulance cases are currently waiting for intake.'
              : 'You do not have any active hospitalized patients at this time.'
          }
          actionLabel="Refresh List"
          onAction={fetchCases}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  segmentedTabs: {
    marginBottom: spacing[4],
  },
  listContainer: {
    gap: spacing[4],
  },
  caseContainer: {
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    gap: spacing[3],
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[1],
  },
});

export default MyCasesScreen;
