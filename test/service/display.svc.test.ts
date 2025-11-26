import type { EolReport, EolScanComponentMetadata } from '@herodevs/eol-shared';
import {
  countComponentsByStatus,
  formatDataPrivacyLink,
  formatReportSaveHint,
  formatScanResults,
  formatWebReportUrl,
} from '../../src/service/display.svc.ts';

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
          cveStats: [],
        } as unknown as EolScanComponentMetadata,
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
          cveStats: [],
        } as unknown as EolScanComponentMetadata,
      },
      {
        purl: 'pkg:npm/test3@3.0.0',
        metadata: null,
      },
      {
        purl: 'pkg:npm/%40scoped/package@1.0.0',
        metadata: {
          isEol: false,
          eolAt: null,
          eolReasons: [],
          cveStats: [],
        } as unknown as EolScanComponentMetadata,
      },
      {
        purl: 'pkg:maven/org.springframework/spring-core@5.3.21',
        metadata: {
          isEol: true,
          eolAt: '2023-01-01T00:00:00.000Z',
          eolReasons: ['End of life'],
          cveStats: [],
        } as unknown as EolScanComponentMetadata,
      },
    ],
    createdOn: new Date().toISOString(),
    metadata: {
      totalComponentsCount: 5,
      unknownComponentsCount: 1,
      totalUniqueComponentsCount: 5,
    },
    page: 1,
    totalRecords: 5,
  };

  describe('countComponentsByStatus', () => {
    it('should count components by status correctly', () => {
      const counts = countComponentsByStatus(mockReport);

      expect(counts.EOL).toBe(2);
      expect(counts.OK).toBe(2);
      expect(counts.UNKNOWN).toBe(1);
      expect(counts.EOL_UPCOMING).toBe(0);
      expect(counts.NES_AVAILABLE).toBe(1);
    });

    it('should extract ecosystems correctly from various PURL formats', () => {
      const counts = countComponentsByStatus(mockReport);

      // Should extract both npm and maven ecosystems
      expect(counts.ECOSYSTEMS).toContain('npm');
      expect(counts.ECOSYSTEMS).toContain('maven');
      expect(counts.ECOSYSTEMS).toHaveLength(2);
    });

    it('should handle empty report', () => {
      const emptyReport: EolReport = {
        id: 'empty',
        createdOn: new Date().toISOString(),
        components: [],
        metadata: {
          totalComponentsCount: 0,
          unknownComponentsCount: 0,
          totalUniqueComponentsCount: 0,
        },
        page: 1,
        totalRecords: 0,
      };

      const counts = countComponentsByStatus(emptyReport);

      expect(counts.EOL).toBe(0);
      expect(counts.OK).toBe(0);
      expect(counts.UNKNOWN).toBe(0);
      expect(counts.EOL_UPCOMING).toBe(0);
      expect(counts.NES_AVAILABLE).toBe(0);
    });
  });

  describe('formatScanResults', () => {
    it('should format scan results with components', () => {
      const lines = formatScanResults(mockReport);

      expect(lines.length).toBeGreaterThan(0);
      expect(lines.some((line) => line.includes('Scan results:'))).toBe(true);
      expect(lines.some((line) => line.includes('5 total packages scanned'))).toBe(true);
    });

    it('should handle empty scan results', () => {
      const emptyReport: EolReport = {
        id: 'empty',
        createdOn: new Date().toISOString(),
        components: [],
        metadata: {
          totalComponentsCount: 0,
          unknownComponentsCount: 0,
          totalUniqueComponentsCount: 0,
        },
        page: 1,
        totalRecords: 0,
      };

      const lines = formatScanResults(emptyReport);

      expect(lines).toHaveLength(1);
      expect(lines[0]).toContain('No components found');
    });
  });

  describe('formatWebReportUrl', () => {
    it('should format web report URL correctly', () => {
      const lines = formatWebReportUrl('test-id', 'https://example.com');

      expect(lines).toHaveLength(2);
      expect(lines[0]).toContain('-'.repeat(40));
      expect(lines[1]).toContain('View your full EOL report');
      expect(lines[1]).toContain('test-id');
    });

    it('should handle different URLs', () => {
      const lines = formatWebReportUrl('another-id', 'https://reports.herodevs.com');

      expect(lines[1]).toContain('reports.herodevs.com');
      expect(lines[1]).toContain('another-id');
    });
  });

  describe('formatDataPrivacyLink', () => {
    it('should return array with privacy link', () => {
      const lines = formatDataPrivacyLink();

      expect(lines).toHaveLength(1);
      expect(lines[0]).toContain('🔒');
      expect(lines[0]).toContain('Learn more about data privacy');
    });

    it('should include HeroDevs documentation URL', () => {
      const lines = formatDataPrivacyLink();

      expect(lines[0]).toContain('docs.herodevs.com/eol-ds/data-privacy-and-security');
    });
  });

  describe('formatReportSaveHint', () => {
    it('should provide a save hint message', () => {
      const lines = formatReportSaveHint();

      expect(lines).toHaveLength(2);
      expect(lines[0]).toContain('-'.repeat(40));
      expect(lines[1]).toContain('--save');
    });
  });
});
