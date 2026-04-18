import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../../../lib/auth/auth-context';
import * as AuthService from '../../../lib/auth/auth-service';
import * as TokenManager from '../../../lib/auth/token-manager';
import * as BiometricService from '../../../lib/auth/biometric-service';
import * as SecureStore from 'expo-secure-store';
import { emitSessionInvalidated } from '../../../lib/auth/session-events';

// Keep AuthError as a real class so toThrow() message checks work
jest.mock('../../../lib/auth/auth-service', () => ({
  ...jest.requireActual('../../../lib/auth/auth-service'),
  signup: jest.fn(),
  verifyEmail: jest.fn(),
  signin: jest.fn(),
  refreshTokens: jest.fn(),
  signout: jest.fn(),
}));
jest.mock('../../../lib/auth/token-manager');
jest.mock('../../../lib/auth/biometric-service');

const mockAuth = AuthService as jest.Mocked<typeof AuthService>;
const mockTokens = TokenManager as jest.Mocked<typeof TokenManager>;
const mockBiometric = BiometricService as jest.Mocked<typeof BiometricService>;
const secureStoreMock = SecureStore as jest.Mocked<typeof SecureStore> & {
  __clear: () => void;
};

const testUser = { id: 'u1', email: 'test@example.com' };

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthProvider / useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    secureStoreMock.__clear?.();

    // Default: no stored tokens
    mockTokens.getRefreshToken.mockResolvedValue(null);
    mockTokens.getAccessToken.mockResolvedValue(null);
    mockTokens.getUser.mockResolvedValue(null);
    mockTokens.saveTokens.mockResolvedValue();
    mockTokens.saveUser.mockResolvedValue();
    mockTokens.clearTokens.mockResolvedValue();
    // Default: biometrics available and succeeds
    mockBiometric.checkBiometricAvailability.mockResolvedValue({ available: true, biometryType: 'face' });
    mockBiometric.promptBiometric.mockResolvedValue(true);
  });

  describe('initial session restore', () => {
    it('sets isAuthenticated=false and isLoading=false when no refresh token', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('restores session from valid access token without biometric prompt', async () => {
      mockTokens.getRefreshToken.mockResolvedValue('stored-refresh');
      mockTokens.getAccessToken.mockResolvedValue('stored-access');
      mockTokens.getUser.mockResolvedValue(testUser);

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(testUser);
      expect(mockBiometric.promptBiometric).not.toHaveBeenCalled();
    });

    it('prompts biometric then refreshes when access token expired and biometrics available', async () => {
      mockTokens.getRefreshToken.mockResolvedValue('stored-refresh');
      mockTokens.getAccessToken.mockResolvedValue(null); // expired
      mockTokens.getUser.mockResolvedValue(testUser);
      mockBiometric.checkBiometricAvailability.mockResolvedValue({ available: true, biometryType: 'face' });
      mockBiometric.promptBiometric.mockResolvedValue(true);
      mockAuth.refreshTokens.mockResolvedValue({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mockBiometric.checkBiometricAvailability).toHaveBeenCalled();
      expect(mockBiometric.promptBiometric).toHaveBeenCalled();
      expect(mockAuth.refreshTokens).toHaveBeenCalledWith('stored-refresh');
      expect(mockTokens.saveTokens).toHaveBeenCalledWith('new-access', 'new-refresh');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('skips biometric prompt and refreshes directly when biometrics unavailable', async () => {
      mockTokens.getRefreshToken.mockResolvedValue('stored-refresh');
      mockTokens.getAccessToken.mockResolvedValue(null); // expired
      mockTokens.getUser.mockResolvedValue(testUser);
      mockBiometric.checkBiometricAvailability.mockResolvedValue({ available: false, biometryType: null });
      mockAuth.refreshTokens.mockResolvedValue({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mockBiometric.promptBiometric).not.toHaveBeenCalled();
      expect(mockAuth.refreshTokens).toHaveBeenCalledWith('stored-refresh');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('clears tokens and sets unauthenticated when biometric denied', async () => {
      mockTokens.getRefreshToken.mockResolvedValue('stored-refresh');
      mockTokens.getAccessToken.mockResolvedValue(null);
      mockBiometric.checkBiometricAvailability.mockResolvedValue({ available: true, biometryType: 'face' });
      mockBiometric.promptBiometric.mockResolvedValue(false);

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mockTokens.clearTokens).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('clears tokens and sets unauthenticated when refresh fails', async () => {
      mockTokens.getRefreshToken.mockResolvedValue('stored-refresh');
      mockTokens.getAccessToken.mockResolvedValue(null);
      mockBiometric.promptBiometric.mockResolvedValue(true);
      mockAuth.refreshTokens.mockRejectedValue(new AuthService.AuthError(401, 'Expired'));

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mockTokens.clearTokens).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('login', () => {
    it('saves tokens + user and sets authenticated state', async () => {
      mockAuth.signin.mockResolvedValue({
        accessToken: 'access-1',
        refreshToken: 'refresh-1',
        user: testUser,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(mockTokens.saveTokens).toHaveBeenCalledWith('access-1', 'refresh-1');
      expect(mockTokens.saveUser).toHaveBeenCalledWith(testUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(testUser);
    });

    it('propagates AuthError on wrong credentials', async () => {
      mockAuth.signin.mockRejectedValue(
        new AuthService.AuthError(401, 'Invalid credentials'),
      );

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // act() swallows rejections; call directly for the error path
      await expect(
        result.current.login('test@example.com', 'wrong'),
      ).rejects.toThrow('Invalid credentials');

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('signup', () => {
    it('delegates to AuthService.signup', async () => {
      mockAuth.signup.mockResolvedValue();

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.signup('new@example.com', 'newpass123');
      });

      expect(mockAuth.signup).toHaveBeenCalledWith('new@example.com', 'newpass123');
      // Signup alone doesn't authenticate — user still needs to verify email then sign in
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('verifyEmail', () => {
    it('delegates to AuthService.verifyEmail', async () => {
      mockAuth.verifyEmail.mockResolvedValue();

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.verifyEmail('new@example.com', '123456');
      });

      expect(mockAuth.verifyEmail).toHaveBeenCalledWith('new@example.com', '123456');
    });
  });

  describe('logout', () => {
    it('calls signout with refresh token, clears tokens, sets unauthenticated', async () => {
      // Set up authenticated state first
      mockTokens.getRefreshToken.mockResolvedValue('stored-refresh');
      mockTokens.getAccessToken.mockResolvedValue('stored-access');
      mockTokens.getUser.mockResolvedValue(testUser);
      mockAuth.signout.mockResolvedValue();

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

      // Re-mock getRefreshToken for the logout call
      mockTokens.getRefreshToken.mockResolvedValue('stored-refresh');

      await act(async () => {
        await result.current.logout();
      });

      expect(mockAuth.signout).toHaveBeenCalledWith('stored-refresh');
      expect(mockTokens.clearTokens).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('still clears tokens even when signout API call fails', async () => {
      mockTokens.getRefreshToken.mockResolvedValue('stored-refresh');
      mockTokens.getAccessToken.mockResolvedValue('stored-access');
      mockTokens.getUser.mockResolvedValue(testUser);
      mockAuth.signout.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

      mockTokens.getRefreshToken.mockResolvedValue('stored-refresh');

      await act(async () => {
        await result.current.logout();
      });

      expect(mockTokens.clearTokens).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('session invalidation (zombie auth fix)', () => {
    it('transitions to UNAUTHENTICATED when external session invalidation is emitted', async () => {
      // Start in authenticated state
      mockTokens.getRefreshToken.mockResolvedValue('stored-refresh');
      mockTokens.getAccessToken.mockResolvedValue('stored-access');
      mockTokens.getUser.mockResolvedValue(testUser);

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

      // Simulate sync.ts calling clearAuth() after a 401 — which emits the event
      act(() => { emitSessionInvalidated(); });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
      });
    });
  });

  describe('useAuth outside provider', () => {
    it('throws when used outside AuthProvider', () => {
      expect(() => renderHook(() => useAuth())).toThrow(
        'useAuth must be used inside AuthProvider',
      );
    });
  });
});
