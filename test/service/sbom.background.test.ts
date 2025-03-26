import { ok } from 'node:assert';
import child_process from 'node:child_process';
import { test } from 'node:test';
import type { Config } from '@oclif/core';
import sinon from 'sinon';
import ScanSbom from '../../dist/commands/scan/sbom.js';

test('ScanSbom - Run scan in the background', async () => {
  const cmd = new ScanSbom([], {} as Config);
  const flags = {
    background: true,
    dir: './some-dir',
  };

  // @ts-ignore
  const parseStub = sinon.stub(cmd, 'parse' as keyof ScanSbom).returns({ flags });

  sinon.stub(child_process, 'spawn').returns({
    unref: sinon.stub(),
  } as unknown as child_process.ChildProcess);

  const logSpy = sinon.spy(cmd, 'log');

  await cmd.run();

  ok(parseStub.calledOnce);

  ok(logSpy.calledWith('The scan is running in the background. The file will be saved at ./some-dir/nes.sbom.json'));
});
