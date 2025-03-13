import inquirer from 'inquirer';
import type { Answers } from 'inquirer';
import { type Line, formatLine } from '../line.ts';

export function promptComponentDetails(lines: Line[]): Promise<Answers> {
  const context = {
    longest: lines.map((l) => l.purl.length).reduce((a, l) => Math.max(a, l), 0),
    total: lines.length,
  };

  return inquirer.prompt([
    {
      choices: lines.map((l, idx) => formatLine(l, idx, context)),
      message: 'Which components',
      name: 'selected',
      pageSize: 20,
      type: 'checkbox',
    },
  ]);
}
