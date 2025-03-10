import * as yargs from 'yargs';
import { CommandModule } from 'yargs';
import { reportCommittersCommand } from '@herodevs/report-committers';
import { reportDiagnosticsCommand } from '@herodevs/report-diagnostics';
import { reportIngestionCommand } from '@herodevs/report-ingestion';
import { trackerInitCommand } from '@herodevs/tracker-init';
import { trackerRunCommand } from '@herodevs/tracker-run';
import { createGroupCommand } from './create-group-command';
import { nesInitCommand } from '@herodevs/nes-init';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getCommands(): CommandModule<any, any>[] {
  const nesCommand = createGroupCommand(
    'nes',
    '',
    'command',
    'nes command',
    [],
    [nesInitCommand],
    'Invalid nes command'
  );

  const reportCommand = createGroupCommand(
    'report',
    '',
    'type',
    'type of report',
    'r',
    [reportCommittersCommand, reportDiagnosticsCommand, reportIngestionCommand],
    'Invalid report type'
  );

  const trackerCommand = createGroupCommand(
    'tracker',
    '',
    'command',
    'tracker command',
    [],
    [trackerInitCommand, trackerRunCommand],
    'Invalid tracker command'
  );

  return [defaultCommand, nesCommand, reportCommand, trackerCommand];
}

const defaultCommand: CommandModule<object, unknown> = {
  command: '$0',
  describe: false,
  handler: (): void => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    yargs.showHelp('log');
  },
};
