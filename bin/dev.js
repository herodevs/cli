#!/usr/bin/env node

import { execute } from '@oclif/core';

// Localhost
// process.env.GRAPHQL_HOST = 'http://localhost:3000';

// Dev
process.env.GRAPHQL_HOST = 'https://api.dev.nes.herodevs.com';

// Prod
// process.env.GRAPHQL_HOST = 'https://api.nes.herodevs.com';

// If no command is provided, default to scan:eol -t
// See https://github.com/oclif/oclif/issues/277#issuecomment-657352674 for more info
// There is no canonical way to do this, so we're using a hacky solution
if (process.argv.length === 2) {
  process.argv[2] = 'scan:eol';
  process.argv[3] = '-t';
}

await execute({ development: true, dir: import.meta.url });
