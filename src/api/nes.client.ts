import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client/core/index.js';
import type { CreateEolReportInput, EolReport, EolReportMutationResponse } from '@herodevs/eol-shared';
import { config } from '../config/constants.ts';
import { debugLogger } from '../service/log.svc.ts';
import { createReportMutation } from './gql-operations.ts';

export const createApollo = (uri: string) =>
  new ApolloClient({
    cache: new InMemoryCache({ addTypename: false }),
    headers: {
      'User-Agent': `hdcli/${process.env.npm_package_version ?? 'unknown'}`,
    },
    link: ApolloLink.from([new HttpLink({ uri })]),
  });

export const SbomScanner = (client: ReturnType<typeof createApollo>) => {
  return async (input: CreateEolReportInput): Promise<EolReport> => {
    const res = await client.mutate<EolReportMutationResponse, { input: CreateEolReportInput }>({
      mutation: createReportMutation,
      variables: { input },
    });

    const result = res.data?.eol?.createReport;
    if (!result?.success || !result.report) {
      debugLogger('failed scan %o', result || {});
      throw new Error('Failed to create EOL report');
    }

    return result.report;
  };
};

export class NesClient {
  startScan: ReturnType<typeof SbomScanner>;

  constructor(url: string) {
    this.startScan = SbomScanner(createApollo(url));
  }
}

/**
 * Submit a scan for a list of purls
 */
export function submitScan(input: CreateEolReportInput): Promise<EolReport> {
  const url = config.graphqlHost + config.graphqlPath;
  debugLogger('Submitting scan to %s', url);
  const client = new NesClient(url);
  return client.startScan(input);
}
