import { runCommand } from './run-command';

describe('runCommand', () => {
  it('should run a given command', async () => {
    const result = await runCommand('echo "foo"');
    expect(result).toEqual('foo');
  });
});
