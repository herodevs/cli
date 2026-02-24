import { Command } from '@oclif/core';
import { provisionCIToken } from '../../api/ci-token.client.ts';
import { ensureUserSetup } from '../../api/user-setup.client.ts';
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

    let orgId: number;
    try {
      orgId = await ensureUserSetup();
    } catch (error) {
      this.error(`User setup failed. ${getErrorMessage(error)}`);
    }

    try {
      const result = await provisionCIToken({ orgId });
      const refreshToken = result.refresh_token;
      saveCIToken(refreshToken);
      this.log('CI token provisioned and saved locally.');
      this.log('');
      this.log('For CI/CD, set this environment variable:');
      this.log(`  HD_CI_CREDENTIAL=${refreshToken}`);
    } catch (error) {
      this.error(`CI token provisioning failed. ${getErrorMessage(error)}`);
    }
  }
}
