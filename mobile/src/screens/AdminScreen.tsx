import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, RefreshControl, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';

import {
  api,
  setApiToken,
  TOKEN_KEY,
  ADMIN_TOKEN_KEY,
  USER_KEY,
} from '../services/api';
import { C, S } from '../styles/theme';
import { User, Rescue } from '../types';
import { AnimatedPress } from '../components/AnimatedPress';
import { RescueCard } from '../components/RescueCard';
import {
  ScreenShell,
  ScreenHeader,
  SectionHeader,
  SurfaceCard,
  StatCard,
  EmptyState,
} from '../components/SharedComponents';

export function AdminRescues() {
  const [rescues, setRescues] = useState<Rescue[]>([]);
  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/rescue-requests?limit=50');
      setRescues(data.rescues || []);
    } catch {
      // Ignore quietly as in original
    }
  }, []);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  return (
    <View>
      <SectionHeader title="🛡️ Rescue Overrides" />
      {rescues.length === 0 ? (
        <EmptyState icon="shield" message="No rescues to override" />
      ) : (
        rescues.map((r) => (
          <RescueCard
            key={r._id}
            rescue={r}
            actions={
              <View style={S.chipRow}>
                {['completed', 'cancelled', 'closed_unresolved'].map((status) => (
                  <AnimatedPress
                    key={status}
                    onPress={async () => {
                      try {
                        await api.put(`/admin/rescue/${r._id}/override`, { status });
                        load();
                      } catch {
                        // Ignore quietly
                      }
                    }}
                    style={S.chip}
                  >
                    <Text style={S.chipText}>{status.replace(/_/g, ' ')}</Text>
                  </AnimatedPress>
                ))}
              </View>
            }
          />
        ))
      )}
    </View>
  );
}

export default function AdminScreen({
  setToken,
  setAdminToken,
  setUser,
}: {
  setToken: (t: string) => void;
  setAdminToken: (t: string) => void;
  setUser: (u: User) => void;
}) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [pending, setPending] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [fundraisers, setFundraisers] = useState<Rescue[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'fundraisers' | 'users' | 'rescues'>('overview');
  const [userRoleTab, setUserRoleTab] = useState<'all' | 'user' | 'ngo' | 'hospital' | 'ambulance'>('all');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, p, u, f] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/pending-approvals'),
        api.get('/admin/users?limit=50'),
        api.get('/admin/fundraisers'),
      ]);
      setAnalytics(a.data.analytics);
      setPending(p.data.users || []);
      setUsers(u.data.users || []);
      setFundraisers(f.data.fundraisers || []);
    } catch {
      // Ignore quietly as in original
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  const impersonate = async (userId: string) => {
    try {
      const current = await SecureStore.getItemAsync(TOKEN_KEY);
      const { data } = await api.post('/auth/impersonate', { userId });
      setApiToken(data.token);
      if (current) await SecureStore.setItemAsync(ADMIN_TOKEN_KEY, current);
      await SecureStore.setItemAsync(TOKEN_KEY, data.token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
      setAdminToken(current || '');
      setToken(data.token);
      setUser(data.user);
    } catch {
      // Ignore quietly as in original
    }
  };

  return (
    <ScreenShell refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={C.brand} />}>
      <ScreenHeader title="Admin Command" subtitle="Manage the entire VetsCue ecosystem" />

      {/* Stats grid */}
      <View style={S.statsGrid}>
        <StatCard label="Users" value={analytics?.totalUsers ?? '—'} icon="people" color={C.brand} />
        <StatCard label="Requests" value={analytics?.totalRequests ?? '—'} icon="document-text" color={C.info} />
        <StatCard label="Pending" value={analytics?.pendingApprovals ?? '—'} icon="time" color={C.warning} />
        <StatCard label="Donations" value={`₹${analytics?.totalDonations ?? '—'}`} icon="heart" color={C.success} />
      </View>

      {/* Tab selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 16 }}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}
      >
        {[
          { key: 'overview', label: '📊 Overview' },
          { key: 'approvals', label: `✅ Approvals (${pending.length})` },
          { key: 'fundraisers', label: `❤️ Fundraisers` },
          { key: 'users', label: `👥 Users` },
          { key: 'rescues', label: `🐾 Rescues` },
        ].map(({ key, label }) => (
          <AnimatedPress
            key={key}
            onPress={() => setActiveTab(key as any)}
            style={[S.chip, activeTab === key && S.chipActive]}
          >
            <Text style={[S.chipText, activeTab === key && S.chipTextActive]}>{label}</Text>
          </AnimatedPress>
        ))}
      </ScrollView>

      {activeTab === 'approvals' &&
        (pending.length === 0 ? (
          <EmptyState icon="checkmark-circle" message="No pending approvals" />
        ) : (
          pending.map((u) => (
            <View key={u._id} style={S.listRow}>
              <View style={S.listRowIcon}>
                <Ionicons name="business" size={16} color={C.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.listRowTitle}>{u.orgName || u.name}</Text>
                <Text style={S.listRowSub}>
                  {u.role} · {u.email}
                </Text>
              </View>
              <AnimatedPress
                onPress={async () => {
                  try {
                    await api.put(`/admin/approve/${u._id}`, { approve: true });
                    load();
                  } catch {
                    // Ignore quietly
                  }
                }}
                style={[S.btnPrimary, { paddingHorizontal: 12, paddingVertical: 8 }]}
              >
                <Ionicons name="checkmark" size={14} color={C.bgMain} />
                <Text style={[S.btnPrimaryText, { fontSize: 12 }]}>Approve</Text>
              </AnimatedPress>
            </View>
          ))
        ))}

      {activeTab === 'fundraisers' &&
        (fundraisers.length === 0 ? (
          <EmptyState icon="heart" message="No fundraisers to review" />
        ) : (
          fundraisers.map((r) => {
            const ngoName = r.assignedNGO?.orgName || r.assignedNGO?.name || 'Assigned NGO';
            const goal = r.fundraiser?.requestedGoal || 0;
            const status = r.fundraiser?.status || 'pending';
            const justification = r.fundraiser?.billText || 'No justification provided.';
            const proofImage = r.fundraiser?.billImage;

            return (
              <SurfaceCard key={r._id}>
                {/* Top Row with NGO and Status */}
                <View style={[S.row, { justifyContent: 'space-between', marginBottom: 12 }]}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={[S.listRowTitle, { fontSize: 16 }]}>{ngoName}</Text>
                    <Text style={[S.listRowSub, { color: C.textMuted }]}>Fundraiser Request</Text>
                  </View>
                  <View
                    style={[
                      S.roleBadge,
                      {
                        backgroundColor:
                          status === 'approved'
                            ? `${C.success}1A`
                            : status === 'rejected'
                            ? `${C.error}1A`
                            : `${C.warning}1A`,
                        borderColor:
                          status === 'approved' ? `${C.success}40` : status === 'rejected' ? `${C.error}40` : `${C.warning}40`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        S.roleBadgeText,
                        {
                          color: status === 'approved' ? C.success : status === 'rejected' ? C.error : C.warning,
                          textTransform: 'uppercase',
                          fontSize: 10,
                        },
                      ]}
                    >
                      {status}
                    </Text>
                  </View>
                </View>

                {/* Animal & Description summary */}
                <View
                  style={{
                    marginBottom: 12,
                    paddingBottom: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: `${C.borderSurface}50`,
                  }}
                >
                  <Text style={[S.listRowTitle, { fontSize: 14, color: C.textMain }]}>Case Description</Text>
                  <Text style={[S.listRowSub, { marginTop: 4, lineHeight: 18 }]}>{r.description}</Text>
                  {r.animalType && (
                    <Text style={[S.listRowSub, { color: C.brand, fontWeight: '700', marginTop: 4 }]}>
                      🐾 {r.animalType.toUpperCase()}
                    </Text>
                  )}
                </View>

                {/* Goal Amount Block */}
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Requested Goal
                  </Text>
                  <Text style={{ fontSize: 24, fontWeight: '900', color: C.warning, marginTop: 2 }}>
                    ₹{goal.toLocaleString('en-IN')}
                  </Text>
                </View>

                {/* Justification Box */}
                <View
                  style={{
                    backgroundColor: `${C.bgMain}80`,
                    borderRadius: 12,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: C.borderSurface,
                    marginBottom: 16,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '800',
                      color: C.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      marginBottom: 4,
                    }}
                  >
                    Justification
                  </Text>
                  <Text style={{ fontSize: 13, color: C.textMain, lineHeight: 18 }}>{justification}</Text>
                </View>

                {/* Proof Image Box */}
                {proofImage ? (
                  <View style={{ marginBottom: 16 }}>
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '800',
                        color: C.textMuted,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        marginBottom: 6,
                      }}
                    >
                      Proof Document
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Image
                        source={{ uri: proofImage }}
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: C.borderSurface,
                          backgroundColor: C.bgMain,
                        }}
                      />
                      <AnimatedPress
                        onPress={() => WebBrowser.openBrowserAsync(proofImage)}
                        style={[S.btnOutline, { flex: 1, height: 44, justifyContent: 'center' }]}
                      >
                        <Ionicons name="eye-outline" size={16} color={C.brand} style={{ marginRight: 6 }} />
                        <Text style={S.btnOutlineText}>View Proof Document</Text>
                      </AnimatedPress>
                    </View>
                  </View>
                ) : null}

                {/* Review actions if pending */}
                {status === 'pending' && (
                  <View style={[S.row, { gap: 12, marginTop: 8 }]}>
                    <AnimatedPress
                      onPress={async () => {
                        try {
                          await api.put(`/admin/rescue/${r._id}/fundraiser/review`, { action: 'reject' });
                          load();
                        } catch {
                          // Ignore quietly
                        }
                      }}
                      style={[S.btnDanger, { flex: 1, height: 44, justifyContent: 'center' }]}
                    >
                      <Ionicons name="close" size={16} color={C.error} style={{ marginRight: 6 }} />
                      <Text style={S.btnDangerText}>Reject</Text>
                    </AnimatedPress>
                    <AnimatedPress
                      onPress={async () => {
                        try {
                          await api.put(`/admin/rescue/${r._id}/fundraiser/review`, { action: 'approve' });
                          load();
                        } catch {
                          // Ignore quietly
                        }
                      }}
                      style={[S.btnPrimary, { flex: 2, height: 44, justifyContent: 'center' }]}
                    >
                      <Ionicons name="checkmark" size={16} color={C.bgMain} style={{ marginRight: 6 }} />
                      <Text style={S.btnPrimaryText}>Approve</Text>
                    </AnimatedPress>
                  </View>
                )}
              </SurfaceCard>
            );
          })
        ))}

      {activeTab === 'users' && (
        <View style={{ gap: 16 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 4 }}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}
          >
            {[
              { key: 'all', label: 'All Users' },
              { key: 'user', label: 'Citizens' },
              { key: 'ngo', label: 'NGOs' },
              { key: 'hospital', label: 'Hospitals' },
              { key: 'ambulance', label: 'Ambulances' },
            ].map(({ key, label }) => (
              <AnimatedPress
                key={key}
                onPress={() => setUserRoleTab(key as any)}
                style={[S.chip, userRoleTab === key && S.chipActive]}
              >
                <Text style={[S.chipText, userRoleTab === key && S.chipTextActive]}>{label}</Text>
              </AnimatedPress>
            ))}
          </ScrollView>
          {users.filter((u) => userRoleTab === 'all' || u.role === userRoleTab).length === 0 ? (
            <EmptyState icon="people" message="No users found" />
          ) : (
            users
              .filter((u) => userRoleTab === 'all' || u.role === userRoleTab)
              .map((u) => (
                <View key={u._id} style={S.listRow}>
                  <View style={S.avatarSmall}>
                    <Text style={S.avatarSmallText}>{u.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={S.listRowTitle}>{u.orgName || u.name}</Text>
                    <Text style={S.listRowSub}>
                      {u.role} · {u.email}
                    </Text>
                  </View>
                  <AnimatedPress
                    onPress={() => impersonate(u._id)}
                    style={[S.btnOutline, { paddingHorizontal: 10, paddingVertical: 8 }]}
                  >
                    <Ionicons name="swap-horizontal" size={14} color={C.brand} />
                    <Text style={[S.btnOutlineText, { fontSize: 12 }]}>Switch</Text>
                  </AnimatedPress>
                </View>
              ))
          )}
        </View>
      )}

      {(activeTab === 'overview' || activeTab === 'rescues') && <AdminRescues />}
    </ScreenShell>
  );
}
