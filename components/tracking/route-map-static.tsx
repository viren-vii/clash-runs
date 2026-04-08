import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
  getRegionForCoordinates,
  coordinatesToPolyline,
  ACTIVITY_COLORS,
} from '@/lib/map/map-utils';
import type { RoutePoint } from '@/lib/types';

interface RouteMapStaticProps {
  routePoints: RoutePoint[];
  height?: number;
}

export function RouteMapStatic({
  routePoints,
  height = 150,
}: RouteMapStaticProps) {
  const coordinates = coordinatesToPolyline(routePoints);
  const region = getRegionForCoordinates(coordinates);
  const placeholderBg = useThemeColor(
    { light: '#E0E0E0', dark: '#3A3A3C' },
    'background',
  );

  if (coordinates.length < 2) {
    return (
      <View style={[styles.placeholder, { height, backgroundColor: placeholderBg }]} />
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
        liteMode // Android: renders as a static image for performance
      >
        <Polyline
          coordinates={coordinates}
          strokeWidth={3}
          strokeColor={ACTIVITY_COLORS.running}
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  placeholder: {
    borderRadius: 12,
  },
});
