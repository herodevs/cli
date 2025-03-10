// TODO move this to another lib altogether!


import { ApolloClient, ApolloQueryResult, DocumentNode, FetchResult, gql, InMemoryCache, NormalizedCacheObject, OperationVariables } from '@apollo/client/core';
// import { existsSync, readFileSync, statSync } from 'node:fs';
// import { TELEMETRY_INITIALIZE_MUTATION, TELEMETRY_REPORT_MUTATION } from './queries';
// import { type JSONValue } from './types';
import 'isomorphic-fetch';

import { SbomScanner } from './modules/sbom';


interface SbomScan {
  (sbom: any): Promise<any>
}

export interface NesClient {
  scan: {
    sbom: SbomScan
  }
}

const USER_AGENT = `hdcli/${process.env.npm_package_version ?? 'unknown'}`



export interface ApolloHelper {
  mutate<T, V extends OperationVariables>(mutation: DocumentNode, variables?: V): Promise<FetchResult<T>>
  query<T, V extends OperationVariables | undefined = undefined>(query: DocumentNode, variables?: V): Promise<ApolloQueryResult<T>>
}


export const createApollo = (url: string) => new ApolloClient({
  cache: new InMemoryCache(),
  headers: {
    "User-Agent": USER_AGENT
  },
  uri: url
});


export class NesApolloError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message)
  }
}
export class NesApolloClient implements ApolloHelper, NesClient {

  scan = {
    sbom: SbomScanner(this)
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
      throw new NesApolloError('Failed Mutation', error)
    });
  }

  query<T, V extends OperationVariables | undefined>(query: DocumentNode, variables?: V) {
    return this.#apollo.query<T>({
      query,
      variables
    }).catch(error => {
      throw new NesApolloError('Failed Mutation', error)
    });
  }
}