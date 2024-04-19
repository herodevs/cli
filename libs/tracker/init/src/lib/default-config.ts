import { Config } from '@herodevs/tracker-shared';

export const defaultConfig: Config = {
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
  ignorePatterns: ['node_modules'],
  outputDir: 'hd-tracker',
};
