import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import MapView, { Polyline, PROVIDER_DEFAULT } from 'react-native-maps';

import { useThemeColor } from '@/hooks/use-theme-color';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Radii } from '@/constants/theme';
import {
  getRegionForCoordinates,
  coordinatesToPolyline,
  ACTIVITY_MAP_COLORS,
  DARK_MAP_STYLE,
} from '@/lib/map/map-utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { RoutePoint, SegmentActivityType } from '@/lib/types';

interface RouteMapStaticProps {
  routePoints: RoutePoint[];
  height?: number;
  activityType?: SegmentActivityType;
}

/**
 * Non-interactive preview map. Renders the full route polyline with the
 * activity-appropriate color and the dark-tile style on dark mode.
 */
export function RouteMapStatic({
  routePoints,
  height = 150,
  activityType = 'running',
}: RouteMapStaticProps) {
  const coordinates = coordinatesToPolyline(routePoints);
  const region = getRegionForCoordinates(coordinates);
  const scheme = useColorScheme() ?? 'dark';
  const palette = Colors[scheme];
  const placeholderBg = useThemeColor({}, 'surfaceContainerHigh');
  const polylineColor =
    ACTIVITY_MAP_COLORS[activityType] ?? ACTIVITY_MAP_COLORS.running;

  // Skeleton overlay fades out when `onMapReady` fires. iOS Apple Maps fires
  // this once the MapKit view is rendered; Android Google Maps fires once the
  // SurfaceView has attached. Tiles may still stream in briefly after ready.
  const [ready, setReady] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (ready) {
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }).start();
    }
  }, [ready, overlayOpacity]);

  if (coordinates.length < 2) {
    return (
      <View
        style={[
          styles.placeholder,
          { height, backgroundColor: placeholderBg },
        ]}
      />
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        region={region}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        showsPointsOfInterest={false}
        showsTraffic={false}
        userInterfaceStyle={scheme}
        customMapStyle={scheme === 'dark' ? DARK_MAP_STYLE : []}
        liteMode // Android: renders as a static image for performance
        onMapReady={() => setReady(true)}
      >
        <Polyline
          coordinates={coordinates}
          strokeWidth={4}
          strokeColor={polylineColor}
          lineCap="round"
          lineJoin="round"
        />
      </MapView>
      {/* Loading skeleton — covers the map until tiles draw */}
      <Animated.View
        pointerEvents={ready ? 'none' : 'auto'}
        style={[StyleSheet.absoluteFillObject, { opacity: overlayOpacity }]}
      >
        <Skeleton width="100%" height={height} radius="lg" />
      </Animated.View>
      {/* Subtle vignette overlay to blend map edges into the card */}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          { borderRadius: Radii.lg, borderWidth: 0 },
          { backgroundColor: `${palette.surface}00` },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radii.lg,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  placeholder: {
    borderRadius: Radii.lg,
  },
});
