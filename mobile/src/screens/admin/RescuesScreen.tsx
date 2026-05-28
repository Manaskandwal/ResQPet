import React, { useEffect, useState, useCallback } from 'react';
import { RefreshControl, StyleSheet, Text, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../themes';
import { spacing, borderRadius, typography } from '../../themes/tokens';
import { api } from '../../services/api';
import { useNavigation } from '../../navigation/navigation';
import Screen from '../../components/Screen';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusPill from '../../components/ui/StatusPill';
import { AnimatedPress } from '../../components/AnimatedPress';
import { Rescue } from '../../types';

export function RescuesScreen() {
  const colors = useColors();
  const navigation = useNavigation();
  const [rescues, setRescues] = useState<Rescue[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const fetchRescues = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/rescue-requests?limit=50');
      setRescues(data.rescues || []);
    } catch (e) {
      // Quietly ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRescues();
  }, [fetchRescues]);

  const handleOverride = async (rescueId: string, status: string) => {
    setSubmitting(`${rescueId}-${status}`);
    try {
      await api.put(`/admin/rescue/${rescueId}/override`, { status });
      Alert.alert('Ecosystem Override', `Rescue status updated successfully to ${status.replace(/_/g, ' ')}.`);
      fetchRescues();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to override status.');
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchRescues} tintColor={colors.primary} />
      }
      title="Rescue Desk"
      subtitle="Manually override live emergency alerts and update status tags"
      style={{ backgroundColor: colors.background.primary }}
    >
      {/* Back button */}
      <View style={styles.headerNav}>
        <AnimatedPress onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={[styles.backBtnText, { color: colors.primary }]}>Dashboard</Text>
        </AnimatedPress>
      </View>

      {/* Listing */}
      {rescues.length > 0 ? (
        <View style={styles.listContainer}>
          {rescues.map((item) => {
            const citizenName = (item as any).reportedBy?.name || 'Citizen';
            return (
              <Card key={item._id} variant="default" style={styles.rescueCard}>
                <View style={styles.cardHeader}>
                  <View style={[styles.animalBox, { backgroundColor: `${colors.primary}10` }]}>
                    <Ionicons name="paw" size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.animalTitle, { color: colors.text.primary }]}>
                      🚨 {item.animalType ? item.animalType.toUpperCase() : 'UNKNOWN ANIMAL'}
                    </Text>
                    <Text style={[styles.citizenSub, { color: colors.text.secondary }]}>
                      Reported by {citizenName}
                    </Text>
                  </View>
                  <StatusPill status={item.status} />
                </View>

                {/* Case Details */}
                <View style={styles.infoBox}>
                  <Text style={[styles.descText, { color: colors.text.primary }]}>
                    {item.description || 'No description provided.'}
                  </Text>
                  {item.location?.address && (
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={13} color={colors.primary} />
                      <Text style={[styles.locationText, { color: colors.text.secondary }]} numberOfLines={1}>
                        {item.location.address}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Overrides Actions Block */}
                <View style={styles.overrideSection}>
                  <Text style={[styles.overrideTitle, { color: colors.text.secondary }]}>
                    🛡️ FORCED RESOLUTION STATUS:
                  </Text>
                  <View style={styles.btnRow}>
                    <Button
                      variant="outlined"
                      size="small"
                      loading={submitting === `${item._id}-completed`}
                      onPress={() => handleOverride(item._id, 'completed')}
                      style={styles.actionBtn}
                      textStyle={{ fontSize: 11 }}
                    >
                      Complete
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      loading={submitting === `${item._id}-cancelled`}
                      onPress={() => handleOverride(item._id, 'cancelled')}
                      style={styles.actionBtn}
                      textStyle={{ fontSize: 11 }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      size="small"
                      loading={submitting === `${item._id}-closed_unresolved`}
                      onPress={() => handleOverride(item._id, 'closed_unresolved')}
                      style={styles.actionBtn}
                      textStyle={{ fontSize: 10 }}
                    >
                      Close Unresolved
                    </Button>
                  </View>
                </View>
              </Card>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={{ color: colors.text.secondary, textAlign: 'center' }}>
            No global rescue overrides available.
          </Text>
        </View>
      )}
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
  listContainer: {
    gap: spacing[4],
    marginBottom: spacing[6],
  },
  rescueCard: {
    padding: spacing[4],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  animalBox: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animalTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
  },
  citizenSub: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    marginTop: 2,
  },
  infoBox: {
    marginTop: spacing[3],
    gap: spacing[2],
  },
  descText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: typography.fontFamily.regular,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[1],
  },
  locationText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    flex: 1,
  },
  overrideSection: {
    marginTop: spacing[4],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    gap: spacing[2],
  },
  overrideTitle: {
    fontSize: 10,
    fontFamily: typography.fontFamily.extraBold,
    letterSpacing: 0.5,
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing[2],
    paddingHorizontal: 0,
  },
  emptyContainer: {
    paddingVertical: spacing[12],
  },
});

export default RescuesScreen;
