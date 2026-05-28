import React, { useEffect, useState, useCallback } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../themes';
import { spacing, borderRadius, typography } from '../../themes/tokens';
import { api } from '../../services/api';
import Screen from '../../components/Screen';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import { AnimatedPress } from '../../components/AnimatedPress';

export function NotificationsScreen() {
  const colors = useColors();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/user/notifications');
      setNotifications(data.notifications || []);
    } catch (e) {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.put(`/user/notifications/${id}/read`);
      // Update local state directly
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (e) {
      // Quietly ignore
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/user/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      // Quietly ignore
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/user/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (e) {
      // Quietly ignore
    }
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchNotifications} tintColor={colors.primary} />
      }
      title="Notifications"
      subtitle="Stay updated on your reported cases and sponsored aid"
      style={{ backgroundColor: colors.background.primary }}
    >
      {/* Mark all as read button */}
      {notifications.length > 0 && hasUnread && (
        <View style={styles.headerActionRow}>
          <Button variant="outlined" size="small" onPress={handleMarkAllAsRead}>
            Mark All as Read
          </Button>
        </View>
      )}

      {/* Notifications Ledger */}
      {notifications.length > 0 ? (
        <View style={styles.listContainer}>
          {notifications.map((n) => (
            <AnimatedPress
              key={n._id}
              onPress={() => !n.isRead && handleMarkAsRead(n._id)}
              style={[
                styles.notifCard,
                {
                  backgroundColor: n.isRead ? colors.background.secondary : `${colors.primary}08`,
                  borderColor: n.isRead ? colors.border.secondary : `${colors.primary}25`,
                },
              ]}
            >
              <View style={styles.row}>
                {/* Unread Indicator */}
                {!n.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}

                {/* Left Icon */}
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: n.isRead ? `${colors.text.muted}15` : `${colors.primary}15` },
                  ]}
                >
                  <Ionicons
                    name={n.isRead ? 'mail-open-outline' : 'mail'}
                    size={16}
                    color={n.isRead ? colors.text.muted : colors.primary}
                  />
                </View>

                {/* Content */}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, { color: colors.text.primary }]}>{n.title || 'Case Alert'}</Text>
                  <Text style={[styles.message, { color: colors.text.secondary }]}>{n.message}</Text>
                  <Text style={[styles.time, { color: colors.text.muted }]}>{formatTime(n.createdAt)}</Text>
                </View>

                {/* Close Button */}
                <AnimatedPress onPress={() => handleDelete(n._id)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={16} color={colors.text.muted} />
                </AnimatedPress>
              </View>
            </AnimatedPress>
          ))}
        </View>
      ) : (
        <EmptyState
          icon="notifications-outline"
          title="All Caught Up"
          message="Your inbox is completely clear. You'll receive real-time notifications when NGOs accept cases."
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerActionRow: {
    alignItems: 'flex-end',
    marginBottom: spacing[3],
  },
  listContainer: {
    gap: spacing[2.5],
    marginBottom: spacing[6],
  },
  notifCard: {
    padding: spacing[3.5],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    top: 2,
    left: 2,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  title: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
  },
  message: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
    marginTop: 2,
    lineHeight: 16,
  },
  time: {
    fontSize: 10,
    fontFamily: typography.fontFamily.regular,
    marginTop: 4,
  },
  deleteBtn: {
    padding: spacing[1],
  },
});

export default NotificationsScreen;
