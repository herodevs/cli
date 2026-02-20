import type {
  CreateEolReportInput,
  EolReport,
  EolReportMutationResponse,
  EolReportQueryResponse,
  GetEolReportInput,
} from '@herodevs/eol-shared';
import type { GraphQLFormattedError } from 'graphql';
import { config } from '../config/constants.ts';
import { debugLogger } from '../service/log.svc.ts';
import { stripTypename } from '../utils/strip-typename.ts';
import { createApollo } from './apollo.client.ts';
import { ApiError, type ApiErrorCode, isApiErrorCode } from './errors.ts';
import { createReportMutation, getEolReportQuery } from './gql-operations.ts';
import { getGraphQLErrors } from './graphql-errors.ts';

function extractErrorCode(errors: ReadonlyArray<GraphQLFormattedError>): ApiErrorCode | undefined {
  const code = (errors[0]?.extensions as { code?: string })?.code;
  if (!code || !isApiErrorCode(code)) return;
  return code;
}

export const SbomScanner = (client: ReturnType<typeof createApollo>) => {
  return async (input: CreateEolReportInput): Promise<EolReport> => {
    let res: Awaited<ReturnType<typeof client.mutate<EolReportMutationResponse, { input: CreateEolReportInput }>>>;
    res = await client.mutate<EolReportMutationResponse, { input: CreateEolReportInput }>({
      mutation: createReportMutation,
      variables: { input },
    });

    const errors = getGraphQLErrors(res);
    if (res?.error || errors?.length) {
      debugLogger('Error returned from createReport mutation: %o', res.error || errors);
      if (errors?.length) {
        const code = extractErrorCode(errors);
        if (code) {
          throw new ApiError(errors[0].message, code);
        }
      }
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
        const queryErrors = getGraphQLErrors(response);
        if (response?.error || queryErrors?.length || !response.data?.eol) {
          debugLogger('Error in getReport query response: %o', response?.error ?? queryErrors ?? response);
          if (queryErrors?.length) {
            const code = extractErrorCode(queryErrors);
            if (code) {
              throw new ApiError(queryErrors[0].message, code);
            }
          }
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
