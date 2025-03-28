import { ux } from '@oclif/core';
import type { ComponentStatus, ScanResult, ScanResultComponentsMap } from '../api/types/nes.types.ts';
import { parseMomentToSimpleDate } from './date.ui.ts';

export function truncatePurl(purl: string): string {
  return purl.length > 60 ? `${purl.slice(0, 57)}...` : purl;
}

export function getColorForStatus(status: ComponentStatus): string {
  return status === 'EOL' ? 'red' : status === 'LTS' ? 'yellow' : status === 'OK' ? 'green' : 'default';
}

export function colorizeStatus(status: ComponentStatus): string {
  return ux.colorize(getColorForStatus(status), status);
}

function formatSimpleComponent(purl: string, status: ComponentStatus): string {
  const indicator = status === 'UNKNOWN' ? ux.colorize('blue', '*') : '•';
  return `  ${indicator} ${truncatePurl(purl)}`;
}

function formatDetailedComponent(
  purl: string,
  eolAt: Date | null,
  daysEol: number | null,
  status: ComponentStatus,
): string {
  const eolAtString = parseMomentToSimpleDate(eolAt);
  const daysEolString = daysEol ? `${daysEol} days` : '';
  const statusColor = getColorForStatus(status);
  const statusText = colorizeStatus(status);

  return [
    `  • ${ux.colorize(`${statusColor}`, truncatePurl(purl))}`,
    `    ⮑  Status: ${statusText}`,
    `    ⮑  EOL Date: ${eolAtString}`,
    daysEolString && `    ⮑  Time Elapsed: ${daysEolString}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function createStatusDisplay(components: ScanResultComponentsMap, all: boolean): string {
  const matchingComponents: string[] = [];

  Array.from(components.entries()).map(([purl, component]) => {
    // For EOL and LTS, keep detailed view
    if (component.info.status === 'EOL' || component.info.status === 'LTS') {
      const { eolAt, daysEol } = component.info;
      matchingComponents.push(formatDetailedComponent(purl, eolAt, daysEol, component.info.status));
    }
    // For others (OK, UNKNOWN), use simple view with potential unknown indicator
    else if (all) {
      matchingComponents.push(formatSimpleComponent(purl, component.info.status));
    }
  });

  return matchingComponents.join('\n');
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
