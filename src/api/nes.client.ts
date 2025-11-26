import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client/core';
import type {
  CreateEolReportInput,
  EolReport,
  EolReportMutationResponse,
  EolReportQueryResponse,
  GetEolReportInput,
} from '@herodevs/eol-shared';
import type { GraphQLFormattedError } from 'graphql';
import { config } from '../config/constants.ts';
import { requireAccessToken } from '../service/auth.svc.ts';
import { debugLogger } from '../service/log.svc.ts';
import { stripTypename } from '../utils/strip-typename.ts';
import { createReportMutation, getEolReportQuery } from './gql-operations.ts';

const createAuthorizedFetch = (): typeof fetch => async (input, init) => {
  const headers = new Headers(init?.headers);

  if (config.enableAuth) {
    // Temporary gate while legacy commands migrate to authenticated flow
    const token = await requireAccessToken();
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(input, { ...init, headers });
};

type GraphQLExecutionResult = {
  errors?: ReadonlyArray<GraphQLFormattedError>;
};

export const createApollo = (uri: string) =>
  new ApolloClient({
    cache: new InMemoryCache(),
    defaultOptions: {
      query: { fetchPolicy: 'no-cache', errorPolicy: 'all' },
      mutate: { errorPolicy: 'all' },
    },
    link: new HttpLink({
      uri,
      fetch: createAuthorizedFetch(),
      headers: {
        'User-Agent': `hdcli/${process.env.npm_package_version ?? 'unknown'}`,
      },
    }),
  });

export const SbomScanner = (client: ReturnType<typeof createApollo>) => {
  return async (input: CreateEolReportInput): Promise<EolReport> => {
    let res: Awaited<ReturnType<typeof client.mutate<EolReportMutationResponse, { input: CreateEolReportInput }>>>;
    res = await client.mutate<EolReportMutationResponse, { input: CreateEolReportInput }>({
      mutation: createReportMutation,
      variables: { input },
    });

    if (res?.error || (res as GraphQLExecutionResult)?.errors) {
      debugLogger(
        'Error returned from createReport mutation: %o',
        res.error || (res as GraphQLExecutionResult | undefined)?.errors,
      );
      throw new Error('Failed to create EOL report');
    }

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
      let batchResponses: Awaited<
        ReturnType<typeof client.query<EolReportQueryResponse, { input: GetEolReportInput }>>
      >[];

      batchResponses = await Promise.all(batch);

      for (const response of batchResponses) {
        const queryErrors = (response as GraphQLExecutionResult | undefined)?.errors;
        if (response?.error || queryErrors?.length || !response.data?.eol) {
          debugLogger('Error in getReport query response: %o', response?.error ?? queryErrors ?? response);
          throw new Error('Failed to fetch EOL report');
        }

        const report = response.data.eol.report;
        reportMetadata ??= report;
        components.push(...(report?.components ?? []));
      }
    }

    if (!reportMetadata) {
      throw new Error('Failed to fetch EOL report');
    }

    return stripTypename({
      ...reportMetadata,
      components,
    }) as EolReport;
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
