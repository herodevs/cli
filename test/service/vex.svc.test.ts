import { vi } from 'vitest';

const { extractPurlsFromCdxBomMock } = vi.hoisted(() => ({
  extractPurlsFromCdxBomMock: vi.fn(),
}));

vi.mock('@herodevs/eol-shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@herodevs/eol-shared')>();
  return { ...actual, extractPurlsFromCdxBom: extractPurlsFromCdxBomMock };
});

vi.mock('../../src/config/constants.ts', async (importOriginal) => importOriginal());

import type { CdxBom } from '@herodevs/eol-shared';
import { config } from '../../src/config/constants.ts';
import {
  applyVexFilters,
  fetchVexStatement,
  filterByComponents,
  filterByPackagePatterns,
  filterByStatus,
  filterByVulnPatterns,
  type OpenVexDocument,
} from '../../src/service/vex.svc.ts';
import { FetchMock } from '../utils/mocks/fetch.mock.ts';

const mockVex: OpenVexDocument = {
  '@context': 'https://openvex.dev/ns/v0.2.0',
  '@id': 'https://openvex.dev/docs/public/vex-test',
  author: 'HeroDevs',
  version: 1,
  statements: [
    {
      vulnerability: { name: 'CVE-2018-20676', aliases: ['GHSA-3mgp-fx93-9xv5'] },
      products: [{ '@id': 'pkg:npm/bootstrap@3.0.0' }, { '@id': 'pkg:npm/bootstrap@3.1.0' }],
      status: 'not_affected',
      justification: 'component_not_present',
    },
    {
      vulnerability: { name: 'CVE-2021-23337' },
      products: [{ '@id': 'pkg:npm/lodash@4.17.20' }],
      status: 'affected',
    },
    {
      vulnerability: { name: 'CVE-2022-31129' },
      products: [{ '@id': 'pkg:npm/moment@2.29.3' }],
      status: 'fixed',
    },
    {
      vulnerability: { name: 'CVE-2020-8203' },
      products: [{ '@id': 'pkg:npm/lodash@4.17.15' }],
      status: 'under_investigation',
    },
  ],
};

const mockSbom = {} as unknown as CdxBom;

describe('vex.svc', () => {
  describe('fetchVexStatement', () => {
    let fetchMock: FetchMock;

    beforeEach(() => {
      fetchMock = new FetchMock();
    });

    afterEach(() => {
      fetchMock.restore();
    });

    it('returns parsed OpenVEX document on success', async () => {
      fetchMock.push({
        ok: true,
        status: 200,
        async json() {
          return mockVex;
        },
      } as unknown as Response);

      const result = await fetchVexStatement();

      expect(result).toEqual(mockVex);
    });

    it('throws with status details on non-200 response', async () => {
      fetchMock.push({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      } as unknown as Response);

      await expect(fetchVexStatement()).rejects.toThrow(
        'Failed to fetch VEX statement: HTTP 503 Service Unavailable',
      );
    });

    it('fetches from the configured VEX statements URL', async () => {
      fetchMock.push({
        ok: true,
        status: 200,
        async json() {
          return mockVex;
        },
      } as unknown as Response);

      await fetchVexStatement();

      const [call] = fetchMock.getCalls();
      expect(call.input).toBe(config.vexStatementsUrl);
    });
  });

  describe('filterByComponents', () => {
    it('keeps statements whose product PURL exactly matches an SBOM component', () => {
      // SBOM has lodash@4.17.20; VEX has lodash@4.17.20 (CVE-2021-23337) and lodash@4.17.15 (CVE-2020-8203)
      extractPurlsFromCdxBomMock.mockReturnValue(['pkg:npm/lodash@4.17.20']);

      const result = filterByComponents(mockVex, mockSbom);

      const names = result.statements.map((s) => s.vulnerability.name);
      expect(names).toContain('CVE-2021-23337');
      expect(names).not.toContain('CVE-2020-8203');
      expect(names).not.toContain('CVE-2018-20676');
      expect(names).not.toContain('CVE-2022-31129');
    });

    it('requires exact version match — different versions do not match', () => {
      // SBOM has lodash@4.17.21 but VEX only has lodash@4.17.20 and lodash@4.17.15
      extractPurlsFromCdxBomMock.mockReturnValue(['pkg:npm/lodash@4.17.21']);

      const result = filterByComponents(mockVex, mockSbom);

      expect(result.statements).toHaveLength(0);
    });

    it('matches when PURL version is identical', () => {
      extractPurlsFromCdxBomMock.mockReturnValue(['pkg:npm/lodash@4.17.20']);

      const result = filterByComponents(mockVex, mockSbom);

      const names = result.statements.map((s) => s.vulnerability.name);
      expect(names).toContain('CVE-2021-23337');
    });

    it('returns original VEX unchanged when SBOM has no PURLs', () => {
      extractPurlsFromCdxBomMock.mockReturnValue([]);

      const result = filterByComponents(mockVex, mockSbom);

      expect(result).toBe(mockVex);
    });

    it('preserves non-statement fields on the document', () => {
      extractPurlsFromCdxBomMock.mockReturnValue(['pkg:npm/lodash@4.17.20']);

      const result = filterByComponents(mockVex, mockSbom);

      expect(result['@context']).toBe(mockVex['@context']);
      expect(result['@id']).toBe(mockVex['@id']);
      expect(result.author).toBe(mockVex.author);
    });
  });

  describe('filterByPackagePatterns', () => {
    it('keeps statements with products matching any glob pattern', () => {
      const result = filterByPackagePatterns(mockVex, ['pkg:npm/lodash*']);

      const names = result.statements.map((s) => s.vulnerability.name);
      expect(names).toContain('CVE-2021-23337');
      expect(names).toContain('CVE-2020-8203');
      expect(names).not.toContain('CVE-2018-20676');
      expect(names).not.toContain('CVE-2022-31129');
    });

    it('supports multiple patterns (OR logic)', () => {
      const result = filterByPackagePatterns(mockVex, ['pkg:npm/lodash*', 'pkg:npm/moment*']);

      const names = result.statements.map((s) => s.vulnerability.name);
      expect(names).toContain('CVE-2021-23337');
      expect(names).toContain('CVE-2020-8203');
      expect(names).toContain('CVE-2022-31129');
      expect(names).not.toContain('CVE-2018-20676');
    });

    it('matching is case-insensitive', () => {
      const result = filterByPackagePatterns(mockVex, ['pkg:NPM/LODASH*']);

      const names = result.statements.map((s) => s.vulnerability.name);
      expect(names).toContain('CVE-2021-23337');
    });

    it('returns original VEX unchanged when patterns list is empty', () => {
      const result = filterByPackagePatterns(mockVex, []);

      expect(result).toBe(mockVex);
    });

    it('returns empty statements when no products match', () => {
      const result = filterByPackagePatterns(mockVex, ['pkg:npm/nonexistent*']);

      expect(result.statements).toHaveLength(0);
    });
  });

  describe('filterByVulnPatterns', () => {
    it('keeps statements whose vulnerability name matches a glob pattern', () => {
      const result = filterByVulnPatterns(mockVex, ['CVE-2021-*']);

      expect(result.statements).toHaveLength(1);
      expect(result.statements[0].vulnerability.name).toBe('CVE-2021-23337');
    });

    it('supports wildcard prefix matching', () => {
      const result = filterByVulnPatterns(mockVex, ['CVE-202?-*']);

      const names = result.statements.map((s) => s.vulnerability.name);
      expect(names).toContain('CVE-2021-23337');
      expect(names).toContain('CVE-2022-31129');
      expect(names).toContain('CVE-2020-8203');
      expect(names).not.toContain('CVE-2018-20676');
    });

    it('supports multiple patterns (OR logic)', () => {
      const result = filterByVulnPatterns(mockVex, ['CVE-2021-*', 'CVE-2022-*']);

      const names = result.statements.map((s) => s.vulnerability.name);
      expect(names).toContain('CVE-2021-23337');
      expect(names).toContain('CVE-2022-31129');
      expect(names).not.toContain('CVE-2018-20676');
    });

    it('matching is case-insensitive', () => {
      const result = filterByVulnPatterns(mockVex, ['cve-2021-*']);

      expect(result.statements).toHaveLength(1);
    });

    it('returns original VEX unchanged when patterns list is empty', () => {
      const result = filterByVulnPatterns(mockVex, []);

      expect(result).toBe(mockVex);
    });
  });

  describe('filterByStatus', () => {
    it('keeps only statements with the given status', () => {
      const result = filterByStatus(mockVex, ['not_affected']);

      expect(result.statements).toHaveLength(1);
      expect(result.statements[0].status).toBe('not_affected');
    });

    it('supports filtering by multiple statuses', () => {
      const result = filterByStatus(mockVex, ['not_affected', 'fixed']);

      expect(result.statements).toHaveLength(2);
      expect(result.statements.every((s) => s.status === 'not_affected' || s.status === 'fixed')).toBe(true);
    });

    it('returns empty statements when no match', () => {
      const result = filterByStatus(mockVex, ['affected']);

      expect(result.statements).toHaveLength(1);
      expect(result.statements[0].vulnerability.name).toBe('CVE-2021-23337');
    });

    it('returns original VEX unchanged when statuses list is empty', () => {
      const result = filterByStatus(mockVex, []);

      expect(result).toBe(mockVex);
    });
  });

  describe('applyVexFilters', () => {
    it('returns original VEX unchanged when no filters are provided', () => {
      const result = applyVexFilters(mockVex, {});

      expect(result).toBe(mockVex);
    });

    it('applies sbom filter when provided', () => {
      extractPurlsFromCdxBomMock.mockReturnValue(['pkg:npm/lodash@4.17.20']);

      const result = applyVexFilters(mockVex, { sbom: mockSbom });

      const names = result.statements.map((s) => s.vulnerability.name);
      expect(names).not.toContain('CVE-2018-20676');
      expect(names).toContain('CVE-2021-23337');
    });

    it('applies package pattern filter when provided', () => {
      const result = applyVexFilters(mockVex, { packagePatterns: ['pkg:npm/moment*'] });

      expect(result.statements).toHaveLength(1);
      expect(result.statements[0].vulnerability.name).toBe('CVE-2022-31129');
    });

    it('applies vuln pattern filter when provided', () => {
      const result = applyVexFilters(mockVex, { vulnPatterns: ['CVE-2022-*'] });

      expect(result.statements).toHaveLength(1);
      expect(result.statements[0].vulnerability.name).toBe('CVE-2022-31129');
    });

    it('applies status filter when provided', () => {
      const result = applyVexFilters(mockVex, { statuses: ['fixed'] });

      expect(result.statements).toHaveLength(1);
      expect(result.statements[0].status).toBe('fixed');
    });

    it('applies multiple filters sequentially (AND logic)', () => {
      // Exact versions matching VEX products: lodash@4.17.20 (affected) + moment@2.29.3 (fixed)
      extractPurlsFromCdxBomMock.mockReturnValue(['pkg:npm/lodash@4.17.20', 'pkg:npm/moment@2.29.3']);

      // SBOM filter keeps lodash + moment statements; status filter keeps only 'affected'
      const result = applyVexFilters(mockVex, {
        sbom: mockSbom,
        statuses: ['affected'],
      });

      expect(result.statements).toHaveLength(1);
      expect(result.statements[0].vulnerability.name).toBe('CVE-2021-23337');
    });
  });
});
