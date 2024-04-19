import { nesInitCommand } from './init';

describe('nesInitCommand', () => {
  it('should work', () => {
    expect(nesInitCommand.command).toEqual('init');
  });
});
