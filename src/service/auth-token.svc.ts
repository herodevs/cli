import keytar from 'keytar';
import { getAccessTokenKey, getRefreshTokenKey, getTokenServiceName } from './auth-config.svc.ts';

export interface StoredTokens {
  accessToken?: string;
  refreshToken?: string;
}

const TOKEN_SKEW_SECONDS = 30;

export async function saveTokens(tokens: { accessToken: string; refreshToken?: string }) {
  const service = getTokenServiceName();
  const accessKey = getAccessTokenKey();
  const refreshKey = getRefreshTokenKey();

  await keytar.setPassword(service, accessKey, tokens.accessToken);

  if (tokens.refreshToken) {
    await keytar.setPassword(service, refreshKey, tokens.refreshToken);
  } else {
    await keytar.deletePassword(service, refreshKey);
  }
}

export async function getStoredTokens(): Promise<StoredTokens | undefined> {
  const service = getTokenServiceName();
  const accessKey = getAccessTokenKey();
  const refreshKey = getRefreshTokenKey();

  const [accessToken, refreshToken] = await Promise.all([
    keytar.getPassword(service, accessKey),
    keytar.getPassword(service, refreshKey),
  ]);

  if (!accessToken && !refreshToken) {
    return undefined;
  }

  return {
    accessToken: accessToken ?? undefined,
    refreshToken: refreshToken ?? undefined,
  };
}

export async function clearStoredTokens() {
  const service = getTokenServiceName();
  const accessKey = getAccessTokenKey();
  const refreshKey = getRefreshTokenKey();

  await Promise.all([
    keytar.deletePassword(service, accessKey),
    keytar.deletePassword(service, refreshKey),
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
