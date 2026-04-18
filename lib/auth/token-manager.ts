import * as SecureStore from 'expo-secure-store';

const KEYS = {
  accessToken: 'auth.accessToken',
  refreshToken: 'auth.refreshToken',
  user: 'auth.user',
} as const;

function decodeTokenExpiry(token: string): number | null {
  try {
    const [, payloadB64] = token.split('.');
    if (!payloadB64) return null;
    const base64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const decoded =
      typeof atob === 'function'
        ? atob(padded)
        : Buffer.from(padded, 'base64').toString('utf-8');
    const payload = JSON.parse(decoded) as { exp?: unknown };
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export async function saveTokens(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.accessToken, accessToken),
    SecureStore.setItemAsync(KEYS.refreshToken, refreshToken),
  ]);
}

export async function saveUser(user: object): Promise<void> {
  await SecureStore.setItemAsync(KEYS.user, JSON.stringify(user));
}

export async function getAccessToken(): Promise<string | null> {
  const token = await SecureStore.getItemAsync(KEYS.accessToken);
  if (!token) return null;
  const expiresAtMs = decodeTokenExpiry(token);
  if (expiresAtMs === null || Date.now() >= expiresAtMs - 60_000) return null;
  return token;
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.refreshToken);
}

export async function getUser<T = unknown>(): Promise<T | null> {
  const raw = await SecureStore.getItemAsync(KEYS.user);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.accessToken),
    SecureStore.deleteItemAsync(KEYS.refreshToken),
    SecureStore.deleteItemAsync(KEYS.user),
  ]);
}
