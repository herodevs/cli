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
import { isErrnoException } from '../../service/error.svc.ts';

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
      description: 'Save the committers report as eol.committers.<output>',
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
      const entries = this.fetchGitCommitData(sinceDate);
      this.log('Fetched %d commit entries', entries.length);
      const reportData = this.generateReportData(entries);

      // Handle different output scenarios
      if (isJson) {
        // JSON mode
        if (save) {
          try {
            fs.writeFileSync(path.resolve('eol.committers.json'), JSON.stringify(reportData, null, 2));
            this.log('Report written to json');
          } catch (error) {
            throw new Error('Failed to save JSON report', { cause: error });
          }
        }
        return reportData;
      }

      const textOutput = formatAsText(reportData);

      if (csv) {
        // CSV mode
        const csvOutput = formatAsCsv(reportData);
        if (save) {
          try {
            fs.writeFileSync(path.resolve('eol.committers.csv'), csvOutput);
            this.log('Report written to csv');
          } catch (error) {
            throw new Error('Failed to save CSV report', { cause: error });
          }
        } else {
          this.log(textOutput);
        }
        return csvOutput;
      }

      if (save) {
        try {
          fs.writeFileSync(path.resolve('eol.committers.txt'), textOutput);
          this.log('Report written to txt');
        } catch (error) {
          throw new Error('Failed to save txt report', { cause: error });
        }
      } else {
        this.log(textOutput);
      }
      return textOutput;
    } catch (error) {
      throw new Error('Failed to generate report', { cause: error });
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
  private fetchGitCommitData(sinceDate: string): CommitEntry[] {
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
          throw new Error('Git command not found. Please ensure git is installed and available in your PATH.');
        }
        throw new Error('Git command failed', { cause: logProcess.error });
      }
      throw new Error('Git command failed', { cause: logProcess.error });
    }

    if (logProcess.status !== 0) {
      throw new Error(`Git command failed with status ${logProcess.status}`, { cause: logProcess.stderr });
    }

    if (!logProcess.stdout) {
      return [];
    }

    return parseGitLogOutput(logProcess.stdout);
  }
}
