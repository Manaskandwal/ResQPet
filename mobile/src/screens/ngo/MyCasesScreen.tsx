import React, { useEffect, useState, useCallback } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
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

export function MyCasesScreen() {
  const colors = useColors();
  const navigation = useNavigation();
  const [cases, setCases] = useState<Rescue[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('active');

  const fetchMyCases = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/ngo/my-cases');
      setCases(data.cases || data.rescues || []);
    } catch (e) {
      // Quietly ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyCases();
  }, [fetchMyCases]);

  const filteredCases = cases.filter((r) => {
    const isCompleted = ['completed', 'resolved_on_spot', 'delivered'].includes(r.status);
    if (activeTab === 'active') return !isCompleted;
    if (activeTab === 'resolved') return isCompleted;
    return true;
  });

  const tabOptions = [
    { key: 'active', label: 'Active Rescues' },
    { key: 'resolved', label: 'Resolved' },
  ];

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchMyCases} tintColor={colors.primary} />
      }
      title="Assigned Cases"
      subtitle="Track and log treatments for animals currently under your organization's care"
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
      {filteredCases.length > 0 ? (
        <View style={styles.listContainer}>
          {filteredCases.map((r) => (
            <AnimatedPress
              key={r._id}
              onPress={() => navigation.push('CaseDetail', { rescueId: r._id })}
            >
              <RescueCard rescue={r} />
            </AnimatedPress>
          ))}
        </View>
      ) : (
        <EmptyState
          icon="medical-outline"
          title={activeTab === 'active' ? 'No Active Cases' : 'No Resolved Cases'}
          message={
            activeTab === 'active'
              ? 'You do not have any active rescue assignments at the moment.'
              : 'You have not marked any cases as completely resolved yet.'
          }
          actionLabel={activeTab === 'active' ? 'Check Nearby Radar' : undefined}
          onAction={activeTab === 'active' ? () => navigation.push('NearbyCases') : undefined}
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

export default MyCasesScreen;
