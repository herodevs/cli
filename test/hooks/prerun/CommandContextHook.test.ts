import { ok } from 'node:assert';
import { describe, it } from 'node:test';
import { runHook } from '@oclif/test';

describe('hooks', () => {
  it('shows a message', async () => {
    const { result } = await runHook('prerun', { id: 'report committers' });
    ok((result as any).successes);
  });
});
