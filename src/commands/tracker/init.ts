import { confirm } from '@inquirer/prompts';
import { Command, Flags } from '@oclif/core';
import { TRACKER_DEFAULT_CONFIG, type TrackerConfig } from '../../config/tracker.config.js';
import { createTrackerConfig, getRootDir } from '../../service/tracker.svc.js';

export default class Init extends Command {
  static override description = 'Initialize the tracker configuration';
  static enableJsonFlag = false;
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> -d trackerDir',
    '<%= config.bin %> <%= command.id %> -d trackerDir -f configFileName',
    '<%= config.bin %> <%= command.id %> -i node_modules',
    '<%= config.bin %> <%= command.id %> -i node_modules -i custom_modules',
    '<%= config.bin %> <%= command.id %> -o',
  ];

  static override flags = {
    overwrite: Flags.boolean({
      char: 'o',
      description: 'Overwrites the tracker configuration file if it exists',
    }),
    force: Flags.boolean({
      description: 'Force tracker configuration file creation. Use with --overwrite flag',
      dependsOn: ['overwrite'],
    }),
    outputDir: Flags.string({
      char: 'd',
      description: 'Output directory for the tracker configuration file',
      default: 'hd-tracker',
    }),
    configFile: Flags.string({
      char: 'f',
      description: 'Filename for the tracker configuration file',
      default: 'config.json',
    }),
    ignorePatterns: Flags.string({
      char: 'i',
      description: 'Ignore patterns to use for the tracker configuration file',
      multiple: true,
      multipleNonGreedy: true,
      default: ['node_modules'],
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Init);
    const { overwrite, outputDir, configFile, ignorePatterns, force } = flags;
    this.log('Starting tracker init command');

    if (overwrite) {
      if (force) {
        this.warn(`You're using the --force flag along the --overwrite flag.`);
      } else {
        const response = await confirm({
          message: `You're using the overwrite flag. If a previous configuration file exists, it will be replaced. Do you want to continue?`,
          default: false,
        });
        this.log(response ? 'Yes' : 'No');
        if (!response) {
          return;
        }
      }
    }

    try {
      const rootDir = getRootDir(global.process.cwd());
      const outputConfig: TrackerConfig = {
        ...TRACKER_DEFAULT_CONFIG,
        outputDir,
        configFile,
        ignorePatterns,
      };
      await createTrackerConfig(rootDir, outputConfig, overwrite);
      this.log(`Tracker init command completed successfully.`);
    } catch (err) {
      if (err instanceof Error) {
        this.error(err, {
          message: err.message,
        });
      } else {
        this.error('An unknown error occurred while running the tracker init command');
      }
    }
  }
}
