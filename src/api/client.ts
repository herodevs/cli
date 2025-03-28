import http from 'node:http';
import https from 'node:https';
import * as apollo from '@apollo/client/core/index.js';
import { ApolloError } from '../service/error.svc.ts';
import { debugLogger } from '../service/log.svc.ts';

export interface ApolloHelper {
  mutate<T, V extends apollo.OperationVariables>(
    mutation: apollo.DocumentNode,
    variables?: V,
  ): Promise<apollo.FetchResult<T>>;
  query<T, V extends apollo.OperationVariables | undefined = undefined>(
    query: apollo.DocumentNode,
    variables?: V,
  ): Promise<apollo.ApolloQueryResult<T>>;
}

const isNode18 = process.versions.node.startsWith('18');

const createNode18Fetch = () => {
  return async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const uri = input instanceof Request ? input.url : input.toString();
    debugLogger('Making Node18-compatible fetch request to: %s', uri);

    try {
      const url = new URL(uri);

      // Skip custom handling for localhost
      if (url.hostname === 'localhost' || url.hostname.includes('127.0.0.1')) {
        return fetch(uri, init);
      }

      // Use a simplified approach that works around both IPv6 and certificate issues
      return new Promise((resolve, reject) => {
        // Choose http or https module
        const isHttps = url.protocol === 'https:';
        const client = isHttps ? https : http;

        // Set up the proper options for the request
        const options = {
          method: init?.method || 'GET',
          headers: {
            ...((init?.headers as Record<string, string>) || {}),
            Host: url.hostname, // Important for SNI
          },
          // For HTTPS: ensure proper hostname is used for cert validation
          ...(isHttps
            ? {
                servername: url.hostname, // Important for SNI
                rejectUnauthorized: true,
                family: 4, // Force IPv4
              }
            : {
                family: 4, // Force IPv4
              }),
        };

        // Create the request
        const req = client.request(url, options, (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
          res.on('end', () => {
            const responseBody = Buffer.concat(chunks);
            const responseHeaders = new Headers();

            // Convert Node.js headers to fetch Headers
            for (const [key, values] of Object.entries(res.headers)) {
              if (values) {
                if (Array.isArray(values)) {
                  for (const value of values) {
                    responseHeaders.append(key, value);
                  }
                } else {
                  responseHeaders.set(key, values);
                }
              }
            }

            // Create a Response object that matches the fetch API
            const response = new Response(responseBody, {
              status: res.statusCode || 200,
              statusText: res.statusMessage || '',
              headers: responseHeaders,
            });

            resolve(response);
          });
        });

        // Handle errors
        req.on('error', (error) => {
          debugLogger('Request error: %O', error);
          reject(error);
        });

        // Send body if provided
        if (init?.body) {
          req.write(init.body);
        }

        req.end();
      });
    } catch (error) {
      debugLogger('Fetch error: %O', error);
      throw error;
    }
  };
};

export const createApollo = (url: string) => {
  debugLogger('Creating Apollo client with URL: %s', url);
  return new apollo.ApolloClient({
    cache: new apollo.InMemoryCache({
      addTypename: false,
    }),
    headers: {
      'User-Agent': `hdcli/${process.env.npm_package_version ?? 'unknown'}`,
    },
    link: apollo.ApolloLink.from([
      new apollo.HttpLink({
        uri: url,
        fetch: isNode18 ? createNode18Fetch() : undefined,
        credentials: 'same-origin',
      }),
    ]),
  });
};

export class ApolloClient implements ApolloHelper {
  #apollo: apollo.ApolloClient<apollo.NormalizedCacheObject>;

  constructor(url: string) {
    this.#apollo = createApollo(url);
  }

  async mutate<T, V extends apollo.OperationVariables>(mutation: apollo.DocumentNode, variables?: V) {
    try {
      debugLogger('Executing mutation with variables: %O', variables);
      return await this.#apollo.mutate<T, V>({
        mutation,
        variables,
        context: {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      });
    } catch (error: unknown) {
      debugLogger('Mutation error: %O', error);
      throw new ApolloError('GraphQL mutation failed', error);
    }
  }

  async query<T, V extends apollo.OperationVariables | undefined>(query: apollo.DocumentNode, variables?: V) {
    try {
      debugLogger('Executing query with variables: %O', variables);
      return await this.#apollo.query<T>({
        query,
        variables,
        context: {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      });
    } catch (error) {
      debugLogger('Query error: %O', error);
      throw new ApolloError('GraphQL query failed', error);
    }
  }
}
