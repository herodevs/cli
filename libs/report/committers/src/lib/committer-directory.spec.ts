import { reportCommittersCommand } from './committers';
import { runCommand } from '@herodevs/utility';

jest.mock('@herodevs/utility', () => ({
  runCommand: jest.fn().mockResolvedValue(''),
}));

describe('reportCommittersCommand directory', () => {
  const mockRunCommand = runCommand as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should construct the git command with directory option', async () => {
    const args = {
      afterDate: '2023-01-01',
      beforeDate: '2023-01-31',
      exclude: [],
      json: false,
      directory: 'src',
      $0: 'test',
      _: [],
    };

    await reportCommittersCommand.handler(args);

    const calledCommand = mockRunCommand.mock.calls[0][0];
    expect(calledCommand).toMatch(/-- src/);
  });
});
