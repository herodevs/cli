import fs from 'node:fs';
import { Command, Flags, ux } from '@oclif/core';
import { batchSubmitPurls } from '../../api/nes/nes.client.ts';
import type { ScanInputOptions, ScanResult, ScanResultComponent } from '../../api/types/nes.types.ts';
import type { Sbom } from '../../service/eol/cdx.svc.ts';
import { getErrorMessage, isErrnoException } from '../../service/error.svc.ts';
import { extractPurls } from '../../service/purls.svc.ts';
import { parsePurlsFile } from '../../service/purls.svc.ts';
import { createStatusDisplay } from '../../ui/eol.ui.ts';
import { INDICATORS, STATUS_COLORS } from '../../ui/shared.us.ts';
import ScanSbom from './sbom.ts';

export default class ScanEol extends Command {
  static override description = 'Scan a given sbom for EOL data';
  static enableJsonFlag = true;
  static override examples = [
    '<%= config.bin %> <%= command.id %> --dir=./my-project',
    '<%= config.bin %> <%= command.id %> --file=path/to/sbom.json',
    '<%= config.bin %> <%= command.id %> --purls=path/to/purls.json',
    '<%= config.bin %> <%= command.id %> -a --dir=./my-project',
  ];
  static override flags = {
    file: Flags.string({
      char: 'f',
      description: 'The file path of an existing cyclonedx sbom to scan for EOL',
    }),
    purls: Flags.string({
      char: 'p',
      description: 'The file path of a list of purls to scan for EOL',
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
    all: Flags.boolean({
      char: 'a',
      description: 'Show all components (default is EOL and LTS only)',
      default: false,
    }),
    noDataRetention: Flags.boolean({
      char: 'n',
      description: 'Do not retain PURL data',
      default: false,
    }),
  };

  public async run(): Promise<{ components: ScanResultComponent[] }> {
    const { flags } = await this.parse(ScanEol);

    const scan = await this.getScan(flags, this.config);

    ux.action.stop('\nScan completed');

    const filteredComponents = this.getFilteredComponents(scan, flags.all);

    if (flags.save) {
      await this.saveReport(filteredComponents);
    }

    if (this.jsonEnabled()) {
      return { components: filteredComponents };
    }

    await this.displayResults(scan, flags.all);

    return { components: filteredComponents };
  }

  getScanInputOptionsFromFlags(flags: Record<string, unknown>): ScanInputOptions {
    const { noDataRetention } = flags;

    if (typeof noDataRetention !== 'boolean') {
      this.error(`Invalid value passed to --noDataRetention: typeof ${noDataRetention} is ${typeof noDataRetention}`);
    }

    return {
      noDataRetention,
      type: 'SBOM', // default to SBOM, potentially in the future we will support other formats
    } satisfies ScanInputOptions;
  }

  private async getScan(flags: Record<string, string>, config: Command['config']): Promise<ScanResult> {
    if (flags.purls) {
      ux.action.start(`Scanning purls from ${flags.purls}`);
      const purls = this.getPurlsFromFile(flags.purls);
      const options = this.getScanInputOptionsFromFlags(flags);
      return batchSubmitPurls(purls, options);
    }

    const sbom = await ScanSbom.loadSbom(flags, config);
    const scan = this.scanSbom(sbom, flags);

    return scan;
  }

  private getPurlsFromFile(filePath: unknown): string[] {
    if (typeof filePath !== 'string') {
      this.error(`Failed to parse file path: ${filePath}`);
    }
    try {
      const purlsFileString = fs.readFileSync(filePath, 'utf8');
      return parsePurlsFile(purlsFileString);
    } catch (error) {
      this.error(`Failed to read purls file. ${getErrorMessage(error)}`);
    }
  }

  private async scanSbom(sbom: Sbom, flags: Record<string, unknown>): Promise<ScanResult> {
    let scan: ScanResult;
    let purls: string[];

    try {
      purls = await extractPurls(sbom);
    } catch (error) {
      this.error(`Failed to extract purls from sbom. ${getErrorMessage(error)}`);
    }
    try {
      const options = this.getScanInputOptionsFromFlags(flags);
      scan = await batchSubmitPurls(purls, options);
    } catch (error) {
      this.error(`Failed to submit scan to NES from sbom. ${getErrorMessage(error)}`);
    }

    if (scan.components.size === 0) {
      this.warn('No components found in scan');
    }

    return scan;
  }

  private getFilteredComponents(scan: ScanResult, all: boolean) {
    return Array.from(scan.components.entries())
      .filter(([_, component]) => all || ['EOL', 'LTS'].includes(component.info.status))
      .map(([_, component]) => component);
  }

  private async saveReport(components: ScanResultComponent[]): Promise<void> {
    try {
      fs.writeFileSync('nes.eol.json', JSON.stringify({ components }, null, 2));
      this.log('Report saved to nes.eol.json');
    } catch (error) {
      if (isErrnoException(error)) {
        switch (error.code) {
          case 'EACCES':
            this.error('Permission denied. Unable to save report to nes.eol.json');
            break;
          case 'ENOSPC':
            this.error('No space left on device. Unable to save report to nes.eol.json');
            break;
          default:
            this.error(`Failed to save report: ${getErrorMessage(error)}`);
        }
      } else {
        this.error(`Failed to save report: ${getErrorMessage(error)}`);
      }
    }
  }

  private async displayResults(scan: ScanResult, all: boolean): Promise<void> {
    const { UNKNOWN, OK, LTS, EOL } = createStatusDisplay(scan.components, all);

    if (!UNKNOWN.length && !OK.length && !LTS.length && !EOL.length) {
      this.displayNoComponentsMessage(all);
      return;
    }

    this.log(ux.colorize('bold', 'Here are the results of the scan:'));
    this.logLine();

    // Display sections in order of increasing severity
    for (const components of [UNKNOWN, OK, LTS, EOL]) {
      this.displayStatusSection(components);
    }

    this.logLegend();
  }

  private displayNoComponentsMessage(all: boolean): void {
    if (!all) {
      this.log(ux.colorize('yellow', 'No End-of-Life or Long Term Support components found in scan.'));
      this.log(ux.colorize('yellow', 'Use --all flag to view all components.'));
    } else {
      this.log(ux.colorize('yellow', 'No components found in scan.'));
    }
  }

  private logLine(): void {
    this.log(ux.colorize('bold', '-'.repeat(50)));
  }

  private displayStatusSection(components: string[]): void {
    if (components.length > 0) {
      this.log(components.join('\n'));
      this.logLine();
    }
  }

  private logLegend(): void {
    this.log(ux.colorize(`${STATUS_COLORS.UNKNOWN}`, `${INDICATORS.UNKNOWN} = No Known Issues`));
    this.log(ux.colorize(`${STATUS_COLORS.OK}`, `${INDICATORS.OK} = OK`));
    this.log(ux.colorize(`${STATUS_COLORS.LTS}`, `${INDICATORS.LTS}= Long Term Support (LTS)`));
    this.log(ux.colorize(`${STATUS_COLORS.EOL}`, `${INDICATORS.EOL} = End of Life (EOL)`));
  }
}
