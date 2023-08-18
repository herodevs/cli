import {Args, Command, Flags} from '@oclif/core'

export default class Committer extends Command {
  static description = 'Gets committer info'

  static examples = [
    `$ @herodevs/ndk committer`,
  ]

  static flags = {
  }

  static args = {
    //person: Args.string({description: 'Person to say hello to', required: true}),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Committer)

    this.log(`committer info`)
  }
}
