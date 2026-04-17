import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { Platform } from 'react-native';
import { createClient } from '@viren-vii/api';
import { API_BASE_URL, STORAGE_KEYS } from './config';

type Platforms = 'ios' | 'android' | 'unknown';

function currentPlatform(): Platforms {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'unknown';
}

async function getOrCreateDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(STORAGE_KEYS.deviceId);
  if (existing) return existing;
  const id = randomUUID();
  await AsyncStorage.setItem(STORAGE_KEYS.deviceId, id);
  return id;
}

async function getCachedToken(): Promise<string | null> {
  const [token, expiresAtStr] = await Promise.all([
    AsyncStorage.getItem(STORAGE_KEYS.token),
    AsyncStorage.getItem(STORAGE_KEYS.tokenExpiresAt),
  ]);
  if (!token || !expiresAtStr) return null;
  // Server returns expiresAt in milliseconds (see clash-runs-server/src/lib/jwt.ts).
  const expiresAtMs = Number(expiresAtStr);
  if (!Number.isFinite(expiresAtMs) || Date.now() >= expiresAtMs - 60_000) {
    return null;
  }
  return token;
}

let inflight: Promise<string> | null = null;

async function fetchFreshToken(): Promise<string> {
  const deviceId = await getOrCreateDeviceId();
  const bootstrap = createClient({ baseUrl: API_BASE_URL });
  const res = await bootstrap.auth.registerDevice({
    deviceId,
    platform: currentPlatform(),
  });
  await Promise.all([
    AsyncStorage.setItem(STORAGE_KEYS.token, res.token),
    AsyncStorage.setItem(STORAGE_KEYS.tokenExpiresAt, String(res.expiresAt)),
    AsyncStorage.setItem(STORAGE_KEYS.userId, res.userId),
  ]);
  return res.token;
}

export async function getToken(): Promise<string> {
  const cached = await getCachedToken();
  if (cached) return cached;
  if (!inflight) {
    inflight = fetchFreshToken().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

export async function clearAuth(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(STORAGE_KEYS.token),
    AsyncStorage.removeItem(STORAGE_KEYS.tokenExpiresAt),
    AsyncStorage.removeItem(STORAGE_KEYS.userId),
  ]);
}
