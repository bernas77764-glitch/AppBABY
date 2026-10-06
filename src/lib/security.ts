import { getRandomBytesAsync } from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const DB_KEY = 'appbaby.db-key';

/**
 * Chave da base de dados (SQLCipher). É gerada no primeiro arranque e fica no
 * Keychain (iOS) / Keystore (Android), sem sair do dispositivo.
 */
export async function getDatabaseKey(): Promise<string> {
  const existing = await SecureStore.getItemAsync(DB_KEY);
  if (existing) return existing;
  const bytes = await getRandomBytesAsync(32);
  const key = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  await SecureStore.setItemAsync(DB_KEY, key, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return key;
}

/** Devolve true se o desbloqueio foi feito (ou se o dispositivo não tem bloqueio configurado). */
export async function unlock(): Promise<boolean> {
  const level = await LocalAuthentication.getEnrolledLevelAsync();
  if (level === LocalAuthentication.SecurityLevel.NONE) return true;
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Desbloquear AppBABY',
    cancelLabel: 'Cancelar',
    disableDeviceFallback: false,
  });
  return result.success;
}
