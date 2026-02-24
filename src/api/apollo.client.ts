import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client/core';
import { requireAccessTokenForScan } from '../service/auth.svc.ts';

export type TokenProvider = (forceRefresh?: boolean) => Promise<string>;

function isTokenEndpoint(input: string | URL | Request): boolean {
  let urlString: string;
  if (typeof input === 'string') {
    urlString = input;
  } else if (input instanceof Request) {
    urlString = input.url;
  } else {
    urlString = input.toString();
  }

  try {
    const url = new URL(urlString);
    return url.pathname.endsWith('/token');
  } catch {
    const pathOnly = urlString.split('?')[0].split('#')[0];
    return pathOnly.endsWith('/token');
  }
}

const createAuthorizedFetch =
  (tokenProvider: TokenProvider): typeof fetch =>
  async (input, init) => {
    const headers = new Headers(init?.headers);

    const token = await tokenProvider();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(input, { ...init, headers });

    if (
      response.status === 401 &&
      !isTokenEndpoint(input) &&
      (init?.method === 'GET' || init?.method === undefined || init?.method === 'POST')
    ) {
      const refreshed = await tokenProvider(true);
      const retryHeaders = new Headers(init?.headers);
      retryHeaders.set('Authorization', `Bearer ${refreshed}`);
      return fetch(input, { ...init, headers: retryHeaders });
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
