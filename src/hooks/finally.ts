import type { Hook } from '@oclif/core';
import ora from 'ora';
import { track } from '../service/analytics.svc.ts';

const hook: Hook<'finally'> = async (opts) => {
  const spinner = ora().start('Cleaning up');
  const event = track('CLI Session Ended', (context) => ({
    cli_version: context.cli_version,
    ended_at: new Date(),
  })).promise;

  if (!opts.argv.includes('--help')) {
    await event;
  }

  spinner.stop();
};

export default hook;
