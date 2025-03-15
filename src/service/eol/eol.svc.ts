import { log } from '../../utils/log.util.ts';
import { getDaysEolFromEolAt, getStatusFromComponent } from '../line.ts';
import type { Line } from '../line.ts';
import type { ComponentStatus, ScanResult } from '../nes/modules/sbom.ts';
import { NesApolloClient } from '../nes/nes.client.ts';
import { createBomFromDir } from './cdx.svc.ts';
import type { Sbom, ScanOptions } from './eol.types.ts';

/**
 * Main function to scan directory and collect SBOM data
 */
export async function scanForEol(directory = process.cwd(), opts: ScanOptions = {}) {
  const sbom = await createBomFromDir(directory, opts.cdxgen || {});
  if (!sbom) throw new Error('SBOM not generated');
  log.info('SBOM generated');
  const purls = await extractPurls(sbom);
  const scan = await submitScan(purls);
  return { purls, sbom, scan };
}

/**
 * Translate an SBOM to a list of purls for api request.
 */
export async function extractPurls(sbom: Sbom): Promise<string[]> {
  const { components: comps } = sbom;
  return comps?.map((c) => c.purl) ?? [];
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
export async function prepareRows(purls: string[], scan: ScanResult): Promise<Line[]> {
  const lines: Line[] = [];

  for (const purl of purls) {
    const details = scan.components.get(purl);

    if (!details) {
      // In this case, the purl string is in the generated sbom, but the NES/XEOL api has no data
      // TODO: add UNKNOWN Component Status, create new line, and create flag to show/hide unknown results
      log.debug(`Unknown status: ${purl}.`);
      continue;
    }

    const { info } = details;

    // Handle date deserialization from GraphQL
    if (typeof info.eolAt === 'string' && info.eolAt) {
      info.eolAt = new Date(info.eolAt);
    }

    const daysEol: number | null = getDaysEolFromEolAt(info.eolAt);

    const status: ComponentStatus = getStatusFromComponent(details, daysEol);

    const showOk = process.env.SHOW_OK === 'true';

    if (!showOk && status === 'OK') {
      continue;
    }

    lines.push({
      daysEol,
      info,
      purl,
      status,
    });
  }

  return lines;
}

export { cdxgen } from './cdx.svc.ts';
export type { Sbom } from './eol.types.ts';
