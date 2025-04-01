import type { InsightsEolScanComponent } from '../../../src/api/types/nes.types.ts';
import type { ScanResult } from '../../../src/api/types/hd-cli.types.ts';

export const createMockComponent = (
  purl: string,
  status: 'OK' | 'EOL' | 'LTS' = 'OK',
  eolAt: Date | null = null,
  daysEol: number | null = null,
): InsightsEolScanComponent => ({
  purl,
  info: {
    eolAt,
    isEol: status === 'EOL',
    isUnsafe: false,
    status,
    daysEol,
  },
});

export const createMockScan = (components: InsightsEolScanComponent[]): ScanResult => ({
  components: new Map(components.map((c) => [c.purl, c])),
  message: 'Test scan',
  success: true,
  warnings: [],
});
