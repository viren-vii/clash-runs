import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken, clearAuth } from '../../../lib/api/auth';
import { STORAGE_KEYS } from '../../../lib/api/config';

jest.mock('@viren-vii/api', () => ({
  createClient: jest.fn(() => ({
    auth: {
      registerDevice: jest.fn().mockResolvedValue({
        token: 'fresh-token',
        userId: 'user-1',
        deviceId: 'test-uuid-1234',
        // Server returns ms (exp * 1000); 7 days in the future.
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      }),
    },
  })),
}));

describe('api/auth.getToken', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('returns a cached token when expiresAt (ms) is still in the future', async () => {
    const futureMs = Date.now() + 10 * 60 * 1000;
    await AsyncStorage.setItem(STORAGE_KEYS.token, 'cached-token');
    await AsyncStorage.setItem(STORAGE_KEYS.tokenExpiresAt, String(futureMs));

    const token = await getToken();
    expect(token).toBe('cached-token');
  });

  it('refreshes when cached token is past the 60s skew window', async () => {
    // Expired 5 seconds ago.
    const pastMs = Date.now() - 5_000;
    await AsyncStorage.setItem(STORAGE_KEYS.token, 'stale-token');
    await AsyncStorage.setItem(STORAGE_KEYS.tokenExpiresAt, String(pastMs));

    const token = await getToken();
    expect(token).toBe('fresh-token');
    expect(await AsyncStorage.getItem(STORAGE_KEYS.token)).toBe('fresh-token');
  });

  it('does NOT treat ms expiresAt as seconds (regression: ms/s mismatch)', async () => {
    // If the client erroneously multiplied expiresAt by 1000, a token that
    // actually expired 5 minutes ago would look like it expires ~1970+far-future
    // and be wrongly reused. Ensure it's refreshed.
    const expiredMs = Date.now() - 5 * 60 * 1000;
    await AsyncStorage.setItem(STORAGE_KEYS.token, 'stale-token');
    await AsyncStorage.setItem(STORAGE_KEYS.tokenExpiresAt, String(expiredMs));

    const token = await getToken();
    expect(token).toBe('fresh-token');
  });

  it('fetches a fresh token and persists deviceId + userId on first call', async () => {
    expect(await AsyncStorage.getItem(STORAGE_KEYS.deviceId)).toBeNull();

    const token = await getToken();

    expect(token).toBe('fresh-token');
    expect(await AsyncStorage.getItem(STORAGE_KEYS.deviceId)).toBe(
      'test-uuid-1234',
    );
    expect(await AsyncStorage.getItem(STORAGE_KEYS.userId)).toBe('user-1');
  });

  it('clearAuth removes token + userId but keeps deviceId', async () => {
    await getToken();
    expect(await AsyncStorage.getItem(STORAGE_KEYS.token)).toBeTruthy();

    await clearAuth();

    expect(await AsyncStorage.getItem(STORAGE_KEYS.token)).toBeNull();
    expect(await AsyncStorage.getItem(STORAGE_KEYS.userId)).toBeNull();
    // DeviceId is intentionally kept so the same user is re-auth'd.
    expect(await AsyncStorage.getItem(STORAGE_KEYS.deviceId)).toBe(
      'test-uuid-1234',
    );
  });
});
