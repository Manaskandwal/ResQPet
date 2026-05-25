import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { api } from '../services/api';
import { C, S, compactDate } from '../styles/theme';
import { AnimatedPress } from '../components/AnimatedPress';
import {
  ScreenShell,
  ScreenHeader,
  SurfaceCard,
  EmptyState,
} from '../components/SharedComponents';

export default function NotificationsScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setData(res.data);
    } catch {
      // Ignore load error quietly as in original
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  return (
    <ScreenShell refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={C.brand} />}>
      <View style={S.row}>
        <ScreenHeader title="Notifications" subtitle={`${data?.unreadCount ?? 0} unread`} />
        <AnimatedPress
          onPress={async () => {
            try {
              await api.put('/notifications/read-all');
              load();
            } catch (e) {
              // Ignore quietly as in original
            }
          }}
          style={[S.btnOutline, { alignSelf: 'center', marginTop: 0 }]}
        >
          <Ionicons name="checkmark-done" size={16} color={C.brand} />
          <Text style={S.btnOutlineText}>Mark all read</Text>
        </AnimatedPress>
      </View>

      {(data?.notifications || []).length === 0 ? (
        <EmptyState icon="notifications-off" message="All clear — no notifications" />
      ) : (
        <SurfaceCard>
          {(data?.notifications || []).map((n: any, i: number) => (
            <View key={n._id}>
              <TouchableOpacity
                onPress={async () => {
                  try {
                    await api.put(`/notifications/${n._id}/read`);
                    load();
                  } catch (e) {
                    // Ignore quietly as in original
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={[S.notifRow, !n.isRead && S.notifRowUnread]}>
                  <View style={[S.listRowIcon, { backgroundColor: n.isRead ? C.bgHover : `${C.brand}20` }]}>
                    <Ionicons
                      name={n.isRead ? 'notifications-outline' : 'notifications'}
                      size={18}
                      color={n.isRead ? C.textMuted : C.brand}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[S.listRowTitle, !n.isRead && { color: C.textMain }]}>{n.title}</Text>
                    <Text style={S.listRowSub} numberOfLines={2}>{n.message}</Text>
                    <Text style={[S.listRowSub, { marginTop: 2 }]}>{compactDate(n.createdAt)}</Text>
                  </View>
                  {!n.isRead && <View style={S.unreadDot} />}
                </View>
              </TouchableOpacity>
              {i < (data?.notifications || []).length - 1 && <View style={S.separator} />}
            </View>
          ))}
        </SurfaceCard>
      )}
    </ScreenShell>
  );
}
