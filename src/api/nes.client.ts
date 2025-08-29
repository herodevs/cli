import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client/core/index.js';
import type {
  CreateEolReportInput,
  EolReport,
  EolReportMutationResponse,
  EolReportQueryResponse,
  GetEolReportInput,
} from '@herodevs/eol-shared';
import { config } from '../config/constants.ts';
import { debugLogger } from '../service/log.svc.ts';
import { createReportMutation, getEolReportQuery } from './gql-operations.ts';

export const createApollo = (uri: string) =>
  new ApolloClient({
    cache: new InMemoryCache(),
    defaultOptions: {
      query: { fetchPolicy: 'no-cache' },
    },
    link: new HttpLink({
      uri,
      headers: {
        'User-Agent': `hdcli/${process.env.npm_package_version ?? 'unknown'}`,
      },
    }),
  });

export const SbomScanner = (client: ReturnType<typeof createApollo>) => {
  return async (input: CreateEolReportInput): Promise<EolReport> => {
    const res = await client.mutate<EolReportMutationResponse, { input: CreateEolReportInput }>({
      mutation: createReportMutation,
      variables: { input },
    });

    const result = res.data?.eol?.createReport;
    if (!result?.success || !result.id) {
      debugLogger('failed scan %o', result || {});
      throw new Error('Failed to create EOL report');
    }

    const totalRecords = result.totalRecords || 0;
    const totalPages = Math.ceil(totalRecords / config.pageSize);
    const pages = Array.from({ length: totalPages }, (_, index) =>
      client.query<EolReportQueryResponse, { input: GetEolReportInput }>({
        query: getEolReportQuery,
        variables: {
          input: {
            id: result.id,
            page: index + 1,
            size: config.pageSize,
          },
        },
      }),
    );

    const components: EolReport['components'] = [];
    let reportMetadata: EolReport | null = null;

    for (let i = 0; i < pages.length; i += config.concurrentPageRequests) {
      const batch = pages.slice(i, i + config.concurrentPageRequests);
      const batchResponses = await Promise.all(batch);

      for (const response of batchResponses) {
        const report = response.data.eol.report;
        reportMetadata ??= report;
        components.push(...(report?.components ?? []));
      }
    }

    if (!reportMetadata) {
      throw new Error('Failed to fetch EOL report');
    }

    return { ...reportMetadata, components };
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
