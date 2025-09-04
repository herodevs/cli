#!/usr/bin/env node

import main from './main.js';

try {
  await main(false);
} catch (_error) {
  process.exit(1);
}
