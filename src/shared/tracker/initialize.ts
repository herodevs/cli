import { join } from 'path';
import { existsSync, writeFileSync, mkdirSync } from 'fs';

import defaultConfig from './default-config';

export function initialize(rootDir: string): void {
  const output = JSON.stringify(defaultConfig, null, 2);
  const dir = join(rootDir, 'hd-tracker');
  if (!existsSync(dir)) {
    mkdirSync(dir);
  }
  writeFileSync(join(dir, 'config.json'), output);
}
