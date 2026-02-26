import { parseArgs } from 'node:util';
import { execute } from '@oclif/core';

async function main(isProduction = false) {
  const { positionals } = parseArgs({
    allowPositionals: true,
    strict: false, // Don't validate flags
  });

  // If no arguments at all, default to help
  if (positionals.length === 0) {
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
