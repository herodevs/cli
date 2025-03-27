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

function formatSimpleComponent(purl: string, status: ComponentStatus): string {
  const unknownIndicator = status === 'UNKNOWN' ? ux.colorize('blue', ' *') : '';
  return `  • ${truncatePurl(purl)}${unknownIndicator}`;
}

function formatDetailedComponent(
  purl: string,
  eolAt: Date | null,
  daysEol: number | null,
  status: ComponentStatus,
): string {
  const eolAtString = parseMomentToSimpleDate(eolAt);
  const daysEolString = daysEol ? `${daysEol} days` : '';
  const statusText = colorizeStatus(status);

  return [
    `  • ${ux.colorize('bold', truncatePurl(purl))}`,
    `    ⮑  Status: ${statusText}`,
    `    ⮑  EOL Date: ${eolAtString}`,
    daysEolString && `    ⮑  Time Elapsed: ${ux.colorize('red', daysEolString)}`,
  ]
    .filter(Boolean)
    .join('\n');
}

function getMatchingComponents(
  components: ScanResultComponentsMap,
  status: ComponentStatus | 'OTHER',
): Array<[string, ScanResultComponent]> {
  return Array.from(components.entries()).filter(([_, component]) => {
    if (status === 'OTHER') {
      return component.info.status === 'OK' || component.info.status === 'UNKNOWN';
    }
    return component.info.status === status;
  });
}

function formatComponentList(components: string[], status: ComponentStatus | 'OTHER'): string {
  const separator = status === 'EOL' || status === 'LTS' ? '\n\n' : '\n';
  const header = ux.colorize('bold', `${status} Components (${components.length} found):`);
  const line = '─'.repeat(50);
  const separatorLine = `\n${ux.colorize('dim', `  ${line}`)}`;

  return `${header}${separatorLine}\n${components.join(separator)}`;
}

export function createStatusDisplay(components: ScanResultComponentsMap, status: ComponentStatus | 'OTHER'): string {
  const matchingComponents = getMatchingComponents(components, status).map(([purl, component]) => {
    // For EOL and LTS, keep detailed view
    if (component.info.status === 'EOL' || component.info.status === 'LTS') {
      const { eolAt, daysEol } = component.info;
      return formatDetailedComponent(purl, eolAt, daysEol, component.info.status);
    }
    // For others (OK, UNKNOWN), use simple view with potential unknown indicator
    return formatSimpleComponent(purl, component.info.status);
  });

  return formatComponentList(matchingComponents, status);
}

export async function promptStatusSelection(
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
            name: `${colorizeStatus(status as ComponentStatus)} (${count} components)`,
            value: status,
          })),
        { name: 'Exit', value: 'exit' },
      ],
    },
  ]);
  return selection;
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

export async function promptForContinue(): Promise<void> {
  await inquirer.prompt([
    {
      type: 'input',
      name: 'continue',
      message: 'Press enter to continue...',
    },
  ]);
}
