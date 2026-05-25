import React, { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, S } from '../styles/theme';
import { Rescue } from '../types';
import { api } from '../services/api';
import { AnimatedPress } from '../components/AnimatedPress';
import { RescueCard } from '../components/RescueCard';
import {
  ScreenShell,
  ScreenHeader,
  StatCard,
  SegmentedControl,
  EmptyState,
} from '../components/SharedComponents';

export function NgoHome() {
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    api
      .get('/ngo/analytics')
      .then(({ data }) => setAnalytics(data.analytics || data))
      .catch(() => undefined);
  }, []);

  return (
    <ScreenShell>
      <ScreenHeader
        title="NGO Response Board"
        subtitle="Nearby reports, active treatment, escalation & follow-ups"
      />
      <View style={S.statsGrid}>
        <StatCard label="Nearby" value={analytics?.nearbyCases ?? '—'} icon="location" color={C.brand} />
        <StatCard label="Active" value={analytics?.activeCases ?? '—'} icon="pulse" color={C.warning} />
        <StatCard label="Completed" value={analytics?.completedCases ?? '—'} icon="checkmark-circle" color={C.success} />
        <StatCard label="Impact" value={analytics?.impactCases ?? '—'} icon="heart" color={C.error} />
      </View>
      <NgoCases />
    </ScreenShell>
  );
}

export function NgoCases() {
  const [nearby, setNearby] = useState<Rescue[]>([]);
  const [mine, setMine] = useState<Rescue[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'nearby' | 'mine'>('nearby');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nearbyRes, mineRes] = await Promise.all([api.get('/ngo/nearby'), api.get('/ngo/my-cases')]);
      setNearby(nearbyRes.data.cases || nearbyRes.data.rescues || []);
      setMine(mineRes.data.cases || mineRes.data.rescues || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const list = activeTab === 'nearby' ? nearby : mine;

  return (
    <ScreenShell
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={load} tintColor={C.brand} />
      }
    >
      <SegmentedControl
        options={[
          { key: 'nearby', label: `Nearby (${nearby.length})` },
          { key: 'mine', label: `My Cases (${mine.length})` },
        ]}
        active={activeTab}
        onChange={(k) => setActiveTab(k as any)}
      />
      {list.length === 0 ? (
        <EmptyState icon="leaf" message="No cases in this section" />
      ) : (
        list.map((r) => (
          <RescueCard key={r._id} rescue={r} actions={<NgoActions rescue={r} onDone={load} />} />
        ))
      )}
    </ScreenShell>
  );
}

export function NgoActions({ rescue, onDone }: { rescue: Rescue; onDone: () => void }) {
  const [followUp, setFollowUp] = useState('');

  const act = async (path: string, body?: any) => {
    try {
      await api[path.startsWith('/ngo') ? 'post' : 'put'](path, body || {});
      onDone();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || e.message);
    }
  };

  return (
    <View style={S.actionGroup}>
      <View style={S.row}>
        <AnimatedPress
          onPress={() => act(`/rescue/${rescue._id}/accept-ngo`, { type: 'immediate', transportType: 'self' })}
          style={[S.btnPrimary, { flex: 1 }]}
        >
          <Ionicons name="checkmark-circle" size={16} color={C.bgMain} />
          <Text style={S.btnPrimaryText}>Accept</Text>
        </AnimatedPress>
        <AnimatedPress
          onPress={() => act(`/rescue/${rescue._id}/reject-ngo`)}
          style={[S.btnDanger, { flex: 1, marginLeft: 8 }]}
        >
          <Ionicons name="close-circle-outline" size={16} color={C.error} />
          <Text style={S.btnDangerText}>Reject</Text>
        </AnimatedPress>
      </View>
      <View style={S.row}>
        <AnimatedPress
          onPress={() => act(`/rescue/${rescue._id}/ngo-status`, { status: 'on_the_way' })}
          style={[S.btnOutline, { flex: 1 }]}
        >
          <Ionicons name="walk-outline" size={16} color={C.brand} />
          <Text style={S.btnOutlineText}>On the Way</Text>
        </AnimatedPress>
        <AnimatedPress
          onPress={() => act(`/rescue/${rescue._id}/resolve-ngo`)}
          style={[S.btnOutline, { flex: 1, marginLeft: 8 }]}
        >
          <Ionicons name="medkit-outline" size={16} color={C.brand} />
          <Text style={S.btnOutlineText}>Resolve On Spot</Text>
        </AnimatedPress>
      </View>
      <AnimatedPress
        onPress={() => act(`/rescue/${rescue._id}/escalate-ngo`, { transportType: 'ambulance' })}
        style={S.btnOutline}
      >
        <Ionicons name="business-outline" size={16} color={C.brand} />
        <Text style={S.btnOutlineText}>Escalate to Hospital</Text>
      </AnimatedPress>
      <View style={S.row}>
        <TextInput
          style={[S.input, { flex: 1 }]}
          value={followUp}
          onChangeText={setFollowUp}
          placeholder="Follow-up note or date..."
          placeholderTextColor={C.textMuted}
        />
        <AnimatedPress
          onPress={async () => {
            await api.post(`/rescue/${rescue._id}/followup`, {
              scheduleDate: followUp || new Date().toISOString(),
              notes: followUp,
            });
            setFollowUp('');
            onDone();
          }}
          style={[S.btnOutline, { marginLeft: 8 }]}
        >
          <Ionicons name="calendar-outline" size={16} color={C.brand} />
          <Text style={S.btnOutlineText}>Add</Text>
        </AnimatedPress>
      </View>
    </View>
  );
}
