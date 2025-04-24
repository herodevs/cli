import { createBom } from '@cyclonedx/cdxgen';
import { debugLogger } from '../../service/log.svc.ts';
import type { CdxGenOptions } from './eol.svc.ts';

export interface SbomEntry {
  group: string;
  name: string;
  purl: string;
  version: string;
}

export interface Sbom {
  components: SbomEntry[];
  dependencies: SbomEntry[];
}

export const SBOM_DEFAULT__OPTIONS = {
  $0: 'cdxgen',
  _: [],
  'auto-compositions': true,
  autoCompositions: true,
  'data-flow-slices-file': 'data-flow.slices.json',
  dataFlowSlicesFile: 'data-flow.slices.json',
  deep: false, // TODO: you def want to check this out
  'deps-slices-file': 'deps.slices.json',
  depsSlicesFile: 'deps.slices.json',
  evidence: false,
  'export-proto': false,
  exportProto: false,
  // DON'T FAIL ON ERROR; you won't get hlepful logs
  'fail-on-error': false,
  failOnError: false,
  false: true,
  'include-crypto': false,
  'include-formulation': false,
  includeCrypto: false,
  includeFormulation: false,
  'no-install-deps': true,
  noInstallDeps: true,
  'min-confidence': 0,
  minConfidence: 0,
  multiProject: true,
  'no-banner': false,
  noBabel: false,
  noBanner: false,
  o: 'bom.json',
  output: 'bom.json',
  outputFormat: 'json', // or "xml"
  // author: ['OWASP Foundation'],
  profile: 'generic',
  project: undefined,
  'project-version': '',
  projectVersion: '',
  'proto-bin-file': 'bom.cdx',
  protoBinFile: 'bom.cdx',
  r: false,
  'reachables-slices-file': 'reachables.slices.json',
  reachablesSlicesFile: 'reachables.slices.json',
  recurse: false,
  requiredOnly: false,
  'semantics-slices-file': 'semantics.slices.json',
  semanticsSlicesFile: 'semantics.slices.json',
  'skip-dt-tls-check': true,
  skipDtTlsCheck: true,
  'spec-version': 1.6,
  specVersion: 1.6,
  'usages-slices-file': 'usages.slices.json',
  usagesSlicesFile: 'usages.slices.json',
  validate: true,
};

/**
 * Lazy loads cdxgen (for ESM purposes), scans
 * `directory`, and returns the `bomJson` property.
 */
export async function createBomFromDir(directory: string, opts: CdxGenOptions = {}) {
  const sbom = await createBom(directory, { ...SBOM_DEFAULT__OPTIONS, ...opts });
  debugLogger('Successfully generated SBOM');
  return sbom?.bomJson;
}
