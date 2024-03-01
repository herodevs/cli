import { Args, Command, Flags } from '@oclif/core';
import { initialize } from '../../shared/tracker/initialize';
import { getTheRootDirectory } from '../../shared/tracker/util';

export class TrackerInit extends Command {
  static description = 'Initialize the tracker configuration';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static flags = {};

  static args = {};

  public async run(): Promise<void> {
    initialize(getTheRootDirectory(global.process.cwd()));
  }
}
