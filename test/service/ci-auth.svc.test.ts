import { type Mock, vi } from 'vitest';

const { mockConfig } = vi.hoisted(() => ({
  mockConfig: {
    ciTokenFromEnv: undefined as string | undefined,
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
  saveCIToken: vi.fn(),
}));

import { exchangeCITokenForAccess } from '../../src/api/ci-token.client.ts';
import { requireCIAccessToken } from '../../src/service/ci-auth.svc.ts';
import { getCIToken, saveCIToken } from '../../src/service/ci-token.svc.ts';

describe('ci-auth.svc', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (getCIToken as Mock).mockReturnValue(undefined);
    mockConfig.ciTokenFromEnv = undefined;
    mockConfig.accessTokenFromEnv = undefined;
  });

  it('does not saveCIToken when token comes from env', async () => {
    mockConfig.ciTokenFromEnv = 'env-refresh-token';
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

  it('throws when exchange fails', async () => {
    (getCIToken as Mock).mockReturnValue('ci-refresh-token');
    (exchangeCITokenForAccess as Mock).mockRejectedValue(new Error('exchange failed'));

    await expect(requireCIAccessToken()).rejects.toMatchObject({
      name: 'CITokenError',
      code: 'CI_TOKEN_REFRESH_FAILED',
    });
  });
});
