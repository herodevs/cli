import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { Config } from './models/config';

export function readConfig(rootDirectory: string, optionsPath?: string): Config {
  let path = join(rootDirectory, 'hd-tracker', 'config.json');
  if (optionsPath) {
    if (existsSync(join(rootDirectory, optionsPath))) {
      path = join(rootDirectory, optionsPath);
    } else {
      console.log('Provided config file not found at path', join(rootDirectory, optionsPath));
    }
  }

  try {
    const contents = readFileSync(path, 'utf-8');
    return JSON.parse(contents);
  } catch (error) {
    console.error('Error reading config file:', path);
    process.exit(1);
  }
}
