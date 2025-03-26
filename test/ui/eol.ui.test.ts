import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';
import type { Line } from '../../src/service/line.svc.js';
import { promptComponentDetails } from '../../src/ui/eol.ui.js';
import { InquirerMock } from '../utils/mocks/ui.mock.ts';

describe('EOL UI', () => {
  describe('promptComponentDetails', () => {
    let mock: InquirerMock;

    beforeEach(() => {
      mock = new InquirerMock();
    });

    afterEach(() => {
      mock.restore();
    });

    it('should format choices with proper context', async () => {
      mock.push({ selected: ['pkg:npm/test@1.0.0'] });

      const lines: Line[] = [
        {
          purl: 'pkg:npm/test@1.0.0',
          status: 'EOL',
          daysEol: 30,
          info: { isEol: true, eolAt: new Date() },
        },
        {
          purl: 'pkg:npm/another@2.0.0',
          status: 'OK',
          daysEol: null,
          info: { isEol: false, eolAt: null },
        },
      ];

      const result = await promptComponentDetails(lines);
      assert(result);
      assert(Array.isArray(result.selected));
      assert.equal(result.selected[0], 'pkg:npm/test@1.0.0');
    });

    it('should handle empty lines array', async () => {
      mock.push({ selected: [] });

      const lines: Line[] = [];
      const result = await promptComponentDetails(lines);
      assert(result);
      assert(Array.isArray(result.selected));
      assert.equal(result.selected.length, 0);
    });

    it('should handle lines with varying purl lengths', async () => {
      mock.push({ selected: ['pkg:npm/very-long-package-name@1.0.0'] });

      const lines: Line[] = [
        {
          purl: 'pkg:npm/very-long-package-name@1.0.0',
          status: 'EOL',
          daysEol: 30,
          info: { isEol: true, eolAt: new Date() },
        },
        {
          purl: 'pkg:npm/short@1.0.0',
          status: 'OK',
          daysEol: null,
          info: { isEol: false, eolAt: null },
        },
      ];

      const result = await promptComponentDetails(lines);
      assert(result);
      assert(Array.isArray(result.selected));
      assert.equal(result.selected[0], 'pkg:npm/very-long-package-name@1.0.0');
    });
  });
});
