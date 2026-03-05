import * as path from 'node:path';
import type { Hook } from '@oclif/core';
import debug from 'debug';

const hook: Hook<'prerun'> = async function (this: Hook.Context, { Command }) {
  if (Command.prototype.jsonEnabled()) {
    debug.disable();
  }

  if (Command.id === 'update') {
    const isNpm = this.config.root.split(path.sep).includes('node_modules');

    if (isNpm) {
      this.warn('The update command is not supported for npm installations.');
      this.log('\nTo update to the latest, run:\n');
      this.log('  npm install -g @herodevs/cli@latest\n');
      this.log('\nTo update to a specific version, run:\n');
      this.log('  npm install -g @herodevs/cli@<version>\n');

      process.exit(0);
    }
  }
};

export default hook;
