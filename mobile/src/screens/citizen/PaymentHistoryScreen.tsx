import React, { useEffect, useState, useCallback } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../themes';
import { spacing, borderRadius, typography } from '../../themes/tokens';
import { api } from '../../services/api';
import Screen from '../../components/Screen';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';

export function PaymentHistoryScreen() {
  const colors = useColors();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/wallet/transactions');
      // Filter strictly outgoings
      const outgoings = (data.transactions || []).filter(
        (tx: any) => tx.type !== 'topup' && tx.type !== 'credit'
      );
      setPayments(outgoings);
    } catch (e) {
      // Quietly ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const formatTxDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchPayments} tintColor={colors.primary} />
      }
      title="Payment History"
      subtitle="Settled veterinary invoices, sponsorships and donations"
      style={{ backgroundColor: colors.background.primary }}
    >
      {payments.length > 0 ? (
        <View style={styles.listContainer}>
          {payments.map((pm) => (
            <Card key={pm._id} variant="glass" style={styles.paymentCard}>
              <View style={styles.cardLeft}>
                <View style={[styles.avatarBox, { backgroundColor: `${colors.primary}12` }]}>
                  <Ionicons name="receipt" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, { color: colors.text.primary }]}>
                    {pm.description || 'Rescue Care Settlement'}
                  </Text>
                  <Text style={[styles.sub, { color: colors.text.muted }]}>
                    TxID: {pm._id.substring(0, 10).toUpperCase()} · {formatTxDate(pm.createdAt)}
                  </Text>
                </View>
              </View>
              <Text style={[styles.amount, { color: colors.text.primary }]}>-₹{pm.amount}</Text>
            </Card>
          ))}
        </View>
      ) : (
        <EmptyState
          icon="receipt-outline"
          title="No Settled Payments"
          message="You have no record of medical payments or sponsorship transactions on this account."
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    gap: spacing[2.5],
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
    borderRadius: borderRadius.xl,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3.5],
    flex: 1,
  },
  avatarBox: {
    width: 40,
    height: 40,
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
  amount: {
    fontSize: 15,
    fontFamily: typography.fontFamily.bold,
  },
});

export default PaymentHistoryScreen;
