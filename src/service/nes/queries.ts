import { gql } from '@apollo/client/core/core.cjs';

export const TELEMETRY_INITIALIZE_MUTATION = gql`
  mutation Telemetry($clientName: String!) {
    telemetry {
      initialize(input: { context: { client: { id: $clientName } } }) {
        success
        oid
        message
      }
    }
  }
`;

export const TELEMETRY_REPORT_MUTATION = gql`
  mutation Report($key: String!, $report: JSON!, $metadata: JSON) {
    telemetry {
      report(input: { key: $key, report: $report, metadata: $metadata }) {
        txId
        success
        message
        diagnostics
      }
    }
  }
`;
