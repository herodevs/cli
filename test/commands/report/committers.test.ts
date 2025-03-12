import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('committers', () => {
  it('runs committers cmd', async () => {
    const {stdout} = await runCommand('report committers')
    expect(stdout).to.contain('hello world')
  })

  it('runs committers --name oclif', async () => {
    const {stdout} = await runCommand('report committers --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
