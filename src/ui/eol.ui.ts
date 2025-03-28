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

export function createStatusDisplay(
  components: ScanResultComponentsMap,
  all: boolean,
): Record<ComponentStatus, string[]> {
  const statusOutput: Record<ComponentStatus, string[]> = {
    UNKNOWN: [],
    OK: [],
    LTS: [],
    EOL: [],
  };

  // Single loop to separate and format components
  for (const [purl, component] of components.entries()) {
    const { status, eolAt, daysEol } = component.info;

    if (all) {
      if (status === 'UNKNOWN' || status === 'OK') {
        statusOutput[status].push(formatSimpleComponent(purl, status));
      }
    }
    if (status === 'LTS' || status === 'EOL') {
      statusOutput[status].push(formatDetailedComponent(purl, eolAt, daysEol, status));
    }
  }

  return statusOutput;
}
