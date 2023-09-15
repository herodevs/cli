import { Args, Command, Flags } from '@oclif/core';
import { TrackerInit } from './init';
import { BaseCommand } from '../../shared';
import { TrackerRun } from './run';

export default class Tracker extends Command {
  static description = 'Tracker info';

  static examples = [`$ @herodevs/cli tracker`];

  static flags = {};

  static args = {
    init: TrackerInit.args,
    run: TrackerRun.args,
  } as any;

  async run(): Promise<void> {}
}
