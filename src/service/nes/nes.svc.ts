import type { NesApolloClient } from '../../api/nes/nes.client.ts';
import { M_SCAN } from '../../api/queries/nes/sbom.ts';
import type {
  CreateEolReportInput,
  EolReport,
  ScanResponse,
} from '../../api/types/nes.types.ts';
import { debugLogger } from '../log.svc.ts';

export const SbomScanner =
  (client: NesApolloClient) =>
  async (purls: string[]): Promise<EolReport> => {
    const input: CreateEolReportInput = { components: purls };

    const res = await client.mutate<ScanResponse, { input: CreateEolReportInput }>(M_SCAN.gql, { input });

    const result = res.data?.eol?.createReport;
    if (!result?.success || !result.report) {
      debugLogger('failed scan %o', result || {});
      debugLogger('scan failed');

      throw new Error('Failed to create EOL report');
    }

    return result.report;
  };
