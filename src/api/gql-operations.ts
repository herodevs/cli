import { gql } from '@apollo/client/core';

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
        dependencySummary
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

export const userSetupStatusQuery = gql`
query Eol {
  eol {
    userSetupStatus
  }
}
`;

export const completeUserSetupMutation = gql`
mutation Eol {
  eol {
    completeUserSetup
  }
}
`;
