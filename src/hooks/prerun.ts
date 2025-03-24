import type { Hook } from '@oclif/core';
import debug from 'debug';

const hook: Hook<'prerun'> = async (opts) => {
  // If JSON flag is enabled, silence debug logging
  if (opts.Command.prototype.jsonEnabled()) {
    debug.disable();
  }
};

export default hook;
