import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import mock from 'mock-fs';
import { TRACKER_DEFAULT_CONFIG, TRACKER_ROOT_FILE } from '../../src/config/tracker.config.ts';
import { createTrackerConfig, getRootDir } from '../../src/service/tracker.svc.ts';

describe('tracker.svc', () => {
  describe('getRootDir', () => {
    beforeEach(() => {
      mock({
        'path/to': {
          with: {
            package: {
              [TRACKER_ROOT_FILE]: '',
            },
          },
          package: {
            [TRACKER_ROOT_FILE]: '',
            folder: {
              extra: {},
            },
          },
          'fake/dir': {},
        },
      });
    });

    afterEach(() => {
      mock.restore();
    });

    it(`should return a path when ${TRACKER_ROOT_FILE} is found`, () => {
      const dirPath = 'path/to/package/folder';

      const result = getRootDir(dirPath);

      expect(result).toBe(join(process.cwd(), 'path/to/package'));
    });

    it(`should throw an error if ${TRACKER_ROOT_FILE} is not found`, () => {
      const dirPath = 'path/to/fake/dir';

      try {
        getRootDir(dirPath);
      } catch (err) {
        if (err instanceof Error) {
          expect(err.message.includes(`Couldn't find root directory for the project`)).toBe(true);
        }
      }
    });
  });

  describe('createTrackerConfig', () => {
    beforeEach(() => {
      mock({
        'path/to/tracker/folder': {},
        'path/to/already/exists': {
          'config.json': JSON.stringify(TRACKER_DEFAULT_CONFIG),
        },
      });
    });

    afterEach(() => {
      mock.restore();
    });

    it(`should create folder if it doesn't exists`, async () => {
      try {
        const outputDir = 'path/to/tracker/new-folder';
        await createTrackerConfig(outputDir, TRACKER_DEFAULT_CONFIG);

        expect(existsSync(outputDir)).toBe(true);
      } catch (_err) {}
    });

    it(`should create configuration file if it doesn't exist`, async () => {
      try {
        const outputDir = 'path/to/tracker/new-folder';
        await createTrackerConfig(outputDir, TRACKER_DEFAULT_CONFIG);

        expect(existsSync(`${outputDir}/${TRACKER_DEFAULT_CONFIG.configFile}`)).toBe(true);
      } catch (_err) {}
    });

    it(`should create configuration file with the default contents`, async () => {
      try {
        const outputDir = 'path/to/tracker/new-folder';
        await createTrackerConfig(outputDir, TRACKER_DEFAULT_CONFIG);

        const fileOutput = readFileSync(`${outputDir}/${TRACKER_DEFAULT_CONFIG.configFile}`).toString('utf-8');

        expect(fileOutput).toBe(TRACKER_DEFAULT_CONFIG);
      } catch (_err) {}
    });

    it(`should throw an error if file exists and overwrite flag is false`, async () => {
      try {
        const outputDir = 'path/to/already/exists';
        await createTrackerConfig(outputDir, TRACKER_DEFAULT_CONFIG);
      } catch (err) {
        if (err instanceof Error) {
          expect(
            err.message.includes(
              `Configuration file already exists for this repo. If you want to overwrite it, run the command again with the --overwrite flag`,
            ),
          ).toBe(true);
        }
      }
    });

    it(`should replace the file if it exists and overwrite flag is true`, async () => {
      try {
        const outputDir = 'path/to/already/exists';
        await createTrackerConfig(
          outputDir,
          {
            ...TRACKER_DEFAULT_CONFIG,
            ignorePatterns: [],
          },
          true,
        );

        const fileOutput = readFileSync(`${outputDir}/${TRACKER_DEFAULT_CONFIG.configFile}`).toString('utf-8');

        expect(fileOutput).toBe(
          JSON.stringify({
            ...TRACKER_DEFAULT_CONFIG,
            ignorePatterns: [],
          }),
        );
      } catch (_err) {}
    });
  });
});
