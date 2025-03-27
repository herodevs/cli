import { ux } from '@oclif/core';
import Table from 'cli-table3';
import inquirer from 'inquirer';
import type { ComponentStatus, ScanResultComponentsMap } from '../api/types/nes.types.ts';
import { parseDateToString } from './date.ui.ts';

export function truncatePurl(purl: string): string {
  return purl.length > 50 ? `${purl.slice(0, 47)}...` : purl;
}

export function colorizeStatus(status: ComponentStatus): string {
  const color = status === 'EOL' ? 'red' : status === 'LTS' ? 'yellow' : status === 'OK' ? 'green' : 'default';
  return ux.colorize(color, status);
}

export function createTableForStatus(components: ScanResultComponentsMap, status: ComponentStatus): Table.Table {
  const table = new Table({
    head: ['PURL', 'Status', 'EOL At', 'Days Eol'],
    colWidths: [50, 12, 24, 12],
    wordWrap: true,
    style: {
      'padding-left': 1,
      'padding-right': 1,
      head: [],
      border: [],
    },
  });

  for (const [purl, component] of components.entries()) {
    if (component.info.status !== status) continue;

    const { eolAt, daysEol } = component.info;

    const statusColorized = colorizeStatus(component.info.status);
    const eolAtString = parseDateToString(eolAt);
    const truncatedPurl = truncatePurl(purl);

    table.push([
      { content: truncatedPurl },
      { content: statusColorized },
      { content: eolAtString },
      { content: daysEol?.toString() ?? '' },
    ]);
  }
  return table;
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
