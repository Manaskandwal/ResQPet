import React, { useEffect, useState, useCallback } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../themes';
import { spacing, borderRadius, typography } from '../../themes/tokens';
import { api } from '../../services/api';
import { Rescue } from '../../types';
import { useNavigation } from '../../navigation/navigation';
import Screen from '../../components/Screen';
import SegmentedControl from '../../components/ui/SegmentedControl';
import EmptyState from '../../components/ui/EmptyState';
import Card from '../../components/ui/Card';
import ListItem from '../../components/ui/ListItem';
import { AnimatedPress } from '../../components/AnimatedPress';

export function FollowupsScreen() {
  const colors = useColors();
  const navigation = useNavigation();
  const [cases, setCases] = useState<Rescue[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/ngo/my-cases');
      setCases(data.cases || data.rescues || []);
    } catch (e) {
      // Quietly ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  // Extract all individual followups from the cases
  const getAllFollowups = useCallback(() => {
    const allList: { rescue: Rescue; scheduledFor: string; notes: string; isPast: boolean }[] = [];
    cases.forEach((c: any) => {
      if (Array.isArray(c.followUps)) {
        c.followUps.forEach((f: any) => {
          const scheduledDate = new Date(f.scheduledFor);
          const isPast = scheduledDate < new Date();
          allList.push({
            rescue: c,
            scheduledFor: f.scheduledFor,
            notes: f.notes,
            isPast,
          });
        });
      }
    });

    // Sort by date (nearest first for upcoming, most recent first for past)
    return allList.sort((a, b) => {
      return new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime();
    });
  }, [cases]);

  const followups = getAllFollowups();
  const filteredFollowups = followups.filter((f) => {
    if (activeTab === 'upcoming') return !f.isPast;
    if (activeTab === 'past') return f.isPast;
    return true;
  });

  const tabOptions = [
    { key: 'upcoming', label: 'Upcoming Visits' },
    { key: 'past', label: 'Completed Logs' },
  ];

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchCases} tintColor={colors.primary} />
      }
      title="Follow-up Planner"
      subtitle="Track post-rescue veterinary visits, vaccination schedules, and recovery updates"
      style={{ backgroundColor: colors.background.primary }}
    >
      {/* Category Tabs */}
      <View style={styles.segmentedTabs}>
        <SegmentedControl
          segments={tabOptions}
          activeSegment={activeTab}
          onChange={setActiveTab}
        />
      </View>

      {/* Followups List */}
      {filteredFollowups.length > 0 ? (
        <View style={styles.listContainer}>
          {filteredFollowups.map((item, index) => (
            <AnimatedPress
              key={index}
              onPress={() => navigation.push('CaseDetail', { rescueId: item.rescue._id })}
            >
              <Card variant="glass" style={styles.followupCard}>
                <View style={styles.cardHeader}>
                  <View style={[styles.avatarBox, { backgroundColor: `${colors.primary}15` }]}>
                    <Ionicons name="calendar-sharp" size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.animalText, { color: colors.primary }]}>
                      {item.rescue.animalType?.toUpperCase() || 'ANIMAL'} RECOVERY
                    </Text>
                    <Text style={[styles.dateText, { color: colors.text.primary }]}>
                      {new Date(item.scheduledFor).toLocaleString('en-IN', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: item.isPast ? `${colors.success}1A` : `${colors.warning}1A` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: item.isPast ? colors.success : colors.warning },
                      ]}
                    >
                      {item.isPast ? 'COMPLETED' : 'PENDING'}
                    </Text>
                  </View>
                </View>

                {/* Description */}
                <View style={[styles.notesBox, { backgroundColor: colors.background.tertiary }]}>
                  <Text style={[styles.notesText, { color: colors.text.secondary }]}>
                    {item.notes || 'No checkup instructions specified.'}
                  </Text>
                </View>

                {/* Patient summary link */}
                <ListItem
                  title={item.rescue.description}
                  subtitle={item.rescue.location?.address || 'Location attached'}
                  icon="paw"
                  onPress={() => navigation.push('CaseDetail', { rescueId: item.rescue._id })}
                  style={styles.patientItem}
                />
              </Card>
            </AnimatedPress>
          ))}
        </View>
      ) : (
        <EmptyState
          icon="calendar-outline"
          title={activeTab === 'upcoming' ? 'All Visited' : 'No Past Logs'}
          message={
            activeTab === 'upcoming'
              ? 'No upcoming post-rescue visits scheduled. You are completely up to date!'
              : 'You have not added any previous checkup or vaccination logs.'
          }
          actionLabel="View Active Cases"
          onAction={() => navigation.push('MyCases')}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  segmentedTabs: {
    marginBottom: spacing[4],
  },
  listContainer: {
    gap: spacing[4],
    marginBottom: spacing[6],
  },
  followupCard: {
    padding: spacing[4],
    gap: spacing[3],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  avatarBox: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animalText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.extraBold,
    letterSpacing: 1,
  },
  dateText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing[2.5],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  statusBadgeText: {
    fontSize: 9,
    fontFamily: typography.fontFamily.extraBold,
    letterSpacing: 0.5,
  },
  notesBox: {
    padding: spacing[3],
    borderRadius: borderRadius.lg,
  },
  notesText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: typography.fontFamily.regular,
  },
  patientItem: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginTop: spacing[1],
  },
});

export default FollowupsScreen;
