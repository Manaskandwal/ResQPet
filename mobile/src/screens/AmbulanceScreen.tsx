import React, { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Socket } from 'socket.io-client';
import * as Location from 'expo-location';
import { C, S } from '../styles/theme';
import { Rescue } from '../types';
import { api } from '../services/api';
import { AnimatedPress } from '../components/AnimatedPress';
import { RescueCard } from '../components/RescueCard';
import {
  ScreenShell,
  ScreenHeader,
  SegmentedControl,
  EmptyState,
} from '../components/SharedComponents';

export function AmbulanceHome({ socket }: { socket: Socket | null }) {
  return (
    <ScreenShell>
      <ScreenHeader
        title="Ambulance Crew"
        subtitle="Accept dispatches, stream location & update transport progress"
      />
      <AmbulanceCases socket={socket} />
    </ScreenShell>
  );
}

export function AmbulanceCases({ socket }: { socket?: Socket | null }) {
  const [assigned, setAssigned] = useState<Rescue[]>([]);
  const [pinged, setPinged] = useState<Rescue[]>([]);
  const [history, setHistory] = useState<Rescue[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'pinged' | 'assigned' | 'history'>('pinged');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, p, h] = await Promise.all([
        api.get('/ambulance/assigned'),
        api.get('/ambulance/pinged'),
        api.get('/ambulance/history'),
      ]);
      setAssigned([...(a.data.task ? [a.data.task] : a.data.tasks || a.data.rescues || [])]);
      setPinged(p.data.tasks || p.data.rescues || []);
      setHistory(h.data.history || h.data.rescues || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const streamLocation = async (rescueId?: string) => {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) {
      return Alert.alert('Location needed', 'Location is required for ambulance tracking.');
    }
    const pos = await Location.getCurrentPositionAsync({});
    await api.put('/ambulance/location', {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
    });
    if (rescueId) {
      socket?.emit('ambulance_location_update', {
        rescueRequestId: rescueId,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    }
    Alert.alert('📍 Location shared', 'Your latest location was sent.');
  };

  const lists: Record<string, Rescue[]> = { pinged, assigned, history };
  const list = lists[activeTab] || [];

  return (
    <ScreenShell
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={load} tintColor={C.brand} />
      }
    >
      <SegmentedControl
        options={[
          { key: 'pinged', label: `Pings (${pinged.length})` },
          { key: 'assigned', label: `Assigned (${assigned.length})` },
          { key: 'history', label: 'History' },
        ]}
        active={activeTab}
        onChange={(k) => setActiveTab(k as any)}
      />
      {list.length === 0 ? (
        <EmptyState icon="car" message="No items in this section" />
      ) : (
        list.map((r) => (
          <RescueCard
            key={r._id}
            rescue={r}
            actions={
              activeTab === 'pinged' ? (
                <View style={S.row}>
                  <AnimatedPress
                    onPress={async () => {
                      await api.put(`/ambulance/rescue/${r._id}/accept-ping`);
                      load();
                    }}
                    style={[S.btnPrimary, { flex: 1 }]}
                  >
                    <Ionicons name="checkmark-circle" size={16} color={C.bgMain} />
                    <Text style={S.btnPrimaryText}>Accept Ping</Text>
                  </AnimatedPress>
                  <AnimatedPress
                    onPress={async () => {
                      await api.put(`/ambulance/rescue/${r._id}/reject-ping`);
                      load();
                    }}
                    style={[S.btnDanger, { flex: 1, marginLeft: 8 }]}
                  >
                    <Ionicons name="close-circle-outline" size={16} color={C.error} />
                    <Text style={S.btnDangerText}>Reject</Text>
                  </AnimatedPress>
                </View>
              ) : activeTab === 'assigned' ? (
                <View style={S.actionGroup}>
                  <AnimatedPress onPress={() => streamLocation(r._id)} style={S.btnPrimary}>
                    <Ionicons name="navigate" size={16} color={C.bgMain} />
                    <Text style={S.btnPrimaryText}>Share Live Location</Text>
                  </AnimatedPress>
                  <View style={S.chipRow}>
                    {['en_route', 'picked_up', 'delivered'].map((status) => (
                      <AnimatedPress
                        key={status}
                        onPress={async () => {
                          await api.put(`/ambulance/rescue/${r._id}/status`, { status });
                          load();
                        }}
                        style={S.chip}
                      >
                        <Text style={S.chipText}>{status.replace('_', ' ')}</Text>
                      </AnimatedPress>
                    ))}
                  </View>
                </View>
              ) : undefined
            }
          />
        ))
      )}
    </ScreenShell>
  );
}
