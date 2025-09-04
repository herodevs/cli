#!/usr/bin/env node

import main from './main.js';

try {
  await main(true);
} catch {
  process.exit(1);
}
