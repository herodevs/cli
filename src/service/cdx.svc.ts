import { createBom } from '@cyclonedx/cdxgen';
import type { CdxBom } from '@herodevs/eol-shared';
import { debugLogger } from './log.svc.ts';

const author = process.env.npm_package_author ?? 'HeroDevs, Inc.';

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
  author: [author],
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
  tools: [
    {
      name: '@herodevs/cli',
      publisher: author,
      version: process.env.npm_package_version ?? 'unknown',
    },
  ],
  'usages-slices-file': 'usages.slices.json',
  usagesSlicesFile: 'usages.slices.json',
  validate: true,
};

/**
 * Lazy loads cdxgen (for ESM purposes), scans
 * `directory`, and returns the `bomJson` property.
 */
export async function createSbom(directory: string): Promise<CdxBom> {
  const sbom = await createBom(directory, SBOM_DEFAULT__OPTIONS);
  if (!sbom) throw new Error('SBOM not generated');
  debugLogger('Successfully generated SBOM');
  return sbom.bomJson;
}
