// TODO move this to another lib altogether!



import {
  ApolloClient, ApolloLink, ApolloQueryResult,
  DocumentNode, FetchResult, HttpLink, InMemoryCache,
  NormalizedCacheObject, OperationVariables
} from '@apollo/client/core';

import { SbomMap } from '../eol/eol.types';
import { SbomScanner as sbomScanner, ScanResult } from '../nes/modules/sbom';

export interface NesClient {
  scan: {
    sbom: (sbom: SbomMap) => Promise<ScanResult>
  }
}

export interface ApolloHelper {
  mutate<T, V extends OperationVariables>(mutation: DocumentNode, variables?: V): Promise<FetchResult<T>>
  query<T, V extends OperationVariables | undefined = undefined>(query: DocumentNode, variables?: V): Promise<ApolloQueryResult<T>>
};

export const createApollo = (url: string) => new ApolloClient({
  cache: new InMemoryCache({
    addTypename: false,
  }),
  headers: {
    "User-Agent": `hdcli/${process.env.npm_package_version ?? 'unknown'}`
  },
  link: ApolloLink.from([
    new HttpLink({
      uri: url
    })
  ])
});


export class NesApolloError extends Error {
}
export class NesApolloClient implements ApolloHelper, NesClient {

  scan = {
    sbom: sbomScanner(this)
  }
  #apollo: ApolloClient<NormalizedCacheObject>;

  constructor(url: string) {
    this.#apollo = createApollo(url)
  }


  mutate<T, V extends OperationVariables>(mutation: DocumentNode, variables?: V) {
    return this.#apollo.mutate<T, V>({
      mutation,
      variables
    }).catch(error => {
      throw new NesApolloError('Failed GQL Mutation', error)
    });
  }

  query<T, V extends OperationVariables | undefined>(query: DocumentNode, variables?: V) {
    return this.#apollo.query<T>({
      query,
      variables
    }).catch(error => {
      throw new NesApolloError('Failed GQL Query', error)
    });
  }
}