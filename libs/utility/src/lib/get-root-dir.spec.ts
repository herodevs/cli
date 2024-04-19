import { getRootDir } from './get-root-dir';

describe('getRootDir', () => {
  it('should return the root directory', () => {
    const result = getRootDir(__dirname);
    expect(result).toMatch(/libs\/utility$/);
  });
});
