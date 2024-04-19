import { trackerRunCommand } from './run';

describe('run', () => {
  it('should set the command', () => {
    expect(trackerRunCommand.command).toEqual('run');
    // expect(trackerRunCommand).toBeTruthy();
  });
});
