import {expect, test} from '@oclif/test'

describe('committer:get-all', () => {
  test
  .stdout()
  .command(['committer:get-all'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['committer:get-all', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
