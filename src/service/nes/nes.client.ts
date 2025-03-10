// TODO move this to another lib altogether!



import {
  ApolloClient, ApolloLink, ApolloQueryResult,
  DocumentNode, FetchResult, HttpLink, InMemoryCache,
  NormalizedCacheObject, OperationVariables
} from '@apollo/client/core';
import 'isomorphic-fetch';
import { default as fetch } from 'node-fetch'

import { SbomScanner as sbomScanner, ScanResult } from './modules/sbom';


type Fetch = typeof fetch
type Params = Parameters<Fetch>


export const fetcher = {
  fetch: ((...args: Params) => fetch(...args)) as Fetch
}


interface SbomScan {
  <SB>(sbom: SB): Promise<ScanResult>
}

export interface NesClient {
  scan: {
    sbom: SbomScan
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
      // @ts-expect-error type is ok; mockable for tests
      fetch: fetcher.fetch,
      uri: url
    })
  ])
});


export class NesApolloError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message)
  }
}
export class NesApolloClient implements ApolloHelper, NesClient {

  scan = {
    sbom: sbomScanner(this)
  }
  #apollo: ApolloClient<NormalizedCacheObject>;

  constructor(public url: string) {
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