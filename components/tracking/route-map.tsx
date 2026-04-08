import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Pressable, Text, useColorScheme } from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useTracking } from '@/lib/tracking/tracking-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
  getRegionForCoordinates,
  coordinatesToPolyline,
  ACTIVITY_COLORS,
} from '@/lib/map/map-utils';
import type { LatLng } from '@/lib/map/map-utils';

export function RouteMap() {
  const { state } = useTracking();
  const mapRef = useRef<MapView>(null);
  const [followUser, setFollowUser] = useState(true);
  const colorScheme = useColorScheme();
  const recenterBg = useThemeColor(
    { light: '#ffffff', dark: '#2C2C2E' },
    'background',
  );
  const recenterIconColor = useThemeColor(
    { light: '#4285F4', dark: '#6AB1F7' },
    'tint',
  );

  const coordinates: LatLng[] = coordinatesToPolyline(state.routePoints);

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
        onPanDrag={() => setFollowUser(false)}
      >
        {/* Route polyline */}
        {coordinates.length >= 2 && (
          <Polyline
            coordinates={coordinates}
            strokeWidth={4}
            strokeColor={ACTIVITY_COLORS.running}
          />
        )}

        {/* Start marker */}
        {coordinates.length > 0 && (
          <Marker
            coordinate={coordinates[0]}
            title="Start"
            pinColor="green"
          />
        )}

        {/* Current position marker */}
        {state.currentLocation && (
          <Marker
            coordinate={state.currentLocation}
            title="Current"
          >
            <View style={styles.currentMarker}>
              <View style={styles.currentMarkerInner} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Re-center button */}
      {!followUser && (
        <Pressable
          style={[
            styles.recenterButton,
            {
              backgroundColor: recenterBg,
              shadowColor: colorScheme === 'dark' ? '#000' : '#666',
            },
          ]}
          onPress={() => setFollowUser(true)}
          accessibilityRole="button"
          accessibilityLabel="Re-center map on current location"
        >
          <Text style={[styles.recenterText, { color: recenterIconColor }]}>
            ⦿
          </Text>
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
  currentMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(66, 133, 244, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4285F4',
    borderWidth: 2,
    borderColor: '#fff',
  },
  recenterButton: {
    position: 'absolute',
    bottom: 48,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  recenterText: {
    fontSize: 20,
  },
});
