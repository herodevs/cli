import { config } from '../config/constants.ts';
import { createConfStore, decryptValue, encryptValue } from './encrypted-store.svc.ts';
import { debugLogger } from './log.svc.ts';

const CI_TOKEN_STORAGE_KEY = 'ciRefreshToken';
const CI_TOKEN_SALT = 'hdcli-ci-token-v1';

function getConfStore() {
  return createConfStore('ci-token');
}

export function encryptToken(plaintext: string): string {
  return encryptValue(plaintext, CI_TOKEN_SALT);
}

export function decryptToken(encoded: string): string {
  return decryptValue(encoded, CI_TOKEN_SALT);
}

export function getCITokenFromStorage(): string | undefined {
  const store = getConfStore();
  const encoded = store.get(CI_TOKEN_STORAGE_KEY) as string | undefined;
  if (encoded === undefined || typeof encoded !== 'string') {
    return undefined;
  }
  try {
    return decryptToken(encoded);
  } catch (error) {
    debugLogger('Failed to decrypt CI token: %O', error);
    return undefined;
  }
}

export function getCIToken(): string | undefined {
  const fromEnv = config.ciTokenFromEnv;
  if (fromEnv !== undefined) {
    return fromEnv;
  }
  return getCITokenFromStorage();
}

export function saveCIToken(token: string): void {
  const store = getConfStore();
  const encoded = encryptToken(token);
  store.set(CI_TOKEN_STORAGE_KEY, encoded);
}

export function clearCIToken(): void {
  const store = getConfStore();
  store.delete(CI_TOKEN_STORAGE_KEY);
}
