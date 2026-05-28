import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../themes';
import { spacing, borderRadius, typography } from '../../themes/tokens';
import { api } from '../../services/api';
import Screen from '../../components/Screen';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import { useNavigation } from '../../navigation/navigation';

export function SubscriptionsScreen() {
  const colors = useColors();
  const navigation = useNavigation();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/user/subscriptions');
      setSubscriptions(data.subscriptions || []);
    } catch (e) {
      // Return empty array on mock/unimplemented endpoints
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleCancelSubscription = async (subId: string) => {
    Alert.alert(
      'Cancel Sponsorship',
      'Are you sure you want to stop this monthly medical care sponsorship?',
      [
        { text: 'Keep Sponsorship', style: 'cancel' },
        {
          text: 'Stop Sponsorship',
          style: 'destructive',
          onPress: async () => {
            setCancellingId(subId);
            try {
              await api.post(`/user/subscription/${subId}/cancel`);
              Alert.alert('Sponsorship Cancelled', 'Your monthly contributions have been stopped.');
              fetchSubscriptions();
            } catch (e: any) {
              Alert.alert('Error', e.response?.data?.message || e.message);
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]
    );
  };

  const getDeductionDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });
  };

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchSubscriptions} tintColor={colors.primary} />
      }
      title="Sponsorships"
      subtitle="Manage your monthly care & feeding sponsorships"
      style={{ backgroundColor: colors.background.primary }}
    >
      {subscriptions.length > 0 ? (
        <View style={styles.listContainer}>
          {subscriptions.map((sub) => (
            <Card key={sub._id} variant="glass" style={styles.subscriptionCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.avatarBox, { backgroundColor: `${colors.primary}12` }]}>
                  <Ionicons name="gift-outline" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, { color: colors.text.primary }]}>
                    {sub.animalName || 'Shelter Care Sponsorship'}
                  </Text>
                  <Text style={[styles.sub, { color: colors.text.secondary }]}>
                    Monthly sponsorship · Next deduction on {getDeductionDate(sub.nextDeductionAt)}
                  </Text>
                </View>
              </View>

              <View style={styles.separator} />

              <View style={styles.detailsRow}>
                <View>
                  <Text style={[styles.label, { color: colors.text.muted }]}>Monthly Amount</Text>
                  <Text style={[styles.amountValue, { color: colors.primary }]}>₹{sub.amount}/mo</Text>
                </View>
                <Button
                  variant="outlined"
                  size="small"
                  onPress={() => handleCancelSubscription(sub._id)}
                  disabled={cancellingId === sub._id}
                  loading={cancellingId === sub._id}
                  style={styles.cancelBtn}
                >
                  Cancel
                </Button>
              </View>
            </Card>
          ))}
        </View>
      ) : (
        <EmptyState
          icon="gift-outline"
          title="No Active Sponsorships"
          message="Sponsor recurring meals, medical checkups, and sheltering for rescued strays."
          actionLabel="Explore Adoptions"
          onAction={() => navigation.push('HomeScreen')}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    gap: spacing[4],
  },
  subscriptionCard: {
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    gap: spacing[3],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3.5],
  },
  avatarBox: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
  },
  sub: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    marginTop: 2,
  },
  separator: {
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: 16,
    fontFamily: typography.fontFamily.bold,
    marginTop: 2,
  },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: 'rgba(248,113,113,0.4)',
    paddingVertical: spacing[1.5],
  },
});

export default SubscriptionsScreen;
