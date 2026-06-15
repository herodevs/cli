import { PackageURL } from 'packageurl-js';
import semver from 'semver';
import type { InstallCatalogEntry, InstallCatalogIndex } from '../../types/install.ts';

const DEFAULT_CATALOG_URL = 'https://api.nes.herodevs.com/api/catalog/packages?type=npm';
const CATALOG_FETCH_TIMEOUT_MS = 10_000;
const CATALOG_PAGE_CONCURRENCY = 5;

interface LoadInstallCatalogOptions {
  authToken: string;
  catalogUrl?: string;
  onProgress?: (message: string) => void;
}

interface CatalogPage {
  results: CatalogPackage[];
  totalPages: number;
}

interface CatalogPackage {
  component?: unknown;
  versions?: CatalogPackageVersion[];
}

interface CatalogPackageVersion {
  version?: unknown;
  nes?: {
    latest?: unknown;
    purl?: unknown;
    versions?: Array<{ purl?: unknown }>;
  };
}

/** Fetches every catalog page once at startup and indexes npm OSS package names to NES packages. */
export async function loadInstallCatalog(options: LoadInstallCatalogOptions): Promise<InstallCatalogIndex> {
  const catalogUrl = options.catalogUrl ?? DEFAULT_CATALOG_URL;
  options.onProgress?.('Loading NES catalog page 1');
  const firstPage = await fetchCatalogPage(catalogUrl, options.authToken);
  const pages = [firstPage];
  options.onProgress?.(`Loaded NES catalog page 1 of ${firstPage.totalPages}`);

  const remainingPages: number[] = [];
  for (let page = 2; page <= firstPage.totalPages; page++) {
    remainingPages.push(page);
  }

  for (let index = 0; index < remainingPages.length; index += CATALOG_PAGE_CONCURRENCY) {
    const batch = remainingPages.slice(index, index + CATALOG_PAGE_CONCURRENCY);
    options.onProgress?.(`Loading NES catalog pages ${batch[0]}-${batch[batch.length - 1]} of ${firstPage.totalPages}`);
    const loadedPages = await Promise.all(batch.map((page) => fetchCatalogPage(catalogUrl, options.authToken, page)));
    pages.push(...loadedPages);
  }

  const catalog = createInstallCatalogIndex(pages);
  options.onProgress?.(`Loaded NES catalog with ${catalog.size} npm package mappings`);
  return catalog;
}

/**
 * Builds the proxy routing index from catalog response pages.
 *
 * Each OSS package may have several installable catalog entries because npm resolves a concrete
 * OSS version first, while NES publishes package-specific replacement versions.
 */
export function createInstallCatalogIndex(pages: CatalogPage | CatalogPage[]): InstallCatalogIndex {
  const catalogPages = Array.isArray(pages) ? pages : [pages];
  const index: InstallCatalogIndex = new Map();

  for (const page of catalogPages) {
    for (const item of page.results) {
      const ossPackageName = getNpmPackageName(item.component);
      if (!ossPackageName) {
        continue;
      }

      const entries = getNpmNesEntries(item);
      for (const entry of entries) {
        addCatalogEntry(index, ossPackageName, entry);
      }
    }
  }

  return index;
}

async function fetchCatalogPage(catalogUrl: string, authToken: string, page?: number): Promise<CatalogPage> {
  const url = new URL(catalogUrl);
  if (page !== undefined) {
    url.searchParams.set('page', String(page));
  }

  const response = await fetch(url, {
    headers: {
      authorization: `Bearer ${authToken}`,
    },
    signal: AbortSignal.timeout(CATALOG_FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Failed to load NES catalog: ${response.status}`);
  }

  return normalizeCatalogPage(await response.json());
}

function normalizeCatalogPage(data: unknown): CatalogPage {
  if (!data || typeof data !== 'object') {
    throw new Error('Failed to load NES catalog: unexpected response shape');
  }

  const results = Array.isArray((data as { results?: unknown }).results)
    ? (data as { results: CatalogPackage[] }).results
    : [];
  const totalPages = Number((data as { totalPages?: unknown }).totalPages);

  return {
    results,
    totalPages: Number.isInteger(totalPages) && totalPages > 0 ? totalPages : 1,
  };
}

function getNpmNesEntries(item: CatalogPackage): InstallCatalogEntry[] {
  const entries: InstallCatalogEntry[] = [];
  if (!Array.isArray(item.versions)) {
    return entries;
  }

  for (const version of item.versions) {
    const ossVersion = typeof version.version === 'string' ? semver.valid(version.version) : undefined;
    const nesPackageName = getNpmPackageName(version.nes?.purl);
    const nesVersion = typeof version.nes?.latest === 'string' ? version.nes.latest : undefined;
    if (ossVersion && nesPackageName && nesVersion) {
      entries.push({ nesPackageName, nesVersion, ossVersion });
    }
  }

  return entries;
}

function addCatalogEntry(index: InstallCatalogIndex, ossPackageName: string, entry: InstallCatalogEntry): void {
  const entries = index.get(ossPackageName) ?? [];
  const duplicateIndex = entries.findIndex((candidate) => candidate.ossVersion === entry.ossVersion);
  if (duplicateIndex === -1) {
    entries.push(entry);
  } else if (isPreferredNesPackage(ossPackageName, entry.nesPackageName, entries[duplicateIndex].nesPackageName)) {
    entries[duplicateIndex] = entry;
  }

  entries.sort((left, right) => semver.compare(left.ossVersion, right.ossVersion));
  index.set(ossPackageName, entries);
}

function isPreferredNesPackage(ossPackageName: string, candidate: string, current: string): boolean {
  return (
    getPackageBaseName(candidate) === getPackageBaseName(ossPackageName) &&
    getPackageBaseName(current) !== getPackageBaseName(ossPackageName)
  );
}

function getPackageBaseName(packageName: string): string {
  return packageName.split('/').at(-1) ?? packageName;
}

function getNpmPackageName(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length === 0) {
    return;
  }

  let purl: PackageURL;
  try {
    purl = PackageURL.fromString(value);
  } catch {
    return;
  }

  if (purl.type !== 'npm') {
    return;
  }

  if (purl.namespace) {
    const namespace = purl.namespace.startsWith('@') ? purl.namespace : `@${purl.namespace}`;
    return `${namespace}/${purl.name}`;
  }

  return purl.name;
}
