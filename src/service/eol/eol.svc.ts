import type { PackageURL } from 'packageurl-js';
import { debugLogger } from '../../service/log.svc.ts';
import { type Sbom, createBomFromDir } from './cdx.svc.ts';

export interface CdxGenOptions {
  projectType?: string[];
}

export interface ScanOptions {
  cdxgen?: CdxGenOptions;
}

export type CdxCreator = (dir: string, opts: CdxGenOptions) => Promise<{ bomJson: Sbom }>;
export async function createSbom(directory: string, opts: ScanOptions = {}) {
  const sbom = await createBomFromDir(directory, opts.cdxgen || {});
  if (!sbom) throw new Error('SBOM not generated');
  debugLogger('SBOM generated');
  return sbom;
}

export function validateIsCycloneDxSbom(sbom: unknown): asserts sbom is Sbom {
  if (!sbom || typeof sbom !== 'object') {
    throw new Error('SBOM must be an object');
  }

  const s = sbom as Record<string, unknown>;

  // Basic CycloneDX validation
  if (!('bomFormat' in s) || s.bomFormat !== 'CycloneDX') {
    throw new Error('Invalid SBOM format: must be CycloneDX');
  }

  if (!('specVersion' in s) || typeof s.specVersion !== 'string') {
    throw new Error('Invalid SBOM: missing specVersion');
  }

  if (!('components' in s) || !Array.isArray(s.components)) {
    throw new Error('Invalid SBOM: missing or invalid components array');
  }
}

const purlPackageNameRules = {
  npm: (p: PackageURL) => (p.namespace ? `${p.namespace}/${p.name}` : p.name),
  maven: (p: PackageURL) => (p.namespace ? `${p.namespace}:${p.name}` : p.name),
  pypi: (p: PackageURL) => p.name.toLowerCase(),
  nuget: (p: PackageURL) => p.name,
  gem: (p: PackageURL) => p.name,
  composer: (p: PackageURL) => (p.namespace ? `${p.namespace}/${p.name}` : p.name),
  golang: (p: PackageURL) => (p.namespace ? `${p.namespace}/${p.name}` : p.name),
  cargo: (p: PackageURL) => p.name,
  conan: (p: PackageURL) => (p.namespace ? `${p.namespace}/${p.name}` : p.name),
  github: (p: PackageURL) => (p.namespace ? `${p.namespace}/${p.name}` : p.name),
  bitbucket: (p: PackageURL) => (p.namespace ? `${p.namespace}/${p.name}` : p.name),
  docker: (p: PackageURL) => (p.namespace ? `${p.namespace}/${p.name}` : p.name),
} as const;

function isKnownEcosystemType(type: string): type is keyof typeof purlPackageNameRules {
  return type in purlPackageNameRules;
}

export function resolvePurlPackageName(purl: PackageURL): string {
  if (!isKnownEcosystemType(purl.type)) {
    debugLogger(`Unsupported package type: ${purl.type}, falling back to name only`);
    return purl.name;
  }
  return purlPackageNameRules[purl.type](purl);
}
