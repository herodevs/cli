import { parseArgs } from 'node:util';
import { execute } from '@oclif/core';

async function main(isProduction = false) {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    strict: false, // Don't validate flags
    options: {
      version: { type: 'boolean', short: 'v' },
    },
  });

  // If no arguments at all, default to help (but not if --version/-v was passed)
  if (positionals.length === 0 && !values.version) {
    process.argv.splice(2, 0, 'help');
  }

  try {
    await execute({
      development: !isProduction,
      dir: new URL('./dev.js', import.meta.url),
    });
  } catch {
    process.exit(1);
  }
}

export default main;
