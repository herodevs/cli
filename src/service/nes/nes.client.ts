// TODO move this to another lib altogether!

import { ApolloClient } from '../../api/client.ts';
import type { ScanResult } from '../../api/types/nes.ts';
import { SbomScanner } from './nes.svc.ts';

export interface NesClient {
  scan: {
    sbom: (purls: string[]) => Promise<ScanResult>;
  };
}

export class NesApolloClient implements NesClient {
  scan = {
    sbom: SbomScanner(this),
  };
  #apollo: ApolloClient;

  constructor(url: string) {
    this.#apollo = new ApolloClient(url);
  }

  mutate<T, V extends Record<string, unknown>>(mutation: any, variables?: V) {
    return this.#apollo.mutate<T, V>(mutation, variables);
  }

  query<T, V extends Record<string, unknown> | undefined>(query: any, variables?: V) {
    return this.#apollo.query<T, V>(query, variables);
  }
}
