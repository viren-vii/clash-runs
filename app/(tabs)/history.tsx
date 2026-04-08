import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { getAllSessions } from '@/lib/database/sessions-repository';
import { getRoutePoints } from '@/lib/database/route-repository';
import { SessionCard } from '@/components/sessions/session-card';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { Session, RoutePoint } from '@/lib/types';

interface SessionWithRoute {
  session: Session;
  routePoints: RoutePoint[];
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const textColor = useThemeColor({}, 'text');
  const bgColor = useThemeColor({}, 'background');
  const subtleColor = useThemeColor({}, 'icon');

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

  // Reload when tab is focused
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
          { paddingTop: insets.top + 16 },
        ]}
        ListHeaderComponent={
          <Text style={[styles.title, { color: textColor }]}>History</Text>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: subtleColor }]}>
              No completed activities yet.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <SessionCard
            session={item.session}
            routePoints={item.routePoints}
          />
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
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 24,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
