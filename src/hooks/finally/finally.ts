import type { Hook } from '@oclif/core';
import ora, { type Ora } from 'ora';
import { track } from '../../service/analytics.svc.ts';

const hook: Hook<'finally'> = async (opts) => {
  const isHelpOrVersionCmd = opts.argv.includes('--help') || opts.argv.includes('--version');
  const hasError = Boolean(opts.error);

  let spinner: Ora | undefined;

  if (!isHelpOrVersionCmd && !hasError) {
    spinner = ora().start('Cleaning up');
  }

  const event = track('CLI Session Ended', (context) => ({
    cli_version: context.cli_version,
    ended_at: new Date(),
  })).promise;

  await event;

  if (!isHelpOrVersionCmd && !hasError) {
    spinner?.stop();
  }
};

export default hook;
