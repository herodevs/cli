/* eslint-disable unicorn/filename-case */
import {runHook} from '@oclif/test'
import {expect} from 'chai'

describe('hooks', () => {
  it('shows a message', async () => {
    const { result } = await runHook('prerun', {id: 'report committers'})
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result as any).successes).to.exist
  })
})
