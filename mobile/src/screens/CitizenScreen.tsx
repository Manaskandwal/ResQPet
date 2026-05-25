import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ActivityIndicator, RefreshControl, Text, TextInput, View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { C, S } from '../styles/theme';
import { Rescue, User, Tab } from '../types';
import { api } from '../services/api';
import { AnimatedPress } from '../components/AnimatedPress';
import { RescueCard } from '../components/RescueCard';
import {
  ScreenShell,
  ScreenHeader,
  SectionHeader,
  SurfaceCard,
  StatCard,
  FormField,
} from '../components/SharedComponents';

// Defer import of these components to prevent circular imports if needed, or import directly
import { FundraisersSection } from './WalletScreen';
import { NgoCases } from './NgoScreen';
import { HospitalCases } from './HospitalScreen';
import { AmbulanceCases } from './AmbulanceScreen';
import { AdminRescues } from './AdminScreen';

export function ImpactFeed() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    api.get('/rescue/impact/feed')
      .then(({ data }) => setItems(data.feed || []))
      .catch(() => undefined);
  }, []);

  if (!items.length) return null;

  return (
    <View>
      <SectionHeader title="✨ Impact Stories" />
      {items.slice(0, 3).map((item) => (
        <SurfaceCard key={item._id}>
          {item.beforeImage && <Image source={{ uri: item.beforeImage }} style={S.fundraiserImg} />}
          <Text style={S.listRowTitle}>{item.helperName}</Text>
          <Text style={S.listRowSub}>{item.afterSummary || item.description}</Text>
        </SurfaceCard>
      ))}
    </View>
  );
}

export function CitizenHome({ setTab }: { setTab: (t: Tab) => void }) {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api
      .get('/public/stats')
      .then(({ data }) => setStats(data.stats))
      .catch(() => undefined);
  }, []);

  return (
    <ScreenShell>
      {/* Hero gradient card */}
      <View style={S.heroCard}>
        <View style={S.heroGlow} pointerEvents="none" />
        <Text style={S.heroKicker}>🐾 Rescue Network</Text>
        <Text style={S.heroTitle}>Rescue Command</Text>
        <Text style={S.heroSub}>
          Submit rescues, track help, fund urgent care, and follow impact stories.
        </Text>
        <View style={S.heroActions}>
          <AnimatedPress onPress={() => setTab('cases')} style={[S.btnPrimary, { flex: 1 }]}>
            <Ionicons name="add-circle" size={18} color={C.bgMain} />
            <Text style={S.btnPrimaryText}>Report Animal</Text>
          </AnimatedPress>
          <AnimatedPress onPress={() => setTab('wallet')} style={[S.btnOutline, { flex: 1 }]}>
            <Ionicons name="wallet-outline" size={18} color={C.brand} />
            <Text style={S.btnOutlineText}>Wallet</Text>
          </AnimatedPress>
        </View>
      </View>

      {/* Stats grid */}
      <SectionHeader title="Platform Stats" />
      <View style={S.statsGrid}>
        <StatCard label="Total Rescues" value={stats?.totalRequests ?? '—'} icon="paw" color={C.brand} />
        <StatCard label="Completed" value={stats?.completedRequests ?? '—'} icon="checkmark-circle" color={C.success} />
        <StatCard label="NGOs Active" value={stats?.totalNGOs ?? '—'} icon="leaf" color={C.info} />
        <StatCard label="Citizens" value={stats?.totalUsers ?? '—'} icon="people" color={C.warning} />
      </View>

      <FundraisersSection compact />
      <ImpactFeed />
    </ScreenShell>
  );
}

export function CasesScreen({ user }: { user: User }) {
  if (user.role === 'user') return <UserCases />;
  if (user.role === 'ngo') return <NgoCases />;
  if (user.role === 'hospital') return <HospitalCases />;
  if (user.role === 'ambulance') return <AmbulanceCases />;
  return <AdminRescues />;
}

export function UserCases() {
  const [rescues, setRescues] = useState<Rescue[]>([]);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [animalType, setAnimalType] = useState('dog');
  const [media, setMedia] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/rescue/mine');
      setRescues(data.rescues || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pickMedia = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      return Alert.alert('Permission needed', 'Allow media access to attach rescue evidence.');
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
    });
    if (!result.canceled) setMedia(result.assets.slice(0, 6));
  };

  const submitRescue = async () => {
    if (!description.trim()) return;
    setSubmitting(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Location needed', 'Location is required to route rescuers.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      const fd = new FormData();
      fd.append('description', description);
      fd.append('animalType', animalType);
      fd.append('lat', String(pos.coords.latitude));
      fd.append('lng', String(pos.coords.longitude));
      fd.append('willingToPay', 'false');
      fd.append('willingToGo', 'false');
      media.forEach((asset, i) => {
        fd.append('media', {
          uri: asset.uri,
          name: asset.fileName || `rescue-${i}.${asset.type === 'video' ? 'mp4' : 'jpg'}`,
          type: asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
        } as any);
      });
      await api.post('/rescue', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setDescription('');
      setMedia([]);
      await load();
      Alert.alert('✅ Rescue submitted', 'Responders have been alerted.');
    } catch (e: any) {
      Alert.alert('Failed', e.response?.data?.message || e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenShell
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={load} tintColor={C.brand} />
      }
    >
      <ScreenHeader title="My Rescues" subtitle="Submit and track your rescue requests" />

      {/* Submit form */}
      <SurfaceCard>
        <Text style={S.cardSectionTitle}>📋 New Rescue Report</Text>
        <FormField
          label="What happened?"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the animal's condition and location..."
          multiline
          icon="document-text-outline"
        />
        <View style={{ marginBottom: 8 }}>
          <Text style={S.fieldLabel}>Animal Type</Text>
          <View style={S.chipRow}>
            {['dog', 'cat', 'bird', 'other'].map((t) => (
              <AnimatedPress
                key={t}
                onPress={() => setAnimalType(t)}
                style={[S.chip, animalType === t && S.chipActive]}
              >
                <Text style={[S.chipText, animalType === t && S.chipTextActive]}>
                  {t === 'dog' ? '🐕' : t === 'cat' ? '🐈' : t === 'bird' ? '🐦' : '🐾'} {t}
                </Text>
              </AnimatedPress>
            ))}
          </View>
        </View>
        <AnimatedPress onPress={pickMedia} style={S.btnOutline}>
          <Ionicons name="images-outline" size={18} color={C.brand} />
          <Text style={S.btnOutlineText}>
            {media.length > 0 ? `${media.length} file(s) selected` : 'Attach Photos / Video'}
          </Text>
        </AnimatedPress>
        <AnimatedPress
          onPress={submitRescue}
          disabled={!description.trim() || submitting}
          style={S.btnPrimary}
        >
          {submitting ? (
            <ActivityIndicator color={C.bgMain} size="small" />
          ) : (
            <>
              <Ionicons name="navigate" size={18} color={C.bgMain} />
              <Text style={S.btnPrimaryText}>Submit at Current Location</Text>
            </>
          )}
        </AnimatedPress>
      </SurfaceCard>

      {/* Rescue list */}
      {rescues.length > 0 && (
        <>
          <SectionHeader title={`Your Rescues (${rescues.length})`} />
          {rescues.map((r) => (
            <RescueCard
              key={r._id}
              rescue={r}
              actions={<UserRescueActions rescue={r} onDone={load} />}
            />
          ))}
        </>
      )}
    </ScreenShell>
  );
}

export function UserRescueActions({ rescue, onDone }: { rescue: Rescue; onDone: () => void }) {
  const [cost, setCost] = useState('');
  return (
    <View style={S.actionGroup}>
      <AnimatedPress
        onPress={async () => {
          await api.put(`/rescue/${rescue._id}/cancel`);
          onDone();
        }}
        style={S.btnDanger}
      >
        <Ionicons name="close-circle-outline" size={16} color={C.error} />
        <Text style={S.btnDangerText}>Cancel Rescue</Text>
      </AnimatedPress>
      <View style={S.row}>
        <TextInput
          style={[S.input, { flex: 1 }]}
          value={cost}
          onChangeText={setCost}
          placeholder="Estimated cost (₹)"
          placeholderTextColor={C.textMuted}
          keyboardType="numeric"
        />
        <AnimatedPress
          onPress={async () => {
            if (!cost) return;
            await api.put(`/rescue/${rescue._id}/fundraiser`, { estimatedCost: Number(cost) });
            setCost('');
            onDone();
          }}
          disabled={!cost}
          style={[S.btnOutline, { marginLeft: 8 }]}
        >
          <Ionicons name="heart-outline" size={16} color={C.brand} />
          <Text style={S.btnOutlineText}>Fundraiser</Text>
        </AnimatedPress>
      </View>
      {rescue.bill?.paidStatus === 'pending' && (
        <AnimatedPress
          onPress={async () => {
            await api.post(`/rescue/${rescue._id}/pay-bill`);
            onDone();
          }}
          style={S.btnPrimary}
        >
          <Ionicons name="card" size={16} color={C.bgMain} />
          <Text style={S.btnPrimaryText}>Pay Hospital Bill</Text>
        </AnimatedPress>
      )}
    </View>
  );
}
