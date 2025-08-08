import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';
import type { CreateEolReportInput } from '@herodevs/eol-shared';
import { submitScan } from '../../src/api/nes.client.ts';
import { FetchMock } from '../utils/mocks/fetch.mock.ts';

describe('nes.client', () => {
  let fetchMock: FetchMock;

  beforeEach(() => {
    fetchMock = new FetchMock();
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it('returns report on successful createReport mutation', async () => {
    const report = {
      id: 'test-123',
      createdOn: new Date().toISOString(),
      metadata: {},
      components: [
        { purl: 'pkg:npm/bootstrap@3.1.1', metadata: { isEol: true } },
        {
          purl: 'pkg:npm/is-core-module@2.11.0',
          metadata: {},
          nesRemediation: { remediations: [{ urls: { main: 'https://example.com' } }] },
        },
      ],
    };

    fetchMock.addGraphQL({
      eol: { createReport: { success: true, report } },
    });

    const input: CreateEolReportInput = {
      sbom: { bomFormat: 'CycloneDX', components: [], specVersion: '1.4', version: 1 },
    };
    const res = await submitScan(input);

    assert.strictEqual(res.id, report.id);
    assert.strictEqual(Array.isArray(res.components), true);
    assert.strictEqual(res.components.length, 2);
  });

  it('throws when mutation returns unsuccessful response or no report', async () => {
    fetchMock.addGraphQL({
      eol: { createReport: { success: false, report: null } },
    });

    const input: CreateEolReportInput = {
      sbom: { bomFormat: 'CycloneDX', components: [], specVersion: '1.4', version: 1 },
    };
    await assert.rejects(() => submitScan(input), /Failed to create EOL report/);
  });
});
