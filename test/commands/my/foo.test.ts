import {expect, test} from '@oclif/test'

describe('my:foo', () => {
  test
  .stdout()
  .command(['my:foo'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['my:foo', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
