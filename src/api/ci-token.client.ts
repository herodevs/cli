import type { GraphQLFormattedError } from 'graphql';
import { config } from '../config/constants.ts';
import { requireAccessToken } from '../service/auth.svc.ts';
import { isAccessTokenExpired } from '../service/auth-token.svc.ts';
import { debugLogger } from '../service/log.svc.ts';
import { createApollo } from './apollo.client.ts';
import { ApiError, type ApiErrorCode, isApiErrorCode } from './errors.ts';
import { getOrgAccessTokensMutation } from './gql-operations.ts';
import { getGraphQLErrors } from './graphql-errors.ts';

const noAuthTokenProvider = async (): Promise<string> => '';

function createOptionalTokenProvider(token?: string) {
  return async (): Promise<string> => {
    if (token && !isAccessTokenExpired(token)) {
      return token;
    }
    return '';
  };
}

export interface IamAccessOrgTokensInput {
  orgId: number | null;
  previousToken: string | null;
}

export interface ProvisionCITokenResponse {
  refresh_token: string;
}

export interface ProvisionCITokenOptions {
  orgId?: number | null;
  previousToken?: string | null;
}

type GetOrgAccessTokensResponse = {
  iamV2?: {
    access?: {
      getOrgAccessTokens?: { accessToken?: string; refreshToken?: string };
    };
  };
};

function getGraphqlUrl(): string {
  return `${config.iamHost}${config.iamPath}`;
}

function extractErrorCode(errors: ReadonlyArray<GraphQLFormattedError>): ApiErrorCode | undefined {
  const code = (errors[0]?.extensions as { code?: string })?.code;
  if (!code || !isApiErrorCode(code)) return undefined;
  return code;
}

async function getOrgAccessTokens(
  input: IamAccessOrgTokensInput,
): Promise<{ accessToken: string; refreshToken: string }> {
  const client = createApollo(getGraphqlUrl(), requireAccessToken);
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

async function getOrgAccessTokensUnauthenticated(
  input: IamAccessOrgTokensInput,
): Promise<{ accessToken: string; refreshToken: string }> {
  return callGetOrgAccessTokensInternal(input, noAuthTokenProvider);
}

type TokenProvider = () => Promise<string>;

async function callGetOrgAccessTokensInternal(
  input: IamAccessOrgTokensInput,
  tokenProvider: TokenProvider,
): Promise<{ accessToken: string; refreshToken: string }> {
  const client = createApollo(getGraphqlUrl(), tokenProvider);
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
  orgId: number;
  optionalAccessToken?: string;
}

export async function exchangeCITokenForAccess(
  options: ExchangeCITokenOptions,
): Promise<{ accessToken: string; refreshToken: string }> {
  const { refreshToken, orgId, optionalAccessToken } = options;
  const tokenProvider = createOptionalTokenProvider(optionalAccessToken);
  return callGetOrgAccessTokensInternal({ orgId, previousToken: refreshToken }, tokenProvider);
}

export async function getAccessTokenFromCIRefresh(
  refreshToken: string,
  orgId: number,
): Promise<{ accessToken: string; refreshToken: string }> {
  return getOrgAccessTokensUnauthenticated({
    orgId,
    previousToken: refreshToken,
  });
}

export async function provisionCIToken(options: ProvisionCITokenOptions = {}): Promise<ProvisionCITokenResponse> {
  const { orgId = null, previousToken = null } = options;
  const result = await getOrgAccessTokens({
    orgId,
    previousToken,
  });
  return { refresh_token: result.refreshToken };
}
