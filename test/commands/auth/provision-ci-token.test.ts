import { type Mock, vi } from 'vitest';

vi.mock('../../../src/api/user-setup.client.ts', () => ({
  __esModule: true,
  ensureUserSetup: vi.fn(),
}));

vi.mock('../../../src/service/auth.svc.ts', () => ({
  __esModule: true,
  requireAccessToken: vi.fn(),
}));

vi.mock('../../../src/api/ci-token.client.ts', () => ({
  __esModule: true,
  provisionCIToken: vi.fn(),
}));

vi.mock('../../../src/service/ci-token.svc.ts', () => ({
  __esModule: true,
  getCIToken: vi.fn(),
  saveCIToken: vi.fn(),
}));

vi.mock('../../../src/service/analytics.svc.ts', () => ({
  __esModule: true,
  refreshIdentityFromStoredToken: vi.fn(),
  track: vi.fn(),
}));

import { provisionCIToken } from '../../../src/api/ci-token.client.ts';
import { ensureUserSetup } from '../../../src/api/user-setup.client.ts';
import AuthProvisionCiToken from '../../../src/commands/auth/provision-ci-token.ts';
import { refreshIdentityFromStoredToken, track } from '../../../src/service/analytics.svc.ts';
import { requireAccessToken } from '../../../src/service/auth.svc.ts';
import { getCIToken, saveCIToken } from '../../../src/service/ci-token.svc.ts';

describe('AuthProvisionCiToken command', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (getCIToken as Mock).mockReturnValue(undefined);
    (ensureUserSetup as Mock).mockResolvedValue(42);
    (refreshIdentityFromStoredToken as Mock).mockResolvedValue(true);
  });

  it('errors when not logged in', async () => {
    (requireAccessToken as Mock).mockRejectedValue(new Error('not logged in'));
    const command = new AuthProvisionCiToken([], {} as Record<string, unknown>);
    vi.spyOn(command, 'parse').mockResolvedValue({ flags: {}, args: {} } as never);
    vi.spyOn(command, 'error').mockImplementation((msg) => {
      throw new Error(msg as string);
    });

    await expect(command.run()).rejects.toThrow(/logged in/);
    expect(provisionCIToken).not.toHaveBeenCalled();
    expect(refreshIdentityFromStoredToken).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
  });

  it('provisions and saves CI token when logged in', async () => {
    (requireAccessToken as Mock).mockResolvedValue('access-token');
    (ensureUserSetup as Mock).mockResolvedValue(123);
    (provisionCIToken as Mock).mockResolvedValue({
      refresh_token: 'new-ci-refresh-token',
    });
    const command = new AuthProvisionCiToken([], {} as Record<string, unknown>);
    vi.spyOn(command, 'parse').mockResolvedValue({ flags: {}, args: {} } as never);
    const logSpy = vi.spyOn(command, 'log').mockImplementation(() => {});

    await command.run();

    expect(requireAccessToken).toHaveBeenCalled();
    expect(refreshIdentityFromStoredToken).toHaveBeenCalled();
    expect(ensureUserSetup).toHaveBeenCalled();
    expect(provisionCIToken).toHaveBeenCalledWith({ orgId: 123 });
    expect(saveCIToken).toHaveBeenCalledWith('new-ci-refresh-token');
    expect(logSpy).toHaveBeenCalledWith('CI token provisioned and saved locally.');
    expect(logSpy).toHaveBeenCalledWith('  HD_CI_CREDENTIAL=new-ci-refresh-token');
    expect(track).toHaveBeenNthCalledWith(1, 'CLI CI Token Provision Started', expect.any(Function));
    expect(track).toHaveBeenNthCalledWith(2, 'CLI CI Token Provision Succeeded', expect.any(Function));
  });

  it('provisions for different org when logged in', async () => {
    (requireAccessToken as Mock).mockResolvedValue('access-token');
    (ensureUserSetup as Mock).mockResolvedValue(456);
    (provisionCIToken as Mock).mockResolvedValue({
      refresh_token: 'new-ci-refresh-token',
    });
    const command = new AuthProvisionCiToken([], {} as Record<string, unknown>);
    vi.spyOn(command, 'parse').mockResolvedValue({ flags: {}, args: {} } as never);
    vi.spyOn(command, 'log').mockImplementation(() => {});

    await command.run();

    expect(ensureUserSetup).toHaveBeenCalled();
    expect(provisionCIToken).toHaveBeenCalledWith({ orgId: 456 });
    expect(track).toHaveBeenNthCalledWith(1, 'CLI CI Token Provision Started', expect.any(Function));
    expect(track).toHaveBeenNthCalledWith(2, 'CLI CI Token Provision Succeeded', expect.any(Function));
  });

  it('errors when user setup fails', async () => {
    (requireAccessToken as Mock).mockResolvedValue('access-token');
    (ensureUserSetup as Mock).mockRejectedValue(new Error('User setup did not return an organization ID'));
    const command = new AuthProvisionCiToken([], {} as Record<string, unknown>);
    vi.spyOn(command, 'parse').mockResolvedValue({ flags: {}, args: {} } as never);
    vi.spyOn(command, 'error').mockImplementation((msg) => {
      throw new Error(msg as string);
    });

    await expect(command.run()).rejects.toThrow(/User setup failed/);
    expect(provisionCIToken).not.toHaveBeenCalled();
    expect(track).toHaveBeenNthCalledWith(1, 'CLI CI Token Provision Started', expect.any(Function));
    expect(track).toHaveBeenNthCalledWith(2, 'CLI CI Token Provision Failed', expect.any(Function));
  });

  it('errors when provisioning fails', async () => {
    (requireAccessToken as Mock).mockResolvedValue('access-token');
    (ensureUserSetup as Mock).mockResolvedValue(99);
    (provisionCIToken as Mock).mockRejectedValue(new Error('Provisioning failed'));
    const command = new AuthProvisionCiToken([], {} as Record<string, unknown>);
    vi.spyOn(command, 'parse').mockResolvedValue({ flags: {}, args: {} } as never);
    vi.spyOn(command, 'error').mockImplementation((msg) => {
      throw new Error(msg as string);
    });

    await expect(command.run()).rejects.toThrow(/Provisioning failed/);
    expect(saveCIToken).not.toHaveBeenCalled();
    expect(track).toHaveBeenNthCalledWith(1, 'CLI CI Token Provision Started', expect.any(Function));
    expect(track).toHaveBeenNthCalledWith(2, 'CLI CI Token Provision Failed', expect.any(Function));
  });
});
