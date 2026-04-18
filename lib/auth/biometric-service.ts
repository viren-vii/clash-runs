import * as LocalAuthentication from 'expo-local-authentication';

export interface BiometricAvailability {
  available: boolean;
  biometryType: 'face' | 'fingerprint' | 'iris' | null;
}

export async function checkBiometricAvailability(): Promise<BiometricAvailability> {
  const [hasHardware, isEnrolled, types] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync(),
  ]);

  if (!hasHardware || !isEnrolled) {
    return { available: false, biometryType: null };
  }

  let biometryType: BiometricAvailability['biometryType'] = null;
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    biometryType = 'face';
  } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    biometryType = 'fingerprint';
  } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    biometryType = 'iris';
  }

  return { available: true, biometryType };
}

export async function promptBiometric(
  reason = 'Confirm your identity to continue',
): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    cancelLabel: 'Cancel',
    disableDeviceFallback: false,
  });
  return result.success;
}
