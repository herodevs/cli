import { trackerInitCommand } from './init';

describe('trackerInitCommand', () => {
  it('should work', () => {
    expect(trackerInitCommand.command).toEqual('init');
  });
});
