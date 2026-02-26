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

async function getOrgAccessTokens(
  input: IamAccessOrgTokensInput,
): Promise<{ accessToken: string; refreshToken: string }> {
  const client = createApollo(graphqlUrl, requireAccessToken);
  const res = await client.mutate<GetOrgAccessTokensResponse, { input: IamAccessOrgTokensInput }>({
    mutation: getOrgAccessTokensMutation,
    variables: {
      input,
    },
  });

  const errors = getGraphQLErrors(res);
  if (res?.error || errors?.length) {
    debugLogger('Error returned from getOrgAccessTokens mutation: %o', res.error ?? errors);
    if (errors?.length) {
      const code = extractErrorCode(errors);
      if (code) {
        throw new ApiError(errors[0].message ?? 'CI token provisioning failed', code);
      }
      throw new Error(errors[0].message ?? 'CI token provisioning failed');
    }
    const msg = res?.error instanceof Error ? res.error.message : res?.error ? String(res.error) : '';
    throw new Error(msg || 'CI token provisioning failed');
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
  const res = await client.mutate<GetOrgAccessTokensResponse, { input: IamAccessOrgTokensInput }>({
    mutation: getOrgAccessTokensMutation,
    variables: { input },
  });

  const errors = getGraphQLErrors(res);
  if (res?.error || errors?.length) {
    debugLogger('Error returned from getOrgAccessTokens mutation: %o', res.error ?? errors);
    if (errors?.length) {
      const code = extractErrorCode(errors);
      if (code) {
        throw new ApiError(errors[0].message ?? 'CI token refresh failed', code);
      }
      throw new Error(errors[0].message ?? 'CI token refresh failed');
    }
    const msg = res?.error instanceof Error ? res.error.message : res?.error ? String(res.error) : '';
    throw new Error(msg || 'CI token refresh failed');
  }

  const tokens = res.data?.iamV2?.access?.getOrgAccessTokens;
  if (!tokens?.accessToken) {
    throw new Error('getOrgAccessTokens response missing accessToken');
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
