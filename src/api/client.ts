import * as apollo from '@apollo/client/core/index.js';
import { ApolloError } from '../service/error.svc.ts';

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

export const createApollo = (url: string) =>
  new apollo.ApolloClient({
    cache: new apollo.InMemoryCache({
      addTypename: false,
    }),
    headers: {
      'User-Agent': `hdcli/${process.env.npm_package_version ?? 'unknown'}`,
    },
    link: apollo.ApolloLink.from([
      new apollo.HttpLink({
        uri: url,
      }),
    ]),
  });

export class ApolloClient implements ApolloHelper {
  #apollo: apollo.ApolloClient<apollo.NormalizedCacheObject>;

  constructor(url: string) {
    this.#apollo = createApollo(url);
  }

  async mutate<T, V extends apollo.OperationVariables>(mutation: apollo.DocumentNode, variables?: V) {
    try {
      return await this.#apollo.mutate<T, V>({
        mutation,
        variables,
      });
    } catch (error: unknown) {
      throw new ApolloError('GraphQL mutation failed', error);
    }
  }

  async query<T, V extends apollo.OperationVariables | undefined>(query: apollo.DocumentNode, variables?: V) {
    try {
      return await this.#apollo.query<T>({
        query,
        variables,
      });
    } catch (error) {
      throw new ApolloError('GraphQL query failed', error);
    }
  }
}
