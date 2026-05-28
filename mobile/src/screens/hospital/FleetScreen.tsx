import React, { useEffect, useState, useCallback } from 'react';
import { RefreshControl, StyleSheet, Text, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../themes';
import { spacing, borderRadius, typography } from '../../themes/tokens';
import { api } from '../../services/api';
import { User } from '../../types';
import { useNavigation } from '../../navigation/navigation';
import Screen from '../../components/Screen';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ListItem from '../../components/ui/ListItem';
import StatusPill from '../../components/ui/StatusPill';
import { AnimatedPress } from '../../components/AnimatedPress';

export function FleetScreen() {
  const colors = useColors();
  const navigation = useNavigation();
  const [ambulances, setAmbulances] = useState<User[]>([]);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchAmbulances = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/hospital/ambulances');
      setAmbulances(data.ambulances || []);
    } catch (e) {
      // Quietly ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAmbulances();
  }, [fetchAmbulances]);

  const handleOnboardAmbulance = async () => {
    if (!vehicleNumber) {
      Alert.alert('Missing Field', 'Please enter a valid vehicle registration number.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/hospital/onboard-ambulance', {
        vehicleNumber,
        name: `Ambulance ${vehicleNumber}`,
      });
      setVehicleNumber('');
      Alert.alert('Onboarded 👍', `Ambulance vehicle ${vehicleNumber} onboarded. Awaiting admin approval.`);
      fetchAmbulances();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to onboard vehicle.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchAmbulances} tintColor={colors.primary} />
      }
      title="Ambulance Fleet"
      subtitle="Onboard dedicated clinical dispatches and monitor active rescue crews"
      style={{ backgroundColor: colors.background.primary }}
    >
      {/* Header back navigation */}
      <View style={styles.headerNav}>
        <AnimatedPress onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={[styles.backBtnText, { color: colors.primary }]}>Hub</Text>
        </AnimatedPress>
      </View>

      {/* Onboard form card */}
      <Card variant="glass" style={styles.onboardCard}>
        <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
          🚑 Onboard Fleet Vehicle
        </Text>
        <Input
          label="Registration Number"
          placeholder="e.g. DL 01 AB 1234"
          value={vehicleNumber}
          onChangeText={setVehicleNumber}
          icon="car-outline"
        />
        <Button
          variant="primary"
          icon={<Ionicons name="add" size={16} color={colors.background.primary} />}
          loading={submitting}
          onPress={handleOnboardAmbulance}
          style={{ marginTop: spacing[2] }}
        >
          Register Ambulance
        </Button>
      </Card>

      {/* Ambulance list */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Active Fleet</Text>
      </View>

      {ambulances.length > 0 ? (
        <View style={styles.listContainer}>
          {ambulances.map((amb) => (
            <Card
              key={amb._id}
              variant="elevated"
              style={StyleSheet.flatten([
                styles.vehicleCard,
                { backgroundColor: colors.background.secondary },
              ])}
            >
              <View style={styles.vehicleHeader}>
                <View style={[styles.avatarBox, { backgroundColor: `${colors.primary}15` }]}>
                  <Ionicons name="car" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.vehicleTitle, { color: colors.text.primary }]}>
                    {amb.vehicleNumber || amb.name}
                  </Text>
                  <Text style={[styles.vehicleSub, { color: colors.text.secondary }]}>
                    Crew Driver: {amb.name}
                  </Text>
                </View>
                <StatusPill status={amb.isApproved ? 'approved' : 'pending'} />
              </View>
            </Card>
          ))}
        </View>
      ) : (
        <View style={{ paddingVertical: spacing[8] }}>
          <Text style={{ color: colors.text.secondary, textAlign: 'center' }}>
            No registered fleet ambulances found.
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
  onboardCard: {
    padding: spacing[4],
    gap: spacing[3],
    marginBottom: spacing[5],
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing[1],
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
  listContainer: {
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  vehicleCard: {
    padding: spacing[4],
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleTitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
  },
  vehicleSub: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    marginTop: 2,
  },
});

export default FleetScreen;
