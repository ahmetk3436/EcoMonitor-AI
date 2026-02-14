import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'eco_biometric_enabled';

// Biometric authentication (Apple Guideline 4.2 - Native Utility).
// Uses Face ID / Touch ID for secure session resumption.

export async function isBiometricAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;

  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
}

export async function getBiometricType(): Promise<string> {
  const types =
    await LocalAuthentication.supportedAuthenticationTypesAsync();

  if (
    types.includes(
      LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
    )
  ) {
    return 'Face ID';
  }
  if (
    types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
  ) {
    return 'Touch ID';
  }
  return 'Biometric';
}

export async function setBiometricLock(enabled: boolean): Promise<void> {
  try {
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch (error) {
    console.error('Error saving biometric lock setting:', error);
    throw error;
  }
}

export async function isBiometricLockEnabled(): Promise<boolean> {
  try {
    const value = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error reading biometric lock setting:', error);
    return false;
  }
}

export async function authenticateWithBiometrics(): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock EcoMonitor AI',
      fallbackLabel: 'Use Passcode',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });
    return result.success;
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return false;
  }
}
