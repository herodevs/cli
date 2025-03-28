import * as apollo from '@apollo/client/core/index.js';
import { ApolloError } from '../service/error.svc.ts';
import { debugLogger } from '../service/log.svc.ts';
import { lookup } from 'node:dns/promises';
import https from 'node:https';

export interface ApolloHelper {
  mutate<T, V extends apollo.OperationVariables>(
    mutation: apollo.DocumentNode,
    variables?: V
  ): Promise<apollo.FetchResult<T>>;
  query<T, V extends apollo.OperationVariables | undefined = undefined>(
    query: apollo.DocumentNode,
    variables?: V
  ): Promise<apollo.ApolloQueryResult<T>>;
}

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
        fetch: async (uri, options) => {
          debugLogger('Making fetch request to: %s', uri);
          debugLogger('Fetch options: %O', {
            method: options?.method,
            headers: options?.headers,
            body: options?.body
              ? JSON.parse(options.body as string)
              : undefined,
          });
          try {
            const urlObj = new URL(uri.toString());
            const ipv4 = await lookup(urlObj.hostname, { family: 4 });
            debugLogger('Resolved to IPv4: %s', ipv4.address);

            return new Promise((resolve, reject) => {
              const headers = options?.headers as
                | Record<string, string>
                | undefined;
              const req = https.request(
                {
                  host: ipv4.address,
                  port: urlObj.port || '443',
                  path: '/graphql',
                  method: options?.method,
                  headers: {
                    ...headers,
                    Host: urlObj.hostname,
                  },
                  servername: urlObj.hostname,
                },
                (res) => {
                  const chunks: Buffer[] = [];
                  res.on('data', (chunk) => chunks.push(chunk));
                  res.on('end', () => {
                    const response = new Response(Buffer.concat(chunks), {
                      status: res.statusCode,
                      statusText: res.statusMessage,
                      headers: res.headers as Record<string, string>,
                    });
                    resolve(response);
                  });
                }
              );

              req.on('error', (error) => {
                debugLogger('Request error: %O', error);
                reject(error);
              });

              if (options?.body) {
                req.write(options.body);
                req.end();
              } else {
                req.end();
              }
            });
          } catch (error) {
            debugLogger('Fetch error: %O', error);
            throw error;
          }
        },
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

  async mutate<T, V extends apollo.OperationVariables>(
    mutation: apollo.DocumentNode,
    variables?: V
  ) {
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

  async query<T, V extends apollo.OperationVariables | undefined>(
    query: apollo.DocumentNode,
    variables?: V
  ) {
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
