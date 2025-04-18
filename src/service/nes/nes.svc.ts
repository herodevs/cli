import type { NesApolloClient } from '../../api/nes/nes.client.ts';
import { M_SCAN } from '../../api/queries/nes/sbom.ts';
import type { ScanInputOptions, ScanResult } from '../../api/types/hd-cli.types.ts';
import type {
  InsightsEolScanComponent,
  InsightsEolScanInput,
  InsightsEolScanResult,
  ScanResponse,
} from '../../api/types/nes.types.ts';
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
    const { type, page, totalPages, scanId } = options;
    const input: InsightsEolScanInput = { components: purls, type, page, totalPages, scanId };

    const res = await client.mutate<ScanResponse, { input: InsightsEolScanInput }>(M_SCAN.gql, { input });

    const scan = res.data?.insights?.scan?.eol;
    if (!scan?.success) {
      debugLogger('failed scan %o', scan || {});
      debugLogger('scan failed');

      throw new Error('Failed to provide scan: ');
    }

    return scan;
  };
