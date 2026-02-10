import type { GraphQLFormattedError } from 'graphql';
import { config } from '../config/constants.ts';
import { requireAccessToken, requireAccessTokenForScan } from '../service/auth.svc.ts';
import { debugLogger } from '../service/log.svc.ts';
import { withRetries } from '../utils/retry.ts';
import { createApollo } from './apollo.client.ts';
import { ApiError, type ApiErrorCode, isApiErrorCode } from './errors.ts';
import { completeUserSetupMutation, userSetupStatusQuery } from './gql-operations.ts';
import { getGraphQLErrors } from './graphql-errors.ts';

const USER_SETUP_MAX_ATTEMPTS = 3;
const USER_SETUP_RETRY_DELAY_MS = 500;

type UserSetupStatusResponse = {
  eol?: {
    userSetupStatus?: boolean;
  };
};

type CompleteUserSetupResponse = {
  eol?: {
    completeUserSetup?: boolean;
  };
};

const getGraphqlUrl = () => `${config.graphqlHost}${config.graphqlPath}`;

function extractErrorCode(errors: ReadonlyArray<GraphQLFormattedError>): ApiErrorCode | undefined {
  const code = (errors[0]?.extensions as { code?: string })?.code;
  if (!code || !isApiErrorCode(code)) return;
  return code;
}

export async function getUserSetupStatus(): Promise<boolean> {
  const client = createApollo(getGraphqlUrl(), requireAccessToken);
  const res = await client.query<UserSetupStatusResponse>({ query: userSetupStatusQuery });

  const errors = getGraphQLErrors(res);
  if (res?.error || errors?.length) {
    debugLogger('Error returned from userSetupStatus query: %o', res.error || errors);
    if (errors?.length) {
      const code = extractErrorCode(errors);
      const message = errors[0].message ?? 'Failed to check user setup status';
      if (code) {
        throw new ApiError(message, code);
      }
      throw new Error(message);
    }
    throw new Error('Failed to check user setup status');
  }

  const isComplete = res.data?.eol?.userSetupStatus;
  if (typeof isComplete !== 'boolean') {
    debugLogger('Unexpected userSetupStatus query response: %o', res.data);
    throw new Error('Failed to check user setup status');
  }

  return isComplete;
}

export async function completeUserSetup(): Promise<boolean> {
  const client = createApollo(getGraphqlUrl(), requireAccessTokenForScan);
  const res = await client.mutate<CompleteUserSetupResponse>({ mutation: completeUserSetupMutation });

  const errors = getGraphQLErrors(res);
  if (res?.error || errors?.length) {
    debugLogger('Error returned from completeUserSetup mutation: %o', res.error || errors);
    if (errors?.length) {
      const code = extractErrorCode(errors);
      const message = errors[0].message ?? 'Failed to complete user setup';
      if (code) {
        throw new ApiError(message, code);
      }
      throw new Error(message);
    }
    throw new Error('Failed to complete user setup');
  }

  const success = res.data?.eol?.completeUserSetup;
  if (!success) {
    debugLogger('completeUserSetup mutation returned unsuccessful response: %o', res.data);
    throw new Error('Failed to complete user setup');
  }

  return success;
}

export async function ensureUserSetup(): Promise<void> {
  const isComplete = await withRetries('user-setup-status', () => getUserSetupStatus(), {
    attempts: USER_SETUP_MAX_ATTEMPTS,
    baseDelayMs: USER_SETUP_RETRY_DELAY_MS,
  });
  if (isComplete) {
    return;
  }

  await withRetries('user-setup-complete', () => completeUserSetup(), {
    attempts: USER_SETUP_MAX_ATTEMPTS,
    baseDelayMs: USER_SETUP_RETRY_DELAY_MS,
  });
}
