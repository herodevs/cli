import type * as apollo from '@apollo/client/core/index.js';

import { ApolloClient } from '../../api/client.ts';
import type {
  InsightsEolScanComponent,
  InsightsEolScanInput,
  InsightsEolScanResult,
} from '../../api/types/nes.types.ts';
import { debugLogger } from '../../service/log.svc.ts';
import { SbomScanner, buildScanResult } from '../../service/nes/nes.svc.ts';
import type { ScanInputOptions, ScanResult } from '../types/hd-cli.types.ts';

export interface NesClient {
  scan: {
    purls: (purls: string[], options: ScanInputOptions) => Promise<InsightsEolScanResult>;
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

export const batchSubmitPurls = async (
  purls: string[],
  options: ScanInputOptions,
  batchSize = 1000,
): Promise<ScanResult> => {
  try {
    const batches = createBatches(purls, batchSize);
    debugLogger('Processing %d batches', batches.length);

    // if batches.length === 0, return empty scan result
    if (batches.length < 0) {
      throw new Error('No batches to process');
    }
    if (batches.length === 0) {
      return {
        components: new Map<string, InsightsEolScanComponent>(),
        message: 'No batches to process',
        success: true,
        warnings: [],
      };
    }

    if (batches.length === 1) {
      debugLogger('One batch to process, returning result');
      const result = await submitScan(batches[0], options);
      return buildScanResult(result);
    }

    const totalPages = batches.length;
    const results: InsightsEolScanResult[] = [];

    for (const [index, batch] of batches.entries()) {
      const page = index + 1;

      if (page > totalPages) {
        throw new Error('Total pages exceeded');
      }

      debugLogger('Processing batch %d of %d', page, totalPages);
      let scanId: string | undefined;
      if (index > 0) {
        scanId = results[index - 1].scanId;
      }
      const result = await submitScan(batch, {
        ...options,
        page,
        totalPages,
        scanId,
      });
      results.push(result);
    }

    const finalResult = results[results.length - 1];

    return buildScanResult(finalResult);
  } catch (error) {
    debugLogger('Fatal error in batchSubmitPurls: %s', error);
    throw new Error(`Failed to process purls: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const createBatches = (items: string[], batchSize: number): string[][] =>
  Array.from({ length: Math.ceil(items.length / batchSize) }, (_, i) =>
    items.slice(i * batchSize, (i + 1) * batchSize),
  );

export const buildInsightsEolScanInput = (purls: string[], options: ScanInputOptions): InsightsEolScanInput => {
  const { type, page, totalPages } = options;

  return {
    components: purls,
    type,
    page,
    totalPages,
  } satisfies InsightsEolScanInput;
};

const submitScan = async (purls: string[], options: ScanInputOptions): Promise<InsightsEolScanResult> => {
  // NOTE: GRAPHQL_HOST is set in `./bin/dev.js` or tests
  const host = process.env.GRAPHQL_HOST || 'https://api.nes.herodevs.com';
  const path = process.env.GRAPHQL_PATH || '/graphql';
  const url = host + path;
  const client = new NesApolloClient(url);
  return client.scan.purls(purls, options);
};
