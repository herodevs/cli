import { Command } from '@oclif/core';
import { exchangeCITokenForAccess } from '../../api/ci-token.client.ts';
import { config } from '../../config/constants.ts';
import { getCIOrgId, getCIToken } from '../../service/ci-token.svc.ts';
import { getErrorMessage } from '../../service/log.svc.ts';

export default class AuthCiLogin extends Command {
  static override description = 'Obtain an access token for CI scans (outputs export HD_ACCESS_TOKEN=... for eval)';

  async run() {
    await this.parse(AuthCiLogin);

    const orgId = config.orgIdFromEnv ?? getCIOrgId();
    if (orgId === undefined) {
      this.error('Organization ID is required. Set HD_ORG_ID or run hd auth-ci provision --org-id <id> to store it.');
    }

    const refreshToken = getCIToken();
    if (!refreshToken) {
      this.error('CI refresh token not found. Set HD_AUTH_TOKEN or run hd auth-ci provision --org-id <id> first.');
    }

    try {
      const result = await exchangeCITokenForAccess({
        refreshToken,
        orgId,
      });

      this.log(`export HD_ACCESS_TOKEN=${JSON.stringify(result.accessToken)}`);
      if (result.refreshToken && result.refreshToken !== refreshToken) {
        this.log(`export HD_AUTH_TOKEN=${JSON.stringify(result.refreshToken)}`);
      }
    } catch (error) {
      this.error(`Failed to obtain access token. ${getErrorMessage(error)}`);
    }
  }
}
