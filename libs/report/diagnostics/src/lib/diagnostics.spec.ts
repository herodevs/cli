import { CommandModule } from 'yargs';
import { reportDiagnosticsCommand } from './diagnostics';

describe('reportDiagnosticsCommand', () => {
  let cmd: CommandModule;

  beforeEach(() => {
    cmd = reportDiagnosticsCommand;
  });

  it('should define command', () => {
    expect(cmd.command).toEqual('diagnostics');
  });

  it('should define describe', () => {
    expect(cmd.describe).toEqual('show diagnostic information');
  });

  it('should define aliases', () => {
    expect(cmd.aliases).toEqual(['diag', 'd']);
  });
  // builder: {},
  // handler: run,
});
