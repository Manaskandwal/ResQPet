import React, { useEffect, useState, useCallback } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { useColors } from '../../themes';
import { spacing } from '../../themes/tokens';
import { api } from '../../services/api';
import { Rescue } from '../../types';
import { useNavigation } from '../../navigation/navigation';
import Screen from '../../components/Screen';
import EmptyState from '../../components/ui/EmptyState';
import { RescueCard } from '../../components/RescueCard';
import { AnimatedPress } from '../../components/AnimatedPress';

export function HistoryScreen() {
  const colors = useColors();
  const navigation = useNavigation();
  const [trips, setTrips] = useState<Rescue[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/ambulance/history');
      setTrips(data.history || data.rescues || []);
    } catch (e) {
      // Quietly ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchHistory} tintColor={colors.primary} />
      }
      title="Trips History"
      subtitle="Complete archive of past dispatches and medical emergency transports"
      style={{ backgroundColor: colors.background.primary }}
    >
      {/* List */}
      {trips.length > 0 ? (
        <View style={styles.listContainer}>
          {trips.map((r) => (
            <AnimatedPress
              key={r._id}
              onPress={() => navigation.push('Task', { rescueId: r._id })}
            >
              <RescueCard rescue={r} />
            </AnimatedPress>
          ))}
        </View>
      ) : (
        <EmptyState
          icon="archive-outline"
          title="No Archive Entries"
          message="You have not completed any ambulance transfer trips yet."
          actionLabel="Refresh List"
          onAction={fetchHistory}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    gap: spacing[4],
    marginBottom: spacing[6],
  },
});

export default HistoryScreen;
