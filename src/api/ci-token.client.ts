import type { GraphQLFormattedError } from 'graphql';
import { config } from '../config/constants.ts';
import { requireAccessToken } from '../service/auth.svc.ts';
import { debugLogger } from '../service/log.svc.ts';
import { createApollo } from './apollo.client.ts';
import { ApiError, type ApiErrorCode, isApiErrorCode } from './errors.ts';
import { getOrgAccessTokensMutation } from './gql-operations.ts';
import { getGraphQLErrors } from './graphql-errors.ts';

const graphqlUrl = `${config.graphqlHost}${config.graphqlPath}`;

const noAuthTokenProvider = async (): Promise<string> => '';

export type IamAccessOrgTokensInput =
  | { orgId: number; previousToken?: never }
  | { orgId?: never; previousToken: string };

export interface ProvisionCITokenResponse {
  refresh_token: string;
  access_token: string;
}

export interface ProvisionCITokenOptions {
  orgId?: number;
  previousToken?: string | null;
}

export class CITokenCommunicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CITokenCommunicationError';
  }
}

type GetOrgAccessTokensResponse = {
  iamV2?: {
    access?: {
      getOrgAccessTokens?: { accessToken?: string; refreshToken?: string };
    };
  };
};

function extractErrorCode(errors: ReadonlyArray<GraphQLFormattedError>): ApiErrorCode | undefined {
  const code = (errors[0]?.extensions as { code?: string })?.code;
  if (!code || !isApiErrorCode(code)) return;
  return code;
}

function classifyCiTokenError(
  errors: ReadonlyArray<GraphQLFormattedError> | undefined,
  error: unknown,
  fallbackMessage: string,
): Error {
  if (errors?.length) {
    const message = errors[0].message ?? fallbackMessage;
    const code = extractErrorCode(errors);
    if (code) {
      return new ApiError(message, code);
    }

    return new CITokenCommunicationError(message);
  }

  const message = error instanceof Error ? error.message : error ? String(error) : fallbackMessage;
  return new CITokenCommunicationError(message || fallbackMessage);
}

async function getOrgAccessTokens(
  input: IamAccessOrgTokensInput,
): Promise<{ accessToken: string; refreshToken: string }> {
  const client = createApollo(graphqlUrl, requireAccessToken);
  let res: Awaited<ReturnType<typeof client.mutate<GetOrgAccessTokensResponse, { input: IamAccessOrgTokensInput }>>>;
  try {
    res = await client.mutate<GetOrgAccessTokensResponse, { input: IamAccessOrgTokensInput }>({
      mutation: getOrgAccessTokensMutation,
      variables: {
        input,
      },
    });
  } catch (error) {
    throw classifyCiTokenError(undefined, error, 'CI token provisioning failed');
  }

  const errors = getGraphQLErrors(res);
  if (res?.error || errors?.length) {
    debugLogger('Error returned from getOrgAccessTokens mutation: %o', res.error ?? errors);
    throw classifyCiTokenError(errors, res?.error, 'CI token provisioning failed');
  }

  const tokens = res.data?.iamV2?.access?.getOrgAccessTokens;
  if (!tokens?.refreshToken || tokens.refreshToken.trim() === '') {
    throw new Error('CI token provisioning response missing refreshToken');
  }

  return {
    accessToken: tokens.accessToken ?? '',
    refreshToken: tokens.refreshToken,
  };
}

export async function getOrgAccessTokensUnauthenticated(
  input: IamAccessOrgTokensInput,
): Promise<{ accessToken: string; refreshToken: string }> {
  return callGetOrgAccessTokensInternal(input, noAuthTokenProvider);
}

type TokenProvider = () => Promise<string>;

async function callGetOrgAccessTokensInternal(
  input: IamAccessOrgTokensInput,
  tokenProvider: TokenProvider,
): Promise<{ accessToken: string; refreshToken: string }> {
  const client = createApollo(graphqlUrl, tokenProvider);
  let res: Awaited<ReturnType<typeof client.mutate<GetOrgAccessTokensResponse, { input: IamAccessOrgTokensInput }>>>;
  try {
    res = await client.mutate<GetOrgAccessTokensResponse, { input: IamAccessOrgTokensInput }>({
      mutation: getOrgAccessTokensMutation,
      variables: { input },
    });
  } catch (error) {
    throw classifyCiTokenError(undefined, error, 'CI token refresh failed');
  }

  const errors = getGraphQLErrors(res);
  if (res?.error || errors?.length) {
    debugLogger('Error returned from getOrgAccessTokens mutation: %o', res.error ?? errors);
    throw classifyCiTokenError(errors, res?.error, 'CI token refresh failed');
  }

  const tokens = res.data?.iamV2?.access?.getOrgAccessTokens;
  if (!tokens?.accessToken) {
    throw new CITokenCommunicationError('getOrgAccessTokens response missing accessToken');
  }

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken ?? '',
  };
}

export interface ExchangeCITokenOptions {
  refreshToken: string;
}

export async function exchangeCITokenForAccess(
  options: ExchangeCITokenOptions,
): Promise<{ accessToken: string; refreshToken: string }> {
  const { refreshToken } = options;
  return callGetOrgAccessTokensInternal({ previousToken: refreshToken }, noAuthTokenProvider);
}

export async function provisionCIToken(options: ProvisionCITokenOptions = {}): Promise<ProvisionCITokenResponse> {
  const { orgId, previousToken } = options;
  let input: IamAccessOrgTokensInput;
  if (previousToken != null && previousToken !== '') {
    input = { previousToken };
  } else if (orgId != null) {
    input = { orgId };
  } else {
    throw new Error('Either orgId or previousToken is required to provision a CI token');
  }
  const result = await getOrgAccessTokens(input);
  return { access_token: result.accessToken, refresh_token: result.refreshToken };
}
