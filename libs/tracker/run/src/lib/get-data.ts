import { existsSync, readFileSync } from 'fs';
import { getDataFilePath } from './get-data-filepath';

export function getData(localRootDir: string, outputDir: string) {
  const outputPath = getDataFilePath(localRootDir, outputDir);
  let contents = '';
  if (existsSync(outputPath)) {
    contents = readFileSync(outputPath).toString('utf-8');
  }
  return contents === '' ? [] : JSON.parse(contents);
}
