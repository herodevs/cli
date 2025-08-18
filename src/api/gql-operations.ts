import { gql } from '@apollo/client/core/core.cjs';

export const createReportMutation = gql`
mutation createReport($input: CreateEolReportInput) {
  eol {
    createReport(input: $input) {
      success
      id
      totalRecords
    }
  }
}
`;

export const getEolReportQuery = gql`
query GetEolReport($input: GetEolReportInput) {
  eol {
    report(input: $input) {
      id
      createdOn
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
      page
      totalRecords
    }
  }
}
`;
