import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { Config } from './models/config';

export function readConfig(
  rootDirectory: string,
  optionsPath?: string
): Config {
  const path =
    optionsPath && existsSync(join(rootDirectory, optionsPath))
      ? join(rootDirectory, optionsPath)
      : join(rootDirectory, 'hd-tracker', 'config.json');

  const contents = readFileSync(path).toString('utf-8');

  return JSON.parse(contents);
}
