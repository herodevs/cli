import { ux } from '@oclif/core';
import inquirer from 'inquirer';
import type {
  ComponentStatus,
  ScanResult,
  ScanResultComponent,
  ScanResultComponentsMap,
} from '../api/types/nes.types.ts';
import { parseMomentToSimpleDate } from './date.ui.ts';

export function truncatePurl(purl: string): string {
  return purl.length > 50 ? `${purl.slice(0, 47)}...` : purl;
}

export function getColorForStatus(status: ComponentStatus): string {
  return status === 'EOL' ? 'red' : status === 'LTS' ? 'yellow' : status === 'OK' ? 'green' : 'default';
}

export function colorizeStatus(status: ComponentStatus): string {
  return ux.colorize(getColorForStatus(status), status);
}

function formatSimpleComponent(purl: string): string {
  return `  ${truncatePurl(purl)}`;
}

function formatDetailedComponent(
  purl: string,
  eolAt: Date | null,
  daysEol: number | null,
  status: ComponentStatus,
): string {
  const eolAtString = parseMomentToSimpleDate(eolAt);
  const daysEolString = daysEol ? `(${daysEol} days)` : '';
  const statusText = colorizeStatus(status);

  return `  ${truncatePurl(purl)}\n    Status: ${statusText}\n    EOL Date: ${eolAtString} ${daysEolString}`;
}

function getMatchingComponents(
  components: ScanResultComponentsMap,
  status: ComponentStatus,
): Array<[string, ScanResultComponent]> {
  return Array.from(components.entries()).filter(([_, component]) => component.info.status === status);
}

function formatComponentList(components: string[], status: ComponentStatus): string {
  const separator = status === 'OK' || status === 'UNKNOWN' ? '\n' : '\n\n';
  return `${status} Components (${components.length} found):\n${components.join(separator)}`;
}

export function createStatusDisplay(components: ScanResultComponentsMap, status: ComponentStatus): string {
  const matchingComponents = getMatchingComponents(components, status).map(([purl, component]) => {
    if (status === 'OK' || status === 'UNKNOWN') {
      return formatSimpleComponent(purl);
    }

    const { eolAt, daysEol } = component.info;
    return formatDetailedComponent(purl, eolAt, daysEol, status);
  });

  return formatComponentList(matchingComponents, status);
}

export async function promptTableSelection(
  statusCounts: Record<ComponentStatus, number>,
): Promise<ComponentStatus | 'exit'> {
  const { selection } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selection',
      message: 'Select status to view:',
      choices: [
        ...Object.entries(statusCounts)
          .filter(([_, count]) => count > 0)
          .map(([status, count]) => ({
            name: `${status} (${count} components)`,
            value: status,
          })),
        { name: 'Exit', value: 'exit' },
      ],
    },
  ]);
  return selection;
}

export function initializeStatusCounts(
  scan: ScanResult,
  withStatus: ComponentStatus[],
): Record<ComponentStatus, number> {
  const statusCounts: Record<ComponentStatus, number> = {
    EOL: 0,
    LTS: 0,
    OK: 0,
    UNKNOWN: 0,
  };

  for (const [_, component] of scan.components) {
    if (withStatus.includes(component.info.status)) {
      statusCounts[component.info.status]++;
    }
  }

  return statusCounts;
}

export async function promptForContinue(): Promise<void> {
  await inquirer.prompt([
    {
      type: 'input',
      name: 'continue',
      message: 'Press enter to continue...',
    },
  ]);
}
