import type { TokenResponse } from '../types/auth.ts';
import { refreshTokens } from './auth-refresh.svc.ts';
import { clearStoredTokens, getStoredTokens, isAccessTokenExpired, saveTokens } from './auth-token.svc.ts';
import { debugLogger } from './log.svc.ts';

export type AuthErrorCode = 'NOT_LOGGED_IN' | 'SESSION_EXPIRED';

export class AuthError extends Error {
  readonly code: AuthErrorCode;

  constructor(message: string, code: AuthErrorCode) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

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
    return;
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

export async function requireAccessTokenForScan(): Promise<string> {
  const tokens = await getStoredTokens();

  if (!tokens?.accessToken) {
    throw new AuthError('Please log in to perform a scan. To authenticate, run "hd auth login".', 'NOT_LOGGED_IN');
  }

  if (!isAccessTokenExpired(tokens.accessToken)) {
    return tokens.accessToken;
  }

  if (tokens.refreshToken) {
    try {
      const newTokens = await refreshTokens(tokens.refreshToken);
      await persistTokenResponse(newTokens);
      return newTokens.access_token;
    } catch (error) {
      // Refresh failed - fall through to session expired error
      debugLogger('Token refresh failed: %O', error);
    }
  }

  throw new AuthError('Your session is no longer valid. To re-authenticate, run "hd auth login".', 'SESSION_EXPIRED');
}
