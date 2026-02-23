import { type Mock, vi } from 'vitest';

const { mockConfig } = vi.hoisted(() => ({
  mockConfig: {
    ciTokenFromEnv: undefined as string | undefined,
    orgIdFromEnv: undefined as number | undefined,
    accessTokenFromEnv: undefined as string | undefined,
  },
}));

vi.mock('../../src/config/constants.ts', () => ({
  config: mockConfig,
}));

vi.mock('../../src/service/auth-token.svc.ts', () => ({
  __esModule: true,
  isAccessTokenExpired: vi.fn(),
}));

vi.mock('../../src/api/ci-token.client.ts', () => ({
  __esModule: true,
  exchangeCITokenForAccess: vi.fn(),
}));

vi.mock('../../src/service/ci-token.svc.ts', () => ({
  __esModule: true,
  getCIToken: vi.fn(),
  getCIOrgId: vi.fn(),
  saveCIToken: vi.fn(),
}));

import { exchangeCITokenForAccess } from '../../src/api/ci-token.client.ts';
import { requireCIAccessToken } from '../../src/service/ci-auth.svc.ts';
import { getCIOrgId, getCIToken, saveCIToken } from '../../src/service/ci-token.svc.ts';

describe('ci-auth.svc', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (getCIToken as Mock).mockReturnValue(undefined);
    (getCIOrgId as Mock).mockReturnValue(undefined);
    mockConfig.ciTokenFromEnv = undefined;
    mockConfig.orgIdFromEnv = undefined;
    mockConfig.accessTokenFromEnv = undefined;
  });

  it('uses orgIdFromEnv when ciTokenFromEnv is set', async () => {
    mockConfig.ciTokenFromEnv = 'env-refresh-token';
    mockConfig.orgIdFromEnv = 123;
    (getCIToken as Mock).mockReturnValue('env-refresh-token');
    (exchangeCITokenForAccess as Mock).mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
    });

    await requireCIAccessToken();
    expect(exchangeCITokenForAccess).toHaveBeenCalledWith({
      refreshToken: 'env-refresh-token',
      orgId: 123,
      optionalAccessToken: undefined,
    });
    expect(getCIOrgId).not.toHaveBeenCalled();
  });

  it('does not saveCIToken when token comes from env', async () => {
    mockConfig.ciTokenFromEnv = 'env-refresh-token';
    mockConfig.orgIdFromEnv = 123;
    (getCIToken as Mock).mockReturnValue('env-refresh-token');
    (exchangeCITokenForAccess as Mock).mockResolvedValue({
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
    expect(exchangeCITokenForAccess).not.toHaveBeenCalled();
  });

  it('throws when orgId cannot be resolved', async () => {
    (getCIToken as Mock).mockReturnValue('ci-refresh-token');
    (getCIOrgId as Mock).mockReturnValue(undefined);

    await expect(requireCIAccessToken()).rejects.toMatchObject({
      name: 'CITokenError',
      code: 'CI_ORG_ID_REQUIRED',
      message: expect.stringContaining('HD_ORG_ID'),
    });
    expect(exchangeCITokenForAccess).not.toHaveBeenCalled();
  });

  it('throws when exchange fails', async () => {
    (getCIToken as Mock).mockReturnValue('ci-refresh-token');
    (getCIOrgId as Mock).mockReturnValue(42);
    (exchangeCITokenForAccess as Mock).mockRejectedValue(new Error('exchange failed'));

    await expect(requireCIAccessToken()).rejects.toMatchObject({
      name: 'CITokenError',
      code: 'CI_TOKEN_REFRESH_FAILED',
    });
  });
});
