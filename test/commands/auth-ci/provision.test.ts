import { type Mock, vi } from 'vitest';

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
import AuthCiProvision from '../../../src/commands/auth-ci/provision.ts';
import { requireAccessToken } from '../../../src/service/auth.svc.ts';
import { getCIToken, saveCIOrgId, saveCIToken } from '../../../src/service/ci-token.svc.ts';

describe('AuthCiProvision command', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (getCIToken as Mock).mockReturnValue(undefined);
  });

  it('errors when --org-id is missing', async () => {
    const command = new AuthCiProvision([], {} as Record<string, unknown>);
    vi.spyOn(command, 'parse').mockResolvedValue({ flags: { orgId: undefined }, args: {} } as never);
    vi.spyOn(command, 'error').mockImplementation((msg) => {
      throw new Error(msg as string);
    });

    await expect(command.run()).rejects.toThrow(/--org-id is required/);
    expect(provisionCIToken).not.toHaveBeenCalled();
  });

  it('errors when not logged in', async () => {
    (requireAccessToken as Mock).mockRejectedValue(new Error('not logged in'));
    const command = new AuthCiProvision([], {} as Record<string, unknown>);
    vi.spyOn(command, 'parse').mockResolvedValue({ flags: { orgId: 42 }, args: {} } as never);
    vi.spyOn(command, 'error').mockImplementation((msg) => {
      throw new Error(msg as string);
    });

    await expect(command.run()).rejects.toThrow(/logged in/);
    expect(provisionCIToken).not.toHaveBeenCalled();
  });

  it('provisions and saves CI token when logged in with --org-id', async () => {
    (requireAccessToken as Mock).mockResolvedValue('access-token');
    (provisionCIToken as Mock).mockResolvedValue({
      refresh_token: 'new-ci-refresh-token',
    });
    const command = new AuthCiProvision([], {} as Record<string, unknown>);
    vi.spyOn(command, 'parse').mockResolvedValue({ flags: { orgId: 123 }, args: {} } as never);
    const logSpy = vi.spyOn(command, 'log').mockImplementation(() => {});

    await command.run();

    expect(requireAccessToken).toHaveBeenCalled();
    expect(provisionCIToken).toHaveBeenCalledWith({ orgId: 123 });
    expect(saveCIToken).toHaveBeenCalledWith('new-ci-refresh-token');
    expect(saveCIOrgId).toHaveBeenCalledWith(123);
    expect(logSpy).toHaveBeenCalledWith('CI token provisioned and saved locally.');
    expect(logSpy).toHaveBeenCalledWith('new-ci-refresh-token');
  });

  it('provisions for different org when logged in', async () => {
    (requireAccessToken as Mock).mockResolvedValue('access-token');
    (provisionCIToken as Mock).mockResolvedValue({
      refresh_token: 'new-ci-refresh-token',
    });
    const command = new AuthCiProvision([], {} as Record<string, unknown>);
    vi.spyOn(command, 'parse').mockResolvedValue({ flags: { orgId: 456 }, args: {} } as never);
    vi.spyOn(command, 'log').mockImplementation(() => {});

    await command.run();

    expect(provisionCIToken).toHaveBeenCalledWith({ orgId: 456 });
    expect(saveCIOrgId).toHaveBeenCalledWith(456);
  });

  it('errors when provisioning fails', async () => {
    (requireAccessToken as Mock).mockResolvedValue('access-token');
    (provisionCIToken as Mock).mockRejectedValue(new Error('Provisioning failed'));
    const command = new AuthCiProvision([], {} as Record<string, unknown>);
    vi.spyOn(command, 'parse').mockResolvedValue({ flags: { orgId: 1 }, args: {} } as never);
    vi.spyOn(command, 'error').mockImplementation((msg) => {
      throw new Error(msg as string);
    });

    await expect(command.run()).rejects.toThrow(/Provisioning failed/);
    expect(saveCIToken).not.toHaveBeenCalled();
  });
});
