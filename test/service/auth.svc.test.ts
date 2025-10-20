import { vi, type Mock } from 'vitest';

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

import { getAccessToken, logoutLocally, persistTokenResponse, requireAccessToken } from '../../src/service/auth.svc.ts';
import { clearStoredTokens, getStoredTokens, isAccessTokenExpired, saveTokens } from '../../src/service/auth-token.svc.ts';
import { refreshTokens } from '../../src/service/auth-refresh.svc.ts';

describe('auth.svc', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('persists token responses via keytar service', async () => {
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
});
