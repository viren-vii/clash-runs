export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export const STORAGE_KEYS = {
  syncedSessions: 'api.syncedSessions',
} as const;
