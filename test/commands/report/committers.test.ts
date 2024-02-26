import { expect, test } from '@oclif/test';

describe('report:committers', () => {
  test
    .stdout({ print: false })
    .command(['report:committers'])
    .it('should output the committers', (ctx) => {
      expect(ctx.stdout).contain(`-COMMITTERS-`);
    });
});
