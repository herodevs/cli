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
  saveCIOrgId: vi.fn(),
  saveCIToken: vi.fn(),
}));

import { provisionCIToken } from '../../../src/api/ci-token.client.ts';
import { ensureUserSetup } from '../../../src/api/user-setup.client.ts';
import AuthProvisionCiToken from '../../../src/commands/auth/provision-ci-token.ts';
import { requireAccessToken } from '../../../src/service/auth.svc.ts';
import { getCIToken, saveCIOrgId, saveCIToken } from '../../../src/service/ci-token.svc.ts';

describe('AuthProvisionCiToken command', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (getCIToken as Mock).mockReturnValue(undefined);
    (ensureUserSetup as Mock).mockResolvedValue(42);
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
    expect(ensureUserSetup).toHaveBeenCalledWith({ preferOAuth: true });
    expect(provisionCIToken).toHaveBeenCalledWith({ orgId: 123 });
    expect(saveCIToken).toHaveBeenCalledWith('new-ci-refresh-token');
    expect(saveCIOrgId).toHaveBeenCalledWith(123);
    expect(logSpy).toHaveBeenCalledWith('CI token provisioned and saved locally.');
    expect(logSpy).toHaveBeenCalledWith('  HD_ORG_ID=123');
    expect(logSpy).toHaveBeenCalledWith('  HD_AUTH_TOKEN=new-ci-refresh-token');
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

    expect(ensureUserSetup).toHaveBeenCalledWith({ preferOAuth: true });
    expect(provisionCIToken).toHaveBeenCalledWith({ orgId: 456 });
    expect(saveCIOrgId).toHaveBeenCalledWith(456);
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
  });

  it('errors when provisioning fails', async () => {
    (requireAccessToken as Mock).mockResolvedValue('access-token');
    (ensureUserSetup as Mock).mockResolvedValue(1);
    (provisionCIToken as Mock).mockRejectedValue(new Error('Provisioning failed'));
    const command = new AuthProvisionCiToken([], {} as Record<string, unknown>);
    vi.spyOn(command, 'parse').mockResolvedValue({ flags: {}, args: {} } as never);
    vi.spyOn(command, 'error').mockImplementation((msg) => {
      throw new Error(msg as string);
    });

    await expect(command.run()).rejects.toThrow(/Provisioning failed/);
    expect(saveCIToken).not.toHaveBeenCalled();
  });
});
