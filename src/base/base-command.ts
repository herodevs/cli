import { Command, Flags, Interfaces } from '@oclif/core'
import fs from 'fs/promises'
import path from 'path'
import { CONFIG_VERSION } from '../config/constants.ts'
import semver from 'semver'


export interface HeroDevsSettings {
  version: semver.SemVer
  eolAcceptance?: semver.SemVer
}

export abstract class BaseCommand<T extends typeof Command> extends Command {

  settings!: HeroDevsSettings

  public async init(): Promise<void> {
    await super.init()

    const cf = path.join(this.config.configDir, 'hd.settings.json')
    try {
      await fs.readFile(cf, 'utf8')
    } catch (err: any) {
      if (err?.code === 'ENOENT') {
        await fs.mkdir(this.config.configDir, { recursive: true })
        await fs.writeFile(cf, JSON.stringify({ version: CONFIG_VERSION.toString() }, null, 2), 'utf8')
      } else {
        throw err
      }
    }


    const raw = JSON.parse(await fs.readFile(cf, 'utf8'))

    this.settings = {
      version: semver.parse(raw.version)!,
      eolAcceptance: raw?.eolAcceptance ? semver.parse(raw.eolAcceptance)! : undefined
    }

  }


  protected async saveSettings() {
    const cf = path.join(this.config.configDir, 'hd.settings.json')
    await fs.mkdir(this.config.configDir, { recursive: true })

    await fs.writeFile(cf, JSON.stringify({
      ...this.settings,
      version: CONFIG_VERSION.toString(),
      eolAcceptance: this.settings.eolAcceptance?.toString()
    }, null, 2), 'utf8')
  }

}
