import { match } from 'node:assert';
import { describe, it } from 'node:test';
import { runCommand } from '@oclif/test';

describe('committers', () => {
  it('runs committers cmd', async () => {
    const { stdout } = await runCommand('report committers');
    match(stdout, /hello world/);
  });

  it('runs committers --name oclif', async () => {
    const { stdout } = await runCommand('report committers --name oclif');
    match(stdout.toString(), /hello oclif/);
  });
});
