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
  isAccessTokenExpired: vi.fn(),
}));

vi.mock('../../src/service/ci-token.svc.ts', () => ({
  __esModule: true,
  getCIToken: vi.fn(),
  saveCIToken: vi.fn(),
}));

import * as ciTokenClient from '../../src/api/ci-token.client.ts';
import { ApiError, INVALID_TOKEN_ERROR_CODE } from '../../src/api/errors.ts';
import { requireCIAccessToken } from '../../src/service/ci-auth.svc.ts';
import { getCIToken, saveCIToken } from '../../src/service/ci-token.svc.ts';

function createTokenWithExp(offsetSeconds: number) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + offsetSeconds })).toString(
    'base64url',
  );
  return `${header}.${payload}.signature`;
}

describe('ci-auth.svc', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (getCIToken as Mock).mockReturnValue(undefined);
    mockConfig.ciTokenFromEnv = undefined;
  });

  it('does not saveCIToken when token comes from env', async () => {
    mockConfig.ciTokenFromEnv = 'env-refresh-token';
    (getCIToken as Mock).mockReturnValue('env-refresh-token');
    vi.spyOn(ciTokenClient, 'exchangeCITokenForAccess').mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'rotated-refresh',
    });

    await requireCIAccessToken();
    expect(saveCIToken).not.toHaveBeenCalled();
  });

  it('throws when CI token is missing', async () => {
    (getCIToken as Mock).mockReturnValue(undefined);

    await expect(requireCIAccessToken()).rejects.toMatchObject({
      name: 'CITokenError',
      code: 'CI_TOKEN_INVALID',
    });
    expect(ciTokenClient.exchangeCITokenForAccess).not.toHaveBeenCalled();
  });

  it('throws expired error without exchanging the CI token when JWT exp is expired', async () => {
    (getCIToken as Mock).mockReturnValue(createTokenWithExp(-60));
    const exchangeSpy = vi.spyOn(ciTokenClient, 'exchangeCITokenForAccess');

    await expect(requireCIAccessToken()).rejects.toMatchObject({
      name: 'CITokenError',
      code: 'CI_TOKEN_EXPIRED',
      message:
        'Your CI token has expired. To provision a new CI token, run hd auth provision-ci-token (after logging in with hd auth login).',
    });
    expect(exchangeSpy).not.toHaveBeenCalled();
  });

  it('throws expired error for env CI token without exchanging when JWT exp is expired', async () => {
    const expiredToken = createTokenWithExp(-60);
    mockConfig.ciTokenFromEnv = expiredToken;
    (getCIToken as Mock).mockReturnValue(expiredToken);
    const exchangeSpy = vi.spyOn(ciTokenClient, 'exchangeCITokenForAccess');

    await expect(requireCIAccessToken()).rejects.toMatchObject({
      name: 'CITokenError',
      code: 'CI_TOKEN_EXPIRED',
    });
    expect(exchangeSpy).not.toHaveBeenCalled();
  });

  it('exchanges the CI token when JWT exp is not expired', async () => {
    (getCIToken as Mock).mockReturnValue(createTokenWithExp(120));
    const exchangeSpy = vi.spyOn(ciTokenClient, 'exchangeCITokenForAccess').mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'rotated-refresh',
    });

    await expect(requireCIAccessToken()).resolves.toBe('access');
    expect(exchangeSpy).toHaveBeenCalledOnce();
  });

  it('throws refresh failure when exchange is explicitly rejected by the server', async () => {
    (getCIToken as Mock).mockReturnValue('ci-refresh-token');
    vi.spyOn(ciTokenClient, 'exchangeCITokenForAccess').mockRejectedValue(
      new ApiError('Invalid refresh token', INVALID_TOKEN_ERROR_CODE),
    );

    await expect(requireCIAccessToken()).rejects.toMatchObject({
      name: 'CITokenError',
      code: 'CI_TOKEN_REFRESH_FAILED',
    });
  });

  it('throws communication failure when exchange returns malformed/null server data', async () => {
    (getCIToken as Mock).mockReturnValue('ci-refresh-token');
    vi.spyOn(ciTokenClient, 'exchangeCITokenForAccess').mockRejectedValue(
      new ciTokenClient.CITokenCommunicationError('getOrgAccessTokens response missing accessToken'),
    );

    await expect(requireCIAccessToken()).rejects.toMatchObject({
      name: 'CITokenError',
      code: 'CI_TOKEN_COMMUNICATION_FAILED',
      message:
        'There was an error communicating with the HeroDevs server while refreshing the CI token. Please verify server connectivity/configuration and try again.',
    });
  });

  it('defaults unexpected exchange failures to communication failure', async () => {
    (getCIToken as Mock).mockReturnValue('ci-refresh-token');
    vi.spyOn(ciTokenClient, 'exchangeCITokenForAccess').mockRejectedValue(
      new Error('connect ETIMEDOUT gateway.prod.apps.herodevs.io'),
    );

    await expect(requireCIAccessToken()).rejects.toMatchObject({
      name: 'CITokenError',
      code: 'CI_TOKEN_COMMUNICATION_FAILED',
    });
  });
});
