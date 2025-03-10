import { expect } from 'chai';

import { ApolloHelper } from '../nes.client';
import { SbomScanner as sbomScanner, ScanResult } from './sbom';

describe('SBOM Scanner', () => {
  it('parses response and creates components record', async () => {

    const mock = mocked.success.insights.scan.eol

    const helper = {
      mutate: () => Promise.resolve({ data: mocked.success })
    } as unknown as ApolloHelper

    const purls = [
      'pkg:npm/camelcase@6.3.0',
      'pkg:npm/bootstrap@3.0.0',
    ]

    const sbom = {
      components: {},
      purls
    }

    const scan = sbomScanner(helper);
    const result = await scan(sbom);
    expect(result).has.property('components')

    // make sure the scan has the components from above
    for (const key of mock.components.map(c => c.purl)) {
      expect(result.components).to.have.property(key)
    }
  });
});



const STATUS_OK = { isEol: false, isUnsafe: false }

const DATE_MS = 1000 * 60 * 60 * 24
const STATUS_EOL = () => ({
  eolAt: new Date(
    Date.now()
    - (Math.random() * DATE_MS * 30 * 6)
    + (15 * DATE_MS)
  ),
  isEol: true,
  isUnsafe: false
})


const mocked = {
  success: {
    insights: {
      scan: {
        eol: {
          components: [
            { info: STATUS_OK, purl: 'pkg:npm/camelcase@6.3.0', 'status': 'OK' },
            { info: STATUS_EOL(), purl: 'pkg:npm/bootstrap@3.3.0', 'status': 'EOL' }
          ],
          diagnostics: {
            __mock: true
          },
          message: 'Your scan was completed successfully!',
          success: true,
        } as ScanResult
      }
    }
  }
}