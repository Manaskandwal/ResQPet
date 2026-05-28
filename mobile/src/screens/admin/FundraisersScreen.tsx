import React, { useEffect, useState, useCallback } from 'react';
import { RefreshControl, StyleSheet, Text, View, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
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

export function FundraisersScreen() {
  const colors = useColors();
  const navigation = useNavigation();
  const [fundraisers, setFundraisers] = useState<Rescue[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const fetchFundraisers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/fundraisers');
      setFundraisers(data.fundraisers || []);
    } catch (e) {
      // Quietly ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFundraisers();
  }, [fetchFundraisers]);

  const handleReview = async (rescueId: string, action: 'approve' | 'reject') => {
    setSubmitting(`${rescueId}-${action}`);
    try {
      await api.put(`/admin/rescue/${rescueId}/fundraiser/review`, { action });
      Alert.alert(
        action === 'approve' ? 'Approved ❤️' : 'Rejected ❌',
        `Fundraiser request has been successfully ${action}d.`
      );
      fetchFundraisers();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to review fundraiser.');
    } finally {
      setSubmitting(null);
    }
  };

  const handleViewProof = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (e) {
      Alert.alert('Error', 'Unable to open proof document link.');
    }
  };

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchFundraisers} tintColor={colors.primary} />
      }
      title="Fundraiser Requests"
      subtitle="Verify NGO crowdfunding campaigns and medical expense documents"
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
      {fundraisers.length > 0 ? (
        <View style={styles.listContainer}>
          {fundraisers.map((item) => {
            const ngoName = item.assignedNGO?.orgName || item.assignedNGO?.name || 'Assigned NGO';
            const fundraiserInfo = item.fundraiser;
            if (!fundraiserInfo) return null;

            const goal = fundraiserInfo.requestedGoal || 0;
            const status = fundraiserInfo.status || 'pending';
            const justification = fundraiserInfo.billText || 'No justification text provided.';
            const proofImage = fundraiserInfo.billImage;

            return (
              <Card key={item._id} variant="default" style={styles.fundCard}>
                {/* Header Title with Status */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.ngoTitle, { color: colors.text.primary }]}>{ngoName}</Text>
                    <Text style={[styles.kicker, { color: colors.text.secondary }]}>Fundraising Campaign Request</Text>
                  </View>
                  <StatusPill status={status} />
                </View>

                {/* Case Animal and Description */}
                <View style={[styles.infoSegment, { borderBottomColor: 'rgba(255, 255, 255, 0.04)' }]}>
                  <Text style={[styles.segHeading, { color: colors.text.secondary }]}>Case Summary</Text>
                  <Text style={[styles.bodyText, { color: colors.text.primary }]}>{item.description}</Text>
                  {item.animalType && (
                    <Text style={[styles.animalTag, { color: colors.primary }]}>
                      🐾 {item.animalType.toUpperCase()}
                    </Text>
                  )}
                </View>

                {/* Goal Amount Block */}
                <View style={styles.goalBlock}>
                  <Text style={[styles.goalLabel, { color: colors.text.secondary }]}>Requested Crowdfunding Target</Text>
                  <Text style={[styles.goalValue, { color: colors.warning }]}>
                    ₹{goal.toLocaleString('en-IN')}
                  </Text>
                </View>

                {/* Justification Box */}
                <View style={[styles.justificationBox, { backgroundColor: 'rgba(255, 255, 255, 0.02)' }]}>
                  <Text style={[styles.justLabel, { color: colors.text.secondary }]}>Justification Note</Text>
                  <Text style={[styles.justBody, { color: colors.text.primary }]}>{justification}</Text>
                </View>

                {/* Proof Image Box */}
                {proofImage && (
                  <View style={styles.proofSection}>
                    <Text style={[styles.proofLabel, { color: colors.text.secondary }]}>Proof Document</Text>
                    <View style={styles.proofLayout}>
                      <Image source={{ uri: proofImage }} style={styles.proofThumb} />
                      <Button
                        variant="outlined"
                        size="small"
                        onPress={() => handleViewProof(proofImage)}
                        icon={<Ionicons name="eye-outline" size={15} color={colors.primary} />}
                        style={{ flex: 1 }}
                      >
                        Inspect Full Proof
                      </Button>
                    </View>
                  </View>
                )}

                {/* Review triggers if pending */}
                {status === 'pending' && (
                  <View style={styles.actionsBox}>
                    <Button
                      variant="danger"
                      size="medium"
                      loading={submitting === `${item._id}-reject`}
                      onPress={() => handleReview(item._id, 'reject')}
                      icon={<Ionicons name="close" size={16} color={colors.error} />}
                      style={styles.actionButton}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="primary"
                      size="medium"
                      loading={submitting === `${item._id}-approve`}
                      onPress={() => handleReview(item._id, 'approve')}
                      icon={<Ionicons name="checkmark" size={16} color={colors.background.primary} />}
                      style={StyleSheet.flatten([styles.actionButton, { flex: 1.5 }])}
                    >
                      Approve Payout
                    </Button>
                  </View>
                )}
              </Card>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={{ color: colors.text.secondary, textAlign: 'center' }}>
            No pending fundraisers found.
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
  fundCard: {
    padding: spacing[4],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  ngoTitle: {
    fontSize: 15,
    fontFamily: typography.fontFamily.bold,
  },
  kicker: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    marginTop: 2,
  },
  infoSegment: {
    marginTop: spacing[3.5],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
  },
  segHeading: {
    fontSize: 10,
    fontFamily: typography.fontFamily.extraBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  bodyText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    lineHeight: 16,
  },
  animalTag: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    marginTop: spacing[2],
  },
  goalBlock: {
    marginVertical: spacing[3],
  },
  goalLabel: {
    fontSize: 10,
    fontFamily: typography.fontFamily.extraBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  goalValue: {
    fontSize: 22,
    fontFamily: typography.fontFamily.extraBold,
    marginTop: 2,
  },
  justificationBox: {
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    gap: spacing[1.5],
    marginBottom: spacing[3],
  },
  justLabel: {
    fontSize: 10,
    fontFamily: typography.fontFamily.extraBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  justBody: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    lineHeight: 16,
  },
  proofSection: {
    marginBottom: spacing[3.5],
  },
  proofLabel: {
    fontSize: 10,
    fontFamily: typography.fontFamily.extraBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[2],
  },
  proofLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  proofThumb: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
    backgroundColor: '#121214',
  },
  actionsBox: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  actionButton: {
    flex: 1,
  },
  emptyContainer: {
    paddingVertical: spacing[12],
  },
});

export default FundraisersScreen;
