import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../themes';
import { spacing, borderRadius, typography } from '../../themes/tokens';
import { api } from '../../services/api';
import { User } from '../../types';
import Screen from '../../components/Screen';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

interface WalletScreenProps {
  user: User;
  setUser: (u: User) => void;
}

export function WalletScreen({ user, setUser }: WalletScreenProps) {
  const colors = useColors();
  const [balance, setBalance] = useState(user.walletBalance || 0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [toppingUp, setToppingUp] = useState(false);

  const fetchWallet = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: meData }, { data: txData }] = await Promise.all([
        api.get('/auth/me'),
        api.get('/wallet/transactions'),
      ]);
      setUser(meData.user);
      setBalance(meData.user.walletBalance || 0);
      setTransactions(txData.transactions || []);
    } catch (e: any) {
      // Ignore quietly
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const handleTopup = async () => {
    const amount = Number(topupAmount);
    if (isNaN(amount) || amount <= 0) {
      return Alert.alert('Invalid Amount', 'Please input a valid amount to load.');
    }
    setToppingUp(true);
    try {
      // Mock top-up backend endpoint
      const { data } = await api.post('/wallet/mock-topup', { amount });
      Alert.alert('✅ Load Successful', `Credited ₹${amount} successfully via Mock Razorpay gateway.`);
      setTopupAmount('');
      fetchWallet();
    } catch (e: any) {
      Alert.alert('Failed', e.response?.data?.message || e.message);
    } finally {
      setToppingUp(false);
    }
  };

  const getTxColor = (type: string) => {
    if (type === 'topup' || type === 'credit') return colors.success;
    return colors.error;
  };

  const formatTxDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchWallet} tintColor={colors.primary} />
      }
      title="My Wallet"
      subtitle="Fund rescue services, clinic bills & sponsorships"
      style={{ backgroundColor: colors.background.primary }}
    >
      {/* Wallet Balance Display */}
      <Card variant="glass" style={styles.balanceCard}>
        <View style={styles.glowEffect} pointerEvents="none" />
        <Text style={[styles.balanceLabel, { color: colors.text.secondary }]}>Available Balance</Text>
        <Text style={[styles.balanceVal, { color: colors.primary }]}>₹{balance.toLocaleString()}</Text>
        <Text style={[styles.balanceSub, { color: colors.text.muted }]}>ResQPet Pilot Digital Ledger</Text>
      </Card>

      {/* Topup Form */}
      <Card variant="default" style={styles.topupCard}>
        <Text style={[styles.cardTitle, { color: colors.text.primary }]}>Load Credits</Text>
        <Text style={[styles.cardSub, { color: colors.text.secondary }]}>
          Instantly add money via credit card or UPI (Simulated Gateway).
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background.tertiary,
                color: colors.text.primary,
                borderColor: colors.border.secondary,
              },
            ]}
            placeholder="Amount in Rupees (₹)"
            placeholderTextColor={colors.text.muted}
            value={topupAmount}
            onChangeText={setTopupAmount}
            keyboardType="numeric"
          />
          <Button
            variant="primary"
            onPress={handleTopup}
            disabled={toppingUp || !topupAmount.trim()}
            loading={toppingUp}
          >
            Add
          </Button>
        </View>
      </Card>

      {/* Transaction History Section */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Wallet Ledger</Text>
      </View>

      {transactions.length > 0 ? (
        <View style={styles.ledgerList}>
          {transactions.map((tx) => {
            const isCredit = tx.type === 'topup' || tx.type === 'credit';
            return (
              <Card key={tx._id} variant="glass" style={styles.txRow}>
                <View style={styles.txLeft}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: isCredit ? `${colors.success}10` : `${colors.error}10` },
                    ]}
                  >
                    <Ionicons
                      name={isCredit ? 'arrow-down-outline' : 'arrow-up-outline'}
                      size={18}
                      color={isCredit ? colors.success : colors.error}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.txTitle, { color: colors.text.primary }]} numberOfLines={1}>
                      {tx.description || (isCredit ? 'Wallet Top-up' : 'Rescue Sponsorship')}
                    </Text>
                    <Text style={[styles.txDate, { color: colors.text.muted }]}>
                      {formatTxDate(tx.createdAt)}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.txAmount, { color: getTxColor(tx.type) }]}>
                  {isCredit ? '+' : '-'}₹{tx.amount}
                </Text>
              </Card>
            );
          })}
        </View>
      ) : (
        <Card variant="glass" style={styles.emptyCard}>
          <Text style={{ color: colors.text.secondary, textAlign: 'center' }}>
            No transaction records found on this account.
          </Text>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    padding: spacing[6],
    borderRadius: borderRadius['2xl'],
    alignItems: 'center',
    gap: spacing[2],
    overflow: 'hidden',
    marginBottom: spacing[3],
  },
  glowEffect: {
    position: 'absolute',
    top: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#76d6d5',
    opacity: 0.05,
  },
  balanceLabel: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  balanceVal: {
    fontSize: 40,
    fontFamily: typography.fontFamily.extraBold,
    letterSpacing: -1,
  },
  balanceSub: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
  },
  topupCard: {
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    gap: spacing[1.5],
    marginBottom: spacing[2],
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: typography.fontFamily.bold,
  },
  cardSub: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[3.5],
    fontSize: 14,
    height: 48,
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
  ledgerList: {
    gap: spacing[2.5],
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[3.5],
    borderRadius: borderRadius.xl,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txTitle: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
  },
  txDate: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
  },
  emptyCard: {
    padding: spacing[6],
    borderRadius: borderRadius.xl,
  },
});

export default WalletScreen;
