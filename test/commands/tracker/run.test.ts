import { expect, test } from '@oclif/test';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';

describe('tracker:run', () => {
  const configFileDir = join(__dirname, '..', '..', '..', 'hd-tracker');
  const configFilePath = join(configFileDir, 'config.json');
  const dataFilePath = join(configFileDir, 'data.json');

  test
    .do((ctx) => {
      // create a test config file
      const config = {
        categories: {
          test: {
            fileTypes: ['js', 'ts', 'html', 'css', 'scss', 'less'],
            includes: ['./test/commands/tracker'],
            jsTsPairs: 'js',
          },
        },
        ignorePatterns: ['node_modules'],
        outputDir: 'hd-tracker',
      };

      mkdirSync(configFileDir, { recursive: true });
      writeFileSync(configFilePath, JSON.stringify(config, null, 2));
    })
    .stdout({ print: false })
    .command(['tracker:run'])
    .it((ctx) => {
      const dataFileContents = readFileSync(dataFilePath).toString();
      const data = JSON.parse(dataFileContents);
      expect(data.length).equal(1);
      expect(data[0].categories.length).equal(1);
      expect(data[0].categories[0].name).equal('test');
      expect(data[0].categories[0].fileTypes.filter((ft) => ft.fileType === 'ts').length).least(1);

      // cleanup
      rmSync(configFileDir, { recursive: true });
    });
});
