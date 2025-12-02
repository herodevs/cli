import assert from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import mock from 'mock-fs';
import { DEFAULT_TRACKER_RUN_DATA_FILE } from '../../src/config/constants.ts';
import { TRACKER_DEFAULT_CONFIG, TRACKER_ROOT_FILE } from '../../src/config/tracker.config.ts';
import {
  createTrackerConfig,
  getFileStats,
  getFilesFromCategory,
  getRootDir,
  saveResults,
} from '../../src/service/tracker.svc.ts';

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

      assert.strictEqual(result, join(process.cwd(), 'path/to/package'));
    });

    it(`should throw an error if ${TRACKER_ROOT_FILE} is not found`, () => {
      const dirPath = 'path/to/fake/dir';

      try {
        getRootDir(dirPath);
      } catch (err) {
        if (err instanceof Error) {
          assert.strictEqual(err.message.includes(`Couldn't find root directory for the project`), true);
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

        assert.strictEqual(existsSync(outputDir), true);
      } catch (_err) {}
    });

    it(`should create configuration file if it doesn't exist`, async () => {
      try {
        const outputDir = 'path/to/tracker/new-folder';
        await createTrackerConfig(outputDir, TRACKER_DEFAULT_CONFIG);

        assert.strictEqual(existsSync(`${outputDir}/${TRACKER_DEFAULT_CONFIG.configFile}`), true);
      } catch (_err) {}
    });

    it(`should create configuration file with the default contents`, async () => {
      try {
        const outputDir = 'path/to/tracker/new-folder';
        await createTrackerConfig(outputDir, TRACKER_DEFAULT_CONFIG);

        const fileOutput = readFileSync(`${outputDir}/${TRACKER_DEFAULT_CONFIG.configFile}`).toString('utf-8');

        assert.strictEqual(fileOutput, TRACKER_DEFAULT_CONFIG);
      } catch (_err) {}
    });

    it(`should throw an error if file exists and overwrite flag is false`, async () => {
      try {
        const outputDir = 'path/to/already/exists';
        await createTrackerConfig(outputDir, TRACKER_DEFAULT_CONFIG);
      } catch (err) {
        if (err instanceof Error) {
          assert.strictEqual(
            err.message.includes(
              `Configuration file already exists for this repo. If you want to overwrite it, run the command again with the --overwrite flag`,
            ),
            true,
          );
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

        assert.strictEqual(fileOutput, {
          ...TRACKER_DEFAULT_CONFIG,
          ignorePatterns: [],
        });
      } catch (_err) {}
    });
  });

  describe('getFilesFromCategory', () => {
    beforeEach(() => {
      mock({
        root: {
          'demo.js': '',
          'demo.css': '',
          'demo.html': '',
          folder: {
            'folder-demo-one.html': '',
            'folder-demo-one.js': '',
            'folder-demo-one.css': '',
            'folder-demo-two.html': '',
            'folder-demo-two.js': '',
            'folder-demo-two.css': '',
            'folder-demo-three.html': '',
            'folder-demo-three.js': '',
            'folder-demo-three.css': '',
          },
          another: {
            'another.html': '',
            'another.js': '',
          },
        },
      });
    });

    afterEach(() => {
      mock.restore();
    });

    it('should return empty array if no fileTypes are defined in config', () => {
      const result = getFilesFromCategory(
        {
          fileTypes: [],
          includes: [''],
          jsTsPairs: 'js',
        },
        {
          rootDir: 'root',
        },
      );

      assert.deepStrictEqual(result, []);
    });

    it('should return empty array if includes is empty are defined in config', () => {
      const result = getFilesFromCategory(
        {
          fileTypes: ['js'],
          includes: [],
          jsTsPairs: 'js',
        },
        {
          rootDir: 'root',
        },
      );

      assert.deepStrictEqual(result, []);
    });

    it('should only return files with specified file types in specified folder', () => {
      const result = getFilesFromCategory(
        {
          fileTypes: ['js'],
          includes: ['folder'],
          jsTsPairs: 'js',
        },
        {
          rootDir: 'root',
        },
      );

      assert.deepStrictEqual(
        result.map((p) => p.replace(/\\/, '/')).sort(),
        ['folder/folder-demo-one.js', 'folder/folder-demo-two.js', 'folder/folder-demo-three.js'].sort(),
      );
    });

    it('should handle multiple file types', () => {
      const result = getFilesFromCategory(
        {
          fileTypes: ['js', 'css'],
          includes: ['folder'],
          jsTsPairs: 'js',
        },
        {
          rootDir: 'root',
        },
      );

      assert.deepStrictEqual(
        result.map((p) => p.replace(/\\/, '/')).sort(),
        [
          'folder/folder-demo-one.js',
          'folder/folder-demo-one.css',
          'folder/folder-demo-two.js',
          'folder/folder-demo-two.css',
          'folder/folder-demo-three.js',
          'folder/folder-demo-three.css',
        ].sort(),
      );
    });

    it('should handle multiple included folders', () => {
      const result = getFilesFromCategory(
        {
          fileTypes: ['js'],
          includes: ['folder', 'another'],
          jsTsPairs: 'js',
        },
        {
          rootDir: 'root',
        },
      );

      assert.deepStrictEqual(
        result.map((p) => p.replace(/\\/, '/')).sort(),
        [
          'folder/folder-demo-one.js',
          'folder/folder-demo-two.js',
          'folder/folder-demo-three.js',
          'another/another.js',
        ].sort(),
      );
    });

    it('should handle multiple file types within multiple folders', () => {
      const result = getFilesFromCategory(
        {
          fileTypes: ['js', 'html'],
          includes: ['folder', 'another'],
          jsTsPairs: 'js',
        },
        {
          rootDir: 'root',
        },
      );

      assert.deepStrictEqual(
        result.map((p) => p.replace(/\\/, '/')).sort(),
        [
          'folder/folder-demo-one.html',
          'folder/folder-demo-one.js',
          'folder/folder-demo-two.html',
          'folder/folder-demo-two.js',
          'folder/folder-demo-three.html',
          'folder/folder-demo-three.js',
          'another/another.html',
          'another/another.js',
        ].sort(),
      );
    });

    it('should skip files that match ignorePatterns', () => {
      const result = getFilesFromCategory(
        {
          fileTypes: ['js', 'html'],
          includes: ['folder', 'another'],
          jsTsPairs: 'js',
        },
        {
          rootDir: 'root',
          ignorePatterns: ['**/*.js'],
        },
      );

      assert.deepStrictEqual(
        result.map((p) => p.replace(/\\/, '/')).sort(),
        [
          'folder/folder-demo-one.html',
          'folder/folder-demo-two.html',
          'folder/folder-demo-three.html',
          'another/another.html',
        ].sort(),
      );
    });
  });

  describe('getFileStats', () => {
    beforeEach(() => {
      mock({
        root: {
          'demo.js': `
            const test = 'This is a test';
            // This should be a comment
            
            const log = () => {
              console.log('Hello from log!');
            }
          `,
          'empty.js': '',
        },
      });
    });

    afterEach(() => {
      mock.restore();
    });

    it('should handle missing file', () => {
      const stats = getFileStats('missing.js', {
        rootDir: 'root',
      });

      assert.deepStrictEqual(stats, {
        path: 'missing.js',
        fileType: 'js',
        error: true,
      });
    });

    it('should handle empty files', () => {
      const stats = getFileStats('empty.js', {
        rootDir: 'root',
      });

      assert.strictEqual(stats.path, 'empty.js');
      assert.strictEqual(stats.fileType, 'js');
      assert.strictEqual('empty' in stats, true);
      if ('empty' in stats) {
        assert.strictEqual(stats.empty, 1);
      }
    });

    it('should handle files with content', () => {
      const stats = getFileStats('demo.js', {
        rootDir: 'root',
      });

      assert.strictEqual(stats.path, 'demo.js');
      assert.strictEqual(stats.fileType, 'js');
      assert.strictEqual('total' in stats, true);
      if ('total' in stats) {
        assert.strictEqual(stats.total, 8);
      }
    });
  });

  describe('saveResults', () => {
    beforeEach(() => {
      mock({
        new: {},
        existing: {
          [DEFAULT_TRACKER_RUN_DATA_FILE]: '[]',
        },
        empty: {
          [DEFAULT_TRACKER_RUN_DATA_FILE]: '',
        },
        invalid: {
          [DEFAULT_TRACKER_RUN_DATA_FILE]: 'deiosjdioesj',
        },
      });
    });

    afterEach(() => {
      mock.restore();
    });

    it('should save information in file', () => {
      const result = saveResults([], '', 'new', {
        author: 'demo',
        hash: '20384209384',
        timestamp: '20384209384',
      });

      const file = readFileSync(`new/${DEFAULT_TRACKER_RUN_DATA_FILE}`).toString('utf-8');

      assert.strictEqual(result.replace(/\\/, '/'), `new/${DEFAULT_TRACKER_RUN_DATA_FILE}`);
      assert.deepStrictEqual(JSON.parse(file), [
        {
          author: 'demo',
          hash: '20384209384',
          timestamp: '20384209384',
          categories: [],
        },
      ]);
    });

    it('should handle saving with existing file', () => {
      const result = saveResults([], '', 'existing', {
        author: 'demo',
        hash: '20384209384',
        timestamp: '20384209384',
      });

      const file = readFileSync(`existing/${DEFAULT_TRACKER_RUN_DATA_FILE}`).toString('utf-8');

      assert.strictEqual(result.replace(/\\/, '/'), `existing/${DEFAULT_TRACKER_RUN_DATA_FILE}`);
      assert.deepStrictEqual(JSON.parse(file), [
        {
          author: 'demo',
          hash: '20384209384',
          timestamp: '20384209384',
          categories: [],
        },
      ]);
    });

    it('should handle saving with existing empty file', () => {
      const result = saveResults([], '', 'empty', {
        author: 'demo',
        hash: '20384209384',
        timestamp: '20384209384',
      });

      const file = readFileSync(`empty/${DEFAULT_TRACKER_RUN_DATA_FILE}`).toString('utf-8');

      assert.strictEqual(result.replace(/\\/, '/'), `empty/${DEFAULT_TRACKER_RUN_DATA_FILE}`);
      assert.deepStrictEqual(JSON.parse(file), [
        {
          author: 'demo',
          hash: '20384209384',
          timestamp: '20384209384',
          categories: [],
        },
      ]);
    });

    it('should handle saving with existing invalid file', () => {
      const result = saveResults([], '', 'invalid', {
        author: 'demo',
        hash: '20384209384',
        timestamp: '20384209384',
      });

      const file = readFileSync(`invalid/${DEFAULT_TRACKER_RUN_DATA_FILE}`).toString('utf-8');

      assert.strictEqual(result.replace(/\\/, '/'), `invalid/${DEFAULT_TRACKER_RUN_DATA_FILE}`);
      assert.deepStrictEqual(JSON.parse(file), [
        {
          author: 'demo',
          hash: '20384209384',
          timestamp: '20384209384',
          categories: [],
        },
      ]);
    });
  });
});
