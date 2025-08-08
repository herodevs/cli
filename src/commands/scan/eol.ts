import { trimCdxBom } from '@herodevs/eol-shared';
import type { CdxBom, EolReport } from '@herodevs/eol-shared';
import { Command, Flags } from '@oclif/core';
import ora from 'ora';
import { submitScan } from '../../api/nes.client.ts';
import { config, filenamePrefix } from '../../config/constants.ts';
import { createSbom } from '../../service/cdx.svc.ts';
import { formatScanResults, formatWebReportUrl } from '../../service/display.svc.ts';
import { readSbomFromFile, saveReportToFile, saveSbomToFile, validateDirectory } from '../../service/file.svc.ts';
import { getErrorMessage } from '../../service/log.svc.ts';

export default class ScanEol extends Command {
  static override description = 'Scan a given SBOM for EOL data';
  static enableJsonFlag = true;
  static override examples = [
    '<%= config.bin %> <%= command.id %> --dir=./my-project',
    '<%= config.bin %> <%= command.id %> --file=path/to/sbom.json',
    '<%= config.bin %> <%= command.id %> -a --dir=./my-project',
  ];
  static override flags = {
    file: Flags.string({
      char: 'f',
      description: 'The file path of an existing cyclonedx sbom to scan for EOL',
      exclusive: ['dir'],
    }),
    dir: Flags.string({
      char: 'd',
      description: 'The directory to scan in order to create a cyclonedx sbom',
      exclusive: ['file'],
    }),
    save: Flags.boolean({
      char: 's',
      default: false,
      description: `Save the generated report as ${filenamePrefix}.report.json in the scanned directory`,
    }),
    saveSbom: Flags.boolean({
      char: 'b',
      default: false,
      description: `Save the generated SBOM as ${filenamePrefix}.sbom.json in the scanned directory`,
    }),
  };

  public async run(): Promise<EolReport> {
    const { flags } = await this.parse(ScanEol);
    const dir = flags.dir || process.cwd();

    const sbom = await this.loadSbom();

    const scan = await this.scanSbom(sbom);

    if (flags.save) {
      const reportPath = this.saveReport(scan, dir);
      this.log(`Report saved to ${reportPath}`);
    }

    if (flags.saveSbom && !flags.file) {
      const sbomPath = this.saveSbom(dir, sbom);
      this.log(`SBOM saved to ${sbomPath}`);
    }

    if (this.jsonEnabled()) {
      this.log(JSON.stringify(sbom, null, 2));
    } else {
      this.displayResults(scan);
    }

    return scan;
  }

  private async loadSbom(): Promise<CdxBom> {
    const { flags } = await this.parse(ScanEol);
    const path = flags.dir || process.cwd();

    const spinner = ora();
    spinner.start(flags.file ? 'Loading SBOM file' : 'Generating SBOM');

    const sbom = flags.file ? this.getSbomFromFile(flags.file) : await this.getSbomFromScan(path);
    if (!sbom) {
      spinner.fail(flags.file ? 'Failed to load SBOM file' : 'Failed to generate SBOM');
      throw new Error('SBOM not generated');
    }

    spinner.succeed(flags.file ? 'Loaded SBOM file' : 'Generated SBOM');

    return sbom;
  }

  private async scanSbom(sbom: CdxBom): Promise<EolReport> {
    const spinner = ora().start('Scanning for EOL packages');
    try {
      const scan = await submitScan({ sbom: trimCdxBom(sbom) });
      spinner.succeed('Scan completed');
      return scan;
    } catch (error) {
      spinner.fail('Scanning failed');
      this.error(`Failed to submit scan to NES. ${getErrorMessage(error)}`);
    }
  }

  private saveReport(report: EolReport, dir: string): string {
    try {
      return saveReportToFile(dir, report);
    } catch (error) {
      this.error(getErrorMessage(error));
    }
  }

  private saveSbom(dir: string, sbom: CdxBom): string {
    try {
      return saveSbomToFile(dir, sbom);
    } catch (error) {
      this.error(getErrorMessage(error));
    }
  }

  private displayResults(report: EolReport): void {
    const lines = formatScanResults(report);
    for (const line of lines) {
      this.log(line);
    }

    if (report.id) {
      const lines = formatWebReportUrl(report.id, config.eolReportUrl);
      for (const line of lines) {
        this.log(line);
      }
    }

    this.log('* Use --json to output the report payload');
    this.log(`* Use --save to save the report to ${filenamePrefix}.report.json`);
    this.log('* Use --help for more commands or options');
  }

  private async getSbomFromScan(dirPath: string): Promise<CdxBom> {
    try {
      validateDirectory(dirPath);
      const sbom = await createSbom(dirPath);
      if (!sbom) {
        this.error(`SBOM failed to generate for dir: ${dirPath}`);
      }
      return sbom;
    } catch (error) {
      this.error(`Failed to scan directory: ${getErrorMessage(error)}`);
    }
  }

  private getSbomFromFile(filePath: string): CdxBom {
    try {
      return readSbomFromFile(filePath);
    } catch (error) {
      this.error(getErrorMessage(error));
    }
  }
}
