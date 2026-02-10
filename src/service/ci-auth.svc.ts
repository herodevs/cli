import { exchangeCITokenForAccess } from '../api/ci-token.client.ts';
import { config } from '../config/constants.ts';
import { isAccessTokenExpired } from './auth-token.svc.ts';
import { getCIOrgId, getCIToken, saveCIToken } from './ci-token.svc.ts';
import { debugLogger } from './log.svc.ts';

export type CITokenErrorCode = 'CI_TOKEN_INVALID' | 'CI_TOKEN_REFRESH_FAILED' | 'CI_ORG_ID_REQUIRED';

const CITOKEN_ERROR_MESSAGE =
  "CI token is invalid or expired. To provision a new CI token, run 'hd auth-ci provision --org-id <id>' (after logging in with 'hd auth login').";

const CI_ORG_ID_ERROR_MESSAGE =
  'Organization ID is required for CI token. When using HD_AUTH_TOKEN, set HD_ORG_ID to your organization ID (e.g. HD_ORG_ID=123). When using a locally stored CI token, re-provision with: hd auth-ci provision --org-id <id>';

export class CITokenError extends Error {
  readonly code: CITokenErrorCode;

  constructor(message: string, code: CITokenErrorCode) {
    super(message);
    this.name = 'CITokenError';
    this.code = code;
  }
}

export async function requireCIAccessToken(): Promise<string> {
  if (config.accessTokenFromEnv && !isAccessTokenExpired(config.accessTokenFromEnv)) {
    return config.accessTokenFromEnv;
  }

  const ciToken = getCIToken();
  if (!ciToken) {
    throw new CITokenError(CITOKEN_ERROR_MESSAGE, 'CI_TOKEN_INVALID');
  }

  const orgId = config.ciTokenFromEnv !== undefined ? config.orgIdFromEnv : getCIOrgId();
  if (orgId === undefined) {
    throw new CITokenError(CI_ORG_ID_ERROR_MESSAGE, 'CI_ORG_ID_REQUIRED');
  }

  try {
    const result = await exchangeCITokenForAccess({
      refreshToken: ciToken,
      orgId,
      optionalAccessToken: config.accessTokenFromEnv,
    });
    if (result.refreshToken && config.ciTokenFromEnv === undefined) {
      saveCIToken(result.refreshToken);
    }
    return result.accessToken;
  } catch (error) {
    debugLogger('CI token refresh failed: %O', error);
    throw new CITokenError(CITOKEN_ERROR_MESSAGE, 'CI_TOKEN_REFRESH_FAILED');
  }
}
