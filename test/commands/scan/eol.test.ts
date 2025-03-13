
import { runCommand } from '@oclif/test'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { ok, strictEqual } from 'node:assert'
import fs from 'node:fs/promises'
import path from 'node:path';
import * as sinon from 'sinon'; 

import { default as EolScan } from '../../../src/commands/scan/eol.ts'
import { cdxgen, extractComponents, prepareRows, type Sbom, } from '../../../src/service/eol/eol.svc.ts';
import type { CdxCreator } from '../../../src/service/eol/eol.types.ts';
import { buildScanResult, type ScanResponseReport } from '../../../src/service/nes/modules/sbom.ts'
import { FetchMock } from '../../utils/mocks/fetch.mock.ts';
import { InquirerMock } from '../../utils/mocks/ui.mock.ts';

// Toggle off if you want to try against an actual server
const MOCK_GQL = true

describe('scan:eol', () => {


  let bomJson: Sbom | undefined

  beforeEach(async () => {
    // if it ever does make a request, hit localhost
    process.env.GRAPHQL_HOST = "http://localhost:3000"

    // mock cdxgen because it's slow AF
    const example = path.resolve(import.meta.dirname, 'bom.json')
    bomJson = JSON.parse(await fs.readFile(example, 'utf8'))
    cdxgen.createBom = (() => Promise.resolve({ bomJson })) as CdxCreator
  })

  it('runs against simple npm fixture', async () => {
    // Mock the scanOptions to force projectType to use npm (otherwise it'll try yarn and such)
    sinon
      .stub(EolScan.prototype, 'getScanOptions')
      .returns({ cdxgen: { projectType: ["npm"] } })

    // TODO: rework this to not require all teh methods for testing
    // dev note: pretending to process the output of our mock, so it matches
    const lines = await prepareRows(
      await extractComponents(bomJson!),
      buildScanResult(mocked.simple)
    )

    // now that we've got the mocked options for the UI, we can pretend one is selected
    new InquirerMock().push({
      selected: [
        lines[0]
      ]
    })

    if (MOCK_GQL) {
      new FetchMock().addGraphQL({ insights: { scan: { eol: mocked.simple } } })
    }

    // finally run the command
    const cmd = 'scan eol --dir test/fixtures/npm/simple/'
    const output = await runCommand(cmd)

    // print some helpful info if we fail
    if (output.error) {
      console.warn(output.error)
      strictEqual(output.error, undefined)
    }

    // TODO: actually check the deeper result?
    ok('components' in output.result)
    // console.log(stdout)
  })

  afterEach(() => {
    sinon.restore();
  });
})

/**
 * Mocked responses from the server
 */
const mocked = {
  // dead simple example
  simple: {
    components: [
      {
        info: {
          eolAt: new Date(2019, 7, 24, 0, 0, 0, 0),
          isEol: true,
          isUnsafe: false
        },
        purl: 'pkg:npm/bootstrap@3.1.1',
      }
    ],
    message: 'Mocked simple',
    success: true
  } as ScanResponseReport,
  // TODO: add more responses 
}
