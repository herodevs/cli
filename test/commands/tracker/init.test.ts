import { expect, test } from '@oclif/test';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';

describe('tracker:init', () => {
  test
    .stdout()
    .command(['tracker:init'])
    .it('creates a "hd-tracker/config.json" file', (ctx) => {
      const configFileDir = join(__dirname, '..', '..', '..', 'hd-tracker');
      const configFilePath = join(configFileDir, 'config.json');
      const exists = existsSync(configFilePath);
      expect(exists).equal(true);

      // cleanup
      rmSync(configFileDir, { recursive: true });
    });
});
