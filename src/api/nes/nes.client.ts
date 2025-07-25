import type * as apollo from '@apollo/client/core/index.js';
import { PackageURL } from 'packageurl-js';

import { ApolloClient } from '../../api/client.ts';
import type { EolReport } from '@herodevs/eol-shared';
import { config } from '../../config/constants.ts';
import { debugLogger } from '../../service/log.svc.ts';
import { SbomScanner } from '../../service/nes/nes.svc.ts';

export interface NesClient {
  scan: {
    purls: (purls: string[]) => Promise<EolReport>;
  };
}

export class NesApolloClient implements NesClient {
  scan = {
    purls: SbomScanner(this),
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

/**
 * Submit a scan for a list of purls
 */
function submitScan(purls: string[]): Promise<EolReport> {
  const host = config.graphqlHost;
  const path = config.graphqlPath;
  const url = host + path;
  debugLogger('Submitting scan to %s', url);
  const client = new NesApolloClient(url);
  return client.scan.purls(purls);
}

export const submitPurls = async (purls: string[]): Promise<EolReport> => {
  try {
    const dedupedAndEncodedPurls = dedupeAndEncodePurls(purls);
    debugLogger('Submitting %d purls', dedupedAndEncodedPurls.length);

    if (dedupedAndEncodedPurls.length === 0) {
      return {
        components: [],
        createdOn: new Date().toISOString(),
        id: '',
        metadata: {
          unknownComponentsCount: 0,
          totalComponentsCount: 0,
        },
      } satisfies EolReport;
    }

    return submitScan(dedupedAndEncodedPurls);
  } catch (error) {
    debugLogger('Fatal error in submitPurls: %s', error);
    throw new Error(`Failed to process purls: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const dedupeAndEncodePurls = (purls: string[]): string[] => {
  const dedupedAndEncodedPurls = new Set<string>();

  for (const purl of purls) {
    try {
      // The PackageURL.fromString method encodes each part of the purl
      const encodedPurl = PackageURL.fromString(purl).toString();
      if (!dedupedAndEncodedPurls.has(encodedPurl)) {
        dedupedAndEncodedPurls.add(encodedPurl);
      }
    } catch (error) {
      debugLogger('Error encoding purl: %s', error);
    }
  }

  return Array.from(dedupedAndEncodedPurls);
};
