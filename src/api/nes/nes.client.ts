import type * as apollo from '@apollo/client/core/index.js';

import { ApolloClient } from '../../api/client.ts';
import type { ScanResult, ScanResultComponent } from '../../api/types/nes.types.ts';
import { debugLogger } from '../../service/log.svc.ts';
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

async function submitScan(purls: string[]): Promise<ScanResult> {
  // NOTE: GRAPHQL_HOST is set in `./bin/dev.js` or tests
  const host = process.env.GRAPHQL_HOST || 'https://api.nes.herodevs.com';
  const path = process.env.GRAPHQL_PATH || '/graphql';
  const url = host + path;
  const client = new NesApolloClient(url);
  return client.scan.sbom(purls);
}

function combineScanResults(results: ScanResult[]): ScanResult {
  const combinedResults: ScanResult = {
    components: new Map<string, ScanResultComponent>(),
    message: '',
    success: true,
    warnings: [],
  };

  for (const result of results) {
    for (const component of result.components.values()) {
      combinedResults.components.set(component.purl, component);
    }
    combinedResults.warnings.push(...result.warnings);
    combinedResults.success = combinedResults.success && result.success;
  }

  return combinedResults;
}

export function createBatches(items: string[], batchSize: number): string[][] {
  return Array.from({ length: Math.ceil(items.length / batchSize) }, (_, i) =>
    items.slice(i * batchSize, (i + 1) * batchSize),
  );
}

export async function batchSubmitPurls(purls: string[], batchSize = 1000): Promise<ScanResult> {
  try {
    const batches = createBatches(purls, batchSize);
    debugLogger('Processing %d batches', batches.length);

    const results = await Promise.allSettled(
      batches.map((batch, index) => {
        debugLogger('Starting batch %d', index + 1);
        return submitScan(batch);
      }),
    );

    const successfulResults: ScanResult[] = [];
    const errors: string[] = [];

    for (const [index, result] of results.entries()) {
      if (result.status === 'fulfilled') {
        debugLogger('Batch %d completed successfully', index + 1);
        successfulResults.push(result.value);
      } else {
        debugLogger('Batch %d failed: %s', index + 1, result.reason);
        errors.push(`Batch ${index + 1}: ${result.reason}`);
      }
    }

    if (successfulResults.length === 0) {
      throw new Error(`All batches failed:\n${errors.join('\n')}`);
    }

    const combinedResults = combineScanResults(successfulResults);
    if (errors.length > 0) {
      combinedResults.success = false;
      combinedResults.message = `Errors encountered:\n${errors.join('\n')}`;
    }

    return combinedResults;
  } catch (error) {
    debugLogger('Fatal error in batchSubmitPurls: %s', error);
    throw new Error(`Failed to process purls: ${error instanceof Error ? error.message : String(error)}`);
  }
}
