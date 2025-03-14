import { log } from '../../utils/log.util.ts';
import { daysBetween } from '../line.ts';
import type { Line } from '../line.ts';
import type { ComponentStatus, ScanResult } from '../nes/modules/sbom.ts';
import { NesApolloClient } from '../nes/nes.client.ts';
import { createBomFromDir } from './cdx.svc.ts';
import type { Sbom, SbomEntry, SbomMap as SbomModel, ScanOptions } from './eol.types.ts';

const SHOW_OCCURRENCES = (process.env.SHOW_OCCURRENCES || 'false') === 'true';
const SHOW_OK = (process.env.SHOW_OK || 'false') === 'true';

/**
 * Main function to scan directory and collect SBOM data
 */
export async function scanForEol(directory = process.cwd(), opts: ScanOptions = {}) {
  const sbom = await createBomFromDir(directory, opts.cdxgen || {});
  if (!sbom) throw new Error('SBOM not generated');
  log.info('SBOM generated');
  const model = await extractComponents(sbom);
  const scan = await submitScan(model);
  // TODO: probably a better return option here...
  return { model, sbom, scan };
}

/**
 * Translate an SBOM to a SbomModel for easier handling.
 */
export async function extractComponents(sbom: Sbom): Promise<SbomModel> {
  const { components: comps, dependencies } = sbom;
  const components = [...(comps || []), ...(dependencies || [])].reduce(
    (acc, entry) => {
      if (entry.purl) {
        acc[entry.purl] = entry;
      }

      return acc;
    },
    {} as Record<string, SbomEntry>,
  );

  return { components, purls: Object.keys(components).sort() };
}

/**
 * Uses the purls from the model to run the scan.
 */
export async function submitScan(model: SbomModel): Promise<ScanResult> {
  // NOTE: GRAPHQL_HOST is set in `./bin/dev.js` or tests
  const host = process.env.GRAPHQL_HOST || 'https://api.nes.herodevs.com';
  const path = process.env.GRAPHQL_PATH || '/graphql';
  const url = host + path;
  const client = new NesApolloClient(url);
  const scan = await client.scan.sbom(model);
  return scan;
}

/**
 * Work in progress; creates "rows" for each component
 * based on the model + the scan result from NES.
 *
 * The idea being that each row can easily be used for
 * processing and/or rendering.
 */
export async function prepareRows({ components, purls }: SbomModel, scan: ScanResult): Promise<Line[]> {
  let lines: Line[] = purls.map((purl) => {
    const { evidence } = components[purl];
    const occ = evidence?.occurrences?.map((o) => o.location).join('\n\t - ');
    const occurrences = SHOW_OCCURRENCES && Boolean(occ) ? `\t - ${occ}\n` : '';

    const details = scan.components.get(purl);

    if (!details) {
      // In this case, the purl string is in the generated sbom, but the NES/XEOL api has no data
      log.debug(`Unknown status: ${purl}.`);
    }

    const info = details
      ? details.info
      : {
          eolAt: null,
          isEol: false,
          isUnsafe: false,
        };

    info.eolAt = typeof info.eolAt === 'string' && info.eolAt ? new Date(info.eolAt) : info.eolAt;

    const daysEol = info.eolAt ? daysBetween(new Date(), info.eolAt) : undefined;
    let status: ComponentStatus = 'OK';

    // TODO: extract this logic into the Line.ts file somehow, so that there is a unified Line model
    if (daysEol === undefined) {
      status = info.isEol ? 'EOL' : status;
    } else if (daysEol < 0) {
      status = 'EOL';
    } else if (daysEol > 0) {
      status = 'LTS';
    }

    return {
      daysEol,
      evidence: occurrences,
      info,
      purl,
      status,
    };
  });

  if (!SHOW_OK) {
    lines = lines.filter((l) => l.status !== 'OK');
  }

  return lines;
}

export { cdxgen } from './cdx.svc.ts';
export type { Sbom } from './eol.types.ts';
