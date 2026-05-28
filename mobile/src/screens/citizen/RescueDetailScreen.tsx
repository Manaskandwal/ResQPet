import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { Rescue } from '../../types';
import { useNavigation } from '../../navigation/navigation';
import Screen from '../../components/Screen';
import Card from '../../components/ui/Card';
import StatusPill from '../../components/ui/StatusPill';
import Timeline from '../../components/ui/Timeline';
import Button from '../../components/ui/Button';

export function RescueDetailScreen() {
  const colors = useColors();
  const navigation = useNavigation();
  const rescueId = navigation.params?.rescueId;

  const [rescue, setRescue] = useState<Rescue | null>(null);
  const [loading, setLoading] = useState(true);
  const [fundraiserGoal, setFundraiserGoal] = useState('');
  const [submittingFundraiser, setSubmittingFundraiser] = useState(false);
  const [payingBill, setPayingBill] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!rescueId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/rescue/${rescueId}`);
      setRescue(data.rescue);
    } catch (e: any) {
      Alert.alert('Error', 'Failed to retrieve rescue details.');
    } finally {
      setLoading(false);
    }
  }, [rescueId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleCancel = async () => {
    if (!rescue) return;
    Alert.alert('Cancel Rescue', 'Are you sure you want to cancel this rescue request?', [
      { text: 'Keep Request', style: 'cancel' },
      {
        text: 'Cancel Request',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            await api.put(`/rescue/${rescue._id}/cancel`);
            Alert.alert('✅ Cancelled', 'The rescue request has been cancelled.');
            fetchDetail();
          } catch (e: any) {
            Alert.alert('Failed', e.response?.data?.message || e.message);
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  const handleStartFundraiser = async () => {
    if (!rescue || !fundraiserGoal.trim()) return;
    setSubmittingFundraiser(true);
    try {
      await api.put(`/rescue/${rescue._id}/fundraiser`, {
        estimatedCost: Number(fundraiserGoal),
      });
      Alert.alert('💖 Campaign Launched', 'Your fundraiser request is sent for Admin review.');
      setFundraiserGoal('');
      fetchDetail();
    } catch (e: any) {
      Alert.alert('Failed', e.response?.data?.message || e.message);
    } finally {
      setSubmittingFundraiser(false);
    }
  };

  const handlePayBill = async () => {
    if (!rescue) return;
    setPayingBill(true);
    try {
      await api.post(`/rescue/${rescue._id}/pay-bill`);
      Alert.alert('✅ Invoice Paid', 'The veterinary treatment bill has been settled.');
      fetchDetail();
    } catch (e: any) {
      Alert.alert('Payment Failed', e.response?.data?.message || e.message);
    } finally {
      setPayingBill(false);
    }
  };

  if (loading && !rescue) {
    return (
      <View style={[styles.loadingCenter, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!rescue) {
    return (
      <Screen title="Rescue Detail" style={{ backgroundColor: colors.background.primary }}>
        <Text style={{ color: colors.text.secondary, textAlign: 'center', marginTop: 32 }}>
          Rescue record not found.
        </Text>
      </Screen>
    );
  }

  // Define dynamic status steps for tracking
  const getTimelineSteps = () => {
    const status = rescue.status;
    const isCompleted = ['completed', 'resolved_on_spot', 'delivered'].includes(status);
    const isHospitalized = ['hospitalized', 'treatment'].includes(status) || isCompleted;
    const isPickedUp = ['picked_up', 'ambulance_arrived'].includes(status) || isHospitalized;
    const isAssigned = ['assigned', 'ambulance_pinged', 'hospital_broadcasted'].includes(status) || isPickedUp;

    return [
      {
        title: 'Report Logged',
        description: 'Distress case submitted with GPS coordinates.',
        status: 'completed' as 'completed' | 'active' | 'pending',
      },
      {
        title: 'Agency Assigned',
        description: rescue.assignedNGO?.orgName
          ? `Assigned to NGO: ${rescue.assignedNGO.orgName}`
          : 'Pending verified responder acceptance.',
        status: (isAssigned ? (isPickedUp ? 'completed' : 'active') : 'pending') as 'completed' | 'active' | 'pending',
      },
      {
        title: 'Ambulance & Pickup',
        description: rescue.assignedAmbulance?.vehicleNumber
          ? `Transporting via vehicle: ${rescue.assignedAmbulance.vehicleNumber}`
          : 'Logistics and pickup dispatch in progress.',
        status: (isPickedUp ? (isHospitalized ? 'completed' : 'active') : 'pending') as 'completed' | 'active' | 'pending',
      },
      {
        title: 'Hospital Admitted',
        description: rescue.assignedHospital?.orgName
          ? `Under treatment at ${rescue.assignedHospital.orgName}`
          : 'Awaiting specialized veterinary intake.',
        status: (isHospitalized ? (isCompleted ? 'completed' : 'active') : 'pending') as 'completed' | 'active' | 'pending',
      },
      {
        title: 'Case Resolved',
        description: 'Animal successfully treated and released/adopted.',
        status: (isCompleted ? 'completed' : 'pending') as 'completed' | 'active' | 'pending',
      },
    ];
  };

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchDetail} tintColor={colors.primary} />
      }
      title="Rescue Progress"
      subtitle="Live tracking and agency coordination details"
      style={{ backgroundColor: colors.background.primary }}
    >
      {/* Visual Header */}
      <Card variant="default" style={styles.detailCard}>
        <View style={styles.headerRow}>
          <Text style={[styles.animalType, { color: colors.primary }]}>
            🐾 {rescue.animalType?.toUpperCase()}
          </Text>
          <StatusPill status={rescue.status} />
        </View>

        <Text style={[styles.descText, { color: colors.text.primary }]}>{rescue.description}</Text>

        {rescue.images && rescue.images.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
            {rescue.images.map((imgUrl, i) => (
              <Image key={i} source={{ uri: imgUrl }} style={styles.evidenceImage} />
            ))}
          </ScrollView>
        )}
      </Card>

      {/* Progress Timeline */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Rescue Timeline</Text>
      </View>
      <Card variant="glass" style={styles.timelineCard}>
        <Timeline steps={getTimelineSteps()} />
      </Card>

      {/* Support and Funding Controls */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Financial Support</Text>
      </View>

      {/* Itemized Bill settlement */}
      {rescue.bill && rescue.bill.paidStatus === 'pending' ? (
        <Card variant="elevated" style={StyleSheet.flatten([styles.billCard, { borderColor: colors.error }])}>
          <View style={styles.billHeader}>
            <Ionicons name="receipt-outline" size={24} color={colors.error} />
            <View>
              <Text style={[styles.billTitle, { color: colors.text.primary }]}>Settlement Invoice</Text>
              <Text style={[styles.billSub, { color: colors.text.secondary }]}>Amount Settlement Required</Text>
            </View>
          </View>
          <Text style={[styles.billAmount, { color: colors.error }]}>₹{rescue.bill.totalAmount}</Text>
          <Button
            variant="danger"
            onPress={handlePayBill}
            disabled={payingBill}
            loading={payingBill}
            style={{ marginTop: 8 }}
          >
            Pay Hospital Bill
          </Button>
        </Card>
      ) : null}

      {/* Fundraiser trigger */}
      {!rescue.fundraiser || !rescue.fundraiser.status ? (
        <Card variant="glass" style={styles.fundraiserActionCard}>
          <Text style={[styles.fundTitle, { color: colors.text.primary }]}>Launch Medical Fundraiser</Text>
          <Text style={[styles.fundSub, { color: colors.text.secondary }]}>
            Crowdfund animal surgery costs within the community.
          </Text>
          <View style={styles.fundInputRow}>
            <TextInput
              style={[
                styles.fundInput,
                {
                  backgroundColor: colors.background.tertiary,
                  color: colors.text.primary,
                  borderColor: colors.border.secondary,
                },
              ]}
              placeholder="Goal Amount (₹)"
              placeholderTextColor={colors.text.muted}
              value={fundraiserGoal}
              onChangeText={setFundraiserGoal}
              keyboardType="numeric"
            />
            <Button
              variant="outlined"
              onPress={handleStartFundraiser}
              disabled={submittingFundraiser || !fundraiserGoal.trim()}
              loading={submittingFundraiser}
            >
              Launch
            </Button>
          </View>
        </Card>
      ) : (
        <Card variant="glass" style={styles.fundraiserActiveCard}>
          <View style={styles.fundHeader}>
            <Ionicons name="heart-circle" size={24} color={colors.warning} />
            <Text style={[styles.fundTitle, { color: colors.text.primary }]}>Active Fundraiser</Text>
          </View>
          <Text style={[styles.fundSub, { color: colors.text.secondary, marginTop: 4 }]}>
            Goal: ₹{rescue.fundraiser.requestedGoal} · Status: {rescue.fundraiser.status?.toUpperCase()}
          </Text>
        </Card>
      )}

      {/* Close Action */}
      {['pending', 'assigned'].includes(rescue.status) && (
        <Button
          variant="secondary"
          onPress={handleCancel}
          disabled={cancelling}
          loading={cancelling}
          style={styles.cancelBtn}
        >
          Cancel Rescue Request
        </Button>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCard: {
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  animalType: {
    fontSize: 16,
    fontFamily: typography.fontFamily.extraBold,
  },
  descText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
  },
  imageScroll: {
    marginTop: spacing[2],
  },
  evidenceImage: {
    width: 140,
    height: 100,
    borderRadius: borderRadius.md,
    marginRight: spacing[2],
  },
  sectionHeader: {
    marginVertical: spacing[2.5],
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timelineCard: {
    padding: spacing[4],
    borderRadius: borderRadius.xl,
  },
  billCard: {
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  billHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  billTitle: {
    fontSize: 15,
    fontFamily: typography.fontFamily.bold,
  },
  billSub: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    marginTop: 2,
  },
  billAmount: {
    fontSize: 32,
    fontFamily: typography.fontFamily.extraBold,
    marginVertical: spacing[1],
  },
  fundraiserActionCard: {
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  fundraiserActiveCard: {
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    marginBottom: spacing[4],
  },
  fundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  fundTitle: {
    fontSize: 15,
    fontFamily: typography.fontFamily.bold,
  },
  fundSub: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
  },
  fundInputRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  fundInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[3.5],
    fontSize: 14,
    height: 48,
  },
  cancelBtn: {
    marginTop: spacing[4],
    marginBottom: spacing[8],
  },
});

export default RescueDetailScreen;
