import { ux } from '@oclif/core';
import debug from 'debug';

import type { Hook } from '@oclif/core';

import { initOclifLog, log } from '../service/log.svc.ts';

const hook: Hook<'prerun'> = async (opts) => {
  // If JSON flag is enabled, silence ux actions and debug
  if (opts.argv.includes('--json')) {
    const noop = () => {};
    debug.disable();
    ux.action.start = noop;
    ux.action.stop = noop;
    initOclifLog(noop, noop, noop, noop);
    log.info = noop;
    log.warn = noop;
    log.debug = noop;
    log.error = noop;
  } else {
    // Wrap all logging functions to handle type conversion
    const wrapLog =
      (fn: (message: string) => void) =>
      (message?: unknown, ...args: unknown[]) => {
        if (typeof message === 'string') {
          fn(message);
        }
      };

    initOclifLog(
      wrapLog(opts.context.log),
      wrapLog(opts.context.warn),
      wrapLog(opts.context.debug),
      (message?: unknown, ...args: unknown[]) => {
        if (typeof message === 'string' || message instanceof Error) {
          opts.context.error(message);
        }
      },
    );
    log.info = wrapLog(opts.context.log) || log.info;
    log.warn = wrapLog(opts.context.warn) || log.warn;
    log.debug = wrapLog(opts.context.debug) || log.debug;
    log.error = (message?: unknown, ...args: unknown[]) => {
      if (typeof message === 'string' || message instanceof Error) {
        opts.context.error(message);
      }
    };
  }
};

export default hook;
