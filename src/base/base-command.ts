import fs from 'node:fs/promises';
import path from 'node:path';
import { Command } from '@oclif/core';
import semver from 'semver';
import { CONFIG_VERSION } from '../config/constants.ts';
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

  protected async saveSettings() {
    const cf = path.join(this.config.configDir, 'hd.settings.json');
    await fs.mkdir(this.config.configDir, { recursive: true });

    const configVersion = CONFIG_VERSION?.toString();

    if (!configVersion) {
      throw new Error('Invalid config version');
    }

    await fs.writeFile(
      cf,
      JSON.stringify(
        {
          ...this.settings,
          version: configVersion,
          eolAcceptance: this.settings?.eolAcceptance?.toString(),
        },
        null,
        2,
      ),
      'utf8',
    );
  }
}
