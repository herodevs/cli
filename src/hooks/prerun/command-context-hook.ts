import type { Hook } from '@oclif/core';

import { initOclifLog, log } from '../../service/log.svc.ts';

const hook: Hook.Prerun = async (opts) => {
  console.log('prerun hook');
  initOclifLog(opts.context.log, opts.context.log, opts.context.debug);
  log.info = opts.context.log || log.info;
  log.warn = opts.context.log || log.warn;
  log.debug = opts.context.debug || log.debug;
};

export default hook;
