import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface PermissionsStatus {
  foregroundLocation: boolean;
  backgroundLocation: boolean;
}

export async function requestForegroundLocation(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function requestBackgroundLocation(): Promise<boolean> {
  // Must have foreground permission first
  const foreground = await requestForegroundLocation();
  if (!foreground) return false;

  const { status } = await Location.requestBackgroundPermissionsAsync();
  return status === 'granted';
}

export async function checkAllPermissions(): Promise<PermissionsStatus> {
  const foreground = await Location.getForegroundPermissionsAsync();
  const background = await Location.getBackgroundPermissionsAsync();

  return {
    foregroundLocation: foreground.status === 'granted',
    backgroundLocation: background.status === 'granted',
  };
}

export async function requestAllTrackingPermissions(): Promise<PermissionsStatus> {
  const foregroundGranted = await requestForegroundLocation();
  let backgroundGranted = false;

  if (foregroundGranted) {
    backgroundGranted = await requestBackgroundLocation();
  }

  return {
    foregroundLocation: foregroundGranted,
    backgroundLocation: backgroundGranted,
  };
}

/** Returns true if we have minimum permissions needed to start tracking. */
export async function hasMinimumPermissions(): Promise<boolean> {
  const status = await checkAllPermissions();
  // Foreground location is the minimum requirement
  return status.foregroundLocation;
}
