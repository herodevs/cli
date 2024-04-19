import { existsSync } from 'fs';
import { join, resolve } from 'path';

export function getRootDir(directory: string): string {
  if (existsSync(join(directory, 'package.json'))) {
    return directory;
  }
  return getRootDir(resolve(join(directory, '..')));
}
