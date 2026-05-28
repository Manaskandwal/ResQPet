import React, { useEffect, useState, useCallback } from 'react';
import { Image, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../themes';
import { spacing, borderRadius, typography } from '../../themes/tokens';
import { api } from '../../services/api';
import Screen from '../../components/Screen';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';

export function ImpactFeedScreen() {
  const colors = useColors();
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/rescue/impact/feed');
      setStories(data.feed || []);
    } catch (e) {
      // Quietly ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });
  };

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchFeed} tintColor={colors.primary} />
      }
      title="Impact Stories"
      subtitle="See the direct results of your contributions & alerts"
      style={{ backgroundColor: colors.background.primary }}
    >
      {stories.length > 0 ? (
        <View style={styles.listContainer}>
          {stories.map((story) => (
            <Card key={story._id} variant="default" style={styles.storyCard}>
              {/* Header */}
              <View style={styles.cardHeader}>
                <View style={[styles.avatarRound, { backgroundColor: `${colors.primary}20` }]}>
                  <Text style={[styles.avatarText, { color: colors.primary }]}>
                    {story.helperName?.charAt(0).toUpperCase() || '🐾'}
                  </Text>
                </View>
                <View>
                  <Text style={[styles.authorName, { color: colors.text.primary }]}>
                    Helped by {story.helperName || 'Anonymous Rescuer'}
                  </Text>
                  <Text style={[styles.dateText, { color: colors.text.muted }]}>
                    Rescue logged on {formatDate(story.createdAt)}
                  </Text>
                </View>
              </View>

              {/* Before/After Gallery Split */}
              <View style={styles.gallerySplit}>
                {story.beforeImage && (
                  <View style={styles.galleryCard}>
                    <Image source={{ uri: story.beforeImage }} style={styles.galleryImage} />
                    <View style={[styles.galleryLabel, { backgroundColor: colors.error }]}>
                      <Text style={styles.galleryLabelText}>Before</Text>
                    </View>
                  </View>
                )}
                {story.afterImage && (
                  <View style={styles.galleryCard}>
                    <Image source={{ uri: story.afterImage }} style={styles.galleryImage} />
                    <View style={[styles.galleryLabel, { backgroundColor: colors.success }]}>
                      <Text style={styles.galleryLabelText}>Recovered</Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Content Text */}
              <Text style={[styles.summaryText, { color: colors.text.primary }]}>
                {story.afterSummary || story.description}
              </Text>
            </Card>
          ))}
        </View>
      ) : (
        <EmptyState
          icon="sparkles-outline"
          title="Impact Feed Loading"
          message="Success stories and animal recovery logs will populate here as responders update completed cases."
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    gap: spacing[4],
  },
  storyCard: {
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    gap: spacing[3],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  avatarRound: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bold,
  },
  authorName: {
    fontSize: 13,
    fontFamily: typography.fontFamily.bold,
  },
  dateText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    marginTop: 2,
  },
  gallerySplit: {
    flexDirection: 'row',
    gap: spacing[2.5],
    height: 120,
    marginTop: spacing[1],
  },
  galleryCard: {
    flex: 1,
    position: 'relative',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  galleryLabel: {
    position: 'absolute',
    bottom: spacing[2],
    left: spacing[2],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: borderRadius.sm,
  },
  galleryLabelText: {
    fontSize: 9,
    fontFamily: typography.fontFamily.extraBold,
    color: '#0e0e0e',
    textTransform: 'uppercase',
  },
  summaryText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: typography.fontFamily.regular,
  },
});

export default ImpactFeedScreen;
