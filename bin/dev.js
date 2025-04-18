#!/usr/bin/env node

import { execute } from '@oclif/core';

// Localhost
process.env.GRAPHQL_HOST = 'http://localhost:3000';

// Dev
// process.env.GRAPHQL_HOST = 'https://api.dev.nes.herodevs.com';

// Prod
// process.env.GRAPHQL_HOST = 'https://api.nes.herodevs.com';

await execute({ development: true, dir: import.meta.url });
