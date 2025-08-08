import assert from 'node:assert';
import { describe, it } from 'node:test';
import type { EolReport } from '@herodevs/eol-shared';
import { countComponentsByStatus, formatScanResults, formatWebReportUrl } from '../../src/service/display.svc.ts';

describe('display.svc', () => {
  const mockReport: EolReport = {
    id: 'test-id',
    components: [
      {
        purl: 'pkg:npm/test@1.0.0',
        metadata: {
          isEol: true,
          eolAt: '2023-01-01T00:00:00.000Z',
          eolReasons: ['End of life'],
          cve: [],
        },
        nesRemediation: {
          remediations: [
            {
              purls: { nes: 'pkg:npm/test-nes@1.0.0', oss: 'pkg:npm/test@1.0.0' },
              urls: { main: 'https://herodevs.com' },
            },
          ],
        },
      },
      {
        purl: 'pkg:npm/test2@2.0.0',
        metadata: {
          isEol: false,
          eolAt: null,
          eolReasons: [],
          cve: [],
        },
      },
      {
        purl: 'pkg:npm/test3@3.0.0',
        metadata: null,
      },
    ],
    createdOn: new Date().toISOString(),
    metadata: {
      totalComponentsCount: 3,
      unknownComponentsCount: 1,
    },
  };

  describe('countComponentsByStatus', () => {
    it('should count components by status correctly', () => {
      const counts = countComponentsByStatus(mockReport);

      assert.strictEqual(counts.EOL, 1);
      assert.strictEqual(counts.OK, 1);
      assert.strictEqual(counts.UNKNOWN, 1);
      assert.strictEqual(counts.EOL_UPCOMING, 0);
      assert.strictEqual(counts.NES_AVAILABLE, 1);
    });

    it('should handle empty report', () => {
      const emptyReport: EolReport = {
        id: 'empty',
        createdOn: new Date().toISOString(),
        components: [],
        metadata: {
          totalComponentsCount: 0,
          unknownComponentsCount: 0,
        },
      };

      const counts = countComponentsByStatus(emptyReport);

      assert.strictEqual(counts.EOL, 0);
      assert.strictEqual(counts.OK, 0);
      assert.strictEqual(counts.UNKNOWN, 0);
      assert.strictEqual(counts.EOL_UPCOMING, 0);
      assert.strictEqual(counts.NES_AVAILABLE, 0);
    });
  });

  describe('formatScanResults', () => {
    it('should format scan results with components', () => {
      const lines = formatScanResults(mockReport);

      assert.ok(lines.length > 0);
      assert.ok(lines.some((line) => line.includes('Scan results:')));
      assert.ok(lines.some((line) => line.includes('3 total packages scanned')));
    });

    it('should handle empty scan results', () => {
      const emptyReport: EolReport = {
        id: 'empty',
        createdOn: new Date().toISOString(),
        components: [],
        metadata: {
          totalComponentsCount: 0,
          unknownComponentsCount: 0,
        },
      };

      const lines = formatScanResults(emptyReport);

      assert.strictEqual(lines.length, 1);
      assert.ok(lines[0].includes('No components found'));
    });
  });

  describe('formatWebReportUrl', () => {
    it('should format web report URL correctly', () => {
      const lines = formatWebReportUrl('test-id', 'https://example.com');

      assert.strictEqual(lines.length, 2);
      assert.ok(lines[0].includes('-'.repeat(40)));
      assert.ok(lines[1].includes('View your full EOL report'));
      assert.ok(lines[1].includes('test-id'));
    });

    it('should handle different URLs', () => {
      const lines = formatWebReportUrl('another-id', 'https://reports.herodevs.com');

      assert.ok(lines[1].includes('reports.herodevs.com'));
      assert.ok(lines[1].includes('another-id'));
    });
  });
});
