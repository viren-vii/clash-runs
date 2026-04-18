import * as SecureStore from 'expo-secure-store';
import {
  saveTokens,
  saveUser,
  getAccessToken,
  getRefreshToken,
  getUser,
  clearTokens,
} from '../../../lib/auth/token-manager';

// Helper: build a minimal signed JWT with a custom exp (seconds)
function makeJwt(expSeconds: number): string {
  const encode = (obj: object) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const payload = encode({ sub: 'user-1', exp: expSeconds });
  return `${header}.${payload}.fakesig`;
}

const secureStoreMock = SecureStore as jest.Mocked<typeof SecureStore> & {
  __clear: () => void;
};

describe('token-manager', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    secureStoreMock.__clear();
  });

  describe('saveTokens / getAccessToken / getRefreshToken', () => {
    it('stores access and refresh tokens in SecureStore', async () => {
      await saveTokens('access-abc', 'refresh-xyz');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'auth.accessToken',
        'access-abc',
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'auth.refreshToken',
        'refresh-xyz',
      );
    });

    it('getRefreshToken returns the stored refresh token', async () => {
      await saveTokens('access-abc', 'refresh-xyz');
      expect(await getRefreshToken()).toBe('refresh-xyz');
    });

    it('getAccessToken returns token when not expired', async () => {
      const futureExp = Math.floor(Date.now() / 1000) + 900; // 15 min from now
      const jwt = makeJwt(futureExp);
      await saveTokens(jwt, 'refresh-xyz');
      expect(await getAccessToken()).toBe(jwt);
    });

    it('getAccessToken returns null when token is expired', async () => {
      const pastExp = Math.floor(Date.now() / 1000) - 60; // 1 min ago
      const jwt = makeJwt(pastExp);
      await saveTokens(jwt, 'refresh-xyz');
      expect(await getAccessToken()).toBeNull();
    });

    it('getAccessToken returns null within 60s skew window', async () => {
      const almostExpired = Math.floor(Date.now() / 1000) + 30; // expires in 30s
      const jwt = makeJwt(almostExpired);
      await saveTokens(jwt, 'refresh-xyz');
      expect(await getAccessToken()).toBeNull();
    });

    it('getAccessToken returns null when no token stored', async () => {
      expect(await getAccessToken()).toBeNull();
    });

    it('getRefreshToken returns null when nothing stored', async () => {
      expect(await getRefreshToken()).toBeNull();
    });
  });

  describe('saveUser / getUser', () => {
    it('stores and retrieves user as JSON', async () => {
      const user = { id: 'u1', email: 'a@b.com', emailVerified: true };
      await saveUser(user);
      expect(await getUser()).toEqual(user);
    });

    it('getUser returns null when nothing stored', async () => {
      expect(await getUser()).toBeNull();
    });
  });

  describe('clearTokens', () => {
    it('removes all three SecureStore entries', async () => {
      const jwt = makeJwt(Math.floor(Date.now() / 1000) + 900);
      await saveTokens(jwt, 'refresh-xyz');
      await saveUser({ id: 'u1', email: 'a@b.com', emailVerified: true });

      await clearTokens();

      expect(await getAccessToken()).toBeNull();
      expect(await getRefreshToken()).toBeNull();
      expect(await getUser()).toBeNull();
    });

    it('calls deleteItemAsync for all three keys', async () => {
      await clearTokens();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth.accessToken');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth.refreshToken');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth.user');
    });
  });
});
