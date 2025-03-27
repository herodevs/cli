import { fail, ok, strictEqual } from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { runCommand } from '@oclif/test';
import * as sinon from 'sinon';

import type { ScanResponseReport, ScanResult } from '../../../src/api/types/nes.types.ts';
import { default as SbomScan } from '../../../src/commands/scan/sbom.ts';
import type { Sbom } from '../../../src/service/eol/cdx.svc.ts';
import { cdxgen, prepareRows } from '../../../src/service/eol/eol.svc.ts';
import type { CdxCreator } from '../../../src/service/eol/eol.svc.ts';
import { buildScanResult } from '../../../src/service/nes/nes.svc.ts';
import { extractPurls } from '../../../src/service/purls.svc.ts';
import { FetchMock } from '../../utils/mocks/fetch.mock.ts';

// Toggle off if you want to try against an actual server
const MOCK_GQL = true;

describe('scan:eol', () => {
  let bomJson: Sbom | undefined;

  beforeEach(async () => {
    // if it ever does make a request, hit localhost
    process.env.GRAPHQL_HOST = 'http://localhost:3000';

    // mock cdxgen because it's slow AF
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const example = path.resolve(__dirname, 'bom.json');
    bomJson = JSON.parse(await fs.readFile(example, 'utf8'));
    cdxgen.createBom = (() => Promise.resolve({ bomJson })) as CdxCreator;
  });

  it.skip('runs against simple npm fixture', async () => {
    // Mock the scanOptions to force projectType to use npm (otherwise it'll try yarn and such)
    sinon.stub(SbomScan.prototype, 'getScanOptions').returns({ cdxgen: { projectType: ['npm'] } });

    if (!bomJson) fail('No bomJson');
    // TODO: rework this to not require all teh methods for testing
    // dev note: pretending to process the output of our mock, so it matches

    // now that we've got the mocked options for the UI, we can pretend one is selected

    if (MOCK_GQL) {
      new FetchMock().addGraphQL({
        insights: { scan: { eol: mocked.simple } },
      });
    }

    // finally run the command
    const cmd = 'scan eol --dir test/fixtures/npm/simple/';
    const output = await runCommand(cmd);

    // print some helpful info if we fail
    if (output.error) {
      console.warn(output.error);
      strictEqual(output.error, undefined);
    }

    const result = output.result as ScanResult;
    ok('components' in result);
    ok(result.components.size > 0);
    // console.log(stdout)
  });

  afterEach(() => {
    sinon.restore();
  });
});

/**
 * Mocked responses from the server
 */
const mocked = {
  // dead simple example
  simple: {
    components: [
      {
        info: {
          eolAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
          isEol: true,
          isUnsafe: false,
        },
        purl: 'pkg:npm/bootstrap@3.1.1',
      },
    ],
    message: 'Mocked simple',
    success: true,
  } as ScanResponseReport,
  // TODO: add more responses
};
