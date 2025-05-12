#!/usr/bin/env node

// Localhost
// process.env.ENVIRONMENT = 'localhost';

process.env.ENVIRONMENT = 'development';

import main from './main.js';

try {
  await main(false);
} catch (error) {
  process.exit(1);
}
