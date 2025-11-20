import { existsSync, mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { TRACKER_ROOT_FILE, type TrackerConfig } from '../config/tracker.config.js';

export const getRootDir = (path: string): string => {
  if (existsSync(join(path, TRACKER_ROOT_FILE))) {
    return path;
  } else if (path === '/') {
    throw new Error(`Couldn't find root directory for the project`);
  }
  return getRootDir(resolve(join(path, '..')));
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
