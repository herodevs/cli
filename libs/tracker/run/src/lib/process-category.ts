import * as sloc from 'sloc';

import { lstatSync, readdirSync, readFileSync } from 'fs';
import { join, extname } from 'path';
import {
  AggregateResult,
  CategoryResult,
  Category,
  FileResult,
  TotalResult,
} from '@herodevs/tracker-shared';

export function processCategory(
  rootDirectory: string,
  category: Category,
  ignorePatterns: string[]
): CategoryResult {
  console.log(`Processing "${category.name}"...`);
  const allFiles = category.includes.reduce((acc, include) => {
    return [...acc, ...findAllFilesInDirectory(join(rootDirectory, include))];
  }, [] as string[]);

  const includedFiles = findIncludedFiles(category, ignorePatterns, allFiles);

  console.log(`     ${includedFiles.length} files...`);
  const results = includedFiles.map(getFileStats);

  const resultMap = aggregateResults(results);

  const aggregatedResults = Object.values(resultMap).map((val) => val);

  const totals = aggregatedResults.reduce(
    (totals, curr) => ({
      fileCount: totals.fileCount + curr.fileCount,
      total: totals.total + curr.total,
      source: totals.source + curr.source,
      comment: totals.comment + curr.comment,
      single: totals.single + curr.single,
      block: totals.block + curr.block,
      mixed: totals.mixed + curr.mixed,
      empty: totals.empty + curr.empty,
      todo: totals.todo + curr.todo,
      blockEmpty: totals.blockEmpty + curr.blockEmpty,
    }),
    {
      fileCount: 0,
      total: 0,
      source: 0,
      comment: 0,
      single: 0,
      block: 0,
      mixed: 0,
      empty: 0,
      todo: 0,
      blockEmpty: 0,
    } as TotalResult
  );
  const final = {
    name: category.name,
    totals: totals,
    fileTypes: aggregatedResults,
  };

  console.log(`     ${final.totals.total} total lines`);

  return final;
}

function aggregateResults(results: FileResult[]): {
  [key: string]: AggregateResult;
} {
  return results.reduce((acc, result) => {
    const fileTypeResults = acc[result.fileType];
    if (!fileTypeResults) {
      acc[result.fileType] = {
        fileType: result.fileType,
        fileCount: 1,
        total: result.total,
        source: result.source,
        comment: result.comment,
        single: result.single,
        block: result.block,
        mixed: result.mixed,
        empty: result.empty,
        todo: result.todo,
        blockEmpty: result.blockEmpty,
      };
    } else {
      acc[result.fileType] = {
        fileType: result.fileType,
        fileCount: fileTypeResults.fileCount + 1,
        total: fileTypeResults.total + result.total,
        source: fileTypeResults.source + result.source,
        comment: fileTypeResults.comment + result.comment,
        single: fileTypeResults.single + result.single,
        block: fileTypeResults.block + result.block,
        mixed: fileTypeResults.mixed + result.mixed,
        empty: fileTypeResults.empty + result.empty,
        todo: fileTypeResults.todo + result.todo,
        blockEmpty: fileTypeResults.blockEmpty + result.blockEmpty,
      };
    }
    return acc;
  }, {} as { [key: string]: AggregateResult });
}

function getFileStats(file: string): FileResult {
  const contents = readFileSync(file).toString('utf-8');
  const fileType = getFileExt(file);
  const stats = sloc(contents, fileType);
  return {
    path: file,
    fileType: fileType,
    ...stats,
  };
}

function findIncludedFiles(
  category: Category,
  ignorePatterns: string[],
  allFiles: string[]
): string[] {
  return allFiles
    .filter((file) => {
      const ext = getFileExt(file);
      let shouldBeIncluded = !!category.fileTypes.find(
        (fileType) => fileType === ext
      );
      if (shouldBeIncluded) {
        ignorePatterns?.forEach((ignorePattern) => {
          if (file.indexOf(ignorePattern) !== -1) {
            shouldBeIncluded = false;
          }
        });
      }
      if (shouldBeIncluded) {
        category.excludes?.forEach((exclude) => {
          if (file.indexOf(exclude) !== -1) {
            shouldBeIncluded = false;
          }
        });
      }
      return shouldBeIncluded;
    })
    .filter((file, _index, files) => {
      if (category.jsTsPairs === 'ignore' || category.jsTsPairs === undefined) {
        return true;
      }
      const fileExtToKeep = category.jsTsPairs;
      const ext = getFileExt(file);
      const fileExtToDiscard = fileExtToKeep === 'js' ? 'ts' : 'js';

      // if it is the extension to keep
      // or if it is not the one to discard, we keep those files
      if (fileExtToKeep === ext || fileExtToDiscard !== ext) {
        return true;
      }

      // get the counterpart's extension
      const counterpartExt = ext === 'js' ? 'ts' : 'js';
      const parts = file.split('.');
      parts[parts.length - 1] = counterpartExt;

      const counterpartExists =
        files.filter((f) => f === parts.join('.')).length !== 0;

      if (counterpartExists) {
        return false;
      }

      return true;
    });
}

function findAllFilesInDirectory(directory: string): string[] {
  const results = readdirSync(directory);
  const subfiles = results
    .filter((result) => lstatSync(join(directory, result)).isDirectory())
    .reduce((acc, subdir) => {
      const files = findAllFilesInDirectory(join(directory, subdir));
      return [...acc, ...files];
    }, [] as string[]);

  const files = results
    .filter((result) => lstatSync(join(directory, result)).isFile())
    .map((fileName) => join(directory, fileName));
  return [...files, ...subfiles];
}

function getFileExt(file: string): string {
  return extname(file).replace(/\./g, '');
}
