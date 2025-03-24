import type { Hook } from '@oclif/core';
import { ux } from '@oclif/core';

import { log, updateLogger } from '../service/log.svc.ts';

const hook: Hook.Prerun = async (opts) => {
  // If JSON flag is enabled, silence all logs and ux actions
  if (opts.argv.includes('--json')) {
    // Create no-op functions for JSON mode
    const noop = () => {};
    updateLogger({ log: noop, warn: noop, debug: noop });
    // Silence ux actions
    ux.action.start = noop;
    ux.action.stop = noop;
  } else {
    // Use the command context's logging functions
    updateLogger(opts.context);
  }
};

export default hook;
