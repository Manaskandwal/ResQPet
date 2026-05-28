import React, { useState } from 'react';
import { StyleSheet, Text, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../themes';
import { spacing, borderRadius, typography } from '../../themes/tokens';
import { api } from '../../services/api';
import { useNavigation } from '../../navigation/navigation';
import Screen from '../../components/Screen';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { AnimatedPress } from '../../components/AnimatedPress';

export function BillingScreen() {
  const colors = useColors();
  const navigation = useNavigation();
  const { params } = useNavigation();
  const rescueId = params?.rescueId;

  const [billAmount, setBillAmount] = useState('');
  const [itemName, setItemName] = useState('Critical Clinical Care & Triage');
  const [submitting, setSubmitting] = useState(false);

  const handleSendBill = async () => {
    if (!billAmount) {
      Alert.alert('Missing Amount', 'Please provide a valid bill amount.');
      return;
    }

    const amount = parseFloat(billAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid billing amount.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/hospital/rescue/${rescueId}/bill`, {
        items: [{ name: itemName, amount }],
        totalAmount: amount,
        sentTo: 'user',
      });
      Alert.alert('Invoice Dispatched 📄', `Hospital bill of ₹${amount} was successfully sent to the citizen for payout.`, [
        {
          text: 'Proceed',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to dispatch veterinary bill.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen
      scrollable
      title="Create Invoice"
      subtitle="Issue itemized clinic medical bills for surgeries, medications, and ward care"
      style={{ backgroundColor: colors.background.primary }}
    >
      {/* Header back navigation */}
      <View style={styles.headerNav}>
        <AnimatedPress onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={[styles.backBtnText, { color: colors.primary }]}>Back to Case</Text>
        </AnimatedPress>
      </View>

      {/* Hero invoice descriptor */}
      <Card variant="glass" style={styles.infoCard}>
        <View style={[styles.infoIconContainer, { backgroundColor: `${colors.primary}15` }]}>
          <Ionicons name="receipt-outline" size={24} color={colors.primary} />
        </View>
        <Text style={[styles.infoTitle, { color: colors.text.primary }]}>Digital Clinical Billing</Text>
        <Text style={[styles.infoDesc, { color: colors.text.secondary }]}>
          Once generated, itemized invoices are directly sent to the reporter. Citizens can verify treatment timelines and settle these bills directly inside their Wallet Ledger.
        </Text>
      </Card>

      {/* Form Card */}
      <Card variant="elevated" style={styles.formCard}>
        <Input
          label="Billing Item Name"
          placeholder="e.g. Leg Fracture Surgery & Intramuscular Injection"
          value={itemName}
          onChangeText={setItemName}
          icon="medical-outline"
        />

        <Input
          label="Bill Amount (INR / ₹)"
          placeholder="e.g. 4500"
          keyboardType="numeric"
          value={billAmount}
          onChangeText={setBillAmount}
          icon="cash-outline"
        />

        <Button
          variant="primary"
          icon={<Ionicons name="card" size={16} color={colors.background.primary} />}
          loading={submitting}
          onPress={handleSendBill}
          style={{ marginTop: spacing[4] }}
        >
          Send Patient Invoice
        </Button>
      </Card>
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
  infoCard: {
    padding: spacing[4],
    marginBottom: spacing[5],
    alignItems: 'center',
    textAlign: 'center',
    gap: spacing[2],
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[1],
  },
  infoTitle: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
  },
  infoDesc: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
  },
  formCard: {
    padding: spacing[4],
    gap: spacing[4],
    marginBottom: spacing[8],
  },
});

export default BillingScreen;
