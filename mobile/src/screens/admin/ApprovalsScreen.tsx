import React, { useEffect, useState, useCallback } from 'react';
import { RefreshControl, StyleSheet, Text, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../themes';
import { spacing, borderRadius, typography } from '../../themes/tokens';
import { api } from '../../services/api';
import { useNavigation } from '../../navigation/navigation';
import Screen from '../../components/Screen';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusPill from '../../components/ui/StatusPill';
import { AnimatedPress } from '../../components/AnimatedPress';
import { User } from '../../types';

export function ApprovalsScreen() {
  const colors = useColors();
  const navigation = useNavigation();
  const [pending, setPending] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/pending-approvals');
      setPending(data.users || []);
    } catch (e) {
      // Quietly ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const handleApprove = async (userId: string, name: string) => {
    setSubmitting(userId);
    try {
      await api.put(`/admin/approve/${userId}`, { approve: true });
      Alert.alert('Approved 👍', `${name} has been approved successfully.`);
      fetchApprovals();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to approve organization.');
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchApprovals} tintColor={colors.primary} />
      }
      title="Approvals Queue"
      subtitle="Verify credentials and approve pending partner organizations"
      style={{ backgroundColor: colors.background.primary }}
    >
      {/* Back button */}
      <View style={styles.headerNav}>
        <AnimatedPress onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={[styles.backBtnText, { color: colors.primary }]}>Dashboard</Text>
        </AnimatedPress>
      </View>

      {/* Main listing */}
      {pending.length > 0 ? (
        <View style={styles.listContainer}>
          {pending.map((item) => (
            <Card key={item._id} variant="default" style={styles.approvalCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.avatarIcon, { backgroundColor: `${colors.primary}15` }]}>
                  <Ionicons
                    name={
                      item.role === 'hospital'
                        ? 'medical'
                        : item.role === 'ngo'
                        ? 'heart'
                        : 'car'
                    }
                    size={22}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.orgName, { color: colors.text.primary }]}>
                    {item.orgName || item.name}
                  </Text>
                  <Text style={[styles.emailSub, { color: colors.text.secondary }]}>
                    {item.email}
                  </Text>
                </View>
                <StatusPill status="pending" />
              </View>

              <View style={styles.detailsBox}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>Role Type:</Text>
                  <Text style={[styles.detailValue, { color: colors.text.primary, textTransform: 'capitalize' }]}>
                    {item.role}
                  </Text>
                </View>
                {item.phone && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>Phone:</Text>
                    <Text style={[styles.detailValue, { color: colors.text.primary }]}>{item.phone}</Text>
                  </View>
                )}
                {item.location?.address && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>Address:</Text>
                    <Text style={[styles.detailValue, { color: colors.text.primary }]} numberOfLines={1}>
                      {item.location.address}
                    </Text>
                  </View>
                )}
              </View>

              <Button
                variant="primary"
                loading={submitting === item._id}
                onPress={() => handleApprove(item._id, item.orgName || item.name || 'Organization')}
                icon={<Ionicons name="checkmark-circle-outline" size={16} color={colors.background.primary} />}
                style={{ marginTop: spacing[3] }}
              >
                Approve Organization
              </Button>
            </Card>
          ))}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconCircle, { backgroundColor: `${colors.success}10` }]}>
            <Ionicons name="checkmark-done-circle" size={40} color={colors.success} />
          </View>
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
            No pending partner approvals at this time. All organizations are verified!
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
  approvalCard: {
    padding: spacing[4],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  avatarIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgName: {
    fontSize: 15,
    fontFamily: typography.fontFamily.bold,
  },
  emailSub: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    marginTop: 2,
  },
  detailsBox: {
    marginTop: spacing[3.5],
    padding: spacing[3],
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: borderRadius.lg,
    gap: spacing[2],
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
  },
  detailValue: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[12],
    gap: spacing[4],
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
    lineHeight: 18,
    paddingHorizontal: spacing[6],
  },
});

export default ApprovalsScreen;
