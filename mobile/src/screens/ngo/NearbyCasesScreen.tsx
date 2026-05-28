import React, { useEffect, useState, useCallback, useRef } from 'react';
import { RefreshControl, StyleSheet, Text, View, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../themes';
import { spacing, borderRadius, typography } from '../../themes/tokens';
import { api } from '../../services/api';
import { Rescue } from '../../types';
import { useNavigation } from '../../navigation/navigation';
import Screen from '../../components/Screen';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import { RescueCard } from '../../components/RescueCard';
import { AnimatedPress } from '../../components/AnimatedPress';
import Button from '../../components/ui/Button';

export function NearbyCasesScreen() {
  const colors = useColors();
  const navigation = useNavigation();
  const [cases, setCases] = useState<Rescue[]>([]);
  const [loading, setLoading] = useState(false);

  // Radar sweep animation
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const startRadarAnimation = useCallback(() => {
    pulseAnim.setValue(0);
    Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 2500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    ).start();
  }, [pulseAnim]);

  const fetchNearby = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/ngo/nearby');
      setCases(data.cases || data.rescues || []);
    } catch (e) {
      // Quietly ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNearby();
    startRadarAnimation();
  }, [fetchNearby, startRadarAnimation]);

  const handleAccept = async (rescueId: string) => {
    try {
      await api.post(`/rescue/${rescueId}/accept-ngo`, { type: 'immediate', transportType: 'self' });
      fetchNearby();
    } catch (e) {
      // Handle error
    }
  };

  const handleReject = async (rescueId: string) => {
    try {
      await api.put(`/rescue/${rescueId}/reject-ngo`);
      fetchNearby();
    } catch (e) {
      // Handle error
    }
  };

  // Interpolations for radar
  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1.4],
  });

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [0.6, 0.4, 0],
  });

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchNearby} tintColor={colors.primary} />
      }
      title="Incident Radar"
      subtitle="Accept distress dispatches and respond to nearby stray reports"
      style={{ backgroundColor: colors.background.primary }}
    >
      {/* Bioluminescent Radar Visual */}
      <View style={[styles.radarContainer, { backgroundColor: colors.background.secondary }]}>
        <Animated.View
          style={[
            styles.radarPulse,
            {
              borderColor: colors.primary,
              transform: [{ scale }],
              opacity,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.radarPulse,
            {
              borderColor: colors.primary,
              transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.1] }) }],
              opacity: pulseAnim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.8, 0.3, 0] }),
            },
          ]}
        />
        <View style={[styles.radarCenter, { backgroundColor: `${colors.primary}1A` }]}>
          <Ionicons name="compass" size={32} color={colors.primary} />
        </View>
        <Text style={[styles.radarStatusText, { color: colors.text.secondary }]}>
          {loading ? 'Scanning ecosystem...' : `Active scan: ${cases.length} pending case(s)`}
        </Text>
      </View>

      {/* Case list */}
      <View style={styles.listContainer}>
        {cases.length > 0 ? (
          cases.map((rescue) => (
            <Card
              key={rescue._id}
              style={StyleSheet.flatten([styles.caseCard, { backgroundColor: colors.background.secondary }])}
            >
              <AnimatedPress
                onPress={() => navigation.push('CaseDetail', { rescueId: rescue._id })}
                style={{ flex: 1 }}
              >
                <RescueCard rescue={rescue} />
              </AnimatedPress>

              <View style={styles.cardActions}>
                <Button
                  variant="primary"
                  size="small"
                  icon={<Ionicons name="checkmark-circle-outline" size={16} color={colors.background.primary} />}
                  onPress={() => handleAccept(rescue._id)}
                  style={{ flex: 1 }}
                >
                  Accept Case
                </Button>
                <Button
                  variant="danger"
                  size="small"
                  icon={<Ionicons name="close-circle-outline" size={16} color={colors.error} />}
                  onPress={() => handleReject(rescue._id)}
                  style={{ flex: 0.4 }}
                >
                  Decline
                </Button>
              </View>
            </Card>
          ))
        ) : (
          <EmptyState
            icon="compass-outline"
            title="Ecosystem Clear"
            message="No distress reports are currently waiting in your immediate neighborhood. Tap below to refresh."
            actionLabel="Refresh Radar"
            onAction={fetchNearby}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  radarContainer: {
    height: 180,
    borderRadius: borderRadius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: spacing[6],
    position: 'relative',
  },
  radarPulse: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
  },
  radarCenter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    marginBottom: spacing[2],
  },
  radarStatusText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    zIndex: 2,
  },
  listContainer: {
    gap: spacing[4],
  },
  caseCard: {
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    gap: spacing[3],
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[1],
  },
});

export default NearbyCasesScreen;
