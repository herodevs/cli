import { ok } from 'node:assert';
import { describe, it } from 'node:test';

import type { ApolloHelper } from '../nes.client.ts';
import { type ScanResult, type ScanResultComponent, SbomScanner as sbomScanner } from './sbom.ts';

describe('SBOM Scanner', () => {
  it('parses response and creates components record', async () => {
    const mock = mocked.success.insights.scan.eol;

    const helper = {
      mutate: () => Promise.resolve({ data: mocked.success }),
    } as unknown as ApolloHelper;

    const purls = ['pkg:npm/camelcase@6.3.0', 'pkg:npm/bootstrap@3.0.0'];

    const sbom = {
      components: {},
      purls,
    };

    const scan = sbomScanner(helper);
    const result = await scan(sbom);
    ok('components' in result);

    // make sure the scan has the components from above
    for (const key of Object.keys(mock.components)) {
      ok(key in result.components);
    }
  });
});

const STATUS_OK = { eolAt: null, isEol: false, isUnsafe: false };

const DATE_MS = 1000 * 60 * 60 * 24;
const STATUS_EOL = () => ({
  eolAt: new Date(Date.now() - Math.random() * DATE_MS * 30 * 6 + 15 * DATE_MS),
  isEol: true,
  isUnsafe: false,
});

const components = new Map<string, ScanResultComponent>();
components.set('pkg:npm/bootstrap@3.3.0', {
  info: STATUS_EOL(),
  purl: 'pkg:npm/bootstrap@3.3.0',
  status: 'EOL',
});
components.set('pkg:npm/camelcase@6.3.0', {
  info: STATUS_OK,
  purl: 'pkg:npm/camelcase@6.3.0',
  status: 'OK',
});
const mocked = {
  success: {
    insights: {
      scan: {
        eol: {
          components,
          diagnostics: {
            __mock: true,
          },
          message: 'Your scan was completed successfully!',
          success: true,
        } satisfies ScanResult,
      },
    },
  },
};
