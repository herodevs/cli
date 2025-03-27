import { ux } from '@oclif/core';
import inquirer from 'inquirer';
import type { ComponentStatus, ScanResult, ScanResultComponentsMap } from '../api/types/nes.types.ts';
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

export function createStatusDisplay(components: ScanResultComponentsMap, status: ComponentStatus): string {
  const matchingComponents = Array.from(components.entries())
    .filter(([_, component]) => component.info.status === status)
    .map(([purl, component]) => {
      const truncatedPurl = truncatePurl(purl);

      // For OK and UNKNOWN, just show the PURL
      if (status === 'OK' || status === 'UNKNOWN') {
        return `  ${truncatedPurl}`;
      }

      // For EOL and LTS, show full metadata
      const { eolAt, daysEol } = component.info;
      const eolAtString = parseMomentToSimpleDate(eolAt);
      const daysEolString = daysEol ? `(${daysEol} days)` : '';
      const statusText = colorizeStatus(component.info.status);

      return `  ${truncatedPurl}\n    Status: ${statusText}\n    EOL Date: ${eolAtString} ${daysEolString}`;
    });

  return `${status} Components (${matchingComponents.length} found):\n${matchingComponents.join(
    status === 'OK' || status === 'UNKNOWN' ? '\n' : '\n\n',
  )}`;
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
