import type { CdxBom, CreateEolReportInput, EolReport, EolReportMutationResponse } from '@herodevs/eol-shared';
import type { NesApolloClient } from '../../api/nes/nes.client.ts';
import { M_SCAN } from '../../api/queries/nes/sbom.ts';
import { debugLogger } from '../log.svc.ts';

export const SbomScanner =
  (client: NesApolloClient) =>
  async (input: CreateEolReportInput): Promise<EolReport> => {
    const res = await client.mutate<EolReportMutationResponse, { input: CreateEolReportInput }>(M_SCAN.gql, { input });

    const result = res.data?.eol?.createReport;
    if (!result?.success || !result.report) {
      debugLogger('failed scan %o', result || {});
      debugLogger('scan failed');

      throw new Error('Failed to create EOL report');
    }

    return result.report;
  };
