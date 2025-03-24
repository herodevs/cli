import { spawnSync } from 'node:child_process';
import { Command, Flags } from '@oclif/core';

import fs from 'node:fs';
import path from 'node:path';
import {
  type CommitEntry,
  type ReportData,
  calculateOverallStats,
  formatOutputBasedOnFlag,
  groupCommitsByMonth,
  parseGitLogOutput,
} from '../../service/committers.svc.ts';
import { log } from '../../service/log.svc.ts';

export default class Committers extends Command {
  static override description = 'Generate report of committers to a git repository';
  static enableJsonFlag = true;
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> -o csv -s',
    '<%= config.bin %> <%= command.id %> --output=json',
    '<%= config.bin %> <%= command.id %> --output=csv',
  ];

  static override flags = {
    months: Flags.integer({
      char: 'm',
      description: 'The number of months of git history to review',
      default: 12,
    }),
    output: Flags.string({
      char: 'o',
      description: 'Output format: text, json, or csv',
      options: ['text', 'json', 'csv'],
      default: 'text',
    }),
    save: Flags.boolean({
      char: 's',
      description: 'Save the committers report as nes.committers.<output>',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Committers);
    const { months, output, save } = flags;

    const sinceDate = `${months} months ago`;

    try {
      // Generate structured report data
      const entries = this.fetchGitCommitData(sinceDate);
      const reportData = this.generateReportData(entries);
      const formattedOutput = formatOutputBasedOnFlag(output, reportData);

      // Output to file or stdout
      if (save) {
        fs.writeFileSync(path.resolve(`nes.committers.${output}`), formattedOutput);
        log.info(`Report written to ${output}`);
      } else {
        log.info(formattedOutput);
      }
    } catch (error) {
      this.error(`Failed to generate report: ${(error as Error).message}`);
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
    try {
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
        throw new Error(`Git command failed: ${logProcess.error.message}`);
      }

      if (!logProcess.stdout) {
        return [];
      }

      return parseGitLogOutput(logProcess.stdout);
    } catch (error) {
      this.error(`Failed to fetch git data: ${(error as Error).message}`);
      return []; // This line won't execute due to this.error() above
    }
  }
}
