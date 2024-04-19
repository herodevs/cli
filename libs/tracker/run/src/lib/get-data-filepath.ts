import { join, resolve } from 'path';

export function getDataFilePath(localRootDir: string, outputDir: string) {
  return resolve(join(localRootDir, outputDir, 'data.json'));
}
