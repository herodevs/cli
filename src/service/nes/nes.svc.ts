import type { NesApolloClient } from '../../api/nes/nes.client.ts';
import { M_SCAN } from '../../api/queries/nes/sbom.ts';
import type {
  ScanInput,
  ScanResponse,
  ScanResponseReport,
  ScanResult,
  ScanResultComponent,
} from '../../api/types/nes.ts';
import { log } from '../log.svc.ts';
export const buildScanResult = (scan: ScanResponseReport): ScanResult => {
  const components = new Map<string, ScanResultComponent>();
  for (const c of scan.components) {
    components.set(c.purl, c);
  }
  return {
    components,
    message: scan.message,
    success: true,
  };
};

export const SbomScanner =
  (client: NesApolloClient) =>
  async (purls: string[]): Promise<ScanResult> => {
    const input: ScanInput = { components: purls, type: 'SBOM' };
    const res = await client.mutate<ScanResponse, { input: ScanInput }>(M_SCAN.gql, { input });

    const scan = res.data?.insights?.scan?.eol;
    if (!scan?.success) {
      log.info('failed scan %o', scan || {});
      log.warn('scan failed');

      throw new Error('Failed to provide scan: ');
    }

    const result = buildScanResult(scan);

    return result;
  };
