import type { SbomEntry } from '../../../src/service/eol/eol.types.ts';
import type { ScanResult, ScanResultComponent } from '../../../src/service/nes/modules/sbom.ts';

export const createMockComponent = (
  purl: string,
  status: 'OK' | 'EOL' | 'LTS' = 'OK',
  eolAt: Date | null = null,
): ScanResultComponent => ({
  purl,
  info: {
    eolAt,
    isEol: status === 'EOL',
    isUnsafe: false,
  },
  status,
});

export const createMockModel = (purls: string[]): { components: Record<string, SbomEntry>; purls: string[] } => {
  const components: Record<string, SbomEntry> = {};
  for (const purl of purls) {
    const [type, name, version] = purl.split('@');
    components[purl] = {
      evidence: {
        occurrences: [],
      },
      group: type.split(':')[1],
      name,
      purl,
      version,
    };
  }
  return { components, purls };
};

export const createMockScan = (components: ScanResultComponent[]): ScanResult => ({
  components: new Map(components.map((c) => [c.purl, c])),
  message: 'Test scan',
  success: true,
});
