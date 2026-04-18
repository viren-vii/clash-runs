import * as LocalAuthentication from 'expo-local-authentication';
import {
  checkBiometricAvailability,
  promptBiometric,
} from '../../../lib/auth/biometric-service';

const mockLocalAuth = LocalAuthentication as jest.Mocked<typeof LocalAuthentication>;

describe('biometric-service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('checkBiometricAvailability', () => {
    it('returns available=true with biometryType=face when Face ID enrolled', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(true);
      mockLocalAuth.isEnrolledAsync.mockResolvedValue(true);
      mockLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
      ]);

      const result = await checkBiometricAvailability();
      expect(result).toEqual({ available: true, biometryType: 'face' });
    });

    it('returns biometryType=fingerprint when only fingerprint enrolled', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(true);
      mockLocalAuth.isEnrolledAsync.mockResolvedValue(true);
      mockLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([
        LocalAuthentication.AuthenticationType.FINGERPRINT,
      ]);

      const result = await checkBiometricAvailability();
      expect(result).toEqual({ available: true, biometryType: 'fingerprint' });
    });

    it('returns biometryType=iris when only iris enrolled', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(true);
      mockLocalAuth.isEnrolledAsync.mockResolvedValue(true);
      mockLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([
        LocalAuthentication.AuthenticationType.IRIS,
      ]);

      const result = await checkBiometricAvailability();
      expect(result).toEqual({ available: true, biometryType: 'iris' });
    });

    it('returns available=false when hardware not present', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(false);
      mockLocalAuth.isEnrolledAsync.mockResolvedValue(false);
      mockLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([]);

      const result = await checkBiometricAvailability();
      expect(result).toEqual({ available: false, biometryType: null });
    });

    it('returns available=false when hardware present but not enrolled', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(true);
      mockLocalAuth.isEnrolledAsync.mockResolvedValue(false);
      mockLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([
        LocalAuthentication.AuthenticationType.FINGERPRINT,
      ]);

      const result = await checkBiometricAvailability();
      expect(result).toEqual({ available: false, biometryType: null });
    });

    it('returns available=true with biometryType=null when enrolled but no known type', async () => {
      mockLocalAuth.hasHardwareAsync.mockResolvedValue(true);
      mockLocalAuth.isEnrolledAsync.mockResolvedValue(true);
      mockLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([]);

      const result = await checkBiometricAvailability();
      expect(result).toEqual({ available: true, biometryType: null });
    });
  });

  describe('promptBiometric', () => {
    it('returns true on successful authentication', async () => {
      mockLocalAuth.authenticateAsync.mockResolvedValue({ success: true });
      expect(await promptBiometric()).toBe(true);
    });

    it('returns false when user cancels', async () => {
      mockLocalAuth.authenticateAsync.mockResolvedValue({
        success: false,
        error: 'user_cancel',
      });
      expect(await promptBiometric()).toBe(false);
    });

    it('passes custom prompt message to authenticateAsync', async () => {
      mockLocalAuth.authenticateAsync.mockResolvedValue({ success: true });
      await promptBiometric('Unlock to refresh session');
      expect(mockLocalAuth.authenticateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ promptMessage: 'Unlock to refresh session' }),
      );
    });

    it('uses default prompt message when none provided', async () => {
      mockLocalAuth.authenticateAsync.mockResolvedValue({ success: true });
      await promptBiometric();
      expect(mockLocalAuth.authenticateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          promptMessage: 'Confirm your identity to continue',
        }),
      );
    });
  });
});
