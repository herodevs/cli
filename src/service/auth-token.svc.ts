import { AsyncEntry } from '@napi-rs/keyring';
import { getAccessTokenKey, getRefreshTokenKey, getTokenServiceName } from './auth-config.svc.ts';
import { decodeJwtPayload } from './jwt.svc.ts';

export interface StoredTokens {
  accessToken?: string;
  refreshToken?: string;
}

const TOKEN_SKEW_SECONDS = 30;

export async function saveTokens(tokens: { accessToken: string; refreshToken?: string }) {
  const service = getTokenServiceName();
  const accessKey = getAccessTokenKey();
  const refreshKey = getRefreshTokenKey();

  const accessTokenSet = new AsyncEntry(service, accessKey).setPassword(tokens.accessToken);
  const refreshTokenSet = tokens.refreshToken
    ? new AsyncEntry(service, refreshKey).setPassword(tokens.refreshToken)
    : new AsyncEntry(service, refreshKey).deletePassword();

  return Promise.all([accessTokenSet, refreshTokenSet]);
}

export async function getStoredTokens(): Promise<StoredTokens | undefined> {
  const service = getTokenServiceName();
  const accessKey = getAccessTokenKey();
  const refreshKey = getRefreshTokenKey();

  return Promise.all([
    new AsyncEntry(service, accessKey).getPassword(),
    new AsyncEntry(service, refreshKey).getPassword(),
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
  const service = getTokenServiceName();
  const accessKey = getAccessTokenKey();
  const refreshKey = getRefreshTokenKey();

  return Promise.all([
    new AsyncEntry(service, accessKey).deletePassword(),
    new AsyncEntry(service, refreshKey).deletePassword(),
  ]);
}

export function isAccessTokenExpired(token: string | undefined): boolean {
  const payload = decodeJwtPayload(token) as { exp?: number } | undefined;
  if (!payload?.exp) {
    return true;
  }

  const now = Date.now() / 1000;
  return now + TOKEN_SKEW_SECONDS >= payload.exp;
}
