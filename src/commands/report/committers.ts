import {Args, Command, Flags} from '@oclif/core'

export default class Committers extends Command {
  static override args = {
    file: Args.string({description: 'file to read'}),
  }
  static override description = 'Generate report of committers to a git repository'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]
  static override flags = {
    // flag with no value (-f, --force)
    force: Flags.boolean({char: 'f'}),
    // flag with a value (-n, --name=VALUE)
    name: Flags.string({char: 'n', description: 'name to print'}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Committers)

    const name = flags.name ?? 'world'
    this.log(`hello ${name} from /Users/edward/code/herodevs/cli/src/commands/committers.ts`)
    if (args.file && flags.force) {
      this.log(`you input --force and --file: ${args.file}`)
    }
  }
}
