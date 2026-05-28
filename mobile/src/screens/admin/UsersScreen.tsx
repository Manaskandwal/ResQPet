import React, { useEffect, useState, useCallback } from 'react';
import { RefreshControl, StyleSheet, Text, View, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useColors } from '../../themes';
import { spacing, borderRadius, typography } from '../../themes/tokens';
import { api, setApiToken, TOKEN_KEY, ADMIN_TOKEN_KEY, USER_KEY } from '../../services/api';
import { useNavigation } from '../../navigation/navigation';
import Screen from '../../components/Screen';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { AnimatedPress } from '../../components/AnimatedPress';
import { User } from '../../types';

interface UsersScreenProps {
  setToken: (t: string) => void;
  setAdminToken: (t: string) => void;
  setUser: (u: any) => void;
}

type RoleTab = 'all' | 'user' | 'ngo' | 'hospital' | 'ambulance';

export function UsersScreen({ setToken, setAdminToken, setUser }: UsersScreenProps) {
  const colors = useColors();
  const navigation = useNavigation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<RoleTab>('all');
  const [switching, setSwitching] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users?limit=50');
      setUsers(data.users || []);
    } catch (e) {
      // Quietly ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleImpersonate = async (userId: string, name: string) => {
    setSwitching(userId);
    try {
      const currentToken = await SecureStore.getItemAsync(TOKEN_KEY);
      const { data } = await api.post('/auth/impersonate', { userId });
      
      setApiToken(data.token);
      if (currentToken) {
        await SecureStore.setItemAsync(ADMIN_TOKEN_KEY, currentToken);
        setAdminToken(currentToken);
      }
      await SecureStore.setItemAsync(TOKEN_KEY, data.token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
      
      setToken(data.token);
      setUser(data.user);
      
      Alert.alert('Ecosystem Swap', `Successfully switched context to ${name}.`);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to switch context.');
    } finally {
      setSwitching(null);
    }
  };

  // Filter users based on tab and search query
  const filteredUsers = users.filter((u) => {
    const matchesTab = activeTab === 'all' || u.role === activeTab;
    const matchesSearch =
      (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.orgName || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchUsers} tintColor={colors.primary} />
      }
      title="User Management"
      subtitle="Audit active user accounts and perform secure impersonation swaps"
      style={{ backgroundColor: colors.background.primary }}
    >
      {/* Back button */}
      <View style={styles.headerNav}>
        <AnimatedPress onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={[styles.backBtnText, { color: colors.primary }]}>Dashboard</Text>
        </AnimatedPress>
      </View>

      {/* Search Input */}
      <Input
        placeholder="Search by name, organization or email..."
        value={search}
        onChangeText={setSearch}
        icon="search-outline"
        style={{ marginBottom: spacing[3] }}
      />

      {/* Role Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={{ gap: spacing[2], paddingHorizontal: 2 }}
      >
        {([
          { key: 'all', label: '👥 All accounts' },
          { key: 'user', label: '🙋 Citizens' },
          { key: 'ngo', label: '🤝 NGOs' },
          { key: 'hospital', label: '🏥 Hospitals' },
          { key: 'ambulance', label: '🚑 Fleet Drivers' },
        ] as { key: RoleTab; label: string }[]).map(({ key, label }) => (
          <AnimatedPress
            key={key}
            onPress={() => setActiveTab(key)}
            style={[
              styles.tabChip,
              { backgroundColor: colors.background.secondary },
              activeTab === key && { backgroundColor: `${colors.primary}20`, borderColor: colors.primary, borderWidth: 1 },
            ]}
          >
            <Text
              style={[
                styles.tabChipText,
                { color: colors.text.secondary },
                activeTab === key && { color: colors.primary, fontFamily: typography.fontFamily.bold },
              ]}
            >
              {label}
            </Text>
          </AnimatedPress>
        ))}
      </ScrollView>

      {/* Listing */}
      {filteredUsers.length > 0 ? (
        <View style={styles.listContainer}>
          {filteredUsers.map((item) => {
            const initial = (item.name || item.orgName || 'U').charAt(0).toUpperCase();
            return (
              <Card key={item._id} variant="default" style={styles.userCard}>
                <View style={styles.cardLayout}>
                  {/* Initial Avatar */}
                  <View style={[styles.avatar, { backgroundColor: `${colors.primary}10` }]}>
                    <Text style={[styles.avatarText, { color: colors.primary }]}>{initial}</Text>
                  </View>

                  {/* Profile info */}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.userName, { color: colors.text.primary }]}>
                      {item.orgName || item.name}
                    </Text>
                    <View style={styles.subMeta}>
                      <Text style={[styles.userRole, { color: colors.primary }]}>
                        {item.role.toUpperCase()}
                      </Text>
                      <Text style={[styles.metaDot, { color: colors.text.muted }]}>•</Text>
                      <Text style={[styles.userEmail, { color: colors.text.secondary }]} numberOfLines={1}>
                        {item.email}
                      </Text>
                    </View>
                  </View>

                  {/* Swap Button */}
                  <Button
                    variant="outlined"
                    size="small"
                    loading={switching === item._id}
                    onPress={() => handleImpersonate(item._id, item.orgName || item.name || 'User')}
                    icon={<Ionicons name="swap-horizontal" size={14} color={colors.primary} />}
                  >
                    Switch
                  </Button>
                </View>
              </Card>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={{ color: colors.text.secondary, textAlign: 'center' }}>
            No accounts found matching your filters.
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
  tabsScroll: {
    marginBottom: spacing[4],
  },
  tabChip: {
    paddingHorizontal: spacing[3.5],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.full,
  },
  tabChipText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.regular,
  },
  listContainer: {
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  userCard: {
    padding: spacing[3.5],
  },
  cardLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
  },
  userName: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
  },
  subMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    marginTop: 2,
  },
  userRole: {
    fontSize: 10,
    fontFamily: typography.fontFamily.extraBold,
    letterSpacing: 0.5,
  },
  metaDot: {
    fontSize: 10,
  },
  userEmail: {
    fontSize: 11,
    flex: 1,
  },
  emptyContainer: {
    paddingVertical: spacing[12],
  },
});

export default UsersScreen;
