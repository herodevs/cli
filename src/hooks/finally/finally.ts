import type { Hook } from '@oclif/core';
import ora, { type Ora } from 'ora';
import { track } from '../../service/analytics.svc.ts';
import { debugLogger, getErrorMessage } from '../../service/log.svc.ts';

const hook: Hook<'finally'> = async (opts) => {
  const isHelpOrVersionCmd = opts.argv.includes('--help') || opts.argv.includes('--version');
  const hasError = Boolean(opts.error);

  let spinner: Ora | undefined;

  if (!isHelpOrVersionCmd && !hasError) {
    spinner = ora().start('Cleaning up');
  }

  try {
    await track('CLI Session Ended', (context) => ({
      cli_version: context.cli_version,
      ended_at: new Date(),
    })).promise;
  } catch (error) {
    debugLogger('Failed to track CLI session end: %s', getErrorMessage(error));
  }

  if (!isHelpOrVersionCmd && !hasError) {
    spinner?.stop();
  }
};

export default hook;
