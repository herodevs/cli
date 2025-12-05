import { Command, Flags, ux } from '@oclif/core';
import ora from 'ora';
import { authenticateWithDeviceFlow, userAccessToken } from '../../service/gh.svc.js';

export default class Authorize extends Command {
  static override description = 'Authorize HeroDevs CLI with GitHub';
  static enableJsonFlag = false;
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> -o',
    '<%= config.bin %> <%= command.id %> --overwrite',
  ];

  static override flags = {
    overwrite: Flags.boolean({
      char: 'o',
      description: 'Triggers the authorization flow even if credentials are already stored',
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Authorize);
    const { overwrite } = flags;

    this.log(`\n[${ux.colorize('magentaBright', 'HeroDevs')}] Authorize with GitHub\n`);

    if (userAccessToken() && !overwrite) {
      this.log(
        ux.colorize(
          'yellow',
          `A previous authorization has been granted to the CLI, if you want to override it, then run the authorize command with the overwrite flag.\nYou can also run the logout command to remove the current authorization grant.\n`,
        ),
      );
      return;
    }

    if (overwrite) {
      this.log(
        `${ux.colorize('yellowBright', '\u26A0')} You're using the ${ux.colorize('red', 'overwrite')} flag. Any previous authorization will be removed\n`,
      );
    }

    try {
      const authSpinner = ora({
        text: 'Authenticating with GitHub App',
      }).start();
      await authenticateWithDeviceFlow((verification) => {
        authSpinner.stop();
        this.log(
          ux.colorize('green', `Click or open the following link in your browser: ${verification.verification_uri}\n`),
        );
        this.log(
          `You will have to enter the following code ${ux.colorize('green', verification.user_code)} to authorize.\n`,
        );
        authSpinner.start('Waiting for authorization...');
      });
      authSpinner.stopAndPersist({
        text: ux.colorize('green', 'Successfully authorized with GitHub!\n'),
        symbol: '\u2705',
      });
    } catch (err) {
      if (err instanceof Error) {
        this.error(err, {
          message: err.message,
        });
      } else {
        this.error('An unknown error occurred while running the gh auth command');
      }
    }
  }
}
