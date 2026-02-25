import type { TokenResponse } from '../types/auth.ts';
import { refreshTokens } from './auth-refresh.svc.ts';
import { clearStoredTokens, getStoredTokens, isAccessTokenExpired, saveTokens } from './auth-token.svc.ts';
import { requireCIAccessToken } from './ci-auth.svc.ts';
import { getCIToken } from './ci-token.svc.ts';
import { debugLogger } from './log.svc.ts';

export type { CITokenErrorCode } from './ci-auth.svc.ts';
export { CITokenError } from './ci-auth.svc.ts';

export type AuthErrorCode = 'NOT_LOGGED_IN' | 'SESSION_EXPIRED';

export type TokenSource = 'oauth' | 'ci';

export type TokenProvider = (forceRefresh?: boolean) => Promise<string>;

export const AUTH_ERROR_MESSAGES = {
  UNAUTHENTICATED: 'Please log in to perform this action. To authenticate, please run an "auth login" command.',
  SESSION_EXPIRED: 'Your session has expired. To re-authenticate, please run an "auth login" command.',
  INVALID_TOKEN: 'Your session has expired. To re-authenticate, please run an "auth login" command.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_LOGGED_IN_GENERIC: 'You are not logged in. Please run an "auth login" command to authenticate.',
} as const;

export async function getTokenForScanWithSource(
  preferOAuth?: boolean,
): Promise<{ token: string; source: TokenSource }> {
  if (preferOAuth) {
    const token = await requireAccessToken();
    return { token, source: 'oauth' };
  }

  const tokens = await getStoredTokens();
  if (tokens?.accessToken && !isAccessTokenExpired(tokens.accessToken)) {
    return { token: tokens.accessToken, source: 'oauth' };
  }

  if (tokens?.refreshToken) {
    try {
      const newTokens = await refreshTokens(tokens.refreshToken);
      await persistTokenResponse(newTokens);
      return { token: newTokens.access_token, source: 'oauth' };
    } catch (error) {
      debugLogger('Token refresh failed: %O', error);
    }
  }

  const ciToken = getCIToken();
  if (ciToken) {
    const accessToken = await requireCIAccessToken();
    return { token: accessToken, source: 'ci' };
  }

  if (!tokens?.accessToken) {
    throw new AuthError(AUTH_ERROR_MESSAGES.UNAUTHENTICATED, 'NOT_LOGGED_IN');
  }

  throw new AuthError(AUTH_ERROR_MESSAGES.SESSION_EXPIRED, 'SESSION_EXPIRED');
}

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

export function getTokenProvider(preferOAuth?: boolean): TokenProvider {
  return async (_forceRefresh?: boolean): Promise<string> => {
    const { token } = await getTokenForScanWithSource(preferOAuth);
    return token;
  };
}

export async function requireAccessToken(): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error(AUTH_ERROR_MESSAGES.NOT_LOGGED_IN_GENERIC);
  }

  return token;
}

export async function logoutLocally() {
  await clearStoredTokens();
}

export const requireAccessTokenForScan = getTokenProvider();
