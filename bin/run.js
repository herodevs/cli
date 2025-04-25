#!/usr/bin/env node

import { execute } from '@oclif/core';

// If no command is provided, default to scan:eol -t
// See https://github.com/oclif/oclif/issues/277#issuecomment-657352674 for more info
// There is no canonical way to do this, so we're using a hacky solution
if (process.argv.length === 2) {
  process.argv[2] = 'scan:eol';
  process.argv[3] = '-t';
}

await execute({ dir: import.meta.url });
