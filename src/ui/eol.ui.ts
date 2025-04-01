import { ux } from '@oclif/core';
import type { ScanResultComponentsMap } from '../api/types/hd-cli.types.ts';
import type { ComponentStatus } from '../api/types/nes.types.ts';
import { parseMomentToSimpleDate } from './date.ui.ts';
import { INDICATORS, STATUS_COLORS } from './shared.us.ts';

export const truncatePurl = (purl: string): string => {
  return purl.length > 60 ? `${purl.slice(0, 57)}...` : purl;
};

export const colorizeStatus = (status: ComponentStatus): string => {
  return ux.colorize(STATUS_COLORS[status], status);
};

const formatSimpleComponent = (purl: string, status: ComponentStatus): string => {
  const color = STATUS_COLORS[status];
  return `  ${INDICATORS[status]} ${ux.colorize(color, truncatePurl(purl))}`;
};

const getDaysEolString = (daysEol: number | null): string => {
  // UNKNOWN || OK
  if (daysEol === null) {
    return '';
  }
  // LTS
  if (daysEol < 0) {
    return `${Math.abs(daysEol)} days from now`;
  }
  // EOL
  if (daysEol === 0) {
    return 'today';
  }
  return `${daysEol} days ago`;
};

function formatDetailedComponent(
  purl: string,
  eolAt: Date | null,
  daysEol: number | null,
  status: ComponentStatus,
): string {
  const simpleComponent = formatSimpleComponent(purl, status);
  const eolAtString = parseMomentToSimpleDate(eolAt);
  const daysEolString = getDaysEolString(daysEol);

  const output = [`${simpleComponent}`, `    ⮑  EOL Date: ${eolAtString} (${daysEolString})`]
    .filter(Boolean)
    .join('\n');

  return output;
}

export const createStatusDisplay = (
  components: ScanResultComponentsMap,
  all: boolean,
): Record<ComponentStatus, string[]> => {
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
};
