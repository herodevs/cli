import { Args, Command, Flags } from '@oclif/core';
import { prompt } from '@oclif/core/lib/cli-ux/prompt';
import { existsSync, writeFileSync, Mode } from 'fs';
import { join } from 'path';

export default class NesSetup extends Command {
  static description = 'Set up project to use NES libraries';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static flags = {};

  private static authTokenDesc = 'auth token';

  static args = {
    token: Args.string({ description: NesSetup.authTokenDesc, required: false }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(NesSetup);

    if (!this.validate()) {
      process.exit();
    }

    const token = args.token || (await prompt(NesSetup.authTokenDesc, {}));

    const contents = this.npmrcTemplate.replace(this.tokenPlaceholder, token);

    writeFileSync(this.npmrcPath, contents);
  }

  private async validate(): Promise<boolean> {
    let isValid = true;

    if (existsSync(this.npmrcPath)) {
      this.log(`This project is already configured with a .npmrc file`);
      const answer = await prompt('Overwrite the existing .npmrc file? (Y/n)', { default: 'y' });
      const overwriteFile = answer.toLowerCase() === 'y';

      if (!overwriteFile) {
        this.log(`No changes made`);
      }

      isValid = overwriteFile;
    }

    return isValid;
  }

  private readonly tokenPlaceholder = '|||token|||';

  private readonly npmrcPath = join(process.cwd(), '.npmrc');

  private readonly npmrcTemplate = [
    `@neverendingsupport:registry=https://registry.nes.herodevs.com/npm/pkg/`,
    `//registry.nes.herodevs.com/npm/pkg/:_authToken=${this.tokenPlaceholder}`,
    ``,
  ].join('\n');
}
