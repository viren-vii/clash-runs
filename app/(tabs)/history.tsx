import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { getAllSessions } from '@/lib/database/sessions-repository';
import { getRoutePoints } from '@/lib/database/route-repository';
import { SessionCard } from '@/components/sessions/session-card';
import { ThemedText } from '@/components/themed-text';
import { EmptyState } from '@/components/ui/empty-state';
import { useThemeColor } from '@/hooks/use-theme-color';
import { PageInsets, Spacing } from '@/constants/theme';
import type { Session, RoutePoint } from '@/lib/types';

interface SessionWithRoute {
  session: Session;
  routePoints: RoutePoint[];
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const bgColor = useThemeColor({}, 'surface');

  const [sessions, setSessions] = useState<SessionWithRoute[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadSessions = useCallback(async () => {
    try {
      const allSessions = await getAllSessions();
      const withRoutes = await Promise.all(
        allSessions.map(async (session) => ({
          session,
          routePoints: await getRoutePoints(session.id),
        })),
      );
      setSessions(withRoutes);
    } catch (e) {
      console.error('Failed to load sessions:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [loadSessions]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.session.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          { paddingTop: insets.top + Spacing.lg },
        ]}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        ListHeaderComponent={
          <ThemedText variant="displaySm" color="onSurface" style={styles.title}>
            History
          </ThemedText>
        }
        ListEmptyComponent={
          <EmptyState
            icon="history"
            title="No activities yet"
            description="Complete your first activity and it will appear here."
            style={styles.empty}
          />
        }
        renderItem={({ item }) => (
          <SessionCard session={item.session} routePoints={item.routePoints} />
        )}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingLeft: PageInsets.left,
    paddingRight: PageInsets.right,
    paddingBottom: Spacing['2xl'],
  },
  title: {
    letterSpacing: -0.72,
    marginBottom: Spacing.xl,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
});
