import type { Hook } from '@oclif/core';
import { ux } from '@oclif/core';
import debug from 'debug';

const hook: Hook<'prerun'> = async (opts) => {
  // If JSON flag is enabled, silence ux actions and debug
  if (opts.argv.includes('--json')) {
    const noop = () => {};
    debug.disable();
    ux.action.start = noop;
    ux.action.stop = noop;
  }
};

export default hook;
