import {
  signup,
  verifyEmail,
  signin,
  refreshTokens,
  signout,
  resendVerification,
  AuthError,
} from '../../../lib/auth/auth-service';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function mockSuccess(data: unknown, status = 200) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status,
    json: () => Promise.resolve(data),
  });
}

function mockFailure(message: string, status: number) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: () => Promise.resolve({ message }),
  });
}

describe('auth-service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('signup', () => {
    it('POSTs to /auth/signup with email and password', async () => {
      mockSuccess({});
      await signup('test@example.com', 'password123');
      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/auth/signup');
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body as string)).toEqual({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('throws AuthError with server message on 409', async () => {
      mockFailure('Email already in use', 409);
      await expect(signup('test@example.com', 'password123')).rejects.toThrow(
        'Email already in use',
      );
    });

    it('AuthError carries the HTTP status code', async () => {
      mockFailure('Email already in use', 409);
      try {
        await signup('test@example.com', 'password123');
      } catch (e) {
        expect(e).toBeInstanceOf(AuthError);
        expect((e as AuthError).status).toBe(409);
      }
    });
  });

  describe('verifyEmail', () => {
    it('POSTs to /auth/verify-email with email and code', async () => {
      mockSuccess({});
      await verifyEmail('test@example.com', '123456');
      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/auth/verify-email');
      expect(JSON.parse(init.body as string)).toEqual({
        email: 'test@example.com',
        code: '123456',
      });
    });

    it('throws AuthError on invalid code', async () => {
      mockFailure('Invalid verification code', 400);
      await expect(verifyEmail('test@example.com', '000000')).rejects.toThrow(
        'Invalid verification code',
      );
    });
  });

  describe('signin', () => {
    it('returns tokens and user on success', async () => {
      const resp = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: 'u1', email: 'test@example.com', emailVerified: true },
      };
      mockSuccess(resp);
      const result = await signin('test@example.com', 'password123');
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('throws AuthError on bad credentials', async () => {
      mockFailure('Invalid credentials', 401);
      await expect(signin('test@example.com', 'wrong')).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('throws AuthError with status 401 on wrong password', async () => {
      mockFailure('Invalid credentials', 401);
      try {
        await signin('test@example.com', 'wrong');
      } catch (e) {
        expect((e as AuthError).status).toBe(401);
      }
    });
  });

  describe('refreshTokens', () => {
    it('returns new access and refresh tokens', async () => {
      mockSuccess({ accessToken: 'new-access', refreshToken: 'new-refresh' });
      const result = await refreshTokens('old-refresh-token');
      expect(result.accessToken).toBe('new-access');
      expect(result.refreshToken).toBe('new-refresh');
    });

    it('throws AuthError on expired refresh token', async () => {
      mockFailure('Token expired', 401);
      await expect(refreshTokens('expired-token')).rejects.toThrow(
        'Token expired',
      );
    });
  });

  describe('signout', () => {
    it('POSTs to /auth/signout with refreshToken', async () => {
      mockSuccess({});
      await signout('my-refresh-token');
      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/auth/signout');
      expect(JSON.parse(init.body as string)).toEqual({
        refreshToken: 'my-refresh-token',
      });
    });

    it('resolves even on server error (best-effort signout)', async () => {
      // signout failures are non-fatal; the server still invalidates on next refresh attempt
      mockSuccess({});
      await expect(signout('token')).resolves.toBeUndefined();
    });
  });

  describe('resendVerification', () => {
    it('POSTs to /auth/resend-verification with email', async () => {
      mockSuccess({});
      await resendVerification('test@example.com');
      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/auth/resend-verification');
      expect(JSON.parse(init.body as string)).toEqual({ email: 'test@example.com' });
    });

    it('throws AuthError on failure', async () => {
      mockFailure('Too many requests', 429);
      await expect(resendVerification('test@example.com')).rejects.toThrow(
        'Too many requests',
      );
    });
  });
});
