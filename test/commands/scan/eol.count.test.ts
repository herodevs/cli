import type { EolReport } from '@herodevs/eol-shared';
import { countComponentsByStatus } from '../../../src/service/display.svc.ts';

describe('countComponentsByStatus', () => {
  it('sums to total components and counts NES availability', () => {
    const report: EolReport = {
      id: 'r1',
      createdOn: new Date().toISOString(),
      metadata: {} as unknown as Record<string, unknown>,
      components: [
        { purl: 'pkg:npm/a@1.0.0', metadata: {} as unknown as Record<string, unknown> },
        {
          purl: 'pkg:npm/b@1.0.0',
          metadata: {} as unknown as Record<string, unknown>,
          nesRemediation: { remediations: [{ urls: { main: 'https://example.com' } }] },
        },
      ],
    } as unknown as EolReport;

    const counts = countComponentsByStatus(report);
    const statusSum = counts.EOL + counts.EOL_UPCOMING + counts.OK + counts.UNKNOWN;

    expect(statusSum).toBe(report.components.length);
    expect(counts.NES_AVAILABLE).toBe(1);
  });
});
