import { resolve, join } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { format } from 'date-fns';
import { Commit, getLastCommit } from 'git-last-commit';
import { Config } from './models/config';
import { ProcessResult } from './models/process-result';
// import { AggregateResult } from './models/aggregate-result';
// import { TrackerChart } from './tracker-chart';
// import { ChartConfig } from './models/chart-config';

const DATE_FORMAT = 'yyyy-MM-dd-HH-mm-ss-SSS';

/**
 *
 *
 *
 * internal alphabetized helper functions ->
 *
 */

function formatDate(date: Date): string {
  return format(date, DATE_FORMAT);
}

function getDataFilePath(localRootDir: string, outputDir: string) {
  return resolve(join(localRootDir, outputDir, 'data.json'));
}

function getGitDate(date: string): Date {
  return new Date(+date * 1000);
}

function getLastCommitAsPromise(): Promise<Commit> {
  return new Promise((resolve, reject) => {
    getLastCommit((err, commit) => {
      if (err) {
        reject(err);
      }
      resolve(commit);
    });
  });
}

/**
 *
 *
 *
 * exported alphabetized util functions ->
 *
 */

// export async function createDataVizIn(
//   chartConfig: ChartConfig,
//   parentDirectory: string,
//   allJsonData: ProcessResult[],
//   graphablePropertyName: keyof AggregateResult = 'total'
// ): Promise<void> {
//   const chart = new TrackerChart(chartConfig, allJsonData, DATE_FORMAT);
//   return chart.writeTo(parentDirectory, graphablePropertyName);
// }

export function getData(localRootDir: string, outputDir: string) {
  const outputPath = getDataFilePath(localRootDir, outputDir);
  let contents = '';
  if (existsSync(outputPath)) {
    contents = readFileSync(outputPath).toString('utf-8');
  }
  return contents === '' ? [] : JSON.parse(contents);
}

export async function getGitCommit(): Promise<{
  hash: string;
  timestamp: string;
}> {
  const commit = await getLastCommitAsPromise();
  return {
    hash: commit.hash,
    timestamp: formatDate(getGitDate(commit.committedOn)),
  };
}

export function getTheRootDirectory(directory: string): string {
  if (existsSync(join(directory, 'package.json'))) {
    return directory;
  }
  return getTheRootDirectory(resolve(join(directory, '..')));
}

export function readConfig(rootDirectory: string, optionsPath?: string): Config {
  const path =
    optionsPath && existsSync(join(rootDirectory, optionsPath))
      ? join(rootDirectory, optionsPath)
      : join(rootDirectory, 'hd-tracker', 'config.json');

  const contents = readFileSync(path).toString('utf-8');

  return JSON.parse(contents);
}

export function saveResults(localRootDir: string, outputDir: string, results: ProcessResult): void {
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
