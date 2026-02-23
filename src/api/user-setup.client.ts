import type { GraphQLFormattedError } from 'graphql';
import { config } from '../config/constants.ts';
import { requireAccessToken, requireAccessTokenForScan } from '../service/auth.svc.ts';
import { getCIToken } from '../service/ci-token.svc.ts';
import { debugLogger } from '../service/log.svc.ts';
import { withRetries } from '../utils/retry.ts';
import { createApollo } from './apollo.client.ts';
import { ApiError, type ApiErrorCode, isApiErrorCode } from './errors.ts';
import { completeUserSetupMutation, userSetupStatusQuery } from './gql-operations.ts';
import { getGraphQLErrors } from './graphql-errors.ts';

const USER_SETUP_MAX_ATTEMPTS = 3;
const USER_SETUP_RETRY_DELAY_MS = 500;
const USER_FACING_SERVER_ERROR = 'Please contact support@herodevs.com.';
const SERVER_ERROR_CODES = ['INTERNAL_SERVER_ERROR', 'SERVER_ERROR', 'SERVICE_UNAVAILABLE'];

type UserSetupStatusData = { isComplete: boolean; orgId?: number | null };

type UserSetupStatusResponse = {
  eol?: {
    userSetupStatus?: UserSetupStatusData;
  };
};

type CompleteUserSetupResponse = {
  eol?: {
    completeUserSetup?: UserSetupStatusData;
  };
};

const getGraphqlUrl = () => `${config.graphqlHost}${config.graphqlPath}`;

function extractErrorCode(errors: ReadonlyArray<GraphQLFormattedError>): ApiErrorCode | undefined {
  const code = (errors[0]?.extensions as { code?: string })?.code;
  if (!code || !isApiErrorCode(code)) return;
  return code;
}

function getTokenProvider(preferOAuth?: boolean) {
  if (preferOAuth) return requireAccessToken;
  if (getCIToken() || config.accessTokenFromEnv) return requireAccessTokenForScan;
  return requireAccessToken;
}

export async function getUserSetupStatus(options?: { preferOAuth?: boolean }): Promise<{
  isComplete: boolean;
  orgId?: number | null;
}> {
  const tokenProvider = getTokenProvider(options?.preferOAuth);
  const client = createApollo(getGraphqlUrl(), tokenProvider);
  const res = await client.query<UserSetupStatusResponse>({ query: userSetupStatusQuery });

  const errors = getGraphQLErrors(res);
  if (res?.error || errors?.length) {
    debugLogger('Error returned from userSetupStatus query: %o', res.error || errors);
    if (errors?.length) {
      const rawCode = (errors[0]?.extensions as { code?: string })?.code;
      if (rawCode && SERVER_ERROR_CODES.includes(rawCode)) {
        throw new Error(USER_FACING_SERVER_ERROR);
      }
      const code = extractErrorCode(errors);
      const message = errors[0].message ?? 'Failed to check user setup status';
      if (code) {
        throw new ApiError(message, code);
      }
      throw new Error(message);
    }
    throw new Error('Failed to check user setup status');
  }

  const status = res.data?.eol?.userSetupStatus;
  if (!status || typeof status.isComplete !== 'boolean') {
    debugLogger('Unexpected userSetupStatus query response: %o', res.data);
    throw new Error('Failed to check user setup status');
  }

  return { isComplete: status.isComplete, orgId: status.orgId ?? undefined };
}

export async function completeUserSetup(options?: { preferOAuth?: boolean }): Promise<{
  isComplete: boolean;
  orgId?: number | null;
}> {
  const tokenProvider = options?.preferOAuth ? requireAccessToken : requireAccessTokenForScan;
  const client = createApollo(getGraphqlUrl(), tokenProvider);
  const res = await client.mutate<CompleteUserSetupResponse>({ mutation: completeUserSetupMutation });

  const errors = getGraphQLErrors(res);
  if (res?.error || errors?.length) {
    debugLogger('Error returned from completeUserSetup mutation: %o', res.error || errors);
    if (errors?.length) {
      const rawCode = (errors[0]?.extensions as { code?: string })?.code;
      if (rawCode && SERVER_ERROR_CODES.includes(rawCode)) {
        throw new Error(USER_FACING_SERVER_ERROR);
      }
      const code = extractErrorCode(errors);
      const message = errors[0].message ?? 'Failed to complete user setup';
      if (code) {
        throw new ApiError(message, code);
      }
      throw new Error(message);
    }
    throw new Error('Failed to complete user setup');
  }

  const result = res.data?.eol?.completeUserSetup;
  if (!result || result.isComplete !== true) {
    debugLogger('completeUserSetup mutation returned unsuccessful response: %o', res.data);
    throw new Error('Failed to complete user setup');
  }

  return { isComplete: true, orgId: result.orgId ?? undefined };
}

export async function ensureUserSetup(options?: { preferOAuth?: boolean }): Promise<number> {
  const status = await withRetries('user-setup-status', () => getUserSetupStatus(options), {
    attempts: USER_SETUP_MAX_ATTEMPTS,
    baseDelayMs: USER_SETUP_RETRY_DELAY_MS,
  });
  if (status.isComplete && status.orgId != null) {
    return status.orgId;
  }

  const result = await withRetries('user-setup-complete', () => completeUserSetup(options), {
    attempts: USER_SETUP_MAX_ATTEMPTS,
    baseDelayMs: USER_SETUP_RETRY_DELAY_MS,
  });
  if (result.orgId != null) {
    return result.orgId;
  }

  throw new Error(`User setup did not return an organization ID. ${USER_FACING_SERVER_ERROR}`);
}
