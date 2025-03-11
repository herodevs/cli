import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('report', () => {
  it('runs report cmd', async () => {
    const {stdout} = await runCommand('report')
    expect(stdout).to.contain('hello world')
  })

  it('runs report --name oclif', async () => {
    const {stdout} = await runCommand('report --name oclif')
    expect(stdout).to.contain('hello oclif')
  })
})
