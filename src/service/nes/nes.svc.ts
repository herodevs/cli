import type { NesApolloClient } from '../../api/nes/nes.client.ts';
import { M_SCAN } from '../../api/queries/nes/sbom.ts';
import type { ScanInput, ScanInputOptions, ScanResult } from '../../api/types/hd-cli.types.ts';
import type { InsightsEolScanComponent, InsightsEolScanResult, ScanResponse } from '../../api/types/nes.types.ts';
import { debugLogger } from '../log.svc.ts';

export const buildScanResult = (scan: InsightsEolScanResult): ScanResult => {
  const components = new Map<string, InsightsEolScanComponent>();
  for (const c of scan.components) {
    components.set(c.purl, c);
  }

  return {
    components,
    message: scan.message,
    success: true,
    warnings: scan.warnings || [],
  };
};

export const SbomScanner =
  (client: NesApolloClient) =>
  async (purls: string[], options: ScanInputOptions): Promise<InsightsEolScanResult> => {
    const input: ScanInput = { components: purls, options };
    const res = await client.mutate<ScanResponse, { input: ScanInput }>(M_SCAN.gql, { input });

    const scan = res.data?.insights?.scan?.eol;
    if (!scan?.success) {
      debugLogger('failed scan %o', scan || {});
      debugLogger('scan failed');

      throw new Error('Failed to provide scan: ');
    }

    return scan;
  };
