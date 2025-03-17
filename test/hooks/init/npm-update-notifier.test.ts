import { ok } from 'node:assert';
import { describe, it } from 'node:test';
import { runHook } from '@oclif/test';

describe('hooks: init', () => {
  it('shows a message', async () => {
    const { result } = await runHook('init', { id: 'report purls' });
    ok((result as unknown as { successes: unknown[] }).successes);
  });
});
