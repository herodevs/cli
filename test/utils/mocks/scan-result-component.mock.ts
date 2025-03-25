import type { ScanResult, ScanResultComponent } from '../../../src/api/types/nes.types.ts';

export const createMockComponent = (
  purl: string,
  status: 'OK' | 'EOL' | 'LTS' = 'OK',
  eolAt: Date | null = null,
  daysEol: number | null = null,
): ScanResultComponent => ({
  purl,
  info: {
    eolAt,
    isEol: status === 'EOL',
    isUnsafe: false,
    status,
    daysEol,
  },
});

export const createMockScan = (components: ScanResultComponent[]): ScanResult => ({
  components: new Map(components.map((c) => [c.purl, c])),
  message: 'Test scan',
  success: true,
  warnings: [],
});
