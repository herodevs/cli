import { ux } from '@oclif/core';
import { makeTable } from '@oclif/table';
import { PackageURL } from 'packageurl-js';
import type { ScanResultComponentsMap } from '../api/types/hd-cli.types.ts';
import type {
  ComponentStatus,
  InsightsEolScanComponent,
  InsightsEolScanComponentInfo,
} from '../api/types/nes.types.ts';
import { resolvePurlPackageName } from '../service/eol/eol.svc.ts';
import { parseMomentToSimpleDate } from './date.ui.ts';
import { INDICATORS, MAX_PURL_LENGTH, MAX_TABLE_COLUMN_WIDTH, STATUS_COLORS } from './shared.ui.ts';

export function truncateString(purl: string, maxLength: number): string {
  const ellipses = '...';
  return purl.length > maxLength ? `${purl.slice(0, maxLength - ellipses.length)}${ellipses}` : purl;
}

export function colorizeStatus(status: ComponentStatus): string {
  return ux.colorize(STATUS_COLORS[status], status);
}

function formatSimpleComponent(purl: string, status: ComponentStatus): string {
  const color = STATUS_COLORS[status];
  return `  ${INDICATORS[status]} ${ux.colorize(color, truncateString(purl, MAX_PURL_LENGTH))}`;
}

function getDaysEolString(daysEol: number | null): string {
  if (daysEol === null) {
    return '';
  }
  if (daysEol < 0) {
    return `${Math.abs(daysEol)} days from now`;
  }
  if (daysEol === 0) {
    return 'today';
  }
  return `${daysEol} days ago`;
}

function formatDetailedComponent(purl: string, info: InsightsEolScanComponentInfo): string {
  const { status, eolAt, daysEol, vulnCount } = info;
  const simpleComponent = formatSimpleComponent(purl, status);
  const eolAtString = parseMomentToSimpleDate(eolAt);
  const daysEolString = getDaysEolString(daysEol);

  const output = [
    `${simpleComponent}`,
    `    ⮑  EOL Date: ${eolAtString} (${daysEolString})`,
    `    ⮑  # of Vulns: ${vulnCount ?? ''}`,
  ]
    .filter(Boolean)
    .join('\n');

  return output;
}

export function createStatusDisplay(
  components: ScanResultComponentsMap,
  all: boolean,
): Record<ComponentStatus, string[]> {
  const statusOutput: Record<ComponentStatus, string[]> = {
    UNKNOWN: [],
    OK: [],
    SUPPORTED: [],
    EOL: [],
  };

  // Single loop to separate and format components
  for (const [purl, component] of components.entries()) {
    const { status } = component.info;

    if (all) {
      if (status === 'UNKNOWN' || status === 'OK') {
        statusOutput[status].push(formatSimpleComponent(purl, status));
      }
    }
    if (status === 'SUPPORTED' || status === 'EOL') {
      statusOutput[status].push(formatDetailedComponent(purl, component.info));
    }
  }

  return statusOutput;
}

export function createTableForStatus(
  grouped: Record<ComponentStatus, InsightsEolScanComponent[]>,
  status: ComponentStatus,
) {
  const data = grouped[status].map((component) => convertComponentToTableRow(component));

  if (status === 'EOL' || status === 'SUPPORTED') {
    return makeTable({
      data,
      columns: [
        { key: 'name', name: 'NAME', width: MAX_TABLE_COLUMN_WIDTH },
        { key: 'version', name: 'VERSION', width: 10 },
        { key: 'eol', name: 'EOL', width: 12 },
        { key: 'daysEol', name: 'DAYS EOL', width: 10 },
        { key: 'type', name: 'TYPE', width: 12 },
        { key: 'vulnCount', name: '# OF VULNS', width: 12 },
      ],
    });
  }
  return makeTable({
    data,
    columns: [
      { key: 'name', name: 'NAME', width: MAX_TABLE_COLUMN_WIDTH },
      { key: 'version', name: 'VERSION', width: 10 },
      { key: 'type', name: 'TYPE', width: 12 },
      { key: 'vulnCount', name: '# OF VULNS', width: 12 },
    ],
  });
}

export function convertComponentToTableRow(component: InsightsEolScanComponent) {
  const purlParts = PackageURL.fromString(component.purl);
  const { eolAt, daysEol, vulnCount } = component.info;

  return {
    name: resolvePurlPackageName(purlParts),
    version: purlParts.version ?? '',
    eol: parseMomentToSimpleDate(eolAt),
    daysEol: daysEol,
    type: purlParts.type,
    vulnCount: vulnCount,
  };
}

export function groupComponentsByStatus(
  components: ScanResultComponentsMap,
): Record<ComponentStatus, InsightsEolScanComponent[]> {
  const grouped: Record<ComponentStatus, InsightsEolScanComponent[]> = {
    UNKNOWN: [],
    OK: [],
    SUPPORTED: [],
    EOL: [],
  };

  for (const component of components.values()) {
    grouped[component.info.status].push(component);
  }

  return grouped;
}
