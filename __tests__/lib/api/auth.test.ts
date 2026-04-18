import { getToken, clearAuth } from '../../../lib/api/auth';
import * as TokenManager from '../../../lib/auth/token-manager';
import * as AuthService from '../../../lib/auth/auth-service';
import * as SessionEvents from '../../../lib/auth/session-events';

jest.mock('../../../lib/auth/token-manager');
jest.mock('../../../lib/auth/auth-service', () => ({
  ...jest.requireActual('../../../lib/auth/auth-service'),
  refreshTokens: jest.fn(),
}));

const mockTokens = TokenManager as jest.Mocked<typeof TokenManager>;
const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;

describe('lib/api/auth (credential-based)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTokens.clearTokens.mockResolvedValue();
    mockTokens.saveTokens.mockResolvedValue();
  });

  describe('getToken', () => {
    it('returns cached access token when valid', async () => {
      mockTokens.getAccessToken.mockResolvedValue('valid-access-token');

      const token = await getToken();

      expect(token).toBe('valid-access-token');
      expect(mockAuthService.refreshTokens).not.toHaveBeenCalled();
    });

    it('uses refresh token to get new access token when expired', async () => {
      mockTokens.getAccessToken.mockResolvedValue(null);
      mockTokens.getRefreshToken.mockResolvedValue('stored-refresh');
      mockAuthService.refreshTokens.mockResolvedValue({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });

      const token = await getToken();

      expect(token).toBe('new-access');
      expect(mockAuthService.refreshTokens).toHaveBeenCalledWith('stored-refresh');
      expect(mockTokens.saveTokens).toHaveBeenCalledWith('new-access', 'new-refresh');
    });

    it('throws when no refresh token available', async () => {
      mockTokens.getAccessToken.mockResolvedValue(null);
      mockTokens.getRefreshToken.mockResolvedValue(null);

      await expect(getToken()).rejects.toThrow('No refresh token');
    });

    it('de-duplicates concurrent refresh calls (single inflight request)', async () => {
      mockTokens.getAccessToken.mockResolvedValue(null);
      mockTokens.getRefreshToken.mockResolvedValue('stored-refresh');

      let resolveRefresh!: (v: { accessToken: string; refreshToken: string }) => void;
      const refreshPromise = new Promise<{ accessToken: string; refreshToken: string }>(
        (res) => { resolveRefresh = res; },
      );
      mockAuthService.refreshTokens.mockReturnValueOnce(refreshPromise);

      const [p1, p2] = [getToken(), getToken()];
      resolveRefresh({ accessToken: 'shared-access', refreshToken: 'shared-refresh' });

      const [t1, t2] = await Promise.all([p1, p2]);
      expect(t1).toBe('shared-access');
      expect(t2).toBe('shared-access');
      expect(mockAuthService.refreshTokens).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearAuth', () => {
    it('delegates to TokenManager.clearTokens', async () => {
      await clearAuth();
      expect(mockTokens.clearTokens).toHaveBeenCalled();
    });

    it('emits session invalidated after clearing tokens', async () => {
      const spy = jest.spyOn(SessionEvents, 'emitSessionInvalidated');
      await clearAuth();
      expect(spy).toHaveBeenCalledTimes(1);
      spy.mockRestore();
    });
  });
});
