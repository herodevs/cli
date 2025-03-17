// TODO move this to another lib altogether!

import * as apollo from '@apollo/client/core/index.js';
import { type ScanResult, SbomScanner as sbomScanner } from '../nes/modules/sbom.ts';

export interface NesClient {
  scan: {
    sbom: (purls: string[]) => Promise<ScanResult>;
  };
}

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

export class NesApolloError extends Error {}
export class NesApolloClient implements ApolloHelper, NesClient {
  scan = {
    sbom: sbomScanner(this),
  };
  #apollo: apollo.ApolloClient<apollo.NormalizedCacheObject>;

  constructor(url: string) {
    this.#apollo = createApollo(url);
  }

  mutate<T, V extends apollo.OperationVariables>(mutation: apollo.DocumentNode, variables?: V) {
    return this.#apollo
      .mutate<T, V>({
        mutation,
        variables,
      })
      .catch((error) => {
        throw new NesApolloError('Failed GQL Mutation', error);
      });
  }

  query<T, V extends apollo.OperationVariables | undefined>(query: apollo.DocumentNode, variables?: V) {
    return this.#apollo
      .query<T>({
        query,
        variables,
      })
      .catch((error) => {
        throw new NesApolloError('Failed GQL Query', error);
      });
  }
}
