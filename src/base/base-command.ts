import { select } from '@inquirer/prompts';
import { Command } from '@oclif/core';
import fs from 'node:fs/promises';
import path from 'node:path';
import semver from 'semver';
import { CONFIG_VERSION, EOL_SCAN_ACCEPTANCE } from '../config/constants.ts';
import { isErrnoException } from '../service/error.svc.ts';

export interface HeroDevsSettings {
  version: semver.SemVer;
  eolAcceptance: semver.SemVer | null;
}

export abstract class BaseCommand<T extends typeof Command> extends Command {
  settings: HeroDevsSettings | null = null;

  public async init(): Promise<void> {
    await super.init();

    const cf = path.join(this.config.configDir, 'hd.settings.json');
    try {
      await fs.readFile(cf, 'utf8');
    } catch (err: unknown) {
      if (isErrnoException(err) && err.code === 'ENOENT') {
        await fs.mkdir(this.config.configDir, { recursive: true });

        const configVersion = CONFIG_VERSION?.toString();

        if (!configVersion) {
          throw new Error('Invalid config version');
        }

        await fs.writeFile(cf, JSON.stringify({ version: configVersion }, null, 2), 'utf8');
      } else {
        throw err;
      }
    }

    const raw = JSON.parse(await fs.readFile(cf, 'utf8'));

    if (!raw.version) {
      throw new Error('No version found in settings');
    }

    const version = semver.parse(raw.version);

    if (!version) {
      throw new Error('Invalid version found in settings');
    }

    let eolAcceptance: semver.SemVer | null = null;

    if (raw?.eolAcceptance) {
      eolAcceptance = semver.parse(raw.eolAcceptance);
      if (!eolAcceptance) {
        throw new Error('Invalid eolAcceptance found in settings');
      }
    }

    this.settings = {
      version,
      eolAcceptance,
    };
  }

  protected async saveSettings(eolAcceptance: semver.SemVer) {
    const cf = path.join(this.config.configDir, 'hd.settings.json');
    await fs.mkdir(this.config.configDir, { recursive: true });

    const configVersion = CONFIG_VERSION?.toString();

    if (!configVersion) {
      throw new Error('Invalid config version');
    }

    const eolAcceptanceToSave = eolAcceptance?.toString();
    if (!eolAcceptanceToSave) {
      throw new Error('Invalid eolAcceptance found in settings');
    }

    await fs.writeFile(
      cf,
      JSON.stringify(
        {
          ...this.settings,
          version: configVersion,
          eolAcceptance: eolAcceptanceToSave,
        },
        null,
        2,
      ),
      'utf8',
    );
  }

  protected async promptUserAcceptance() {
    if (
      !this.settings ||
      !this.settings.eolAcceptance ||
      !EOL_SCAN_ACCEPTANCE ||
      this.settings.eolAcceptance.compare(EOL_SCAN_ACCEPTANCE) < 0
    ) {
      const message = `
The EOL scanner requires transmitting a list of purls for analysis. 
This information will be stored but not associated with you.
`;

      const answer = await select({
        message,
        choices: [
          { value: 'always', name: '✔ Always send', description: 'Always send the data to the server' },
          { value: 'ask', name: '- Ask before sending', description: 'Ask before sending the data to the server' },
          { value: 'cancel', name: '✗ Cancel', description: 'Cancel the operation' },
        ],
      });

      switch (answer) {
        case 'always': {
          const eolAcceptance = EOL_SCAN_ACCEPTANCE;
          if (!eolAcceptance) {
            throw new Error('Invalid eolAcceptance found in settings');
          }
          await this.saveSettings(eolAcceptance);
          return true;
        }
        case 'ask':
          return true;
        default: {
          throw new Error('Operation cancelled. Please accept the EOL scanner to continue.');
        }
      }
    }
  }
}
