import { spawnSync } from 'node:child_process';
import { Command, Flags } from '@oclif/core';

import fs from 'node:fs';
import path from 'node:path';
import {
  type CommitEntry,
  type ReportData,
  calculateOverallStats,
  formatAsCsv,
  formatAsText,
  groupCommitsByMonth,
  parseGitLogOutput,
} from '../../service/committers.svc.ts';
import { getErrorMessage, isErrnoException } from '../../service/error.svc.ts';

export default class Committers extends Command {
  static override description = 'Generate report of committers to a git repository';
  static enableJsonFlag = true;
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --csv -s',
    '<%= config.bin %> <%= command.id %> --json',
    '<%= config.bin %> <%= command.id %> --csv',
  ];

  static override flags = {
    months: Flags.integer({
      char: 'm',
      description: 'The number of months of git history to review',
      default: 12,
    }),
    csv: Flags.boolean({
      char: 'c',
      description: 'Output in CSV format',
      default: false,
    }),
    save: Flags.boolean({
      char: 's',
      description: 'Save the committers report as nes.committers.<output>',
      default: false,
    }),
  };

  public async run(): Promise<ReportData | string> {
    const { flags } = await this.parse(Committers);
    const { months, csv, save } = flags;
    const isJson = this.jsonEnabled();

    const sinceDate = `${months} months ago`;
    this.log('Starting committers report with flags: %O', flags);

    try {
      // Generate structured report data
      const entries = await this.fetchGitCommitData(sinceDate);
      this.log('Fetched %d commit entries', entries.length);
      const reportData = this.generateReportData(entries);

      // Handle different output scenarios
      if (isJson) {
        // JSON mode
        if (save) {
          try {
            fs.writeFileSync(path.resolve('nes.committers.json'), JSON.stringify(reportData, null, 2));
            this.log('Report written to json');
          } catch (error) {
            this.error(`Failed to save JSON report: ${getErrorMessage(error)}`);
          }
        }
        return reportData;
      }
      if (csv) {
        // CSV mode
        const csvOutput = formatAsCsv(reportData);
        if (save) {
          try {
            fs.writeFileSync(path.resolve('nes.committers.csv'), csvOutput);
            this.log('Report written to csv');
          } catch (error) {
            this.error(`Failed to save CSV report: ${getErrorMessage(error)}`);
          }
        } else {
          this.log(csvOutput);
        }
        return csvOutput;
      }
      // Text mode
      const textOutput = formatAsText(reportData);
      if (save) {
        try {
          fs.writeFileSync(path.resolve('nes.committers.txt'), textOutput);
          this.log('Report written to txt');
        } catch (error) {
          this.error(`Failed to save txt report: ${getErrorMessage(error)}`);
        }
      } else {
        this.log(textOutput);
      }
      return textOutput;
    } catch (error) {
      this.error(`Failed to generate report: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Generates structured report data
   * @param entries - parsed git log output for commits
   */
  private generateReportData(entries: CommitEntry[]): ReportData {
    if (entries.length === 0) {
      return { monthly: {}, overall: { total: 0 } };
    }

    const monthlyData = groupCommitsByMonth(entries);
    const overallStats = calculateOverallStats(entries);
    const grandTotal = entries.length;

    // Format into a structured report data object
    const report: ReportData = {
      monthly: {},
      overall: { ...overallStats, total: grandTotal },
    };

    // Add monthly totals
    for (const [month, authors] of Object.entries(monthlyData)) {
      const monthTotal = Object.values(authors).reduce((sum, count) => sum + count, 0);
      report.monthly[month] = { ...authors, total: monthTotal };
    }

    return report;
  }

  /**
   * Fetches git commit data with month and author information
   * @param sinceDate - Date range for git log
   */
  private async fetchGitCommitData(sinceDate: string): Promise<CommitEntry[]> {
    const logProcess = spawnSync(
      'git',
      [
        'log',
        '--all', // Include committers on all branches in the repo
        '--format="%ad|%an"', // Format: date|author
        '--date=format:%Y-%m', // Format date as YYYY-MM
        `--since="${sinceDate}"`,
      ],
      { encoding: 'utf-8' },
    );

    if (logProcess.error) {
      if (isErrnoException(logProcess.error)) {
        if (logProcess.error.code === 'ENOENT') {
          this.error('Git command not found. Please ensure git is installed and available in your PATH.');
        }
        this.error(`Git command failed: ${getErrorMessage(logProcess.error)}`);
      }
      this.error(`Git command failed: ${getErrorMessage(logProcess.error)}`);
    }

    if (logProcess.status !== 0) {
      this.error(`Git command failed with status ${logProcess.status}: ${logProcess.stderr}`);
    }

    if (!logProcess.stdout) {
      return [];
    }

    return parseGitLogOutput(logProcess.stdout);
  }
}
