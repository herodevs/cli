import {expect, test} from '@oclif/test'

describe('update:verify', () => {
  test
  .stdout()
  .command(['update:verify'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['update:verify', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
