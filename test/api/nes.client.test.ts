import type { CreateEolReportInput } from '@herodevs/eol-shared';
import { submitScan } from '../../src/api/nes.client.ts';
import { SCAN_ORIGIN_AUTOMATED, SCAN_ORIGIN_CLI } from '../../src/config/constants.ts';
import { FetchMock } from '../utils/mocks/fetch.mock.ts';

function getGraphQLVariables(fetchMock: FetchMock, callIndex = 0): Record<string, unknown> {
  const calls = fetchMock.getCalls();
  const init = calls[callIndex]?.init;
  if (!init?.body) return {};
  const body = JSON.parse(init.body as string);
  return body.variables ?? {};
}

describe('nes.client', () => {
  let fetchMock: FetchMock;

  beforeEach(() => {
    fetchMock = new FetchMock();
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it('returns report on successful createReport mutation', async () => {
    const components = [
      { purl: 'pkg:npm/bootstrap@3.1.1', metadata: { isEol: true } },
      {
        purl: 'pkg:npm/is-core-module@2.11.0',
        metadata: {},
        nesRemediation: { remediations: [{ urls: { main: 'https://example.com' } }] },
      },
    ];

    fetchMock
      .addGraphQL({
        eol: { createReport: { success: true, id: 'test-123', totalRecords: components.length } },
      })
      .addGraphQL({
        eol: {
          report: {
            id: 'test-123',
            createdOn: new Date().toISOString(),
            metadata: {},
            components,
            page: 1,
            totalRecords: components.length,
          },
        },
      });

    const input: CreateEolReportInput = {
      sbom: { bomFormat: 'CycloneDX', components: [], specVersion: '1.4', version: 1 },
    };
    const res = await submitScan(input);

    expect(res.id).toBe('test-123');
    expect(Array.isArray(res.components)).toBe(true);
    expect(res.components).toHaveLength(components.length);
  });

  it('throws when mutation returns unsuccessful response or no report', async () => {
    fetchMock.addGraphQL({
      eol: { createReport: { success: false, id: null, totalRecords: 0 } },
    });

    const input: CreateEolReportInput = {
      sbom: { bomFormat: 'CycloneDX', components: [], specVersion: '1.4', version: 1 },
    };
    await expect(submitScan(input)).rejects.toThrow(/Failed to create EOL report/);
  });

  it('throws when GraphQL errors are present in createReport mutation', async () => {
    fetchMock.addGraphQL({ eol: { createReport: null } }, [
      { message: 'Internal server error', path: ['eol', 'createReport'] },
    ]);

    const input: CreateEolReportInput = {
      sbom: { bomFormat: 'CycloneDX', components: [], specVersion: '1.4', version: 1 },
    };
    await expect(submitScan(input)).rejects.toThrow(/Failed to create EOL report/);
  });

  it('throws when GraphQL errors are present in getReport query', async () => {
    const components = [{ purl: 'pkg:npm/bootstrap@3.1.1', metadata: { isEol: true } }];

    fetchMock
      .addGraphQL({
        eol: { createReport: { success: true, id: 'test-456', totalRecords: components.length } },
      })
      .addGraphQL({ eol: { report: null } }, [{ message: 'Database connection failed', path: ['eol', 'report'] }]);

    const input: CreateEolReportInput = {
      sbom: { bomFormat: 'CycloneDX', components: [], specVersion: '1.4', version: 1 },
    };
    await expect(submitScan(input)).rejects.toThrow(/Failed to fetch EOL report/);
  });

  it('throws when multiple GraphQL errors are present', async () => {
    fetchMock.addGraphQL({ eol: { createReport: null } }, [
      { message: 'Error 1: Authentication failed', path: ['eol', 'createReport'] },
      { message: 'Error 2: Rate limit exceeded', path: ['eol', 'createReport'] },
    ]);

    const input: CreateEolReportInput = {
      sbom: { bomFormat: 'CycloneDX', components: [], specVersion: '1.4', version: 1 },
    };
    await expect(submitScan(input)).rejects.toThrow(/Failed to create EOL report/);
  });

  it('throws with generic message when GraphQL errors have no message', async () => {
    fetchMock.addGraphQL({ eol: { createReport: null } }, [{ message: '', path: ['eol', 'createReport'] }]);

    const input: CreateEolReportInput = {
      sbom: { bomFormat: 'CycloneDX', components: [], specVersion: '1.4', version: 1 },
    };
    await expect(submitScan(input)).rejects.toThrow(/Failed to create EOL report/);
  });

  describe('scanOrigin', () => {
    it('passes scanOrigin to createReport mutation when provided', async () => {
      const components = [{ purl: 'pkg:npm/test@1.0.0', metadata: { isEol: false } }];

      fetchMock
        .addGraphQL({
          eol: { createReport: { success: true, id: 'test-origin', totalRecords: components.length } },
        })
        .addGraphQL({
          eol: {
            report: {
              id: 'test-origin',
              createdOn: new Date().toISOString(),
              metadata: {},
              components,
              page: 1,
              totalRecords: components.length,
            },
          },
        });

      const input: CreateEolReportInput = {
        sbom: { bomFormat: 'CycloneDX', components: [], specVersion: '1.4', version: 1 },
        scanOrigin: SCAN_ORIGIN_CLI,
      };
      await submitScan(input);

      const variables = getGraphQLVariables(fetchMock, 0);
      expect(variables.input).toHaveProperty('scanOrigin', SCAN_ORIGIN_CLI);
    });

    it('passes automated scanOrigin when specified', async () => {
      const components = [{ purl: 'pkg:npm/test@1.0.0', metadata: { isEol: false } }];

      fetchMock
        .addGraphQL({
          eol: { createReport: { success: true, id: 'test-automated', totalRecords: components.length } },
        })
        .addGraphQL({
          eol: {
            report: {
              id: 'test-automated',
              createdOn: new Date().toISOString(),
              metadata: {},
              components,
              page: 1,
              totalRecords: components.length,
            },
          },
        });

      const input: CreateEolReportInput = {
        sbom: { bomFormat: 'CycloneDX', components: [], specVersion: '1.4', version: 1 },
        scanOrigin: SCAN_ORIGIN_AUTOMATED,
      };
      await submitScan(input);

      const variables = getGraphQLVariables(fetchMock, 0);
      expect(variables.input).toHaveProperty('scanOrigin', SCAN_ORIGIN_AUTOMATED);
    });

    it('does not include scanOrigin when not provided', async () => {
      const components = [{ purl: 'pkg:npm/test@1.0.0', metadata: { isEol: false } }];

      fetchMock
        .addGraphQL({
          eol: { createReport: { success: true, id: 'test-no-origin', totalRecords: components.length } },
        })
        .addGraphQL({
          eol: {
            report: {
              id: 'test-no-origin',
              createdOn: new Date().toISOString(),
              metadata: {},
              components,
              page: 1,
              totalRecords: components.length,
            },
          },
        });

      const input: CreateEolReportInput = {
        sbom: { bomFormat: 'CycloneDX', components: [], specVersion: '1.4', version: 1 },
      };
      await submitScan(input);

      const variables = getGraphQLVariables(fetchMock, 0);
      expect(variables.input).not.toHaveProperty('scanOrigin');
    });
  });
});
