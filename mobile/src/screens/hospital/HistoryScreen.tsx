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
  const [completedCases, setCompletedCases] = useState<Rescue[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/hospital/my-cases');
      const allCases = data.cases || data.rescues || [];
      setCompletedCases(
        allCases.filter((c: any) =>
          ['completed', 'resolved_on_spot', 'delivered'].includes(c.status)
        )
      );
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
      title="Clinic Archive"
      subtitle="History of treated strays and successfully processed veterinary invoices"
      style={{ backgroundColor: colors.background.primary }}
    >
      {/* Historical Cases */}
      {completedCases.length > 0 ? (
        <View style={styles.listContainer}>
          {completedCases.map((r) => (
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
          icon="archive-outline"
          title="No Archive Records"
          message="Your clinic has not marked any incoming dispatches as fully completed yet."
          actionLabel="Refresh Archive"
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
