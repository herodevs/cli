import { ux } from '@oclif/core';
import type { ComponentStatus, ScanResult, ScanResultComponentsMap } from '../api/types/nes.types.ts';
import { parseMomentToSimpleDate } from './date.ui.ts';
import { INDICATORS, STATUS_COLORS } from './shared.us.ts';

export function truncatePurl(purl: string): string {
  return purl.length > 60 ? `${purl.slice(0, 57)}...` : purl;
}

export function colorizeStatus(status: ComponentStatus): string {
  return ux.colorize(STATUS_COLORS[status], status);
}

function formatSimpleComponent(purl: string, status: ComponentStatus): string {
  const color = STATUS_COLORS[status];
  return `  ${INDICATORS[status]} ${ux.colorize(color, truncatePurl(purl))}`;
}

function formatDetailedComponent(
  purl: string,
  eolAt: Date | null,
  daysEol: number | null,
  status: ComponentStatus,
): string {
  const simpleComponent = formatSimpleComponent(purl, status);
  const eolAtString = parseMomentToSimpleDate(eolAt);
  const daysEolString = daysEol ? `${daysEol} days` : '';
  const statusText = colorizeStatus(status);

  return [
    `${simpleComponent}`,
    `    ⮑  Status: ${statusText}`,
    `    ⮑  EOL Date: ${eolAtString}`,
    daysEolString && `    ⮑  Time Elapsed: ${daysEolString}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function createStatusDisplay(components: ScanResultComponentsMap, all: boolean): [string[], string[]] {
  const regularOutput: string[] = [];
  const criticalOutput: Array<{ output: string; daysEol: number }> = [];

  // Single loop to separate and format components
  for (const [purl, component] of components.entries()) {
    const { status, eolAt, daysEol } = component.info;

    if (status === 'EOL' || status === 'LTS') {
      const output = formatDetailedComponent(purl, eolAt, daysEol, status);
      criticalOutput.push({ output, daysEol: daysEol ?? 0 });
    } else if (all) {
      regularOutput.push(formatSimpleComponent(purl, status));
    }
  }

  // Sort only the critical components by daysEol
  const sortedCriticalOutput = criticalOutput.sort((a, b) => b.daysEol - a.daysEol).map((item) => item.output);

  // Combine with separator if both arrays have content
  return [regularOutput, sortedCriticalOutput];
}

export function initializeStatusCounts(scan: ScanResult, all: boolean): Record<string, number> {
  // If not showing all, only track EOL and LTS
  if (!all) {
    const counts = {
      EOL: 0,
      LTS: 0,
    };

    for (const [_, component] of scan.components) {
      const status = component.info.status;
      if (status === 'EOL' || status === 'LTS') {
        counts[status]++;
      }
    }

    return counts;
  }

  // When showing all, group OK and UNKNOWN under OTHER
  const counts = {
    EOL: 0,
    LTS: 0,
    OTHER: 0,
  };

  for (const [_, component] of scan.components) {
    const status = component.info.status;
    if (status === 'EOL' || status === 'LTS') {
      counts[status]++;
    } else {
      counts.OTHER++;
    }
  }

  return counts;
}
