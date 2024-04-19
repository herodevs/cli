import { getCommands } from './get-commands';

describe('getCommands', () => {
  it('should return the commands', () => {
    const result = getCommands();
    const commandNames = result.map((command) => command.command);
    expect(commandNames).toContain('report <type>');
    expect(commandNames).toContain('tracker <command>');
  });
});
