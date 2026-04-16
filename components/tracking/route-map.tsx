import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_DEFAULT } from 'react-native-maps';

import { useTracking } from '@/lib/tracking/tracking-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Radii, StatusColors } from '@/constants/theme';
import {
  getRegionForCoordinates,
  coordinatesToPolyline,
  DARK_MAP_STYLE,
  ACTIVITY_MAP_COLORS,
} from '@/lib/map/map-utils';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import type { LatLng } from '@/lib/map/map-utils';

export function RouteMap() {
  const { state } = useTracking();
  const mapRef = useRef<MapView>(null);
  const [followUser, setFollowUser] = useState(true);
  const scheme = useColorScheme() ?? 'dark';
  const palette = Colors[scheme];
  const recenterBg = useThemeColor({}, 'surfaceContainerHighest');

  const coordinates: LatLng[] = coordinatesToPolyline(state.routePoints);
  const polylineColor =
    ACTIVITY_MAP_COLORS[state.currentActivity] ?? ACTIVITY_MAP_COLORS.running;

  // Skeleton overlay: covers the raw map container while the SDK is warming
  // up. Fades out on `onMapReady` (fires on both Apple Maps iOS and Google
  // Maps Android), so the user never sees a blank/flickering map.
  const [ready, setReady] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (ready) {
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 320,
        useNativeDriver: true,
      }).start();
    }
  }, [ready, overlayOpacity]);

  // Auto-follow user position
  useEffect(() => {
    if (followUser && state.currentLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: state.currentLocation.latitude,
          longitude: state.currentLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        300,
      );
    }
  }, [state.currentLocation, followUser]);

  const initialRegion = state.currentLocation
    ? {
        latitude: state.currentLocation.latitude,
        longitude: state.currentLocation.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }
    : getRegionForCoordinates(coordinates);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsPointsOfInterest={false}
        showsTraffic={false}
        userInterfaceStyle={scheme}
        customMapStyle={scheme === 'dark' ? DARK_MAP_STYLE : []}
        onPanDrag={() => setFollowUser(false)}
        onMapReady={() => setReady(true)}
      >
        {/* Route polyline — segment-colored */}
        {coordinates.length >= 2 && (
          <Polyline
            coordinates={coordinates}
            strokeWidth={5}
            strokeColor={polylineColor}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Start marker — Cyber Blue "begin" point */}
        {coordinates.length > 0 && (
          <Marker coordinate={coordinates[0]} title="Start" anchor={{ x: 0.5, y: 0.5 }}>
            <View style={[styles.startMarker, { backgroundColor: palette.secondary }]}>
              <View style={styles.startMarkerInner} />
            </View>
          </Marker>
        )}

        {/* Current position marker — Electric Lime dot with a static halo.
            Note: we intentionally keep the inner view static and set
            `tracksViewChanges={false}`. On iOS, MapKit caches a marker's view
            as a snapshot; when the Marker has a continuously-animated child
            the cache keeps getting invalidated and the rendered bitmap can
            detach from the coordinate — the dot pops to (0,0) until a pan
            triggers a re-layout. Static view + tracksViewChanges=false keeps
            the snapshot pinned to the coordinate. */}
        {state.currentLocation && (
          <Marker
            coordinate={state.currentLocation}
            anchor={{ x: 0.5, y: 0.5 }}
            title="Current"
            tracksViewChanges={false}
          >
            <View style={styles.currentMarkerWrap}>
              <View
                style={[
                  styles.currentMarkerHalo,
                  { backgroundColor: `${StatusColors.active}33` },
                ]}
              />
              <View
                style={[
                  styles.currentMarkerCore,
                  {
                    backgroundColor: StatusColors.active,
                    borderColor: palette.surface,
                  },
                ]}
              />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Loading skeleton — covers the full-bleed map until tiles draw */}
      <Animated.View
        pointerEvents={ready ? 'none' : 'auto'}
        style={[StyleSheet.absoluteFillObject, { opacity: overlayOpacity }]}
      >
        <Skeleton width="100%" radius="sm" style={styles.skeletonFill} />
      </Animated.View>

      {/* Re-center button — tonal surface, no shadow */}
      {!followUser && (
        <Pressable
          style={[styles.recenterButton, { backgroundColor: recenterBg }]}
          onPress={() => setFollowUser(true)}
          accessibilityRole="button"
          accessibilityLabel="Re-center map on current location"
        >
          <Icon name="recenter" size={20} color="onSurface" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  skeletonFill: {
    flex: 1,
  },
  currentMarkerWrap: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentMarkerHalo: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: Radii.full,
  },
  currentMarkerCore: {
    width: 14,
    height: 14,
    borderRadius: Radii.full,
    borderWidth: 2.5,
  },
  startMarker: {
    width: 18,
    height: 18,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startMarkerInner: {
    width: 6,
    height: 6,
    borderRadius: Radii.full,
    backgroundColor: '#ffffff',
  },
  recenterButton: {
    position: 'absolute',
    bottom: 48,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
