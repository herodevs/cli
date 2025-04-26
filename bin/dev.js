#!/usr/bin/env node

// Localhost
// process.env.GRAPHQL_HOST = 'http://localhost:3000';

// Dev
process.env.GRAPHQL_HOST = 'https://api.dev.nes.herodevs.com';

// Prod
// process.env.GRAPHQL_HOST = 'https://api.nes.herodevs.com';

import main from './main.js';

main(false).catch(console.error);
