import React, { useEffect, useState, useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useColors } from '../../themes';
import { spacing } from '../../themes/tokens';
import { api } from '../../services/api';
import { Rescue } from '../../types';
import { useNavigation } from '../../navigation/navigation';
import Screen from '../../components/Screen';
import SegmentedControl from '../../components/ui/SegmentedControl';
import EmptyState from '../../components/ui/EmptyState';
import { RescueCard } from '../../components/RescueCard';
import { AnimatedPress } from '../../components/AnimatedPress';

export function MyReportsScreen() {
  const colors = useColors();
  const navigation = useNavigation();

  const [rescues, setRescues] = useState<Rescue[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/rescue/mine');
      setRescues(data.rescues || []);
    } catch (e) {
      // Quietly ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const filteredRescues = rescues.filter((r) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') {
      return ['pending', 'hospital_broadcasted', 'ambulance_pinged'].includes(r.status);
    }
    if (activeTab === 'resolved') {
      return ['completed', 'resolved_on_spot', 'delivered'].includes(r.status);
    }
    return false;
  });

  const tabOptions = [
    { key: 'all', label: 'All Cases' },
    { key: 'pending', label: 'In Progress' },
    { key: 'resolved', label: 'Resolved' },
  ];

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadReports} tintColor={colors.primary} />
      }
      title="My Reports"
      subtitle="Track rescue agencies & progress for your reports"
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
      {filteredRescues.length > 0 ? (
        <View style={styles.listContainer}>
          {filteredRescues.map((r) => (
            <AnimatedPress
              key={r._id}
              onPress={() => navigation.push('RescueDetail', { rescueId: r._id })}
            >
              <RescueCard rescue={r} />
            </AnimatedPress>
          ))}
        </View>
      ) : (
        <EmptyState
          icon="paw-outline"
          title="No Cases Found"
          message={
            activeTab === 'all'
              ? 'You have not reported any stray animal rescue requests yet.'
              : `You have no ongoing reported cases in the "${activeTab}" filter.`
          }
          actionLabel="Report Now"
          onAction={() => navigation.push('SubmitRescue')}
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
});

export default MyReportsScreen;
