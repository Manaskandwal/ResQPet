import React, { useState, useEffect } from 'react';
import { RefreshControl, StyleSheet, Text, View, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../themes';
import { spacing, borderRadius, typography } from '../../themes/tokens';
import { useNavigation } from '../../navigation/navigation';
import Screen from '../../components/Screen';
import Card from '../../components/ui/Card';
import { AnimatedPress } from '../../components/AnimatedPress';

interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
  ipAddress: string;
  severity: 'low' | 'medium' | 'high';
}

export function AuditLogsScreen() {
  const colors = useColors();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  const mockLogs = (): AuditLog[] => [
    {
      id: '1',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      actor: 'Admin (System)',
      action: 'IMPERSONATE_USER',
      details: 'Impersonated NGO partner: "Save Our Paws" (ID: 64b8a1c9)',
      ipAddress: '103.22.45.19',
      severity: 'medium',
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      actor: 'Admin (System)',
      action: 'APPROVE_ORGANIZATION',
      details: 'Approved clinical license for: "Capital Pet Hospital"',
      ipAddress: '103.22.45.19',
      severity: 'high',
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      actor: 'System Worker',
      action: 'AUTO_AMBULANCE_ROUTING',
      details: 'Assigned ambulance #DL-03-999 to active trauma report #748',
      ipAddress: '127.0.0.1',
      severity: 'low',
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 1000 * 3600 * 2.2).toISOString(),
      actor: 'Admin (System)',
      action: 'OVERRIDE_RESCUE_STATUS',
      details: 'Manually changed status of Rescue #1102 from "assigned_ambulance" to "completed"',
      ipAddress: '103.22.45.19',
      severity: 'medium',
    },
    {
      id: '5',
      timestamp: new Date(Date.now() - 1000 * 3600 * 4).toISOString(),
      actor: 'Admin (System)',
      action: 'APPROVE_FUNDRAISER',
      details: 'Approved fundraiser target ₹18,000 for Stray dog bone fracture surgery #920',
      ipAddress: '103.22.45.22',
      severity: 'high',
    },
    {
      id: '6',
      timestamp: new Date(Date.now() - 1000 * 3600 * 12).toISOString(),
      actor: 'System Cron',
      action: 'GARBAGE_COLLECTION',
      details: 'Cleared 4,209 cached telemetry locations (older than 48 hours)',
      ipAddress: '127.0.0.1',
      severity: 'low',
    },
  ];

  const fetchLogs = () => {
    setLoading(true);
    setTimeout(() => {
      setLogs(mockLogs());
      setLoading(false);
    }, 400);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchLogs} tintColor={colors.primary} />
      }
      title="Security Audits"
      subtitle="Complete chronological logs of administrative overrides and telemetry events"
      style={{ backgroundColor: colors.background.primary }}
    >
      {/* Back button */}
      <View style={styles.headerNav}>
        <AnimatedPress onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={[styles.backBtnText, { color: colors.primary }]}>Dashboard</Text>
        </AnimatedPress>
      </View>

      {/* Terminal View Card */}
      <Card variant="glass" style={styles.terminalCard}>
        <View style={styles.terminalHeader}>
          <View style={styles.terminalDots}>
            <View style={[styles.dot, { backgroundColor: '#ff5f56' }]} />
            <View style={[styles.dot, { backgroundColor: '#ffbd2e' }]} />
            <View style={[styles.dot, { backgroundColor: '#27c93f' }]} />
          </View>
          <Text style={styles.terminalTitle}>SEC_AUDIT.LOG (Live Stream)</Text>
        </View>

        <View style={styles.logStream}>
          {logs.map((log) => {
            const timeStr = new Date(log.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });
            const sevColor =
              log.severity === 'high'
                ? colors.error
                : log.severity === 'medium'
                ? colors.warning
                : colors.success;

            return (
              <View key={log.id} style={styles.logItem}>
                <View style={styles.logLineOne}>
                  <Text style={[styles.logTime, { color: colors.text.muted }]}>[{timeStr}]</Text>
                  <Text style={[styles.logTag, { color: sevColor }]}>
                    [{log.action}]
                  </Text>
                  <Text style={[styles.logIp, { color: colors.text.muted }]}>
                    ({log.ipAddress})
                  </Text>
                </View>
                <Text style={[styles.logDetails, { color: colors.text.primary }]}>
                  {log.details}
                </Text>
                <Text style={[styles.logActor, { color: colors.primary }]}>
                  &gt; Actor: {log.actor}
                </Text>
              </View>
            );
          })}
        </View>
      </Card>
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
  terminalCard: {
    padding: 0,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: '#0a0a0c',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  terminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    backgroundColor: '#121216',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.02)',
  },
  terminalDots: {
    flexDirection: 'row',
    gap: 6,
    marginRight: spacing[4],
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  terminalTitle: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#a0a0b0',
  },
  logStream: {
    padding: spacing[4],
    gap: spacing[4],
  },
  logItem: {
    gap: 4,
  },
  logLineOne: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  logTime: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  logTag: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  logIp: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  logDetails: {
    fontSize: 12.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 16,
  },
  logActor: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});

export default AuditLogsScreen;
