import type { Hook } from '@oclif/core';
import ora from 'ora';
import { track } from '../service/analytics.svc.ts';

const hook: Hook<'finally'> = async (opts) => {
  const isHelpOrVersionCmd = opts.argv.includes('--help') || opts.argv.includes('--version') || opts.Command?.id === 'version'
  
  let spinner;

  if (!isHelpOrVersionCmd) {
    spinner = ora().start('Cleaning up');
  }

  const event = track('CLI Session Ended', (context) => ({
    cli_version: context.cli_version,
    ended_at: new Date(),
  })).promise;

  if (!isHelpOrVersionCmd) {
    await event;
    spinner?.stop();
  }

};

export default hook;
