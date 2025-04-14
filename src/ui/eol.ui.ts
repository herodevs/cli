import { ux } from '@oclif/core';
import Table from 'cli-table3';
import { PackageURL } from 'packageurl-js';
import type { ScanResultComponentsMap } from '../api/types/hd-cli.types.ts';
import type { ComponentStatus, InsightsEolScanComponent } from '../api/types/nes.types.ts';
import { parseMomentToSimpleDate } from './date.ui.ts';
import { INDICATORS, MAX_PURL_LENGTH, MAX_TABLE_COLUMN_WIDTH, STATUS_COLORS } from './shared.ui.ts';

export function truncateString(purl: string, maxLength: number): string {
  return purl.length > maxLength ? `${purl.slice(0, maxLength - 3)}...` : purl;
}

export function colorizeStatus(status: ComponentStatus): string {
  return ux.colorize(STATUS_COLORS[status], status);
}

function formatSimpleComponent(purl: string, status: ComponentStatus): string {
  const color = STATUS_COLORS[status];
  return `  ${INDICATORS[status]} ${ux.colorize(color, truncateString(purl, MAX_PURL_LENGTH))}`;
}

function getDaysEolString(daysEol: number | null): string {
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
}

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

export function createTableForStatus(
  components: ScanResultComponentsMap,
  status: ComponentStatus
): { table: Table.Table; count: number } {
  let count = 0;

  const table = new Table({
    head: ['NAME', 'VERSION', 'EOL', 'DAYS EOL', 'TYPE'],
    colWidths: [MAX_TABLE_COLUMN_WIDTH, 10, 12, 10, 12],
    wordWrap: true,
    style: {
      'padding-left': 1,
      'padding-right': 1,
      head: [],
      border: [],
    },
  });

  for (const [_, component] of components.entries()) {
    if (component.info.status !== status) continue;

    const row = convertComponentToTableRow(component);
    table.push(row);
    count++;
  }
  return { table, count };
}

export function convertComponentToTableRow(component: InsightsEolScanComponent) {
  const purlParts = PackageURL.fromString(component.purl);
  const { eolAt, daysEol } = component.info;

  return [
    { content: purlParts.name },
    { content: purlParts.version },
    { content: parseMomentToSimpleDate(eolAt) },
    { content: daysEol },
    { content: purlParts.type },
    // vulns: component.vulns.length, // TODO: add vulns to monorepo api
  ];
}
