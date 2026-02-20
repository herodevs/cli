import { parseArgs } from 'node:util';
import type { Hook } from '@oclif/core';
import { initializeAnalytics, track } from '../../service/analytics.svc.ts';
import { debugLogger, getErrorMessage } from '../../service/log.svc.ts';

const hook: Hook.Init = async () => {
  const args = parseArgs({ allowPositionals: true, strict: false });
  try {
    await initializeAnalytics();
  } catch (error) {
    debugLogger('Failed to initialize analytics in init hook: %s', getErrorMessage(error));
  }

  try {
    track('CLI Command Submitted', (context) => ({
      command: args.positionals.join(' ').trim(),
      command_flags: Object.entries(args.values).flat().join(' '),
      app_used: context.app_used,
      ci_provider: context.ci_provider,
      cli_version: context.cli_version,
      started_at: context.started_at,
    }));
  } catch (error) {
    debugLogger('Failed to track command submission: %s', getErrorMessage(error));
  }
};

export default hook;
