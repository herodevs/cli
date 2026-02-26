import { Command } from '@oclif/core';
import { provisionCIToken } from '../../api/ci-token.client.ts';
import { ensureUserSetup } from '../../api/user-setup.client.ts';
import { refreshIdentityFromStoredToken, track } from '../../service/analytics.svc.ts';
import { requireAccessToken } from '../../service/auth.svc.ts';
import { saveCIToken } from '../../service/ci-token.svc.ts';
import { getErrorMessage } from '../../service/log.svc.ts';

export default class AuthProvisionCiToken extends Command {
  static override description = 'Provision a CI/CD long-lived refresh token for headless auth';

  async run() {
    await this.parse(AuthProvisionCiToken);

    try {
      await requireAccessToken();
    } catch (error) {
      this.error(`Must be logged in to provision CI token. Run 'hd auth login' first. ${getErrorMessage(error)}`);
    }

    try {
      await refreshIdentityFromStoredToken();
    } catch (error) {
      this.warn(`Failed to refresh analytics identity: ${getErrorMessage(error)}`);
    }

    track('CLI CI Token Provision Started', (context) => ({
      command: 'auth provision-ci-token',
      app_used: context.app_used,
      ci_provider: context.ci_provider,
      cli_version: context.cli_version,
      started_at: context.started_at,
    }));

    let orgId: number;
    try {
      orgId = await ensureUserSetup();
    } catch (error) {
      track('CLI CI Token Provision Failed', () => ({
        command: 'auth provision-ci-token',
        error: `user_setup_failed:${getErrorMessage(error)}`,
      }));
      this.error(`User setup failed. ${getErrorMessage(error)}`);
    }

    try {
      const result = await provisionCIToken({ orgId });
      try {
        await ensureUserSetup({ orgAccessToken: result.access_token });
      } catch (error) {
        track('CLI CI Token Provision Failed', () => ({
          command: 'auth provision-ci-token',
          error: `user_setup_failed:${getErrorMessage(error)}`,
        }));
        this.error(`User Org setup failed. ${getErrorMessage(error)}`);
      }
      const refreshToken = result.refresh_token;
      saveCIToken(refreshToken);
      this.log('CI token provisioned and saved locally.');
      this.log('');
      this.log('For CI/CD, set this environment variable:');
      this.log(`  HD_CI_CREDENTIAL=${refreshToken}`);
      track('CLI CI Token Provision Succeeded', () => ({
        command: 'auth provision-ci-token',
      }));
    } catch (error) {
      track('CLI CI Token Provision Failed', () => ({
        command: 'auth provision-ci-token',
        error: `provision_failed:${getErrorMessage(error)}`,
      }));
      this.error(`CI token provisioning failed. ${getErrorMessage(error)}`);
    }
  }
}
