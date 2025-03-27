import { Command, Flags, ux } from '@oclif/core';
import inquirer from 'inquirer';
import { submitScan } from '../../api/nes/nes.client.ts';
import { type ComponentStatus, type ScanResult, VALID_STATUSES } from '../../api/types/nes.types.ts';
import type { Sbom } from '../../service/eol/cdx.svc.ts';
import { getErrorMessage } from '../../service/error.svc.ts';
import { extractPurls } from '../../service/purls.svc.ts';
import { createTableForStatus, promptTableSelection } from '../../ui/eol.ui.ts';
import ScanSbom from './sbom.ts';
export default class ScanEol extends Command {
  static override description = 'Scan a given sbom for EOL data';
  static enableJsonFlag = true;
  static override examples = [
    '<%= config.bin %> <%= command.id %> --dir=./my-project',
    '<%= config.bin %> <%= command.id %> --file=path/to/sbom.json',
    '<%= config.bin %> <%= command.id %> -w EOL,UNKNOWN --dir=./my-project',
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
      description: 'Save the generated SBOM as nes.sbom.json in the scanned directory',
    }),
    withStatus: Flags.string({
      char: 'w',
      description: `Show components with specific statuses (comma-separated). Valid values: ${VALID_STATUSES.join(
        ', ',
      )}`,
      options: VALID_STATUSES,
      multiple: true,
      delimiter: ',',
      default: ['EOL'],
    }),
    getCustomerSupport: Flags.boolean({
      char: 'c',
      description: 'Get Never-Ending Support for End-of-Life components',
      default: false,
    }),
  };

  public async run(): Promise<ScanResult | { components: [] }> {
    const { flags } = await this.parse(ScanEol);
    const { dir: _dirFlag, file: _fileFlag, withStatus } = flags;

    const sbom = await ScanSbom.loadSbom(flags, this.config);
    const { scan, purls } = await this.scanSbom(sbom);

    ux.action.stop('Scan completed');

    await this.displayInteractiveTables(scan);

    return scan;
  }

  private async scanSbom(sbom: Sbom): Promise<{ scan: ScanResult; purls: string[] }> {
    let scan: ScanResult;
    let purls: string[];

    try {
      purls = await extractPurls(sbom);
    } catch (error) {
      this.error(`Failed to extract purls from sbom. ${getErrorMessage(error)}`);
    }
    try {
      scan = await submitScan(purls);
    } catch (error) {
      this.error(`Failed to submit scan to NES from sbom. ${getErrorMessage(error)}`);
    }

    if (scan.components.size === 0) {
      this.warn('No components found in scan');
    }

    return { scan, purls };
  }

  private async displayInteractiveTables(scan: ScanResult): Promise<void> {
    // Count components by status
    const statusCounts: Record<ComponentStatus, number> = {
      EOL: 0,
      LTS: 0,
      OK: 0,
      UNKNOWN: 0,
    };

    for (const [_, component] of scan.components) {
      statusCounts[component.info.status]++;
    }

    while (true) {
      const selectedStatus = await promptTableSelection(statusCounts);
      if (selectedStatus === 'exit') break;

      const table = createTableForStatus(scan.components, selectedStatus);
      console.log(`\n${selectedStatus} Components:`);
      console.log(table.toString());
      console.log('\nPress any key to continue...');

      // Wait for user input before showing menu again
      await inquirer.prompt([
        {
          type: 'input',
          name: 'continue',
          message: 'Press enter to continue...',
        },
      ]);
    }
  }
}
