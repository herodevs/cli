import { AsyncEntry } from '@napi-rs/keyring';
import { ACCESS_KEY, REFRESH_KEY, SERVICE_NAME } from '../config/auth.config.js';

export interface StoredTokens {
  accessToken?: string;
  refreshToken?: string;
}

const TOKEN_SKEW_SECONDS = 30;

export async function saveTokens(tokens: { accessToken: string; refreshToken?: string }) {
  const accessTokenSet = new AsyncEntry(SERVICE_NAME, ACCESS_KEY).setPassword(tokens.accessToken);
  const refreshTokenSet = tokens.refreshToken
    ? new AsyncEntry(SERVICE_NAME, REFRESH_KEY).setPassword(tokens.refreshToken)
    : new AsyncEntry(SERVICE_NAME, REFRESH_KEY).deletePassword();

  return Promise.all([accessTokenSet, refreshTokenSet]);
}

export async function getStoredTokens(): Promise<StoredTokens | undefined> {
  return Promise.all([
    new AsyncEntry(SERVICE_NAME, ACCESS_KEY).getPassword(),
    new AsyncEntry(SERVICE_NAME, REFRESH_KEY).getPassword(),
  ]).then(([accessToken, refreshToken]) => {
    if (!accessToken && !refreshToken) {
      return;
    }

    return {
      accessToken,
      refreshToken,
    };
  });
}

export async function clearStoredTokens() {
  return Promise.all([
    new AsyncEntry(SERVICE_NAME, ACCESS_KEY).deletePassword(),
    new AsyncEntry(SERVICE_NAME, REFRESH_KEY).deletePassword(),
  ]);
}

export function isAccessTokenExpired(token: string | undefined): boolean {
  if (!token) {
    return true;
  }

  try {
    const [, payloadB64] = token.split('.');
    if (!payloadB64) {
      return true;
    }

    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson) as { exp?: number };
    if (!payload.exp) {
      return true;
    }

    const now = Date.now() / 1000;
    return now + TOKEN_SKEW_SECONDS >= payload.exp;
  } catch {
    return true;
  }
}
