import { createConfStore, decryptValue, encryptValue } from './encrypted-store.svc.ts';
import { decodeJwtPayload } from './jwt.svc.ts';
import { debugLogger } from './log.svc.ts';

export interface StoredTokens {
  accessToken?: string;
  refreshToken?: string;
}

const AUTH_TOKEN_SALT = 'hdcli-auth-token-v1';
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const TOKEN_SKEW_SECONDS = 30;

function getStore() {
  return createConfStore('auth-token');
}

export async function saveTokens(tokens: { accessToken: string; refreshToken?: string }) {
  const store = getStore();
  store.set(ACCESS_TOKEN_KEY, encryptValue(tokens.accessToken, AUTH_TOKEN_SALT));

  if (tokens.refreshToken) {
    store.set(REFRESH_TOKEN_KEY, encryptValue(tokens.refreshToken, AUTH_TOKEN_SALT));
  } else {
    store.delete(REFRESH_TOKEN_KEY);
  }
}

export async function getStoredTokens(): Promise<StoredTokens | undefined> {
  const store = getStore();
  const encodedAccess = store.get(ACCESS_TOKEN_KEY) as string | undefined;
  const encodedRefresh = store.get(REFRESH_TOKEN_KEY) as string | undefined;

  let accessToken: string | undefined;
  let refreshToken: string | undefined;

  try {
    if (encodedAccess && typeof encodedAccess === 'string') {
      accessToken = decryptValue(encodedAccess, AUTH_TOKEN_SALT);
    }
  } catch (error) {
    debugLogger('Failed to decrypt access token: %O', error);
    accessToken = undefined;
  }

  try {
    if (encodedRefresh && typeof encodedRefresh === 'string') {
      refreshToken = decryptValue(encodedRefresh, AUTH_TOKEN_SALT);
    }
  } catch (error) {
    debugLogger('Failed to decrypt refresh token: %O', error);
    refreshToken = undefined;
  }

  if (!accessToken && !refreshToken) {
    return;
  }

  return { accessToken, refreshToken };
}

export async function clearStoredTokens() {
  const store = getStore();
  store.delete(ACCESS_TOKEN_KEY);
  store.delete(REFRESH_TOKEN_KEY);
}

export function isAccessTokenExpired(token: string | undefined): boolean {
  const payload = decodeJwtPayload(token) as { exp?: number } | undefined;
  if (!payload?.exp) {
    return true;
  }

  const now = Date.now() / 1000;
  return now + TOKEN_SKEW_SECONDS >= payload.exp;
}
