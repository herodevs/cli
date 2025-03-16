import { Command, Flags, ux } from '@oclif/core';

import { type Sbom, extractPurls } from '../../service/eol/eol.svc.ts';
import SbomScan from '../scan/sbom.ts';

export default class ReportPurls extends Command {
  static override description = 'Generate a list of purls from a sbom';
  static enableJsonFlag = true;
  static override examples = [
    '<%= config.bin %> <%= command.id %> --dir=./my-project',
    '<%= config.bin %> <%= command.id %> --file=path/to/sbom.json',
  ];
  static override flags = {
    file: Flags.string({
      char: 'f',
      description: 'The file path of an existing cyclonedx sbom to scan for EOL',
    }),
    dir: Flags.string({
      char: 'd',
      description: 'The directory to scan in order to create a cyclonedx sbom',
    }),
    save: Flags.boolean({
      char: 's',
      default: false,
      description: 'Save the list of purls as nes.purls.json',
    }),
  };

  public async run(): Promise<string[]> {
    const { flags } = await this.parse(ReportPurls);
    const { dir: _dirFlag, file: _fileFlag } = flags;

    // Load the SBOM
    const sbomCommand = new SbomScan(this.argv, this.config);
    const sbom: Sbom = await sbomCommand.run();

    // Extract purls from SBOM
    const purls = await extractPurls(sbom);

    ux.action.stop('Scan completed');

    return purls;
  }
}
