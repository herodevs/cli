#!/usr/bin/env node

process.env.GRAPHQL_HOST = 'https://api.dev.nes.herodevs.com';
process.env.EOL_REPORT_URL = 'https://eol-report-card.stage.apps.herodevs.io';

import main from './main.js';

try {
  await main(false);
} catch (error) {
  process.exit(1);
}
