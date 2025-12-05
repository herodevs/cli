import { confirm } from '@inquirer/prompts';
import { Command, ux } from '@oclif/core';
import { userAccessToken, userLogout } from '../../service/gh.svc.js';

export default class Logout extends Command {
  static override description = 'Clear authorization credentials of GitHub';
  static enableJsonFlag = false;
  static override examples = ['<%= config.bin %> <%= command.id %>'];

  static override flags = {};

  public async run(): Promise<void> {
    const { flags: _flags } = await this.parse(Logout);

    this.log(`\n[${ux.colorize('magentaBright', 'HeroDevs')}] Clear GitHub Authorization credentials\n`);

    try {
      if (!userAccessToken()) {
        this.log(ux.colorize('yellow', `No credentials were found.\n`));
        return;
      }

      const remove = await confirm({
        message: `Are you sure you want to clear authorization credentials?`,
        default: false,
      });
      this.log('');
      if (remove) {
        userLogout();
        this.log(`Authorization credentials were successfully cleared.`);
      } else {
        this.log(`Exited without clearing credentials`);
      }
      this.log('');
    } catch (err) {
      if (err instanceof Error) {
        this.error(err, {
          message: err.message,
        });
      } else {
        this.error('An unknown error occurred while running the gh logout command');
      }
    }
  }
}
