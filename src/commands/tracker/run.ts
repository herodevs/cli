import { spawnSync } from 'node:child_process';
import { Command, Flags, ux } from '@oclif/core';
import { Presets, SingleBar } from 'cli-progress';
import ora from 'ora';
import terminalLink from 'terminal-link';
import { TRACKER_GIT_OUTPUT_FORMAT } from '../../config/constants.js';
import { getErrorMessage, isErrnoException } from '../../service/error.svc.js';
import {
  type CategoryStatsResult,
  type FilesStats,
  type GitLastCommit,
  getConfiguration,
  getFileStats,
  getFilesFromCategory,
  getRootDir,
  INITIAL_FILES_STATS,
  saveResults,
} from '../../service/tracker.svc.js';

export default class Run extends Command {
  static override description = 'Run the tracker';
  static enableJsonFlag = false;
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> -d tracker-configuration',
    '<%= config.bin %> <%= command.id %> -d tracker -f settings.json',
  ];

  static override flags = {
    configDir: Flags.string({
      char: 'd',
      description: 'Directory where the tracker configuration file resides',
      default: 'hd-tracker',
    }),
    configFile: Flags.string({
      char: 'f',
      description: 'Filename for the tracker configuration file',
      default: 'config.json',
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Run);
    const { configDir, configFile } = flags;

    try {
      const rootDir = getRootDir(global.process.cwd());
      const confSpinner = ora('Searching for configuration file').start();
      const { categories, ignorePatterns, outputDir } = getConfiguration(rootDir, configDir, configFile);

      confSpinner.text = `Configuration file ${configFile} found in ${rootDir}/${configDir}`;

      const categoriesTotal = Object.keys(categories).length;
      if (categoriesTotal > 0) {
        confSpinner.stopAndPersist({
          text: ux.colorize('green', `Found ${categoriesTotal} categor${categoriesTotal === 1 ? 'y' : 'ies'}`),
          symbol: ux.colorize('green', `\u2714`),
        });
      } else {
        confSpinner.stopAndPersist({
          text: ux.colorize('red', `No categories found, please check your configuration file`),
          symbol: ux.colorize('red', `\u2716`),
        });
        return;
      }
      this.log('');
      const results = Object.entries(categories).reduce((acc: CategoryStatsResult[], [name, category]) => {
        const loadingFilesSpinner = ora(`[${ux.colorize('blueBright', name)}] Getting files`).start();
        const fileProgress = new SingleBar(
          {
            format: `${ux.colorize('green', '{bar}')} | {value}/{total} | {name}`,
            clearOnComplete: false,
            fps: 100,
            hideCursor: true,
          },
          Presets.shades_grey,
        );

        const fileTypes: Set<string> = new Set();
        const categoryFilesWithError: string[] = [];

        const files = getFilesFromCategory(category, {
          rootDir,
          ignorePatterns,
        });

        if (files.length === 0) {
          loadingFilesSpinner.stopAndPersist({
            text: ux.colorize('yellow', `[${ux.colorize('yellowBright', name)}] Found 0 files`),
            symbol: ux.colorize('yellowBright', `\u26A0`),
          });
          this.log(
            ux.colorize(
              'yellow',
              `Please check your configuration [includes] property so it matches folders in your project directory`,
            ),
          );
          this.log('');
          return acc;
        }

        loadingFilesSpinner.stopAndPersist({
          text: ux.colorize('green', `[${ux.colorize('blueBright', name)}] Found ${files.length} files`),
          symbol: ux.colorize('green', `\u2714`),
        });
        fileProgress.start(files.length, 1);

        const fileResults = files.reduce((result: FilesStats, file, currentIndex, array) => {
          const fileStats = getFileStats(file, {
            rootDir,
          });
          if (currentIndex === array.length - 1) {
            fileProgress.update({
              name: ux.colorize('green', 'All files were processed successfully'),
            });
            fileProgress.stop();
          } else {
            fileProgress.increment({
              name: file,
            });
          }

          if ('error' in fileStats) {
            categoryFilesWithError.push(file);
            fileProgress.increment();
            return result;
          } else {
            fileTypes.add(fileStats.fileType);
            return {
              total: fileStats.total + result.total,
              block: fileStats.block + result.block,
              blockEmpty: fileStats.blockEmpty + result.blockEmpty,
              comment: fileStats.comment + result.comment,
              empty: fileStats.empty + result.empty,
              mixed: fileStats.mixed + result.mixed,
              single: fileStats.single + result.single,
              source: fileStats.source + result.source,
              todo: fileStats.todo + result.todo,
            };
          }
        }, INITIAL_FILES_STATS);

        this.log('');
        acc.push({
          name,
          totals: fileResults,
          errors: categoryFilesWithError,
          fileTypes: Array.from(fileTypes),
        });
        return acc;
      }, []);

      this.log('');
      const spinner = ora('Saving results').start();
      const resultsLink = saveResults(results, rootDir, outputDir, this.fetchGitLastCommit(rootDir));
      spinner.stopAndPersist({
        text: ux.colorize('green', 'Tracker results saved!\n'),
        symbol: ux.colorize('green', '\u2713'),
      });

      this.log(`${ux.colorize('blueBright', terminalLink(`Open Tracker Results`, `file://${resultsLink}`))}\n`);
    } catch (err) {
      if (err instanceof Error) {
        this.error(ux.colorize('red', err.message));
      }
    } finally {
    }
  }

  /**
   * Fetches Git last commit
   */
  private fetchGitLastCommit(rootDir?: string): GitLastCommit {
    const logParameters = ['log', `-1`, `--format=${TRACKER_GIT_OUTPUT_FORMAT}`, ...(rootDir ? ['--', rootDir] : [])];

    const logProcess = spawnSync('git', logParameters, {
      encoding: 'utf-8',
    });

    if (logProcess.error) {
      if (isErrnoException(logProcess.error)) {
        if (logProcess.error.code === 'ENOENT') {
          this.error('Git command not found. Please ensure git is installed and available in your PATH.');
        }
        this.error(`Git command failed: ${getErrorMessage(logProcess.error)}`);
      }
      this.error(`Git command failed: ${getErrorMessage(logProcess.error)}`);
    }

    if (logProcess.status !== 0) {
      this.error(`Git command failed with status ${logProcess.status}: ${logProcess.stderr}`);
    }

    if (!logProcess.stdout) {
      return {
        hash: '',
        timestamp: '',
        author: '',
      };
    }

    return logProcess.stdout
      .split('\n')
      .filter(Boolean)
      .reduce(
        (_acc, curr) => {
          const [hash, author, timestamp] = curr.replace(/^"(.*)"$/, '$1').split('|');
          return {
            timestamp,
            hash,
            author,
          };
        },
        {
          hash: '',
          timestamp: '',
          author: '',
        },
      );
  }
}
