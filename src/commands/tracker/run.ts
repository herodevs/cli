import { Args, Command, Flags } from '@oclif/core';
import { resolve } from 'path';
import {
  // createDataVizIn,
  getData,
  getTheRootDirectory,
  readConfig,
  saveResults,
} from '../../shared/tracker/util';
import { processConfig } from '../../shared/tracker/process-config';
// import { ChartConfig } from '../../shared/tracker/models/chart-config';

export class TrackerRun extends Command {
  static description = 'Run the tracker';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static flags = {
    root: Flags.string({ char: 'r', description: 'root dir of the project' }),
    config: Flags.string({ char: 'c', description: 'path to config file' }),
    // chart: Flags.custom<ChartConfig>({
    //   description: 'chart configuration',
    // })(),
  };

  static args = {};

  public async run(): Promise<void> {
    const { flags } = await this.parse(TrackerRun);

    const localRootDir = getTheRootDirectory(global.process.cwd());

    const rootDirectory = flags.root ? resolve(flags.root) : localRootDir;
    const config = readConfig(localRootDir, flags.config);

    const results = await processConfig(config, rootDirectory);

    saveResults(localRootDir, config.outputDir, results);

    const allData = getData(localRootDir, config.outputDir);

    const parentDir = resolve(localRootDir, config.outputDir);

    // const chartConfig = new ChartConfig(flags.chart);

    // try {
    //   await createDataVizIn(chartConfig, parentDir, allData);
    // } catch (error) {
    //   console.log('Error creating visualization');
    // }
  }
}
