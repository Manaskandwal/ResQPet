import React, { useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, S, compactDate } from '../styles/theme';
import { Rescue } from '../types';
import { StatusPill, SurfaceCard } from './SharedComponents';

interface RescueCardProps {
  rescue: Rescue;
  actions?: React.ReactNode;
}

export function RescueCard({ rescue, actions }: RescueCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <SurfaceCard>
      {/* Header */}
      <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
        <View style={S.rescueCardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={S.listRowTitle} numberOfLines={2}>
              {rescue.description}
            </Text>
            <Text style={S.listRowSub}>{compactDate(rescue.createdAt)}</Text>
          </View>
          <StatusPill status={rescue.status} />
        </View>
      </TouchableOpacity>

      {rescue.images?.[0] && (
        <Image source={{ uri: rescue.images[0] }} style={S.rescueImg} />
      )}

      <View style={S.row}>
        <Ionicons name="location-outline" size={14} color={C.textMuted} />
        <Text style={[S.listRowSub, { flex: 1, marginLeft: 4 }]} numberOfLines={1}>
          {rescue.location?.address ||
            [rescue.location?.lat, rescue.location?.lng].filter(Boolean).join(', ') ||
            'Location attached'}
        </Text>
      </View>

      {!!rescue.estimatedCost && (
        <View>
          <View style={S.progressRow}>
            <Text style={[S.listRowSub, { color: C.brand }]}>
              ₹{rescue.amountRaised || 0} raised
            </Text>
            <Text style={[S.listRowSub, { color: C.warning }]}>
              ₹{rescue.estimatedCost} goal
            </Text>
          </View>
          <View style={S.progressTrack}>
            <View
              style={[
                S.progressFill,
                {
                  width: `${Math.min(
                    ((rescue.amountRaised || 0) / rescue.estimatedCost) * 100,
                    100
                  )}%` as any,
                },
              ]}
            />
          </View>
        </View>
      )}

      {/* Assigned info */}
      {rescue.assignedNGO && (
        <View style={S.row}>
          <Ionicons name="leaf-outline" size={14} color={C.brand} />
          <Text style={[S.listRowSub, { marginLeft: 4 }]}>
            NGO: {rescue.assignedNGO.orgName || rescue.assignedNGO.name}
          </Text>
        </View>
      )}

      {/* Actions */}
      {actions && <View style={S.separator} />}
      {actions}
    </SurfaceCard>
  );
}
