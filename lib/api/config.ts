export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export const STORAGE_KEYS = {
  deviceId: 'api.deviceId',
  token: 'api.token',
  tokenExpiresAt: 'api.tokenExpiresAt',
  userId: 'api.userId',
  syncedSessions: 'api.syncedSessions',
} as const;
