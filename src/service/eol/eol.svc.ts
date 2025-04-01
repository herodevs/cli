import type { ScanInputOptions } from '../../api/types/hd-cli.types.ts';
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
};
