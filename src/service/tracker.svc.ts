import { existsSync, globSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import sloc from 'sloc';
import { DEFAULT_TRACKER_RUN_DATA_FILE } from '../config/constants.js';
import { TRACKER_ROOT_FILE, type TrackerCategoryDefinition, type TrackerConfig } from '../config/tracker.config.ts';

export type GitLastCommit = {
  hash: string;
  timestamp: string;
  author: string;
};

export type FilesStats = {
  total: number;
  source: number;
  comment: number;
  single: number;
  block: number;
  mixed: number;
  empty: number;
  todo: number;
  blockEmpty: number;
  [k: string]: number | string | boolean;
};

export type CategoryStatsResult = {
  name: string;
  totals: FilesStats;
  errors: string[];
  fileTypes: string[];
};

export type CategorySavedResult = {
  timestamp: string;
  hash: string;
  categories: CategoryStatsResult[];
};

export const INITIAL_FILES_STATS: FilesStats = {
  total: 0,
  block: 0,
  blockEmpty: 0,
  comment: 0,
  empty: 0,
  mixed: 0,
  single: 0,
  source: 0,
  todo: 0,
};

export const getRootDir = (path: string): string => {
  if (existsSync(join(path, TRACKER_ROOT_FILE))) {
    return path;
  } else if (path === join(path, '..')) {
    throw new Error(`Couldn't find root directory for the project`);
  }
  return getRootDir(resolve(join(path, '..')));
};

export const getConfiguration = (path: string, folderName: string, fileName: string): TrackerConfig => {
  const filePath = join(path, folderName, fileName);
  if (existsSync(filePath)) {
    const stringConfiguration = readFileSync(filePath, {
      encoding: 'utf-8',
    }).toString();
    try {
      return JSON.parse(stringConfiguration);
    } catch (_err) {
      throw new Error(
        `A configuration file was found, but it's contents are not valid. Review your configuration file and fix any errors, or run tracker init -o to overwrite the file`,
      );
    }
  }
  throw new Error(
    `Couldn't find configuration ${fileName} file in ${path}. If you haven't, run tracker init command to create the configuration file. If you have a custom folder and configuration file, use the flags -d (directory) and -f (filename) to specify it`,
  );
};

export const createTrackerConfig = async (rootPath: string, config: TrackerConfig, overwrite: boolean = false) => {
  const { outputDir } = config;
  const configDir = join(rootPath, outputDir);
  const configFile = join(configDir, config.configFile);
  const doesConfigFileExists = existsSync(configFile);

  if (!existsSync(configDir)) {
    mkdirSync(configDir);
  }

  if (doesConfigFileExists && !overwrite) {
    throw new Error(
      `Configuration file already exists for this repo. If you want to overwrite it, run the command again with the --overwrite flag`,
    );
  }

  await writeFile(join(configDir, config.configFile), JSON.stringify(config, null, 2));
};

export const getFilesFromCategory = (
  category: TrackerCategoryDefinition,
  options: {
    rootDir: string;
    ignorePatterns?: string[];
  },
) => {
  const { fileTypes, includes } = category;
  const { rootDir, ignorePatterns } = options;

  // if no includes folder or no specific file type is set, we ignore the category
  if (fileTypes.length === 0 || includes.length === 0) {
    return [];
  }

  const patterns = includes.flatMap((include) => fileTypes.map((type) => `*${include.replace('./', '')}/**/*.${type}`));
  return globSync(patterns, {
    cwd: rootDir,
    exclude: ignorePatterns?.map((ignore) => `${ignore}`) ?? [],
  });
};

export const getFileStats = (
  path: string,
  options: {
    rootDir: string;
  },
) => {
  const fileType = extname(path).replace(/\./g, '');
  try {
    const stats = sloc(readFileSync(join(options.rootDir, path), 'utf8').toString(), fileType);
    return {
      path,
      fileType,
      ...stats,
    };
  } catch (_err) {
    return {
      path,
      fileType,
      error: true,
    };
  }
};

export const saveResults = (
  categoriesResult: CategoryStatsResult[],
  rootDir: string,
  outputDir: string,
  git: GitLastCommit,
): string => {
  const dataResults: CategorySavedResult[] = [];
  const dataFile = join(rootDir, outputDir, DEFAULT_TRACKER_RUN_DATA_FILE);
  try {
    const savedOutput = readFileSync(dataFile).toString('utf8');
    dataResults.push(...JSON.parse(savedOutput));
  } catch (_err) {}

  dataResults.push({
    ...git,
    categories: categoriesResult,
  });

  writeFileSync(dataFile, JSON.stringify(dataResults, null, 2));
  return `${dataFile}`;
};
