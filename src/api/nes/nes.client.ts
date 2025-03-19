import type * as apollo from '@apollo/client/core/index.js';

import { ApolloClient } from '../../api/client.ts';
import type { ScanResult } from '../../api/types/nes.ts';
import { SbomScanner } from '../../service/nes/nes.svc.ts';

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

  mutate<T, V extends Record<string, unknown>>(mutation: apollo.DocumentNode, variables?: V) {
    return this.#apollo.mutate<T, V>(mutation, variables);
  }

  query<T, V extends Record<string, unknown> | undefined>(query: apollo.DocumentNode, variables?: V) {
    return this.#apollo.query<T, V>(query, variables);
  }
}
