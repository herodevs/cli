import type { Hook } from '@oclif/core';

import { initOclifLog, log } from '../../utils/log.util.ts';

const hook: Hook<'prerun'> = async (opts) => {
  initOclifLog(opts.context.log, opts.context.log, opts.context.debug);
  log.info = opts.context.log || log.info;
  log.warn = opts.context.log || log.warn;
  log.debug = opts.context.debug || log.debug;
};

export default hook;
