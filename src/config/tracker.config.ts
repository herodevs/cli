export interface TrackerCategoryDefinition {
  fileTypes: string[];
  includes: string[];
  excludes?: string[];
  jsTsPairs?: 'js' | 'ts' | 'ignore';
}

export type TrackerConfig = {
  categories: { [key: string]: TrackerCategoryDefinition };
  ignorePatterns?: string[];
  outputDir: string;
  configFile: string;
};

export const TRACKER_ROOT_FILE = 'package.json';

export const TRACKER_DEFAULT_CONFIG: TrackerConfig = {
  categories: {
    legacy: {
      fileTypes: ['js', 'ts', 'html', 'css', 'scss', 'less'],
      includes: ['./legacy'],
      jsTsPairs: 'js',
    },
    modern: {
      fileTypes: ['ts', 'html', 'css', 'scss', 'less'],
      includes: ['./modern'],
      jsTsPairs: 'ts',
    },
  },
  ignorePatterns: ['**/node_modules/**'],
  outputDir: 'hd-tracker',
  configFile: 'config.json',
};
