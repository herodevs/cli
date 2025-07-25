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
                vulnCount
              }
              remediation {
                id
              }
            }
            diagnostics
            message
            scanId
            createdOn
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
