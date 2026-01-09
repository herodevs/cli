import { type Mock, vi } from 'vitest';

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

import {
  AuthError,
  getAccessToken,
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

describe('auth.svc', () => {
  beforeEach(() => {
    vi.resetAllMocks();
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
    it('returns token when access token is valid', async () => {
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

      await expect(requireAccessTokenForScan()).rejects.toThrow(AuthError);
      await expect(requireAccessTokenForScan()).rejects.toMatchObject({
        code: 'NOT_LOGGED_IN',
        message: 'Please log in to perform a scan. To authenticate, run "hd auth login".',
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

      await expect(requireAccessTokenForScan()).rejects.toThrow(AuthError);
      await expect(requireAccessTokenForScan()).rejects.toMatchObject({
        code: 'SESSION_EXPIRED',
        message: 'Your session is no longer valid. To re-authenticate, run "hd auth login".',
      });
    });

    it('throws AuthError with SESSION_EXPIRED when access token expired and no refresh token', async () => {
      (getStoredTokens as Mock).mockResolvedValue({ accessToken: 'expired' });
      (isAccessTokenExpired as Mock).mockReturnValue(true);

      await expect(requireAccessTokenForScan()).rejects.toThrow(AuthError);
      await expect(requireAccessTokenForScan()).rejects.toMatchObject({
        code: 'SESSION_EXPIRED',
      });
    });
  });
});
