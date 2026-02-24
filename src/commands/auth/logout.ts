import { Command } from '@oclif/core';
import { clearTrackedIdentity } from '../../service/analytics.svc.ts';
import { logoutFromProvider } from '../../service/auth-refresh.svc.ts';
import { clearStoredTokens, getStoredTokens } from '../../service/auth-token.svc.ts';

export default class AuthLogout extends Command {
  static description = 'Logs out of HeroDevs OAuth and clears stored tokens';

  async run() {
    if (typeof (this.config as { runHook?: unknown }).runHook === 'function') {
      await this.parse(AuthLogout);
    }

    const tokens = await getStoredTokens();
    if (!tokens?.accessToken && !tokens?.refreshToken) {
      this.log('No stored authentication tokens found.');
      return;
    }

    try {
      await logoutFromProvider(tokens?.refreshToken);
      this.log('Logged out of HeroDevs OAuth provider.');
    } catch (error) {
      this.warn(`Failed to revoke tokens remotely: ${error instanceof Error ? error.message : error}`);
    }

    clearTrackedIdentity();
    await clearStoredTokens();
    this.log('Local authentication tokens removed from your system.');
  }
}
