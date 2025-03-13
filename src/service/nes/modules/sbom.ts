import { gql } from '@apollo/client/core/core.cjs';

import { log } from '../../../utils/log.util.ts';
import type { SbomMap } from '../../eol/eol.types.ts';
import type { ApolloHelper } from '../nes.client.ts';

export const buildScanResult = (scan: ScanResponseReport): ScanResult => {
  const components = new Map<string, ScanResultComponent>()
  for (const c of scan.components) {
    components.set(c.purl, c)
  }
  return {
    components,
    message: scan.message,
    success: true,
  }
};

export const SbomScanner =
  (client: ApolloHelper) =>
  async (sbom: SbomMap): Promise<ScanResult> => {
    const input: ScanInput = { components: sbom.purls, type: 'SBOM' };
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

type ScanInput = { components: string[]; type: 'SBOM' } | { type: 'OTHER' };

export interface ScanResponse {
  insights: {
    scan: {
      eol: ScanResponseReport;
    };
  };
}

export interface ScanResponseReport {
  components: ScanResultComponent[];
  diagnostics?: Record<string, unknown>;
  message: string;
  success: boolean;
}
export interface ScanResult {
  components: Map<string, ScanResultComponent>;
  diagnostics?: Record<string, unknown>;
  message: string;
  success: boolean;
}

export type ComponentStatus = 'EOL' | 'LTS' | 'OK'

export interface ScanResultComponent {
  info: {
    eolAt: Date | null;
    isEol: boolean;
    isUnsafe: boolean;
  };
  purl: string;
  status?: ComponentStatus;
}

const M_SCAN = {
  gql: gql`
    mutation EolScan($input: InsightsEolScanInput!) {
        insights {
          scan {
            eol(input: $input) {
            components {
              purl
              info {
                isEol
                isUnsafe
                eolAt
              }
            } 
            diagnostics
            message
            scanId
            success
            warnings {
              purl
              type
            }
          }
        }
      }
    }
  `,
};
