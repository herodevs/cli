import type { Hook } from '@oclif/core';
import { ux } from '@oclif/core';

import { log } from '../service/log.svc.ts';

const hook: Hook.Prerun = async (opts) => {
  // If JSON flag is enabled, silence all logs and ux actions
  if (opts.argv.includes('--json')) {
    log.info = () => {};
    log.warn = () => {};
    log.debug = () => {};
    // Silence ux actions
    ux.action.start = () => {};
    ux.action.stop = () => {};
  } else {
    // Otherwise use the command context's logging functions
    log.info = opts.context.log;
    log.warn = opts.context.log;
    log.debug = opts.context.debug;
  }
};

export default hook;
