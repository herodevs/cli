import {Args, Command, Flags} from '@oclif/core'
import { isVersionUpToDate } from '../../shared'

export default class UpdateVerify extends Command {
  static description = 'verifies version'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    quiet: Flags.boolean({char: 'q', description: 'Prints/returns nothing if version is up to date' }),
  }

  static args = {
    // file: Args.string({description: 'file to read'}),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(UpdateVerify) as any;
    await isVersionUpToDate(this, flags.quiet);
  }
}
