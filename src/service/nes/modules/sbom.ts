import { gql } from "@apollo/client/core"

import { log } from "../../../hooks/prerun/CommandContextHook";
import { ApolloHelper } from "../nes.client"

export const SbomScanner = (client: ApolloHelper) =>
  async (sbom: any): Promise<ScanResult> => {

    const input: ScanInput = { components: sbom.purls, type: 'SBOM' }
    const res = await client.mutate<ScanResponse, { input: ScanInput }>(M_SCAN.gql, { input })

    const scan = res.data?.insights?.scan?.eol
    if (!scan?.success) {

      log.warn('failed scan %o', scan || {})

      throw new Error('Failed to provide scan: ')
    }

    const result: ScanResult = {
      components: Object.fromEntries(scan.components.map((c) => [c.purl, c]))
    }
    return result
  };



type ScanInput =
  { components: string[]; type: 'SBOM', }
  | { type: 'OTHER' }

export interface ScanResponse {
  insights: {
    scan: {
      eol: {
        components: ScanResultComponent[]
        diagnostics?: Record<string, unknown>
        message: string
        success: boolean
      }
    }
  }
}
export interface ScanResult {
  components: Record<string, ScanResultComponent>
}
export interface ScanResultComponent {
  info?: any
  purl: string
  status: 'EOL' | 'LTS' | 'OK',
}


const M_SCAN = {
  gql: gql`
    mutation EolScan($input: InsightsEolScanInput!) {
      insights {
        scan {
          eol(input: $input) {
          components {
            purl
            info
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
  `
}