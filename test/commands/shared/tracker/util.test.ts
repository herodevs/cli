import { expect, test } from '@oclif/test';
import { resolve, join } from 'path';
import { getTheRootDirectory } from '../../../../src/shared/tracker/util';

describe('shared:tracker:util', () => {
  describe('getTheRootDirectory', () => {
    test.it('gets the root of this project', () => {
      const now = new Date();
      const result = getTheRootDirectory(__dirname);
      const expected = join(__dirname, '..', '..', '..', '..');
      expect(expected).equals(result);
    });
  });
});
