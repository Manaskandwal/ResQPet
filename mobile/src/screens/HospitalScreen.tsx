import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, S } from '../styles/theme';
import { Rescue, User } from '../types';
import { api } from '../services/api';
import { AnimatedPress } from '../components/AnimatedPress';
import { RescueCard } from '../components/RescueCard';
import {
  ScreenShell,
  ScreenHeader,
  SectionHeader,
  SurfaceCard,
  SegmentedControl,
  EmptyState,
  StatusPill,
} from '../components/SharedComponents';

export function HospitalHome() {
  return (
    <ScreenShell>
      <ScreenHeader
        title="Hospital Desk"
        subtitle="Accept escalations, manage treatment, bill cases & coordinate ambulances"
      />
      <HospitalCases />
    </ScreenShell>
  );
}

export function HospitalCases() {
  const [escalated, setEscalated] = useState<Rescue[]>([]);
  const [mine, setMine] = useState<Rescue[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'escalated' | 'mine'>('escalated');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, b] = await Promise.all([api.get('/hospital/escalated'), api.get('/hospital/my-cases')]);
      setEscalated(a.data.cases || a.data.rescues || []);
      setMine(b.data.cases || b.data.rescues || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const list = activeTab === 'escalated' ? escalated : mine;

  return (
    <ScreenShell
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={load} tintColor={C.brand} />
      }
    >
      <SegmentedControl
        options={[
          { key: 'escalated', label: `Escalated (${escalated.length})` },
          { key: 'mine', label: `My Cases (${mine.length})` },
        ]}
        active={activeTab}
        onChange={(k) => setActiveTab(k as any)}
      />
      {list.length === 0 ? (
        <EmptyState icon="medkit" message="No cases in this section" />
      ) : (
        list.map((r) => (
          <RescueCard key={r._id} rescue={r} actions={<HospitalActions rescue={r} onDone={load} />} />
        ))
      )}
      <FleetManager />
    </ScreenShell>
  );
}

export function HospitalActions({ rescue, onDone }: { rescue: Rescue; onDone: () => void }) {
  const [bill, setBill] = useState('');
  const [note, setNote] = useState('');

  return (
    <View style={S.actionGroup}>
      <View style={S.row}>
        <AnimatedPress
          onPress={async () => {
            await api.put(`/hospital/rescue/${rescue._id}/accept-broadcast`);
            onDone();
          }}
          style={[S.btnPrimary, { flex: 1 }]}
        >
          <Ionicons name="checkmark-done" size={16} color={C.bgMain} />
          <Text style={S.btnPrimaryText}>Accept</Text>
        </AnimatedPress>
        <AnimatedPress
          onPress={async () => {
            await api.put(`/hospital/rescue/${rescue._id}/reject-broadcast`);
            onDone();
          }}
          style={[S.btnDanger, { flex: 1, marginLeft: 8 }]}
        >
          <Ionicons name="close" size={16} color={C.error} />
          <Text style={S.btnDangerText}>Reject</Text>
        </AnimatedPress>
      </View>
      <View style={S.row}>
        <TextInput
          style={[S.input, { flex: 1 }]}
          value={note}
          onChangeText={setNote}
          placeholder="Treatment note..."
          placeholderTextColor={C.textMuted}
        />
        <AnimatedPress
          onPress={async () => {
            await api.put(`/hospital/rescue/${rescue._id}/treatment`, {
              treatmentStatus: 'under_treatment',
              hospitalNote: note,
            });
            setNote('');
            onDone();
          }}
          style={[S.btnOutline, { marginLeft: 8 }]}
        >
          <Ionicons name="pulse" size={16} color={C.brand} />
          <Text style={S.btnOutlineText}>Update</Text>
        </AnimatedPress>
      </View>
      <View style={S.row}>
        <TextInput
          style={[S.input, { flex: 1 }]}
          value={bill}
          onChangeText={setBill}
          placeholder="Bill amount (₹)"
          placeholderTextColor={C.textMuted}
          keyboardType="numeric"
        />
        <AnimatedPress
          onPress={async () => {
            await api.post(`/hospital/rescue/${rescue._id}/bill`, {
              items: [{ name: 'Treatment', amount: Number(bill) }],
              totalAmount: Number(bill),
              sentTo: 'user',
            });
            setBill('');
            onDone();
          }}
          disabled={!bill}
          style={[S.btnPrimary, { marginLeft: 8 }]}
        >
          <Ionicons name="receipt" size={16} color={C.bgMain} />
          <Text style={S.btnPrimaryText}>Send Bill</Text>
        </AnimatedPress>
      </View>
    </View>
  );
}

export function FleetManager() {
  const [ambulances, setAmbulances] = useState<User[]>([]);
  const [vehicleNumber, setVehicleNumber] = useState('');

  const load = useCallback(async () => {
    const { data } = await api.get('/hospital/ambulances');
    setAmbulances(data.ambulances || []);
  }, []);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  return (
    <View>
      <SectionHeader title="🚑 Fleet Manager" />
      <SurfaceCard>
        <View style={S.row}>
          <TextInput
            style={[S.input, { flex: 1 }]}
            value={vehicleNumber}
            onChangeText={setVehicleNumber}
            placeholder="Vehicle number (e.g. DL 01 AB 1234)"
            placeholderTextColor={C.textMuted}
          />
          <AnimatedPress
            onPress={async () => {
              if (!vehicleNumber) return;
              await api.post('/hospital/onboard-ambulance', {
                vehicleNumber,
                name: `Ambulance ${vehicleNumber}`,
              });
              setVehicleNumber('');
              load();
            }}
            disabled={!vehicleNumber}
            style={[S.btnPrimary, { marginLeft: 8 }]}
          >
            <Ionicons name="add" size={16} color={C.bgMain} />
            <Text style={S.btnPrimaryText}>Add</Text>
          </AnimatedPress>
        </View>
        {ambulances.map((a) => (
          <View key={a._id} style={S.listRow}>
            <View style={S.listRowIcon}>
              <Ionicons name="car" size={16} color={C.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.listRowTitle}>{a.vehicleNumber || a.name}</Text>
              <Text style={S.listRowSub}>{a.isApproved ? 'Approved' : 'Pending approval'}</Text>
            </View>
            <StatusPill status={a.isApproved ? 'approved' : 'pending'} />
          </View>
        ))}
      </SurfaceCard>
    </View>
  );
}
