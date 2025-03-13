/* eslint-disable unicorn/filename-case */
import { runHook } from '@oclif/test'
import { ok } from 'node:assert'
import { describe, it } from 'node:test'

describe('hooks', () => {
  it('shows a message', async () => {
    const { result } = await runHook('prerun', { id: 'report committers' })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ok((result as any).successes)
  })
})
