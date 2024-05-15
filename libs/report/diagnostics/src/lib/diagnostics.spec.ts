import { reportDiagnosticsCommand } from './diagnostics';

describe('reportDiagnosticsCommand', () => {
  it('should define command', () => {
    expect(reportDiagnosticsCommand.command).toEqual('diagnostics');
  });

  it('should define describe', () => {
    expect(reportDiagnosticsCommand.describe).toEqual('show diagnostic information');
  });

  it('should define aliases', () => {
    expect(reportDiagnosticsCommand.aliases).toEqual(['diag', 'd']);
  });
  // builder: {},
  // handler: run,
});
