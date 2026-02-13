import { type Mock, vi } from 'vitest';

const { mockConfig } = vi.hoisted(() => ({
  mockConfig: {
    orgIdFromEnv: undefined as number | undefined,
    ciTokenFromEnv: undefined as string | undefined,
  },
}));

vi.mock('../../../src/config/constants.ts', () => ({
  config: mockConfig,
}));

vi.mock('../../../src/api/ci-token.client.ts', () => ({
  __esModule: true,
  exchangeCITokenForAccess: vi.fn(),
}));

vi.mock('../../../src/service/ci-token.svc.ts', () => ({
  __esModule: true,
  getCIToken: vi.fn(),
  getCIOrgId: vi.fn(),
}));

import { exchangeCITokenForAccess } from '../../../src/api/ci-token.client.ts';
import AuthCiLogin from '../../../src/commands/auth-ci/login.ts';
import { getCIOrgId, getCIToken } from '../../../src/service/ci-token.svc.ts';

describe('AuthCiLogin command', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockConfig.orgIdFromEnv = undefined;
    mockConfig.ciTokenFromEnv = undefined;
  });

  it('outputs export HD_ACCESS_TOKEN when exchange succeeds', async () => {
    (getCIOrgId as Mock).mockReturnValue(42);
    (getCIToken as Mock).mockReturnValue('ci-refresh-token');
    (exchangeCITokenForAccess as Mock).mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'ci-refresh-token',
    });
    const command = new AuthCiLogin([], {} as Record<string, unknown>);
    vi.spyOn(command, 'parse').mockResolvedValue({ flags: {}, args: {} } as never);
    const logSpy = vi.spyOn(command, 'log').mockImplementation(() => {});

    await command.run();

    expect(logSpy).toHaveBeenCalledWith('export HD_ACCESS_TOKEN="new-access-token"');
    expect(exchangeCITokenForAccess).toHaveBeenCalledWith({
      refreshToken: 'ci-refresh-token',
      orgId: 42,
    });
  });

  it('outputs HD_AUTH_TOKEN when refresh token is rotated', async () => {
    (getCIOrgId as Mock).mockReturnValue(42);
    (getCIToken as Mock).mockReturnValue('old-refresh-token');
    (exchangeCITokenForAccess as Mock).mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'rotated-refresh-token',
    });
    const command = new AuthCiLogin([], {} as Record<string, unknown>);
    vi.spyOn(command, 'parse').mockResolvedValue({ flags: {}, args: {} } as never);
    const logSpy = vi.spyOn(command, 'log').mockImplementation(() => {});

    await command.run();

    expect(logSpy).toHaveBeenCalledWith('export HD_ACCESS_TOKEN="new-access-token"');
    expect(logSpy).toHaveBeenCalledWith('export HD_AUTH_TOKEN="rotated-refresh-token"');
  });

  it('uses orgIdFromEnv when set', async () => {
    mockConfig.orgIdFromEnv = 123;
    (getCIToken as Mock).mockReturnValue('ci-refresh-token');
    (exchangeCITokenForAccess as Mock).mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
    });
    const command = new AuthCiLogin([], {} as Record<string, unknown>);
    vi.spyOn(command, 'parse').mockResolvedValue({ flags: {}, args: {} } as never);
    vi.spyOn(command, 'log').mockImplementation(() => {});

    await command.run();

    expect(exchangeCITokenForAccess).toHaveBeenCalledWith(expect.objectContaining({ orgId: 123 }));
    expect(getCIOrgId).not.toHaveBeenCalled();
  });

  it('errors when orgId is missing', async () => {
    (getCIOrgId as Mock).mockReturnValue(undefined);
    (getCIToken as Mock).mockReturnValue('ci-refresh-token');
    const command = new AuthCiLogin([], {} as Record<string, unknown>);
    vi.spyOn(command, 'parse').mockResolvedValue({ flags: {}, args: {} } as never);
    vi.spyOn(command, 'error').mockImplementation((msg) => {
      throw new Error(msg as string);
    });

    await expect(command.run()).rejects.toThrow(/Organization ID is required/);
    expect(exchangeCITokenForAccess).not.toHaveBeenCalled();
  });

  it('errors when CI token is missing', async () => {
    (getCIOrgId as Mock).mockReturnValue(42);
    (getCIToken as Mock).mockReturnValue(undefined);
    const command = new AuthCiLogin([], {} as Record<string, unknown>);
    vi.spyOn(command, 'parse').mockResolvedValue({ flags: {}, args: {} } as never);
    vi.spyOn(command, 'error').mockImplementation((msg) => {
      throw new Error(msg as string);
    });

    await expect(command.run()).rejects.toThrow(/CI refresh token not found/);
    expect(exchangeCITokenForAccess).not.toHaveBeenCalled();
  });
});
