import { ProcessResult } from '@herodevs/tracker-shared';
import { getData } from './get-data';
import { getDataFilePath } from './get-data-filepath';
import { writeFileSync } from 'fs';

export function saveResults(
  localRootDir: string,
  outputDir: string,
  results: ProcessResult
): void {
  console.log('Outputting file');
  const output: ProcessResult[] = getData(localRootDir, outputDir);
  if (!Array.isArray(output)) {
    console.error('Invalid output file format');
  }
  output.push(results);
  const outputPath = getDataFilePath(localRootDir, outputDir);
  const outputText = JSON.stringify(output, null, 2);
  writeFileSync(outputPath, outputText);
  console.log(`Output written to: ${outputPath}`);
}
