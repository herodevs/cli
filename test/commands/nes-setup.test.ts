import {expect, test} from '@oclif/test'

describe('nes-setup', () => {
  test
  .stdout()
  .command(['nes-setup'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['nes-setup', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
