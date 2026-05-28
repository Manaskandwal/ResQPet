import React, { useEffect, useState, useCallback } from 'react';
import { RefreshControl, StyleSheet, Text, View, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../themes';
import { spacing, borderRadius, typography } from '../../themes/tokens';
import { api } from '../../services/api';
import { Rescue } from '../../types';
import { useNavigation } from '../../navigation/navigation';
import Screen from '../../components/Screen';
import Card from '../../components/ui/Card';
import Timeline from '../../components/ui/Timeline';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import StatusPill from '../../components/ui/StatusPill';
import { AnimatedPress } from '../../components/AnimatedPress';
import SegmentedControl from '../../components/ui/SegmentedControl';

export function CaseDetailScreen() {
  const colors = useColors();
  const navigation = useNavigation();
  const { params } = useNavigation();
  const rescueId = params?.rescueId;

  const [rescue, setRescue] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Treatment form state
  const [treatmentStatus, setTreatmentStatus] = useState('under_treatment');
  const [note, setNote] = useState('');

  const fetchDetail = useCallback(async () => {
    if (!rescueId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/rescue/${rescueId}`);
      setRescue(data.rescue || data);
      if (data.rescue?.treatmentStatus) {
        setTreatmentStatus(data.rescue.treatmentStatus);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to retrieve incident details.');
    } finally {
      setLoading(false);
    }
  }, [rescueId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleUpdateTreatment = async () => {
    if (!rescue) return;
    setSubmitting(true);
    try {
      await api.put(`/hospital/rescue/${rescue._id}/treatment`, {
        treatmentStatus,
        hospitalNote: note,
      });
      setNote('');
      Alert.alert('Success', `Treatment status updated to "${treatmentStatus.replace('_', ' ')}"!`);
      fetchDetail();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to update treatment notes.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!rescue) {
    return (
      <Screen style={{ backgroundColor: colors.background.primary }} scrollable={false}>
        <View style={styles.centerContainer}>
          <Text style={{ color: colors.text.secondary }}>Loading case details...</Text>
        </View>
      </Screen>
    );
  }

  // Stepper timeline
  const getTimelineSteps = () => {
    const steps = [
      {
        title: 'Admitted to Clinic',
        description: `Admitted under partner clinic ${rescue.assignedHospital?.orgName || ''}.`,
        status: 'completed' as const,
        timestamp: rescue.escalatedAt ? new Date(rescue.escalatedAt).toLocaleDateString() : undefined,
      },
      {
        title: 'Active Veterinary Treatment',
        description: rescue.treatmentStatus === 'under_treatment' ? 'Doctors actively managing clinical care.' : 'Intake checkup completed.',
        status: rescue.treatmentStatus === 'under_treatment' ? ('active' as const) : ('completed' as const),
      },
      {
        title: 'Recovery Phase',
        description: rescue.treatmentStatus === 'recovering' ? 'Animal responding well and recovering.' : 'Awaiting clinical signs check.',
        status:
          rescue.treatmentStatus === 'recovering'
            ? ('active' as const)
            : ['discharged', 'completed'].includes(rescue.treatmentStatus)
            ? ('completed' as const)
            : ('pending' as const),
      },
      {
        title: 'Discharged & Safe',
        description: rescue.treatmentStatus === 'discharged' ? 'Animal discharged and ready for return dispatches.' : 'Awaiting discharge clearance.',
        status: rescue.treatmentStatus === 'discharged' ? ('completed' as const) : ('pending' as const),
      },
    ];
    return steps;
  };

  const statusOptions = [
    { key: 'under_treatment', label: 'In ICU / Treating' },
    { key: 'recovering', label: 'Recovering' },
    { key: 'discharged', label: 'Ready to Discharge' },
  ];

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchDetail} tintColor={colors.primary} />
      }
      style={{ backgroundColor: colors.background.primary }}
    >
      {/* Header back navigation */}
      <View style={styles.headerNav}>
        <AnimatedPress onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={[styles.backBtnText, { color: colors.primary }]}>Clinic Board</Text>
        </AnimatedPress>
        <StatusPill status={rescue.status} />
      </View>

      {/* Cover picture */}
      {rescue.images?.[0] ? (
        <Image source={{ uri: rescue.images[0] }} style={styles.coverImage} />
      ) : (
        <View style={[styles.coverPlaceholder, { backgroundColor: colors.background.secondary }]}>
          <Ionicons name="medkit" size={48} color={`${colors.primary}40`} />
        </View>
      )}

      {/* Basic details */}
      <Card variant="glass" style={styles.detailsCard}>
        <Text style={[styles.animalType, { color: colors.primary }]}>
          PATIENT: {rescue.animalType?.toUpperCase() || 'STRAY ANIMAL'}
        </Text>
        <Text style={[styles.descriptionText, { color: colors.text.primary }]}>
          {rescue.description}
        </Text>
        <View style={styles.reporterDetails}>
          <Ionicons name="person-outline" size={14} color={colors.text.secondary} />
          <Text style={{ color: colors.text.secondary, fontSize: 12 }}>
            Reporter: {rescue.user?.name || 'Citizen'} ({rescue.user?.phone || 'No phone'})
          </Text>
        </View>
      </Card>

      {/* Bill summary and action card */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Clinical Receipts & Billing</Text>
      </View>
      <Card variant="elevated" style={styles.billCard}>
        {rescue.bill ? (
          <View style={styles.billSummary}>
            <View style={styles.billMain}>
              <Text style={{ color: colors.text.primary, fontSize: 13, fontFamily: typography.fontFamily.bold }}>
                Invoice Amount:
              </Text>
              <Text style={[styles.billAmount, { color: colors.primary }]}>
                ₹{rescue.bill.totalAmount || 0}
              </Text>
            </View>
            <View style={styles.billStatusRow}>
              <Text style={{ color: colors.text.secondary, fontSize: 12 }}>Status:</Text>
              <Text
                style={{
                  fontFamily: typography.fontFamily.extraBold,
                  fontSize: 12,
                  color: rescue.bill.paidStatus === 'paid' ? colors.success : colors.warning,
                }}
              >
                {rescue.bill.paidStatus?.toUpperCase() || 'PENDING'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.billEmpty}>
            <Text style={{ color: colors.text.secondary, fontSize: 12 }}>
              No medical invoice generated for this patient yet.
            </Text>
            <Button
              variant="outlined"
              size="small"
              icon={<Ionicons name="receipt-outline" size={16} color={colors.primary} />}
              onPress={() => navigation.push('Billing', { rescueId: rescue._id })}
            >
              Generate Patient Invoice
            </Button>
          </View>
        )}
      </Card>

      {/* Medical treatment notes updater */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Update Medical Status</Text>
      </View>
      <Card variant="glass" style={styles.treatmentFormCard}>
        <View style={{ marginBottom: spacing[2] }}>
          <Text style={styles.formLabel}>Treatment Status</Text>
          <SegmentedControl
            segments={statusOptions}
            activeSegment={treatmentStatus}
            onChange={setTreatmentStatus}
          />
        </View>

        <Input
          label="Clinical Treatment Log"
          placeholder="e.g. Conducted leg surgery. Prescribed vaccines, daily wound dressing."
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={3}
          style={{ minHeight: 60 }}
        />

        <Button
          variant="primary"
          icon={<Ionicons name="pulse" size={16} color={colors.background.primary} />}
          loading={submitting}
          onPress={handleUpdateTreatment}
          style={{ marginTop: spacing[2] }}
        >
          Update Treatment File
        </Button>
      </Card>

      {/* Clinical Timeline */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Clinic Treatment History</Text>
      </View>
      <Card variant="glass" style={styles.timelineCard}>
        <Timeline steps={getTimelineSteps()} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  coverImage: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.xl,
    marginBottom: spacing[4],
  },
  coverPlaceholder: {
    width: '100%',
    height: 180,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  detailsCard: {
    padding: spacing[4],
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  animalType: {
    fontSize: 12,
    fontFamily: typography.fontFamily.extraBold,
    letterSpacing: 1.5,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: typography.fontFamily.bold,
  },
  reporterDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    marginTop: spacing[1],
  },
  sectionHeader: {
    marginVertical: spacing[3],
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  billCard: {
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  billEmpty: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  billSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  billAmount: {
    fontSize: 22,
    fontFamily: typography.fontFamily.extraBold,
    letterSpacing: -1,
  },
  billStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
  },
  treatmentFormCard: {
    padding: spacing[4],
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  formLabel: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#879392',
    marginBottom: spacing[2],
  },
  timelineCard: {
    padding: spacing[4],
    marginBottom: spacing[8],
  },
});

export default CaseDetailScreen;
