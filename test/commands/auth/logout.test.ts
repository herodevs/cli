import { vi, type Mock } from 'vitest';

vi.mock('../../../src/service/auth-token.svc.ts', () => ({
  __esModule: true,
  getStoredTokens: vi.fn(),
  clearStoredTokens: vi.fn(),
}));

vi.mock('../../../src/service/auth-refresh.svc.ts', () => ({
  __esModule: true,
  logoutFromProvider: vi.fn().mockResolvedValue(undefined),
}));

import AuthLogout from '../../../src/commands/auth/logout.ts';
import { clearStoredTokens, getStoredTokens } from '../../../src/service/auth-token.svc.ts';
import { logoutFromProvider } from '../../../src/service/auth-refresh.svc.ts';

describe('AuthLogout command', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('logs when there are no stored tokens', async () => {
    (getStoredTokens as Mock).mockResolvedValue(undefined);
    const command = new AuthLogout([], {} as Record<string, unknown>);
    const logSpy = vi.spyOn(command, 'log').mockImplementation(() => {});

    await command.run();

    expect(logSpy).toHaveBeenCalledWith('No stored authentication tokens found.');
    expect(clearStoredTokens).not.toHaveBeenCalled();
  });

  it('revokes tokens and clears local storage', async () => {
    (getStoredTokens as Mock).mockResolvedValue({ refreshToken: 'refresh', accessToken: 'access' });
    const command = new AuthLogout([], {} as Record<string, unknown>);
    const logSpy = vi.spyOn(command, 'log').mockImplementation(() => {});

    await command.run();

    expect(logoutFromProvider).toHaveBeenCalledWith('refresh');
    expect(clearStoredTokens).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith('Local authentication tokens removed from your system.');
  });

  it('warns when remote logout fails but still clears tokens', async () => {
    (getStoredTokens as Mock).mockResolvedValue({ refreshToken: 'refresh' });
    (logoutFromProvider as Mock).mockRejectedValueOnce(new Error('network fail'));
    const command = new AuthLogout([], {} as Record<string, unknown>);
    const warnSpy = vi.spyOn(command, 'warn').mockImplementation((msg) => msg);

    await command.run();

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('network fail'));
    expect(clearStoredTokens).toHaveBeenCalled();
  });
});
