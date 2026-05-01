import type { CdxBom } from '@herodevs/eol-shared';
import { extractPurlsFromCdxBom } from '@herodevs/eol-shared';
import { PackageURL } from 'packageurl-js';
import { config } from '../config/constants.ts';

export interface VexProduct {
  '@id': string;
  subcomponents?: Array<{ '@id': string }>;
}

export interface VexVulnerability {
  '@id'?: string;
  name: string;
  aliases?: string[];
  description?: string;
}

export interface VexStatement {
  vulnerability: VexVulnerability;
  products: VexProduct[];
  status: 'not_affected' | 'affected' | 'fixed' | 'under_investigation';
  justification?: string;
  impact_statement?: string;
  action_statement?: string;
  action_statement_timestamp?: string;
  timestamp?: string;
}

export interface OpenVexDocument {
  '@context': string;
  '@id': string;
  author: string;
  version: number;
  timestamp?: string;
  last_updated?: string;
  tooling?: string;
  statements: VexStatement[];
}

export async function fetchVexStatement(): Promise<OpenVexDocument> {
  const response = await fetch(config.vexStatementsUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch VEX statement: HTTP ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<OpenVexDocument>;
}

function globToRegex(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`, 'i');
}

function matchesAnyPattern(value: string, patterns: string[]): boolean {
  return patterns.some((p) => globToRegex(p).test(value));
}

function normalizePurl(purl: string): string | null {
  try {
    const parsed = PackageURL.fromString(purl);
    const ns = parsed.namespace ? `${parsed.namespace}/` : '';
    const ver = parsed.version ? `@${parsed.version}` : '';
    return `pkg:${parsed.type}/${ns}${parsed.name}${ver}`.toLowerCase();
  } catch {
    return null;
  }
}

export function filterByComponents(vex: OpenVexDocument, sbom: CdxBom): OpenVexDocument {
  const normalizePurls = new Set(
    extractPurlsFromCdxBom(sbom)
      .map(normalizePurl)
      .filter((b): b is string => b !== null),
  );

  if (normalizePurls.size === 0) return vex;

  const filtered = vex.statements.filter((stmt) =>
    stmt.products.some((product) => {
      const base = normalizePurl(product['@id']);
      return base !== null && normalizePurls.has(base);
    }),
  );

  return { ...vex, statements: filtered };
}

export function filterByPackagePatterns(vex: OpenVexDocument, patterns: string[]): OpenVexDocument {
  if (patterns.length === 0) return vex;

  const filtered = vex.statements.filter((stmt) =>
    stmt.products.some((product) => matchesAnyPattern(product['@id'], patterns)),
  );

  return { ...vex, statements: filtered };
}

export function filterByVulnPatterns(vex: OpenVexDocument, patterns: string[]): OpenVexDocument {
  if (patterns.length === 0) return vex;

  const filtered = vex.statements.filter((stmt) => matchesAnyPattern(stmt.vulnerability.name, patterns));

  return { ...vex, statements: filtered };
}

export function filterByStatus(vex: OpenVexDocument, statuses: string[]): OpenVexDocument {
  if (statuses.length === 0) return vex;

  const filtered = vex.statements.filter((stmt) => statuses.includes(stmt.status));

  return { ...vex, statements: filtered };
}

export function excludeByPackagePatterns(vex: OpenVexDocument, patterns: string[]): OpenVexDocument {
  if (patterns.length === 0) return vex;

  const filtered = vex.statements.filter(
    (stmt) => !stmt.products.some((product) => matchesAnyPattern(product['@id'], patterns)),
  );

  return { ...vex, statements: filtered };
}

export function applyVexFilters(
  vex: OpenVexDocument,
  filters: {
    sbom?: CdxBom;
    packagePatterns?: string[];
    vulnPatterns?: string[];
    statuses?: string[];
    excludePackagePatterns?: string[];
  },
): OpenVexDocument {
  let result = vex;
  if (filters.sbom) result = filterByComponents(result, filters.sbom);
  if (filters.packagePatterns?.length) result = filterByPackagePatterns(result, filters.packagePatterns);
  if (filters.vulnPatterns?.length) result = filterByVulnPatterns(result, filters.vulnPatterns);
  if (filters.statuses?.length) result = filterByStatus(result, filters.statuses);
  if (filters.excludePackagePatterns?.length) result = excludeByPackagePatterns(result, filters.excludePackagePatterns);
  return result;
}
