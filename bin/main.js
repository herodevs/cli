import { execute } from '@oclif/core';
import { parseArgs } from 'node:util';

async function main(isProduction = false) {
  const { positionals } = parseArgs({
    allowPositionals: true,
    strict: false, // Don't validate flags
  });

  // If no arguments at all, default to scan:eol
  if (positionals.length === 0) {
    process.argv.splice(2, 0, 'scan:eol');
  }
  // If only flags are provided, set scan:eol as the command for those flags
  else if (positionals.length === 1 && positionals[0].startsWith('-')) {
    process.argv.splice(2, 0, 'scan:eol');
  }

  try {
    await execute({
      development: !isProduction,
      dir: new URL('./dev.js', import.meta.url),
    });
  } catch (_error) {
    process.exit(1);
  }
}

export default main;
