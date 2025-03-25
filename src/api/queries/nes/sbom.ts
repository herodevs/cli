import { gql } from '@apollo/client/core/core.cjs';

export const M_SCAN = {
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
                daysEol
                status
              }
            } 
            diagnostics
            message
            scanId
            success
            warnings {
              purl
              type
              message
              error
              diagnostics
            }
          }
        }
      }
    }
  `,
};
