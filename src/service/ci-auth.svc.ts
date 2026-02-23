import { exchangeCITokenForAccess } from '../api/ci-token.client.ts';
import { config } from '../config/constants.ts';
import { getCIOrgId, getCIToken, saveCIToken } from './ci-token.svc.ts';
import { debugLogger } from './log.svc.ts';

export type CITokenErrorCode = 'CI_TOKEN_INVALID' | 'CI_TOKEN_REFRESH_FAILED' | 'CI_ORG_ID_REQUIRED';

const CITOKEN_ERROR_MESSAGE =
  "CI token is invalid or expired. To provision a new CI token, run 'hd auth provision-ci-token' (after logging in with 'hd auth login').";

const CI_ORG_ID_ERROR_MESSAGE =
  'Organization ID is required for CI token. Set HD_CI_CREDENTIAL to <orgId>:<refreshToken> (e.g. HD_CI_CREDENTIAL=123:eyJ...). When using a locally stored CI token, re-provision with: hd auth provision-ci-token';

export class CITokenError extends Error {
  readonly code: CITokenErrorCode;

  constructor(message: string, code: CITokenErrorCode) {
    super(message);
    this.name = 'CITokenError';
    this.code = code;
  }
}

export async function requireCIAccessToken(): Promise<string> {
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
