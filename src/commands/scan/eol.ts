import fs from 'node:fs';
import path from 'node:path';
import { Command, Flags, ux } from '@oclif/core';
import { batchSubmitPurls } from '../../api/nes/nes.client.ts';
import type { ScanResult } from '../../api/types/hd-cli.types.js';
import type { ComponentStatus, InsightsEolScanComponent } from '../../api/types/nes.types.ts';
import { config } from '../../config/constants.ts';
import type { Sbom } from '../../service/eol/cdx.svc.ts';
import { getErrorMessage, isErrnoException } from '../../service/error.svc.ts';
import { extractPurls, parsePurlsFile } from '../../service/purls.svc.ts';
import { createStatusDisplay, createTableForStatus, groupComponentsByStatus } from '../../ui/eol.ui.ts';
import { INDICATORS, SCAN_ID_KEY, STATUS_COLORS } from '../../ui/shared.ui.ts';
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
      description: 'Save the generated report as eol.report.json in the scanned directory',
    }),
    all: Flags.boolean({
      char: 'a',
      description: 'Show all components (default is EOL and SUPPORTED only)',
      default: false,
    }),
    table: Flags.boolean({
      char: 't',
      description: 'Display the results in a table',
      default: false,
    }),
  };

  public async run(): Promise<{ components: InsightsEolScanComponent[]; createdOn: string }> {
    const { flags } = await this.parse(ScanEol);

    const scan = await this.getScan(flags, this.config);

    ux.action.stop('\nScan completed');

    const components = this.getFilteredComponents(scan, flags.all);

    if (flags.save) {
      await this.saveReport(components, scan.createdOn);
    }

    if (!this.jsonEnabled()) {
      if (flags.table) {
        this.log(`${scan.components.size} components scanned`);
        this.displayResultsInTable(scan, flags.all);
      } else {
        this.displayResults(scan, flags.all);
      }

      if (scan.scanId) {
        this.printWebReportUrl(scan.scanId);
      }
    }

    return { components, createdOn: scan.createdOn ?? '' };
  }

  private async getScan(flags: Record<string, string>, config: Command['config']): Promise<ScanResult> {
    if (flags.purls) {
      ux.action.start(`Scanning purls from ${flags.purls}`);
      const purls = this.getPurlsFromFile(flags.purls);
      return batchSubmitPurls(purls);
    }

    const sbom = await ScanSbom.loadSbom(flags, config);
    return this.scanSbom(sbom);
  }

  private getPurlsFromFile(filePath: string): string[] {
    try {
      const purlsFileString = fs.readFileSync(filePath, 'utf8');
      return parsePurlsFile(purlsFileString);
    } catch (error) {
      this.error(`Failed to read purls file. ${getErrorMessage(error)}`);
    }
  }

  private printWebReportUrl(scanId: string): void {
    this.logLine();
    const id = scanId.split(SCAN_ID_KEY)[1];
    const reportCardUrl = config.eolReportUrl;
    const url = ux.colorize('blue', `${reportCardUrl}/${id}`);
    this.log(`🌐 View your free EOL report at: ${ux.colorize('blue', url)}`);
  }

  private async scanSbom(sbom: Sbom): Promise<ScanResult> {
    let scan: ScanResult;
    let purls: string[];

    try {
      purls = await extractPurls(sbom);
    } catch (error) {
      this.error(`Failed to extract purls from sbom. ${getErrorMessage(error)}`);
    }
    try {
      scan = await batchSubmitPurls(purls);
    } catch (error) {
      this.error(`Failed to submit scan to NES from sbom. ${getErrorMessage(error)}`);
    }

    if (scan.components.size === 0) {
      this.warn('No components found in scan');
    }

    return scan;
  }

  private getFilteredComponents(scan: ScanResult, all: boolean) {
    return Array.from(scan.components.values()).filter(
      (component) => all || ['EOL', 'SUPPORTED'].includes(component.info.status),
    );
  }

  private async saveReport(components: InsightsEolScanComponent[], createdOn?: string): Promise<void> {
    const { flags } = await this.parse(ScanEol);
    const reportPath = path.join(flags.dir || process.cwd(), 'eol.report.json');

    try {
      fs.writeFileSync(reportPath, JSON.stringify({ components, createdOn }, null, 2));
      this.log('Report saved to eol.report.json');
    } catch (error) {
      if (!isErrnoException(error)) {
        this.error(`Failed to save report: ${getErrorMessage(error)}`);
      }
      if (error.code === 'EACCES') {
        this.error('Permission denied. Unable to save report to eol.report.json');
      } else if (error.code === 'ENOSPC') {
        this.error('No space left on device. Unable to save report to eol.report.json');
      } else {
        this.error(`Failed to save report: ${getErrorMessage(error)}`);
      }
    }
  }

  private displayResults(scan: ScanResult, all: boolean) {
    const { UNKNOWN, OK, SUPPORTED, EOL } = createStatusDisplay(scan.components, all);

    if (!UNKNOWN.length && !OK.length && !SUPPORTED.length && !EOL.length) {
      this.displayNoComponentsMessage(all);
      return;
    }

    this.log(ux.colorize('bold', 'Here are the results of the scan:'));
    this.logLine();

    // Display sections in order of increasing severity
    for (const components of [UNKNOWN, OK, SUPPORTED, EOL]) {
      this.displayStatusSection(components);
    }

    this.logLegend();
  }

  private displayResultsInTable(scan: ScanResult, all: boolean) {
    const grouped = groupComponentsByStatus(scan.components);
    const statuses: ComponentStatus[] = ['SUPPORTED', 'EOL'];

    if (all) {
      statuses.unshift('UNKNOWN', 'OK');
    }

    for (const status of statuses) {
      const components = grouped[status];
      if (components.length > 0) {
        const table = createTableForStatus(grouped, status);
        this.displayTable(table, components.length, status);
      }
    }
    this.logLegend();
  }

  private displayTable(table: string, count: number, status: ComponentStatus): void {
    this.log(ux.colorize(STATUS_COLORS[status], `${INDICATORS[status]} ${count} ${status} Component(s):`));
    this.log(ux.colorize(STATUS_COLORS[status], table));
  }

  private displayNoComponentsMessage(all: boolean): void {
    if (!all) {
      this.log(ux.colorize('yellow', 'No End-of-Life or Supported components found in scan.'));
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
    this.log(ux.colorize(STATUS_COLORS.UNKNOWN, `${INDICATORS.UNKNOWN} = No Known Issues`));
    this.log(ux.colorize(STATUS_COLORS.OK, `${INDICATORS.OK} = OK`));
    this.log(
      ux.colorize(STATUS_COLORS.SUPPORTED, `${INDICATORS.SUPPORTED}= Supported: End-of-Life (EOL) is scheduled`),
    );
    this.log(ux.colorize(STATUS_COLORS.EOL, `${INDICATORS.EOL} = End of Life (EOL)`));
  }
}
