import { type Mock, vi } from 'vitest';

const { mockConfig } = vi.hoisted(() => ({
  mockConfig: {
    ciTokenFromEnv: undefined as string | undefined,
  },
}));

vi.mock('../../src/config/constants.ts', () => ({
  config: mockConfig,
}));

vi.mock('../../src/service/auth-token.svc.ts', () => ({
  __esModule: true,
  getStoredTokens: vi.fn(),
  saveTokens: vi.fn(),
  clearStoredTokens: vi.fn(),
  isAccessTokenExpired: vi.fn(),
}));

vi.mock('../../src/service/auth-refresh.svc.ts', () => ({
  __esModule: true,
  refreshTokens: vi.fn(),
}));

vi.mock('../../src/service/ci-token.svc.ts', () => ({
  __esModule: true,
  getCIToken: vi.fn(),
  saveCIToken: vi.fn(),
}));

vi.mock('../../src/service/ci-auth.svc.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/service/ci-auth.svc.ts')>();
  return {
    ...actual,
    requireCIAccessToken: vi.fn(),
  };
});

const { debugLoggerMock } = vi.hoisted(() => ({
  debugLoggerMock: vi.fn(),
}));

vi.mock('../../src/service/log.svc.ts', () => ({
  debugLogger: debugLoggerMock,
  getErrorMessage: (e: unknown) => (e instanceof Error ? e.message : String(e)),
}));

import {
  AUTH_ERROR_MESSAGES,
  AuthError,
  getAccessToken,
  getTokenForScanWithSource,
  getTokenProvider,
  logoutLocally,
  persistTokenResponse,
  requireAccessToken,
  requireAccessTokenForScan,
} from '../../src/service/auth.svc.ts';
import { refreshTokens } from '../../src/service/auth-refresh.svc.ts';
import {
  clearStoredTokens,
  getStoredTokens,
  isAccessTokenExpired,
  saveTokens,
} from '../../src/service/auth-token.svc.ts';
import { CITokenError, requireCIAccessToken } from '../../src/service/ci-auth.svc.ts';
import { getCIToken } from '../../src/service/ci-token.svc.ts';

describe('auth.svc', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (getCIToken as Mock).mockReturnValue(undefined);
    mockConfig.ciTokenFromEnv = undefined;
  });

  it('persists token responses via keyring service', async () => {
    await persistTokenResponse({ access_token: 'access', refresh_token: 'refresh' });
    expect(saveTokens).toHaveBeenCalledWith({ accessToken: 'access', refreshToken: 'refresh' });
  });

  it('returns stored access token when it is valid', async () => {
    (getStoredTokens as Mock).mockResolvedValue({ accessToken: 'valid-token' });
    (isAccessTokenExpired as Mock).mockReturnValue(false);

    const token = await getAccessToken();
    expect(token).toBe('valid-token');
    expect(refreshTokens).not.toHaveBeenCalled();
  });

  it('refreshes access token when expired and refresh token exists', async () => {
    (getStoredTokens as Mock).mockResolvedValue({ accessToken: 'expired', refreshToken: 'refresh-1' });
    (isAccessTokenExpired as Mock).mockReturnValue(true);
    (refreshTokens as Mock).mockResolvedValue({ access_token: 'new-token', refresh_token: 'refresh-2' });

    const token = await getAccessToken();
    expect(token).toBe('new-token');
    expect(refreshTokens).toHaveBeenCalledWith('refresh-1');
    expect(saveTokens).toHaveBeenCalledWith({ accessToken: 'new-token', refreshToken: 'refresh-2' });
  });

  it('propagates refresh errors when renewal fails', async () => {
    (getStoredTokens as Mock).mockResolvedValue({ accessToken: 'expired', refreshToken: 'refresh-1' });
    (isAccessTokenExpired as Mock).mockReturnValue(true);
    (refreshTokens as Mock).mockRejectedValue(new Error('refresh failed'));

    await expect(getAccessToken()).rejects.toThrow('refresh failed');
  });

  it('returns undefined when no tokens are stored', async () => {
    (getStoredTokens as Mock).mockResolvedValue(undefined);

    const token = await getAccessToken();
    expect(token).toBeUndefined();
  });

  it('throws when requireAccessToken cannot obtain a token', async () => {
    (getStoredTokens as Mock).mockResolvedValue(undefined);

    await expect(requireAccessToken()).rejects.toThrow(/not logged in/i);
  });

  it('clears local tokens when logging out locally', async () => {
    await logoutLocally();
    expect(clearStoredTokens).toHaveBeenCalled();
  });

  describe('requireAccessTokenForScan', () => {
    it('delegates to requireCIAccessToken when only CI token present', async () => {
      (getCIToken as Mock).mockReturnValue('ci-refresh-token');
      (getStoredTokens as Mock).mockResolvedValue(undefined);
      (requireCIAccessToken as Mock).mockResolvedValue('ci-access-token');

      const token = await requireAccessTokenForScan();
      expect(token).toBe('ci-access-token');
      expect(requireCIAccessToken).toHaveBeenCalled();
    });

    it('uses keyring (OAuth) before CI when both CI token and keyring tokens exist', async () => {
      (getCIToken as Mock).mockReturnValue('ci-refresh-token');
      (getStoredTokens as Mock).mockResolvedValue({ accessToken: 'keyring-token', refreshToken: 'keyring-refresh' });
      (isAccessTokenExpired as Mock).mockReturnValue(false);

      const token = await requireAccessTokenForScan();

      expect(token).toBe('keyring-token');
      expect(requireCIAccessToken).not.toHaveBeenCalled();
    });

    it('propagates CITokenError when requireCIAccessToken throws', async () => {
      (getCIToken as Mock).mockReturnValue('ci-refresh-token');
      (requireCIAccessToken as Mock).mockRejectedValue(new CITokenError('Org required', 'CI_ORG_ID_REQUIRED'));

      await expect(requireAccessTokenForScan()).rejects.toMatchObject({
        name: 'CITokenError',
        code: 'CI_ORG_ID_REQUIRED',
      });
    });

    it('returns token when access token is valid (login path)', async () => {
      (getStoredTokens as Mock).mockResolvedValue({ accessToken: 'valid-token' });
      (isAccessTokenExpired as Mock).mockReturnValue(false);

      const token = await requireAccessTokenForScan();
      expect(token).toBe('valid-token');
      expect(refreshTokens).not.toHaveBeenCalled();
    });

    it('auto-refreshes when access token expired with valid refresh token', async () => {
      (getStoredTokens as Mock).mockResolvedValue({ accessToken: 'expired', refreshToken: 'refresh-1' });
      (isAccessTokenExpired as Mock).mockReturnValue(true);
      (refreshTokens as Mock).mockResolvedValue({ access_token: 'new-token', refresh_token: 'refresh-2' });

      const token = await requireAccessTokenForScan();
      expect(token).toBe('new-token');
      expect(refreshTokens).toHaveBeenCalledWith('refresh-1');
      expect(saveTokens).toHaveBeenCalledWith({ accessToken: 'new-token', refreshToken: 'refresh-2' });
    });

    it('throws AuthError with NOT_LOGGED_IN when no tokens exist', async () => {
      (getStoredTokens as Mock).mockResolvedValue(undefined);

      await expect(requireAccessTokenForScan()).rejects.toMatchObject({
        name: 'AuthError',
        code: 'NOT_LOGGED_IN',
        message: AUTH_ERROR_MESSAGES.UNAUTHENTICATED,
      });
    });

    it('throws AuthError with NOT_LOGGED_IN when access token is missing', async () => {
      (getStoredTokens as Mock).mockResolvedValue({ refreshToken: 'refresh-only' });

      await expect(requireAccessTokenForScan()).rejects.toThrow(AuthError);
      await expect(requireAccessTokenForScan()).rejects.toMatchObject({
        code: 'NOT_LOGGED_IN',
      });
    });

    it('throws AuthError with SESSION_EXPIRED when refresh fails', async () => {
      (getStoredTokens as Mock).mockResolvedValue({ accessToken: 'expired', refreshToken: 'invalid-refresh' });
      (isAccessTokenExpired as Mock).mockReturnValue(true);
      (refreshTokens as Mock).mockRejectedValue(new Error('refresh failed'));

      await expect(getTokenProvider()()).rejects.toThrow(AuthError);
      await expect(requireAccessTokenForScan()).rejects.toMatchObject({
        code: 'SESSION_EXPIRED',
        message: AUTH_ERROR_MESSAGES.SESSION_EXPIRED,
      });
    });

    it('throws AuthError with SESSION_EXPIRED when access token expired and no refresh token', async () => {
      (getStoredTokens as Mock).mockResolvedValue({ accessToken: 'expired' });
      (isAccessTokenExpired as Mock).mockReturnValue(true);

      await expect(getTokenProvider()()).rejects.toThrow(AuthError);
      await expect(requireAccessTokenForScan()).rejects.toMatchObject({
        code: 'SESSION_EXPIRED',
      });
    });
  });

  describe('getTokenProvider', () => {
    it('preferOAuth=true uses only requireAccessToken, never CI', async () => {
      (getStoredTokens as Mock).mockResolvedValue({ accessToken: 'oauth-token' });
      (isAccessTokenExpired as Mock).mockReturnValue(false);
      (getCIToken as Mock).mockReturnValue('ci-token');

      const provider = getTokenProvider(true);
      const token = await provider();

      expect(token).toBe('oauth-token');
      expect(requireCIAccessToken).not.toHaveBeenCalled();
    });

    it('preferOAuth=false with OAuth tokens present returns OAuth token, does not call requireCIAccessToken', async () => {
      (getStoredTokens as Mock).mockResolvedValue({ accessToken: 'oauth-token' });
      (isAccessTokenExpired as Mock).mockReturnValue(false);
      (getCIToken as Mock).mockReturnValue('ci-token');

      const provider = getTokenProvider(false);
      const token = await provider();

      expect(token).toBe('oauth-token');
      expect(requireCIAccessToken).not.toHaveBeenCalled();
    });

    it('preferOAuth=false with only CI token calls requireCIAccessToken and returns CI access token', async () => {
      (getStoredTokens as Mock).mockResolvedValue(undefined);
      (getCIToken as Mock).mockReturnValue('ci-refresh-token');
      (requireCIAccessToken as Mock).mockResolvedValue('ci-access-token');

      const provider = getTokenProvider(false);
      const token = await provider();

      expect(token).toBe('ci-access-token');
      expect(requireCIAccessToken).toHaveBeenCalled();
    });

    it('preferOAuth=false when CI path used, getTokenForScanWithSource returns source ci', async () => {
      (getStoredTokens as Mock).mockResolvedValue(undefined);
      (getCIToken as Mock).mockReturnValue('ci-refresh-token');
      (requireCIAccessToken as Mock).mockResolvedValue('ci-access-token');

      const result = await getTokenForScanWithSource();

      expect(result.token).toBe('ci-access-token');
      expect(result.source).toBe('ci');
    });
  });

  describe('getTokenForScanWithSource', () => {
    it('returns source oauth when OAuth path is used', async () => {
      (getStoredTokens as Mock).mockResolvedValue({ accessToken: 'oauth-token' });
      (isAccessTokenExpired as Mock).mockReturnValue(false);

      const result = await getTokenForScanWithSource();

      expect(result.token).toBe('oauth-token');
      expect(result.source).toBe('oauth');
    });
  });
});
