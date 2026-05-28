import React, { useEffect, useState, useCallback } from 'react';
import { RefreshControl, StyleSheet, Text, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useColors } from '../../themes';
import { spacing, borderRadius, typography } from '../../themes/tokens';
import { api } from '../../services/api';
import { useNavigation } from '../../navigation/navigation';
import Screen from '../../components/Screen';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusPill from '../../components/ui/StatusPill';
import { AnimatedPress } from '../../components/AnimatedPress';

export function TaskScreen() {
  const colors = useColors();
  const navigation = useNavigation();
  const { params } = useNavigation();
  const rescueId = params?.rescueId;

  const [rescue, setRescue] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchTask = useCallback(async () => {
    if (!rescueId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/rescue/${rescueId}`);
      setRescue(data.rescue || data);
    } catch (e) {
      Alert.alert('Error', 'Failed to retrieve task details.');
    } finally {
      setLoading(false);
    }
  }, [rescueId]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  const handleUpdateStatus = async (status: string) => {
    if (!rescue) return;
    setSubmitting(true);
    try {
      await api.put(`/ambulance/rescue/${rescue._id}/status`, { status });
      Alert.alert('Status Updated', `Task status updated to "${status.replace('_', ' ')}"!`);
      fetchTask();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to update transport progress.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShareLiveLocation = async () => {
    if (!rescue) return;
    setSubmitting(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Denied', 'GPS access is required to stream coordinates.');
        return;
      }

      const pos = await Location.getCurrentPositionAsync({});
      await api.put('/ambulance/location', {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });

      Alert.alert('📍 Location Streamed', 'Your current GPS coordinates were synchronized with the dispatch center.');
    } catch (e: any) {
      Alert.alert('Error', 'Failed to acquire location coordinates.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!rescue) {
    return (
      <Screen style={{ backgroundColor: colors.background.primary }} scrollable={false}>
        <View style={styles.centerContainer}>
          <Text style={{ color: colors.text.secondary }}>Loading task file...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchTask} tintColor={colors.primary} />
      }
      style={{ backgroundColor: colors.background.primary }}
    >
      {/* Header back navigation */}
      <View style={styles.headerNav}>
        <AnimatedPress onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={[styles.backBtnText, { color: colors.primary }]}>Crew Board</Text>
        </AnimatedPress>
        <StatusPill status={rescue.status} />
      </View>

      {/* Task Details Card */}
      <Card variant="glass" style={styles.taskDetailCard}>
        <Text style={[styles.kickerText, { color: colors.primary }]}>🔴 EMERGENCY TRANSFER</Text>
        <Text style={[styles.descText, { color: colors.text.primary }]}>
          {rescue.description}
        </Text>
        <View style={styles.locationBlock}>
          <Ionicons name="navigate" size={16} color={colors.text.secondary} />
          <Text style={{ color: colors.text.secondary, fontSize: 12, flex: 1 }}>
            Pickup: {rescue.location?.address || 'Precise GPS Location Attached'}
          </Text>
        </View>
      </Card>

      {/* Navigation Radar Map Mock */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Tactical Navigation</Text>
      </View>
      <Card variant="elevated" style={styles.mapCard}>
        <View style={[styles.mapPlaceholder, { backgroundColor: colors.background.tertiary }]}>
          <Ionicons name="map-outline" size={40} color={`${colors.primary}40`} />
          <Text style={{ color: colors.text.secondary, fontSize: 12, textAlign: 'center', marginTop: spacing[2] }}>
            Tactical Map Mock: GPS coordinates trace active en-route path to partner clinic
          </Text>
        </View>
      </Card>

      {/* Transport Controls */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Trips Control Center</Text>
      </View>
      <Card variant="elevated" style={styles.controlsCard}>
        <View style={styles.btnStack}>
          {/* Share coordinates */}
          <Button
            variant="primary"
            icon={<Ionicons name="locate" size={16} color={colors.background.primary} />}
            loading={submitting}
            onPress={handleShareLiveLocation}
          >
            Share Live GPS Coordinates
          </Button>

          {/* Stepper status updates */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border.primary }]} />
            <Text style={{ fontSize: 10, color: colors.text.muted, fontFamily: typography.fontFamily.bold, textTransform: 'uppercase' }}>
              Dispatch Status
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border.primary }]} />
          </View>

          <View style={styles.stepperRow}>
            <Button
              variant={rescue.status === 'en_route' ? 'primary' : 'outlined'}
              size="small"
              onPress={() => handleUpdateStatus('en_route')}
              style={{ flex: 1 }}
            >
              En Route
            </Button>
            <Button
              variant={rescue.status === 'picked_up' ? 'primary' : 'outlined'}
              size="small"
              onPress={() => handleUpdateStatus('picked_up')}
              style={{ flex: 1 }}
            >
              Picked Up
            </Button>
            <Button
              variant={rescue.status === 'delivered' ? 'primary' : 'outlined'}
              size="small"
              onPress={() => handleUpdateStatus('delivered')}
              style={{ flex: 1 }}
            >
              Delivered
            </Button>
          </View>
        </View>
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
  taskDetailCard: {
    padding: spacing[4],
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  kickerText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.extraBold,
    letterSpacing: 1,
  },
  descText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: typography.fontFamily.bold,
  },
  locationBlock: {
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
  mapCard: {
    padding: spacing[2],
    marginBottom: spacing[4],
  },
  mapPlaceholder: {
    height: 160,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[5],
  },
  controlsCard: {
    padding: spacing[4],
    marginBottom: spacing[8],
  },
  btnStack: {
    gap: spacing[3],
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginVertical: spacing[1],
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  stepperRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
});

export default TaskScreen;
