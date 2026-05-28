import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
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

export function FundraisersScreen() {
  const colors = useColors();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [donationAmounts, setDonationAmounts] = useState<Record<string, string>>({});
  const [donatingId, setDonatingId] = useState<string | null>(null);

  const fetchFundraisers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/rescue/fundraisers/active');
      setCampaigns(data.fundraisers || []);
    } catch (e) {
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFundraisers();
  }, [fetchFundraisers]);

  const handleDonate = async (rescueId: string) => {
    const amountStr = donationAmounts[rescueId];
    const amount = Number(amountStr);
    if (!amountStr || isNaN(amount) || amount <= 0) {
      return Alert.alert('Invalid Amount', 'Please input a donation amount.');
    }
    setDonatingId(rescueId);
    try {
      // Wallet donation payment trigger
      await api.post(`/rescue/${rescueId}/donate`, { amount });
      Alert.alert('💖 Thank You!', `Successfully contributed ₹${amount} towards this rescue case.`);
      setDonationAmounts((prev) => ({ ...prev, [rescueId]: '' }));
      fetchFundraisers();
    } catch (e: any) {
      Alert.alert('Payment Failed', e.response?.data?.message || e.message);
    } finally {
      setDonatingId(null);
    }
  };

  const updateDonationValue = (rescueId: string, val: string) => {
    setDonationAmounts((prev) => ({ ...prev, [rescueId]: val }));
  };

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchFundraisers} tintColor={colors.primary} />
      }
      title="Crowdfunding"
      subtitle="Help cover veterinary surgery bills for stray animals"
      style={{ backgroundColor: colors.background.primary }}
    >
      {campaigns.length > 0 ? (
        <View style={styles.listContainer}>
          {campaigns.map((camp) => {
            const raised = camp.amountRaised || 0;
            const goal = camp.estimatedCost || 1;
            const percentage = Math.min((raised / goal) * 100, 100);

            return (
              <Card key={camp._id} variant="glass" style={styles.campaignCard}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.animalBadge, { color: colors.primary }]}>
                    🐾 {camp.animalType?.toUpperCase()}
                  </Text>
                  <View style={styles.raisedPill}>
                    <Text style={[styles.percentageVal, { color: colors.primary }]}>
                      {percentage.toFixed(0)}% Funded
                    </Text>
                  </View>
                </View>

                <Text style={[styles.desc, { color: colors.text.primary }]}>{camp.description}</Text>

                {/* Progress bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressMeta}>
                    <Text style={[styles.progressLabel, { color: colors.text.muted }]}>Raised: ₹{raised}</Text>
                    <Text style={[styles.progressLabel, { color: colors.text.muted }]}>Goal: ₹{goal}</Text>
                  </View>
                  <View style={[styles.progressTrack, { backgroundColor: colors.background.tertiary }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor: colors.primary,
                          width: `${percentage}%`,
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Donation Controls */}
                <View style={styles.donateBox}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.background.tertiary,
                        color: colors.text.primary,
                        borderColor: colors.border.secondary,
                      },
                    ]}
                    placeholder="Sponsor Amt (₹)"
                    placeholderTextColor={colors.text.muted}
                    value={donationAmounts[camp._id] || ''}
                    onChangeText={(val) => updateDonationValue(camp._id, val)}
                    keyboardType="numeric"
                  />
                  <Button
                    variant="primary"
                    size="small"
                    onPress={() => handleDonate(camp._id)}
                    disabled={donatingId === camp._id}
                    loading={donatingId === camp._id}
                  >
                    Donate
                  </Button>
                </View>
              </Card>
            );
          })}
        </View>
      ) : (
        <EmptyState
          icon="heart-outline"
          title="No Active Fundraisers"
          message="There are no active animal medical fundraiser campaigns requiring public support at the moment."
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
  campaignCard: {
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    gap: spacing[3],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  animalBadge: {
    fontSize: 13,
    fontFamily: typography.fontFamily.extraBold,
  },
  raisedPill: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(118,214,213,0.1)',
  },
  percentageVal: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
  },
  desc: {
    fontSize: 13.5,
    lineHeight: 18,
    fontFamily: typography.fontFamily.regular,
  },
  progressContainer: {
    gap: spacing[1.5],
    marginTop: spacing[1],
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
  },
  progressTrack: {
    height: 6,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  donateBox: {
    flexDirection: 'row',
    gap: spacing[2],
    alignItems: 'center',
    marginTop: spacing[1.5],
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[3.5],
    fontSize: 13,
    height: 40,
  },
});

export default FundraisersScreen;
