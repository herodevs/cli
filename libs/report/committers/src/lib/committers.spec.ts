import { reportCommittersCommand } from './committers';

describe('reportCommittersCommand', () => {
  it('should work', () => {
    expect(reportCommittersCommand.command).toEqual('committers');
  });
});
