import { createPrompt, useKeypress } from '@inquirer/core';
import { Command, ux } from '@oclif/core';
import { printTable } from '@oclif/table';
import ora from 'ora';
import { GH_REPOS_PER_PAGE } from '../../config/gh.config.js';
import { getUserRepositories, userAccessToken } from '../../service/gh.svc.js';
import type { Repo } from '../../types/gh/repo.js';

export default class List extends Command {
  static override description = 'Get all GitHub repos of the authorized user';
  static enableJsonFlag = false;
  static override examples = ['<%= config.bin %> <%= command.id %>'];

  static override aliases = ['gh:ls'];

  public async run(): Promise<void> {
    await this.parse(List);

    this.log(`\n[${ux.colorize('magentaBright', 'HeroDevs')}] Get all GitHub repos of the authorized user\n`);

    if (!userAccessToken()) {
      this.log(
        ux.colorize(
          'yellow',
          `There's no current user credentials for the CLI to use. Please run the ${ux.colorize('blueBright', 'gh authorize')} command and try again.\n`,
        ),
      );
      return;
    }

    const authSpinner = ora({
      text: 'Getting user GitHub repos',
    });
    try {
      let getMore = true;
      let page = 1;
      const repos: Repo[] = [];
      do {
        authSpinner.start();
        const pageRepos = await getUserRepositories(page);
        authSpinner.stop();
        repos.push(...pageRepos);
        this.log('');
        printTable({
          title: ux.colorize('blueBright', `GitHub Repositories`),
          data: repos.slice((page - 1) * GH_REPOS_PER_PAGE, GH_REPOS_PER_PAGE * page),
          columns: [
            { key: 'full_name', width: 60, name: 'Repo' },
            { key: 'forks_count', name: 'Forks', horizontalAlignment: 'center', verticalAlignment: 'center' },
            { key: 'stargazers_count', name: 'Stars', horizontalAlignment: 'center', verticalAlignment: 'center' },
            { key: 'watchers_count', name: 'Watchers', horizontalAlignment: 'center', verticalAlignment: 'center' },
          ],
        });
        if (pageRepos.length === 0 || pageRepos.length < GH_REPOS_PER_PAGE) {
          getMore = false;
        } else {
          getMore = await createPrompt<boolean, { message: string }>((config, done) => {
            useKeypress((key, readline) => {
              if (key.name === 'y') {
                readline.write(' Yes\n');
                done(true);
              } else if (key.name === 'n') {
                readline.write(' No\n');
                done(false);
              } else if (key.name === 'c' && key.ctrl) {
                done(false);
              } else {
                readline.clearLine(0);
              }
            });

            return `${config.message}`;
          })({
            message: `Current page ${ux.colorize('blueBright', `${page}`)}. Load next page? [Y]es [N]o`,
          });
        }
        if (getMore) {
          this.log('');
          authSpinner.start();
        }
        page++;
      } while (getMore);
    } catch (err) {
      authSpinner.stop();
      if (err instanceof Error) {
        if (err.name === 'ExitPromptError') {
          this.log('User exited');
        } else {
          this.error(ux.colorize('redBright', `${err.message}`));
        }
      } else {
        this.error(ux.colorize('redBright', 'An unknown error occurred while running the gh list command'));
      }
    }
    this.log('');
  }
}
