import { gql } from '@apollo/client/core/core.cjs';

export const createReportMutation = gql`
mutation createReport($input: CreateEolReportInput) {
  eol {
    createReport(input: $input) {
      success
      report {
        createdOn
        id 
        metadata
        components {
          purl
          metadata
          nesRemediation {
            remediations {
              urls {
                main
              }
            }
          }
        }
      }
    }
  }
}
`;
