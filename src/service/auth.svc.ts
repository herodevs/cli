import { refreshTokens } from './auth-refresh.svc.ts';
import { clearStoredTokens, getStoredTokens, isAccessTokenExpired, saveTokens } from './auth-token.svc.ts';
import type { TokenResponse } from '../types/auth.ts';

export async function persistTokenResponse(token: TokenResponse) {
  await saveTokens({
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
  });
}

export async function getAccessToken(): Promise<string | undefined> {
  const tokens = await getStoredTokens();
  if (!tokens) {
    return;
  }

  if (tokens.accessToken && !isAccessTokenExpired(tokens.accessToken)) {
    return tokens.accessToken;
  }

  if (!tokens.refreshToken) {
    return undefined;
  }

  const refreshed = await refreshTokens(tokens.refreshToken);
  await persistTokenResponse(refreshed);
  return refreshed.access_token;
}

export async function requireAccessToken(): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('You are not logged in. Run "hd auth login" to authenticate.');
  }

  return token;
}

export async function logoutLocally() {
  await clearStoredTokens();
}
