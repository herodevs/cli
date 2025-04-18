import type { ScanResult } from '../../../src/api/types/hd-cli.types.ts';
import type { ComponentStatus, InsightsEolScanComponent } from '../../../src/api/types/nes.types.ts';

export const createMockComponent = (
  purl: string,
  status: ComponentStatus = 'OK',
  eolAt: Date | null = null,
  daysEol: number | null = null,
  vulnCount = 0,
): InsightsEolScanComponent => ({
  purl,
  info: {
    eolAt,
    isEol: status === 'EOL',
    isUnsafe: false,
    status,
    daysEol,
    vulnCount,
  },
});

export const createMockScan = (components: InsightsEolScanComponent[]): ScanResult => ({
  components: new Map(components.map((c) => [c.purl, c])),
  message: 'Test scan',
  success: true,
  warnings: [],
});
