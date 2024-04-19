import { readConfig } from '@herodevs/tracker-shared';
import { getRootDir } from '@herodevs/utility';
import { resolve } from 'path';
import { ArgumentsCamelCase, CommandBuilder, CommandModule } from 'yargs';
import { processConfig } from './process-config';
import { saveResults } from './save-results';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Options {
  root: string;
  config: string;
}

export const trackerRunCommand: CommandModule<object, Options> = {
  command: 'run',
  describe: 'Run the tracker',
  aliases: [],
  builder: {
    // root: Flags.string({ char: 'r', description: 'root dir of the project' }),
    // config: Flags.string({ char: 'c', description: 'path to config file' }),
  } as CommandBuilder<unknown, Options>,
  handler: run,
};

async function run(args: ArgumentsCamelCase<Options>): Promise<void> {
  const localRootDir = getRootDir(global.process.cwd());

  const rootDirectory = args.root ? resolve(args.root) : localRootDir;
  const config = readConfig(localRootDir, args.config);

  const results = await processConfig(config, rootDirectory);

  saveResults(localRootDir, config.outputDir, results);
}
