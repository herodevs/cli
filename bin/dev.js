#!/usr/bin/env node

import main from './main.js';

try {
  await main(false);
} catch {
  process.exit(1);
}
