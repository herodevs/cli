import { gql } from "@apollo/client/core"

import { log } from '../../../utils/log.util';
import { SbomMap } from '../../eol/eol.types';
import { ApolloHelper } from "../nes.client"

export const buildScanResult =
  (scan: ScanResponseReport): ScanResult => ({
    components: Object.fromEntries(scan.components.map((c) => [c.purl, c])),
    message: scan.message,
    success: true
  })

export const SbomScanner = (client: ApolloHelper) =>
  async (sbom: SbomMap ): Promise<ScanResult> => {

    const input: ScanInput = { components: sbom.purls, type: 'SBOM' }
    const res = await client.mutate<ScanResponse, { input: ScanInput }>(M_SCAN.gql, { input })

    const scan = res.data?.insights?.scan?.eol
    if (!scan?.success) {

      log.info('failed scan %o', scan || {})
      log.warn('scan failed')

      throw new Error('Failed to provide scan: ')
    }

    const result = buildScanResult(scan)
    // const result: ScanResult = {
    //   components: Object.fromEntries(scan.components.map((c) => [c.purl, c])),
    //   message: scan.message,
    //   success: true
    // }
    return result
  };



type ScanInput =
  { components: string[]; type: 'SBOM', }
  | { type: 'OTHER' }

export interface ScanResponse {
  insights: {
    scan: {
      eol: ScanResponseReport
    }
  }
}

export interface ScanResponseReport {
  components: ScanResultComponent[]
  diagnostics?: Record<string, unknown>
  message: string
  success: boolean
}
export interface ScanResult {
  components: Record<string, ScanResultComponent>
  diagnostics?: Record<string, unknown>
  message: string
  success: boolean
}
export interface ScanResultComponent {
  info?: {
    eolAt?: Date
    isEol: boolean
    isUnsafe: boolean
  }
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
  `
}