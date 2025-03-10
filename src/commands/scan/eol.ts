import { Args, Command, Flags, ux } from '@oclif/core'

import { prepareLines, scanForEol } from '../../service/eol/eol.svc'
import { promptComponentDetails } from '../../service/eol/eol.ui'

export default class ScanEol extends Command {
  static override args = {
    dir: Args.string({ description: 'file to read' }),
  }
  static override description = 'Scan a given directory'
  static enableJsonFlag = true
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]
  static override flags = {
    all: Flags.boolean({ char: 'a', default: false }),
    dir: Flags.string({ char: 'd', default: process.cwd(), description: 'The directory to scan' }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(ScanEol)

    ux.action.start('Scanning')
    const { map, sbom, scan } = await scanForEol(flags.dir)
    if (!sbom) {
      throw new Error('SBOM failed to generate for dir: ' + flags.dir)
    }

    if (!scan?.components) {
      throw new Error('Scan failed to generate for dir: ' + flags.dir)
    }

    ux.action.stop('Scan completed')
    const lines = await prepareLines(map, scan)

    // this.log("Here we go!", map.purls.length, lines.length)
    const r = await promptComponentDetails(lines)

    console.clear()
    this.log('Need to review:\n', r.selected.map((l: { purl: string }) => l.purl).map((s: string) => '\t' + s).join('\n'))








    // return sbom
  }
}

