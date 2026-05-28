import React, { useEffect, useState, useCallback } from 'react';
import { RefreshControl, StyleSheet, Text, View, Image, ScrollView, TextInput, Alert } from 'react-native';
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

export function CaseDetailScreen() {
  const colors = useColors();
  const navigation = useNavigation();
  const { params } = useNavigation();
  const rescueId = params?.rescueId;

  const [rescue, setRescue] = useState<Rescue | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Follow-up state
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState('');

  const fetchDetail = useCallback(async () => {
    if (!rescueId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/rescue/${rescueId}`);
      setRescue(data.rescue || data);
    } catch (e) {
      Alert.alert('Error', 'Failed to retrieve incident details.');
    } finally {
      setLoading(false);
    }
  }, [rescueId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleUpdateStatus = async (status: string) => {
    if (!rescue) return;
    setSubmitting(true);
    try {
      await api.post(`/rescue/${rescue._id}/ngo-status`, { status });
      fetchDetail();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to update status.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveOnSpot = async () => {
    if (!rescue) return;
    setSubmitting(true);
    try {
      await api.put(`/rescue/${rescue._id}/resolve-ngo`);
      fetchDetail();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to resolve case.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEscalate = async () => {
    if (!rescue) return;
    setSubmitting(true);
    try {
      await api.post(`/rescue/${rescue._id}/escalate-ngo`, { transportType: 'ambulance' });
      fetchDetail();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to escalate case.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddFollowup = async () => {
    if (!rescue || !notes) return;
    setSubmitting(true);
    try {
      const scheduleDate = date || new Date().toISOString();
      await api.post(`/rescue/${rescue._id}/followup`, {
        scheduleDate,
        notes,
      });
      setNotes('');
      setDate('');
      Alert.alert('Success', 'Post-rescue follow-up scheduled.');
      fetchDetail();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to add follow-up.');
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

  // Generate timeline steps
  const getTimelineSteps = () => {
    const steps = [
      {
        title: 'Report Submitted',
        description: 'Distressed animal reported by citizen.',
        status: 'completed' as const,
        timestamp: rescue.createdAt ? new Date(rescue.createdAt).toLocaleDateString() : undefined,
      },
      {
        title: 'NGO Assigned',
        description: `Case under care of ${rescue.assignedNGO?.orgName || 'your NGO'}.`,
        status: rescue.status !== 'pending' ? ('completed' as const) : ('active' as const),
      },
      {
        title: 'Rescue Dispatch',
        description:
          rescue.status === 'on_the_way'
            ? 'Rescuers currently on the way.'
            : rescue.status === 'hospital_broadcasted' || rescue.status === 'ambulance_pinged'
            ? 'Ambulance transport initiated.'
            : ['completed', 'resolved_on_spot', 'delivered'].includes(rescue.status)
            ? 'Dispatch and pickup completed.'
            : 'Pending dispatch.',
        status:
          rescue.status === 'on_the_way'
            ? ('active' as const)
            : ['completed', 'resolved_on_spot', 'delivered', 'hospital_broadcasted', 'ambulance_pinged'].includes(rescue.status)
            ? ('completed' as const)
            : ('pending' as const),
      },
      {
        title: 'Clinical Treatment',
        description: rescue.assignedHospital
          ? `Transferred to ${rescue.assignedHospital.orgName || 'partner clinic'}.`
          : ['completed', 'resolved_on_spot'].includes(rescue.status)
          ? 'On-spot treatment completed successfully.'
          : 'Pending medical checkup.',
        status:
          ['completed', 'resolved_on_spot', 'delivered'].includes(rescue.status)
            ? ('completed' as const)
            : rescue.status === 'hospital_broadcasted' || rescue.status === 'ambulance_pinged'
            ? ('active' as const)
            : ('pending' as const),
      },
      {
        title: 'Resolved',
        description: 'Animal is safe and fully recovered.',
        status: ['completed', 'resolved_on_spot'].includes(rescue.status)
          ? ('completed' as const)
          : ('pending' as const),
      },
    ];
    return steps;
  };

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
          <Text style={[styles.backBtnText, { color: colors.primary }]}>Cases</Text>
        </AnimatedPress>
        <StatusPill status={rescue.status} />
      </View>

      {/* Main image / thumbnail */}
      {rescue.images?.[0] ? (
        <Image source={{ uri: rescue.images[0] }} style={styles.coverImage} />
      ) : (
        <View style={[styles.coverPlaceholder, { backgroundColor: colors.background.secondary }]}>
          <Ionicons name="paw" size={48} color={`${colors.primary}40`} />
        </View>
      )}

      {/* Basic details */}
      <Card variant="glass" style={styles.detailsCard}>
        <Text style={[styles.animalType, { color: colors.primary }]}>
          {rescue.animalType?.toUpperCase() || 'UNKNOWN ANIMAL'}
        </Text>
        <Text style={[styles.descriptionText, { color: colors.text.primary }]}>
          {rescue.description}
        </Text>

        <View style={styles.locationContainer}>
          <Ionicons name="location" size={16} color={colors.text.secondary} />
          <Text style={[styles.locationText, { color: colors.text.secondary }]}>
            {rescue.location?.address || 'Precise GPS Location Attached'}
          </Text>
        </View>
      </Card>

      {/* Case Management Actions */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Response Center</Text>
      </View>

      <Card variant="elevated" style={styles.actionsCard}>
        <View style={styles.btnStack}>
          {/* On the way */}
          {rescue.status === 'accepted' && (
            <Button
              variant="primary"
              icon={<Ionicons name="walk" size={16} color={colors.background.primary} />}
              loading={submitting}
              onPress={() => handleUpdateStatus('on_the_way')}
            >
              Dispatched (On the Way)
            </Button>
          )}

          {/* Arrived at Spot */}
          {rescue.status === 'on_the_way' && (
            <Button
              variant="primary"
              icon={<Ionicons name="pin" size={16} color={colors.background.primary} />}
              loading={submitting}
              onPress={() => handleUpdateStatus('arrived')}
            >
              Mark Arrived
            </Button>
          )}

          {/* Spot resolution / Escalations */}
          {['accepted', 'on_the_way', 'arrived'].includes(rescue.status) && (
            <>
              <Button
                variant="primary"
                style={{ backgroundColor: colors.success }}
                textStyle={{ color: colors.background.primary }}
                icon={<Ionicons name="checkmark-circle" size={16} color={colors.background.primary} />}
                loading={submitting}
                onPress={handleResolveOnSpot}
              >
                Resolve on Spot
              </Button>
              <Button
                variant="outlined"
                icon={<Ionicons name="business" size={16} color={colors.primary} />}
                loading={submitting}
                onPress={handleEscalate}
              >
                Escalate to Hospital
              </Button>
            </>
          )}

          {/* Crowdfunding launch */}
          {rescue.status !== 'completed' && !rescue.estimatedCost && (
            <Button
              variant="outlined"
              icon={<Ionicons name="heart-outline" size={16} color={colors.primary} />}
              onPress={() => navigation.push('FundraiserRequest', { rescueId: rescue._id })}
            >
              Request Fundraiser Support
            </Button>
          )}

          {rescue.estimatedCost && (
            <View style={styles.fundraiserSummary}>
              <View style={styles.progressRow}>
                <Text style={{ color: colors.primary, fontFamily: typography.fontFamily.bold }}>
                  Fundraiser Active
                </Text>
                <Text style={{ color: colors.text.secondary, fontSize: 12 }}>
                  ₹{rescue.amountRaised || 0} / ₹{rescue.estimatedCost} Raised
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: colors.background.tertiary }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: colors.primary,
                      width: `${Math.min(((rescue.amountRaised || 0) / rescue.estimatedCost) * 100, 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>
          )}
        </View>
      </Card>

      {/* Case Timeline */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Rescue Roadmap</Text>
      </View>
      <Card variant="glass" style={styles.timelineCard}>
        <Timeline steps={getTimelineSteps()} />
      </Card>

      {/* Schedule Post-Rescue Followups */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Schedule Followups</Text>
      </View>
      <Card variant="elevated" style={styles.followupCard}>
        <Input
          label="Follow-up Date / Time"
          placeholder="e.g. Next Monday, 10:00 AM"
          value={date}
          onChangeText={setDate}
        />
        <Input
          label="Follow-up Notes / Checkup list"
          placeholder="Enter veterinary checkup schedule, vaccination detail..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          style={{ minHeight: 60 }}
        />
        <Button
          variant="primary"
          icon={<Ionicons name="calendar" size={16} color={colors.background.primary} />}
          loading={submitting}
          onPress={handleAddFollowup}
          style={{ marginTop: spacing[2] }}
        >
          Add Follow-up Visit
        </Button>
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
    marginBottom: spacing[5],
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
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    marginTop: spacing[1],
  },
  locationText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    flex: 1,
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
  actionsCard: {
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  btnStack: {
    gap: spacing[3],
  },
  timelineCard: {
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  followupCard: {
    padding: spacing[4],
    gap: spacing[3],
    marginBottom: spacing[8],
  },
  fundraiserSummary: {
    gap: spacing[2],
    padding: spacing[3],
    backgroundColor: 'rgba(118, 214, 213, 0.08)',
    borderRadius: borderRadius.lg,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});

export default CaseDetailScreen;
