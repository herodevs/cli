import { execute } from '@oclif/core';

async function main(isProduction = false) {
  // If no command is provided, default to scan:eol -t
  // See https://github.com/oclif/oclif/issues/277#issuecomment-657352674 for more info
  if (process.argv.length === 2) {
    process.argv[2] = 'scan:eol';
    process.argv[3] = '-t';
  } else if (process.argv.length > 2) {
    const firstArg = process.argv[2];
    const isFlag = firstArg.startsWith('-');

    // If it's a flag or not a valid command, insert scan:eol
    if (isFlag || (!firstArg.includes(':') && process.argv.length === 3)) {
      process.argv.splice(2, 0, 'scan:eol');
      // Add -t flag if no other flags are present
      if (!process.argv.some((arg) => arg.startsWith('-'))) {
        process.argv.splice(3, 0, '-t');
      }
    }
  }

  await execute({
    development: !isProduction,
    dir: new URL('./dev.js', import.meta.url),
  });
}

export default main;
