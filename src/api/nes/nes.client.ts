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

interface BatchConfig {
  avgPurlLength: number; // Average length of a PURL string
  jsonOverhead: number; // JSON overhead per item (quotes, commas, etc)
  totalOverhead: number; // Total overhead for query structure
  byteLimit: number; // Server byte limit
}

const DEFAULT_BATCH_CONFIG: BatchConfig = {
  avgPurlLength: 30, // characters
  jsonOverhead: 10, // characters per item
  totalOverhead: 200, // characters for query structure
  byteLimit: 100_000, // slightly below server limit of 102400
};

function calculateOptimalBatchSize(config: BatchConfig = DEFAULT_BATCH_CONFIG): number {
  const bytesPerItem = (config.avgPurlLength + config.jsonOverhead) * 2; // UTF-8 approximation
  return Math.floor((config.byteLimit - config.totalOverhead) / bytesPerItem);
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

    if (result.message) {
      if (combinedResults.message) {
        combinedResults.message += `\n${result.message}`;
      } else {
        combinedResults.message = result.message;
      }
    }

    combinedResults.success = combinedResults.success && result.success;
  }

  return combinedResults;
}

function logBatchStart(purls: string[], batches: string[][], batchSize: number, config?: BatchConfig): void {
  const bytesPerBatch =
    ((config?.avgPurlLength ?? DEFAULT_BATCH_CONFIG.avgPurlLength) +
      (config?.jsonOverhead ?? DEFAULT_BATCH_CONFIG.jsonOverhead)) *
      batchSize +
    (config?.totalOverhead ?? DEFAULT_BATCH_CONFIG.totalOverhead);

  debugLogger(
    'Submitting %d purls in %d batches (batch size: %d, estimated bytes per batch: %d)',
    purls.length,
    batches.length,
    batchSize,
    bytesPerBatch,
  );
}

function logBatchProgress(batch: string[], index: number, config?: BatchConfig): void {
  const estimatedSize =
    batch.reduce((sum, purl) => sum + purl.length, 0) * 2 +
    (config?.totalOverhead ?? DEFAULT_BATCH_CONFIG.totalOverhead);

  debugLogger('Starting batch %d with %d purls (estimated size: %d bytes)', index + 1, batch.length, estimatedSize);
}

function logBatchCompletion(successfulResults: ScanResult[], errors: string[]): void {
  debugLogger(
    'Completed scan with %d successful batches and %d failed batches',
    successfulResults.length,
    errors.length,
  );
}

export async function batchSubmitPurls(purls: string[], config?: BatchConfig): Promise<ScanResult> {
  try {
    const batchSize = calculateOptimalBatchSize(config);
    const batches = splitIntoBatches(purls, batchSize);
    logBatchStart(purls, batches, batchSize, config);

    const successfulResults: ScanResult[] = [];
    const errors: string[] = [];

    await Promise.all(
      batches.map(async (batch, index) => {
        try {
          logBatchProgress(batch, index, config);
          const result = await submitScan(batch);
          debugLogger('Batch %d completed successfully', index + 1);
          successfulResults.push(result);
        } catch (error) {
          debugLogger('Batch %d failed: %s', index + 1, error);
          errors.push(`Batch ${index + 1}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }),
    );

    if (successfulResults.length === 0) {
      throw new Error(`All batches failed:\n ${errors.join('\n')}`);
    }

    const combinedResults = combineScanResults(successfulResults);

    if (errors.length > 0) {
      combinedResults.success = false;
      combinedResults.message = combinedResults.message
        ? `${combinedResults.message}\nErrors encountered:\n${errors.join('\n')}`
        : `Errors encountered:\n${errors.join('\n')}`;
    }

    logBatchCompletion(successfulResults, errors);
    return combinedResults;
  } catch (error) {
    debugLogger('Fatal error in batchSubmitPurls: %s', error);
    throw new Error(`Failed to process purls: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function splitIntoBatches(array: string[], batchSize: number): string[][] {
  return Array.from({ length: Math.ceil(array.length / batchSize) }, (_, i) =>
    array.slice(i * batchSize, (i + 1) * batchSize),
  );
}
