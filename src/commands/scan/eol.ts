import path from 'node:path';
import { Args, Command, Flags, ux } from '@oclif/core';

import { prepareRows, scanForEol } from '../../service/eol/eol.svc.ts';
import { promptComponentDetails } from '../../service/eol/eol.ui.ts';
import type { ScanResult } from '../../service/nes/modules/sbom.ts';

export default class ScanEol extends Command {
  static override args = {
    dir: Args.string({ description: 'file to read' }),
  };
  static override description = 'Scan a given directory';
  static enableJsonFlag = true;
  static override examples = ['<%= config.bin %> <%= command.id %>'];
  static override flags = {
    all: Flags.boolean({ char: 'a', default: false }),
    dir: Flags.string({
      char: 'd',
      default: process.cwd(),
      description: 'The directory to scan',
    }),
  };

  getScanOptions() {
    // intentionally provided for mocking
    return {};
  }

  public async run(): Promise<ScanResult | { components: [] }> {
    const { flags } = await this.parse(ScanEol);

    const dir = path.resolve(flags.dir);

    ux.action.start(`Scanning ${dir}`);

    const options = this.getScanOptions();
    const { purls, sbom, scan } = await scanForEol(dir, options);
    ux.action.stop('Scan completed');
    if (!sbom) {
      throw new Error(`SBOM failed to generate for dir: ${dir}`);
    }

    if (!scan?.components) {
      throw new Error(`Scan failed to generate for dir: ${dir}`);
    }

    // TODO: map scanResultComponents to Lines in a consolidated way
    const lines = await prepareRows(purls, scan);
    if (lines?.length === 0) {
      this.log('No dependencies found');
      return { components: [] };
    }

    const r = await promptComponentDetails(lines);
    this.log('What now %o', r);

    // console.clear()
    // this.log('Need to review:\n', r.selected.map((l: { purl: string }) => l.purl).map((s: string) => '\t' + s).join('\n'))

    return scan;
  }
}
