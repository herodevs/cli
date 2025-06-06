#!/usr/bin/env node

import main from './main.js';

try {
  await main(false);
} catch (error) {
  process.exit(1);
}
