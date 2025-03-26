import { NesApolloClient } from '../../api/nes/nes.client.ts';
import type { ScanResult } from '../../api/types/nes.types.ts';
import { debugLogger } from '../../service/log.svc.ts';
import type { Line } from '../line.svc.ts';
import { extractPurls } from '../purls.svc.ts';
import { type Sbom, createBomFromDir } from './cdx.svc.ts';

export interface CdxGenOptions {
  projectType?: string[];
}

export interface ScanOptions {
  cdxgen?: CdxGenOptions;
}

export type CdxCreator = (dir: string, opts: CdxGenOptions) => Promise<{ bomJson: Sbom }>;
export async function createSbom(directory: string, opts: ScanOptions = {}) {
  const sbom = await createBomFromDir(directory, opts.cdxgen || {});
  if (!sbom) throw new Error('SBOM not generated');
  debugLogger('SBOM generated');
  return sbom;
}

export function validateIsCycloneDxSbom(sbom: unknown): asserts sbom is Sbom {
  if (!sbom || typeof sbom !== 'object') {
    throw new Error('SBOM must be an object');
  }

  const s = sbom as Record<string, unknown>;

  // Basic CycloneDX validation
  if (!('bomFormat' in s) || s.bomFormat !== 'CycloneDX') {
    throw new Error('Invalid SBOM format: must be CycloneDX');
  }

  if (!('specVersion' in s) || typeof s.specVersion !== 'string') {
    throw new Error('Invalid SBOM: missing specVersion');
  }

  if (!('components' in s) || !Array.isArray(s.components)) {
    throw new Error('Invalid SBOM: missing or invalid components array');
  }
}

/**
 * Main function to scan directory and collect SBOM data
 */
export async function scanForEol(sbom: Sbom) {
  const purls = await extractPurls(sbom);
  const scan = await submitScan(purls);
  return { purls, scan };
}

/**
 * Uses the purls from the sbom to run the scan.
 */
export async function submitScan(purls: string[]): Promise<ScanResult> {
  // NOTE: GRAPHQL_HOST is set in `./bin/dev.js` or tests
  const host = process.env.GRAPHQL_HOST || 'https://api.nes.herodevs.com';
  const path = process.env.GRAPHQL_PATH || '/graphql';
  const url = host + path;
  const client = new NesApolloClient(url);
  const scan = await client.scan.sbom(purls);
  return scan;
}

/**
 * Work in progress; creates "rows" for each component
 * based on the model + the scan result from NES.
 *
 * The idea being that each row can easily be used for
 * processing and/or rendering.
 */
export async function prepareRows(purls: string[], scan: ScanResult, withStatus: string[]): Promise<Line[]> {
  const lines: Line[] = [];

  for (const purl of purls) {
    const details = scan.components.get(purl);

    if (!details) {
      // The api should create a default component with status UNKNOWN even if the purl is not found
      throw new Error(`API failed to return details for: ${purl}.`);
    }

    const { info } = details;

    // Handle date deserialization from GraphQL
    if (typeof info.eolAt === 'string' && info.eolAt) {
      info.eolAt = new Date(info.eolAt);
    }

    if (!withStatus.includes(details.info.status)) {
      debugLogger('Skipping', details.info.status, 'withStatus', withStatus);
      continue;
    }

    lines.push({
      daysEol: details.info.daysEol,
      info,
      purl,
      status: details.info.status,
    });
  }

  return lines;
}

export { cdxgen } from './cdx.svc.ts';
