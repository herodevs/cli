import { parseArgs } from 'node:util';
import type { Hook } from '@oclif/core';
import { initializeAnalytics, track } from '../../service/analytics.svc.ts';

const hook: Hook.Init = async () => {
  const args = parseArgs({ allowPositionals: true, strict: false });
  initializeAnalytics();
  track('CLI Command Submitted', (context) => ({
    command: args.positionals.join(' ').trim(),
    command_flags: Object.entries(args.values).flat().join(' '),
    app_used: context.app_used,
    ci_provider: context.ci_provider,
    cli_version: context.cli_version,
    started_at: context.started_at,
  }));
};

export default hook;
