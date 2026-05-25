import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, RefreshControl, Alert, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RazorpayCheckout from 'react-native-razorpay';

import { api, RAZORPAY_KEY_ID } from '../services/api';
import { C, S, compactDate } from '../styles/theme';
import { User, Rescue } from '../types';
import { AnimatedPress } from '../components/AnimatedPress';
import {
  ScreenShell,
  ScreenHeader,
  SectionHeader,
  SurfaceCard,
  FormField,
  EmptyState,
} from '../components/SharedComponents';

// ─── Fundraisers Section ──────────────────────────────────────────────────────
export function FundraisersSection({ compact = false }: { compact?: boolean }) {
  const [items, setItems] = useState<Rescue[]>([]);
  const [amount, setAmount] = useState('100');

  const loadFundraisers = useCallback(() => {
    api.get('/donation/fundraisers')
      .then(({ data }) => setItems(data.fundraisers || []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    loadFundraisers();
  }, [loadFundraisers]);

  if (compact && items.length === 0) return null;

  const list = compact ? items.slice(0, 3) : items;

  return (
    <View>
      <SectionHeader title="❤️ Active Fundraisers" />
      {list.length === 0 ? (
        <EmptyState icon="heart" message="No active fundraisers" />
      ) : (
        list.map((rescue) => {
          const progress = Math.min(((rescue.amountRaised || 0) / (rescue.estimatedCost || 1)) * 100, 100);
          return (
            <SurfaceCard key={rescue._id}>
              {rescue.images?.[0] && (
                <Image source={{ uri: rescue.images[0] }} style={S.fundraiserImg} />
              )}
              <Text style={S.listRowTitle} numberOfLines={2}>{rescue.description}</Text>
              <View style={S.progressRow}>
                <Text style={[S.listRowSub, { color: C.brand }]}>Raised: ₹{rescue.amountRaised || 0}</Text>
                <Text style={[S.listRowSub, { color: C.warning }]}>Goal: ₹{rescue.estimatedCost}</Text>
              </View>
              <View style={S.progressTrack}>
                <View style={[S.progressFill, { width: `${progress}%` as any }]} />
              </View>
              <Text style={[S.listRowSub, { textAlign: 'right', marginTop: 2 }]}>{progress.toFixed(0)}% FUNDED</Text>
              {!compact && (
                <View style={S.row}>
                  <TextInput
                    style={[S.input, { flex: 1 }]}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    placeholder="Amount (₹)"
                    placeholderTextColor={C.textMuted}
                  />
                  <AnimatedPress onPress={async () => {
                    try {
                      await api.post('/donation/donate-wallet', { rescueId: rescue._id, amount: Number(amount) });
                      loadFundraisers();
                      Alert.alert('❤️ Donation sent', 'Thank you for your contribution!');
                    } catch (e: any) {
                      Alert.alert('Error', e.response?.data?.message || e.message);
                    }
                  }} style={[S.btnPrimary, { marginLeft: 8 }]}>
                    <Ionicons name="heart" size={16} color={C.bgMain} />
                    <Text style={S.btnPrimaryText}>Donate</Text>
                  </AnimatedPress>
                </View>
              )}
            </SurfaceCard>
          );
        })
      )}
    </View>
  );
}

// ─── Wallet Screen ────────────────────────────────────────────────────────────
export default function WalletScreen({ user, setUser }: { user: User; setUser: (u: User) => void }) {
  const [amount, setAmount] = useState('500');
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/user/wallet');
      setWallet(data);
      setUser({ ...user, walletBalance: data.walletBalance });
    } catch {
      // Ignore load error quietly as done in original
    } finally {
      setLoading(false);
    }
  }, [setUser, user]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  const topUp = async () => {
    try {
      const value = Number(amount);
      const { data } = await api.post('/payment/create-order', { amount: value });
      if (!RazorpayCheckout || typeof RazorpayCheckout.open !== 'function') {
        throw new Error('Razorpay native checkout is not available in the Expo Go client. Use "Mock top-up" below.');
      }
      const payment = await RazorpayCheckout.open({
        key: RAZORPAY_KEY_ID || data.keyId,
        amount: data.order.amount,
        currency: data.order.currency || 'INR',
        order_id: data.order.id,
        name: 'VetsCue Wallet',
        description: 'Wallet top-up',
        prefill: { email: user.email, name: user.name, contact: user.phone || '' },
        theme: { color: C.brand },
      });
      await api.post('/payment/verify', payment);
      await load();
      Alert.alert('✅ Wallet updated', 'Payment verified successfully.');
    } catch (error: any) {
      Alert.alert('Payment', `${error.message}\n\nFor testing, use the Mock top-up button.`);
    }
  };

  const balance = wallet?.walletBalance ?? user.walletBalance ?? 0;

  return (
    <ScreenShell refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={C.brand} />}>
      <ScreenHeader title="Wallet" subtitle="Manage your balance and transactions" />

      {/* Balance card */}
      <View style={S.balanceCard}>
        <View style={S.balanceGlow} pointerEvents="none" />
        <Text style={S.balanceLabel}>Available Balance</Text>
        <Text style={S.balanceAmount}>₹{balance.toLocaleString('en-IN')}</Text>
        <Text style={S.balanceSub}>VetsCue Wallet</Text>
      </View>

      <SurfaceCard>
        <Text style={S.cardSectionTitle}>💳 Top Up Wallet</Text>
        <FormField
          label="Amount (₹)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="Enter amount"
          icon="cash-outline"
        />
        <View style={S.row}>
          {['100', '500', '1000', '2000'].map((v) => (
            <AnimatedPress key={v} onPress={() => setAmount(v)} style={[S.chip, amount === v && S.chipActive]}>
              <Text style={[S.chipText, amount === v && S.chipTextActive]}>₹{v}</Text>
            </AnimatedPress>
          ))}
        </View>
        <AnimatedPress onPress={topUp} style={S.btnPrimary}>
          <Ionicons name="card" size={18} color={C.bgMain} />
          <Text style={S.btnPrimaryText}>Top up with Razorpay</Text>
        </AnimatedPress>
        <AnimatedPress onPress={async () => { await api.post('/payment/mock-topup', { amount: Number(amount) }); load(); }} style={S.btnOutline}>
          <Ionicons name="flask-outline" size={18} color={C.brand} />
          <Text style={S.btnOutlineText}>Mock Top-up (Dev)</Text>
        </AnimatedPress>
      </SurfaceCard>

      <SectionHeader title="Transaction History" />
      {(wallet?.transactions || []).length === 0 ? (
        <EmptyState icon="receipt" message="No transactions yet" />
      ) : (
        <SurfaceCard>
          {(wallet?.transactions || []).map((tx: any) => (
            <View key={tx._id} style={S.listRow}>
              <View style={[S.listRowIcon, { backgroundColor: tx.type === 'credit' ? `${C.success}20` : `${C.error}20` }]}>
                <Ionicons
                  name={tx.type === 'credit' ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
                  size={18}
                  color={tx.type === 'credit' ? C.success : C.error}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.listRowTitle}>{tx.description || tx.type}</Text>
                <Text style={S.listRowSub}>{compactDate(tx.createdAt)}</Text>
              </View>
              <Text style={[S.listRowTitle, { color: tx.type === 'credit' ? C.success : C.error }]}>
                {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
              </Text>
            </View>
          ))}
        </SurfaceCard>
      )}

      <FundraisersSection />
    </ScreenShell>
  );
}
