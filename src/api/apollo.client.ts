import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client/core';
import { config } from '../config/constants.ts';
import { requireAccessTokenForScan } from '../service/auth.svc.ts';

export type TokenProvider = (forceRefresh?: boolean) => Promise<string>;

function isTokenEndpoint(input: string | URL | Request): boolean {
  const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.toString();
  return url.endsWith('/token');
}

const createAuthorizedFetch =
  (tokenProvider: TokenProvider): typeof fetch =>
  async (input, init) => {
    const headers = new Headers(init?.headers);

    if (config.enableAuth) {
      const token = await tokenProvider();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    let response = await fetch(input, { ...init, headers });

    if (
      config.enableAuth &&
      response.status === 401 &&
      !isTokenEndpoint(input) &&
      (init?.method === 'GET' || init?.method === undefined || init?.method === 'POST')
    ) {
      const refreshed = await tokenProvider(true);
      const retryHeaders = new Headers(init?.headers);
      retryHeaders.set('Authorization', `Bearer ${refreshed}`);
      response = await fetch(input, { ...init, headers: retryHeaders });
    }

    return response;
  };

export const createApollo = (uri: string, tokenProvider: TokenProvider = requireAccessTokenForScan) =>
  new ApolloClient({
    cache: new InMemoryCache(),
    defaultOptions: {
      query: { fetchPolicy: 'no-cache', errorPolicy: 'all' },
      mutate: { errorPolicy: 'all' },
    },
    link: new HttpLink({
      uri,
      fetch: createAuthorizedFetch(tokenProvider),
      headers: {
        'User-Agent': `hdcli/${process.env.npm_package_version ?? 'unknown'}`,
      },
    }),
  });
