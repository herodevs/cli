import type { CdxBom, EolReport } from '@herodevs/eol-shared';
import { trimCdxBom } from '@herodevs/eol-shared';
import { Command, Flags } from '@oclif/core';
import ora from 'ora';
import { ApiError } from '../../api/errors.ts';
import { submitScan } from '../../api/nes.client.ts';
import { config, filenamePrefix, SCAN_ORIGIN_AUTOMATED, SCAN_ORIGIN_CLI } from '../../config/constants.ts';
import { track } from '../../service/analytics.svc.ts';
import { requireAccessTokenForScan } from '../../service/auth.svc.ts';
import { createSbom } from '../../service/cdx.svc.ts';
import {
  countComponentsByStatus,
  formatDataPrivacyLink,
  formatReportSaveHint,
  formatScanResults,
  formatWebReportUrl,
} from '../../service/display.svc.ts';
import { readSbomFromFile, saveArtifactToFile, validateDirectory } from '../../service/file.svc.ts';
import { getErrorMessage } from '../../service/log.svc.ts';

export default class ScanEol extends Command {
  static override description = 'Scan a given SBOM for EOL data';
  static enableJsonFlag = true;
  static override examples = [
    { description: 'Default behavior (no command or flags specified)', command: '<%= config.bin %>' },
    { description: 'Equivalent to', command: '<%= config.bin %> <%= command.id %> --dir .' },
    {
      description: 'Skip SBOM generation and specify an existing file',
      command: '<%= config.bin %> <%= command.id %> --file /path/to/sbom.json',
    },
    {
      description: 'Save the report or SBOM to a file',
      command: '<%= config.bin %> <%= command.id %> --save --saveSbom',
    },
    {
      description: 'Output the report in JSON format (for APIs, CI, etc.)',
      command: '<%= config.bin %> <%= command.id %> --json',
    },
  ];
  static override flags = {
    file: Flags.string({
      char: 'f',
      description: 'The file path of an existing SBOM to scan for EOL (supports CycloneDX and SPDX 2.3 formats)',
      exclusive: ['dir'],
    }),
    dir: Flags.string({
      char: 'd',
      default: process.cwd(),
      defaultHelp: async () => '<current directory>',
      description: 'The directory to scan in order to create a cyclonedx SBOM',
      exclusive: ['file'],
    }),
    save: Flags.boolean({
      char: 's',
      default: false,
      description: `Save the generated report as ${filenamePrefix}.report.json in the scanned directory`,
    }),
    output: Flags.string({
      char: 'o',
      description: `Save the generated report to a custom path (defaults to ${filenamePrefix}.report.json when not provided)`,
    }),
    saveSbom: Flags.boolean({
      aliases: ['save-sbom'],
      default: false,
      description: `Save the generated SBOM as ${filenamePrefix}.sbom.json in the scanned directory`,
    }),
    sbomOutput: Flags.string({
      aliases: ['sbom-output'],
      description: `Save the generated SBOM to a custom path (defaults to ${filenamePrefix}.sbom.json when not provided)`,
    }),
    saveTrimmedSbom: Flags.boolean({
      aliases: ['save-trimmed-sbom'],
      default: false,
      description: `Save the trimmed SBOM as ${filenamePrefix}.sbom-trimmed.json in the scanned directory`,
    }),
    hideReportUrl: Flags.boolean({
      aliases: ['hide-report-url'],
      default: false,
      description: 'Hide the generated web report URL for this scan',
    }),
    automated: Flags.boolean({
      default: false,
      description: 'Mark scan as automated (for CI/CD pipelines)',
    }),
    version: Flags.version(),
  };

  public async run(): Promise<EolReport | undefined> {
    const { flags } = await this.parse(ScanEol);

    await requireAccessTokenForScan();

    track('CLI EOL Scan Started', (context) => ({
      command: context.command,
      command_flags: context.command_flags,
    }));

    const sbomStartTime = performance.now();
    const sbom = await this.loadSbom();
    const sbomEndTime = performance.now();

    if (!flags.file) {
      track('CLI SBOM Generated', (context) => ({
        command: context.command,
        command_flags: context.command_flags,
        sbom_generation_time: (sbomEndTime - sbomStartTime) / 1000,
      }));
    }

    let reportOutputPath = flags.output;
    let sbomOutputPath = flags.sbomOutput;

    if (flags.output && !flags.save) {
      this.warn('--output requires --save to write the report. Run again with --save to create the file.');
      reportOutputPath = undefined;
    }

    if (flags.sbomOutput && !flags.saveSbom) {
      this.warn('--sbomOutput requires --saveSbom to write the SBOM. Run again with --saveSbom to create the file.');
      sbomOutputPath = undefined;
    }

    const shouldSaveSbom = !flags.file && flags.saveSbom;
    if (shouldSaveSbom) {
      const sbomPath = this.saveSbom(flags.dir, sbom, sbomOutputPath);
      this.log(`SBOM saved to ${sbomPath}`);
      track('CLI SBOM Output Saved', (context) => ({
        command: context.command,
        command_flags: context.command_flags,
        sbom_output_path: sbomPath,
      }));
    }

    if (!sbom.components?.length) {
      track('CLI EOL Scan Ended, No Components Found', (context) => ({
        command: context.command,
        command_flags: context.command_flags,
      }));
      this.log('No components found in scan. Report not generated.');
      return;
    }

    const scanStartTime = performance.now();
    const scan = await this.scanSbom(sbom);

    const componentCounts = countComponentsByStatus(scan);
    track('CLI EOL Scan Completed', (context) => ({
      command: context.command,
      command_flags: context.command_flags,
      eol_true_count: componentCounts.EOL,
      eol_unknown_count: componentCounts.UNKNOWN,
      nes_available_count: componentCounts.NES_AVAILABLE,
      number_of_packages: componentCounts.TOTAL,
      sbom_created: !flags.file,
      scan_load_time: this.getScanLoadTime(scanStartTime),
      scanned_ecosystems: componentCounts.ECOSYSTEMS,
      web_report_link: !flags.hideReportUrl && scan.id ? `${config.eolReportUrl}/${scan.id}` : undefined,
      web_report_hidden: flags.hideReportUrl,
    }));

    const shouldSaveReport = flags.save;
    if (shouldSaveReport) {
      const reportPath = this.saveReport(scan, flags.dir, reportOutputPath);
      this.log(`Report saved to ${reportPath}`);
      track('CLI JSON Scan Output Saved', (context) => ({
        command: context.command,
        command_flags: context.command_flags,
        report_output_path: reportPath,
      }));
    }

    if (!this.jsonEnabled()) {
      this.displayResults(scan, flags.hideReportUrl, Boolean(reportOutputPath || sbomOutputPath));
    }

    return scan;
  }

  private async loadSbom(): Promise<CdxBom> {
    const { flags } = await this.parse(ScanEol);

    const spinner = ora();
    spinner.start(flags.file ? 'Loading SBOM file' : 'Generating SBOM');

    const sbom = flags.file ? this.getSbomFromFile(flags.file) : await this.getSbomFromScan(flags.dir);
    if (!sbom) {
      spinner.fail(flags.file ? 'Failed to load SBOM file' : 'Failed to generate SBOM');
      throw new Error('SBOM not generated');
    }

    spinner.succeed(flags.file ? 'Loaded SBOM file' : 'Generated SBOM');

    return sbom;
  }

  private async scanSbom(sbom: CdxBom): Promise<EolReport> {
    const scanStartTime = performance.now();
    const numberOfPackages = sbom.components?.length ?? 0;
    const { flags } = await this.parse(ScanEol);

    const spinner = ora().start('Trimming SBOM');
    const trimmedSbom = trimCdxBom(sbom);
    spinner.succeed('SBOM trimmed');

    if (flags.saveTrimmedSbom) {
      const trimmedPath = this.saveTrimmedSbom(flags.dir, trimmedSbom);
      this.log(`Trimmed SBOM saved to ${trimmedPath}`);
      track('CLI Trimmed SBOM Output Saved', (context) => ({
        command: context.command,
        command_flags: context.command_flags,
      }));
    }

    spinner.start('Scanning for EOL packages');
    try {
      const scanOrigin = flags.automated ? SCAN_ORIGIN_AUTOMATED : SCAN_ORIGIN_CLI;
      const scan = await submitScan({ sbom: trimmedSbom, scanOrigin });
      spinner.succeed('Scan completed');
      return scan;
    } catch (error) {
      spinner.fail('Scanning failed');
      const scanLoadTime = this.getScanLoadTime(scanStartTime);

      if (error instanceof ApiError) {
        track('CLI EOL Scan Failed', (context) => ({
          command: context.command,
          command_flags: context.command_flags,
          scan_failure_reason: error.code,
          scan_load_time: scanLoadTime,
          number_of_packages: numberOfPackages,
        }));

        const errorMessages: Record<string, string> = {
          SESSION_EXPIRED: 'Your session is no longer valid. To re-authenticate, run "hd auth login".',
          INVALID_TOKEN: 'Your session is no longer valid. To re-authenticate, run "hd auth login".',
          UNAUTHENTICATED: 'Please log in to perform a scan. To authenticate, run "hd auth login".',
          FORBIDDEN: 'You do not have permission to perform this action.',
        };
        this.error(errorMessages[error.code]);
      }

      const errorMessage = getErrorMessage(error);
      track('CLI EOL Scan Failed', (context) => ({
        command: context.command,
        command_flags: context.command_flags,
        scan_failure_reason: errorMessage,
        scan_load_time: scanLoadTime,
        number_of_packages: numberOfPackages,
      }));
      this.error(`Failed to submit scan to NES. ${errorMessage}`);
    }
  }

  private getScanLoadTime(scanStartTime: number): number {
    return (performance.now() - scanStartTime) / 1000;
  }

  private saveReport(report: EolReport, dir: string, outputPath?: string): string {
    try {
      return saveArtifactToFile(dir, { kind: 'report', payload: report, outputPath });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      track('CLI Error Encountered', () => ({ error: errorMessage }));
      this.error(errorMessage);
    }
  }

  private saveSbom(dir: string, sbom: CdxBom, outputPath?: string): string {
    try {
      return saveArtifactToFile(dir, { kind: 'sbom', payload: sbom, outputPath });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      track('CLI Error Encountered', () => ({ error: errorMessage }));
      this.error(errorMessage);
    }
  }

  private saveTrimmedSbom(dir: string, sbom: CdxBom): string {
    try {
      return saveArtifactToFile(dir, { kind: 'sbomTrimmed', payload: sbom });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      track('CLI Error Encountered', () => ({ error: errorMessage }));
      this.error(errorMessage);
    }
  }

  private displayResults(report: EolReport, hideReportUrl: boolean, hasCustomOutput: boolean): void {
    const lines = formatScanResults(report);
    for (const line of lines) {
      this.log(line);
    }

    if (!hideReportUrl && report.id) {
      const lines = formatWebReportUrl(report.id, config.eolReportUrl);
      for (const line of lines) {
        this.log(line);
      }
    } else if (hideReportUrl && !hasCustomOutput) {
      const lines = formatReportSaveHint();
      for (const line of lines) {
        this.log(line);
      }
    }

    const privacyLines = formatDataPrivacyLink();
    for (const line of privacyLines) {
      this.log(line);
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
      const errorMessage = getErrorMessage(error);
      track('CLI Error Encountered', () => ({ error: errorMessage }));
      this.error(`Failed to scan directory: ${errorMessage}`);
    }
  }

  private getSbomFromFile(filePath: string): CdxBom {
    try {
      return readSbomFromFile(filePath);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      track('CLI Error Encountered', () => ({ error: errorMessage }));
      this.error(errorMessage);
    }
  }
}
