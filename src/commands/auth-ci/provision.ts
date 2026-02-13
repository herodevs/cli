import { Command, Flags } from '@oclif/core';
import { provisionCIToken } from '../../api/ci-token.client.ts';
import { requireAccessToken } from '../../service/auth.svc.ts';
import { saveCIOrgId, saveCIToken } from '../../service/ci-token.svc.ts';
import { getErrorMessage } from '../../service/log.svc.ts';

export default class AuthCiProvision extends Command {
  static override description = 'Provision a CI/CD long-lived refresh token for headless auth';

  static override flags = {
    orgId: Flags.integer({
      description: 'Organization ID for the CI token (required)',
      required: true,
      aliases: ['org-id'],
    }),
  };

  async run() {
    const { flags } = await this.parse(AuthCiProvision);
    const orgId = flags.orgId;
    if (orgId === undefined) {
      this.error('--org-id is required');
    }

    try {
      await requireAccessToken();
    } catch (error) {
      this.error(`Must be logged in to provision CI token. Run 'hd auth login' first. ${getErrorMessage(error)}`);
    }

    try {
      const result = await provisionCIToken({ orgId });
      const refreshToken = result.refresh_token;
      saveCIToken(refreshToken);
      saveCIOrgId(orgId);
      this.log('CI token provisioned and saved locally.');
      this.log(refreshToken);
    } catch (error) {
      this.error(`CI token provisioning failed. ${getErrorMessage(error)}`);
    }
  }
}
