import { ok } from 'node:assert';
import { describe, it } from 'node:test';
import { runHook } from '@oclif/test';

describe('hooks: prerun', () => {
  it('shows a message', async () => {
    const { result } = await runHook('prerun', { id: 'report purls' });
    ok((result as unknown as { successes: unknown[] }).successes);
  });
});
