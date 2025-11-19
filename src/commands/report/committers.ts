import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { Command, Flags } from '@oclif/core';
import { makeTable } from '@oclif/table';
import { endOfDay, formatDate, formatISO, parse, subMonths } from 'date-fns';
import {
  DEFAULT_DATE_COMMIT_FORMAT,
  DEFAULT_DATE_FORMAT,
  filenamePrefix,
  GIT_OUTPUT_FORMAT,
} from '../../config/constants.ts';
import {
  type AuthorReportTableRow,
  type CommitEntry,
  type CommittersReport,
  generateCommittersReport,
  generateMonthlyReport,
  type MonthlyReportRow,
  parseGitLogOutput,
  type ReportFormat,
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
    beforeDate: Flags.string({
      char: 's',
      default: formatDate(new Date(), DEFAULT_DATE_FORMAT),
      description: `End date (format: ${DEFAULT_DATE_FORMAT})`,
    }),
    afterDate: Flags.string({
      char: 'e',
      default: formatDate(subMonths(new Date(), 12), DEFAULT_DATE_FORMAT),
      description: `Start date (format: ${DEFAULT_DATE_FORMAT})`,
    }),
    exclude: Flags.string({
      char: 'x',
      description: 'Path Exclusions (eg -x="./src/bin" -x="./dist")',
      multiple: true,
      multipleNonGreedy: true,
    }),
    json: Flags.boolean({
      description: 'Output to JSON format',
      default: false,
    }),
    directory: Flags.string({
      char: 'd',
      description: 'Directory to search',
    }),
    monthly: Flags.boolean({
      char: 'm',
      description: 'Break down by calendar month.',
      default: false,
    }),
    months: Flags.integer({
      char: 'n',
      description: 'The number of months of git history to review. Cannot be used along beforeDate and afterDate',
      default: 12,
      exclusive: ['beforeDate', 'afterDate', 's', 'e'],
    }),
    csv: Flags.boolean({
      char: 'c',
      description: 'Output in CSV format',
      default: false,
    }),
    save: Flags.boolean({
      char: 's',
      description: `Save the committers report as ${filenamePrefix}.committers.<output>`,
      default: false,
    }),
  };

  public async run(): Promise<CommittersReport | string> {
    const { flags } = await this.parse(Committers);
    const { afterDate, beforeDate, exclude, directory: cwd, monthly, months, csv, save } = flags;
    const isJson = this.jsonEnabled();

    const reportFormat: ReportFormat = isJson ? 'json' : csv ? 'csv' : 'txt';

    const afterDateStartOfDay = months
      ? `${subMonths(new Date(), months)}`
      : `${parse(afterDate, DEFAULT_DATE_FORMAT, new Date())}`;
    const beforeDateEndOfDay = formatISO(endOfDay(parse(beforeDate, DEFAULT_DATE_FORMAT, new Date())));

    const ignores = exclude && exclude.length > 0 ? `. "!(${exclude.join('|')})"` : undefined;

    try {
      const entries = this.fetchGitCommitData(afterDateStartOfDay, beforeDateEndOfDay, ignores, cwd);

      if (entries.length === 0) {
        return `No commits found between ${afterDate} and ${beforeDate}`;
      }

      this.log('\nFetched %d commit entries\n', entries.length);

      const reportData = monthly ? generateMonthlyReport(entries) : generateCommittersReport(entries);

      let finalReport: string;
      switch (reportFormat) {
        case 'json':
          finalReport = JSON.stringify(
            reportData.map((row) =>
              'month' in row
                ? {
                    month: row.month,
                    start: row.start,
                    end: row.end,
                    committers: row.committers,
                  }
                : {
                    name: row.author,
                    count: row.commits.length,
                    lastCommitDate: formatDate(row.lastCommitOn, DEFAULT_DATE_COMMIT_FORMAT),
                  },
            ),
            null,
            2,
          );
          break;
        case 'csv':
          finalReport = reportData
            .map((row, index) =>
              'month' in row
                ? `${index},${row.month},${row.start},${row.end},${row.totalCommits}`
                : `${index},${row.author},${row.commits.length},${formatDate(row.lastCommitOn, DEFAULT_DATE_COMMIT_FORMAT).replace(',', '')}`,
            )
            .join('\n')
            .replace(
              /^/,
              monthly ? `(index),month,start,end,totalCommits\n` : `(index),Committer,Commits,Last Commit Date\n`,
            );
          break;
        default:
          if (monthly) {
            finalReport = makeTable({
              title: 'Monthly Report',
              data: reportData
                .filter((row) => 'month' in row)
                .map((row: MonthlyReportRow, index) => ({
                  index,
                  month: row.month,
                  start: row.start,
                  end: row.end,
                  totalCommits: row.totalCommits,
                })),
              headerOptions: {
                color: undefined,
                bold: false,
              },
            });
          } else {
            finalReport = makeTable({
              title: 'Committers Report',
              data: reportData
                .filter((row) => 'author' in row)
                .map(
                  (row, index): AuthorReportTableRow => ({
                    index,
                    author: row.author,
                    commits: row.commits.length,
                    lastCommitOn: formatDate(row.lastCommitOn, DEFAULT_DATE_COMMIT_FORMAT),
                  }),
                ),
              columns: [
                {
                  key: 'index',
                  name: '(index)',
                },
                {
                  key: 'author',
                  name: 'Committer',
                },
                {
                  key: 'commits',
                  name: 'Commits',
                },
                {
                  key: 'lastCommitOn',
                  name: 'Last Commit Date',
                },
              ],
              headerOptions: {
                color: undefined,
                bold: false,
              },
            });
          }
          break;
      }

      if (save) {
        try {
          fs.writeFileSync(`${filenamePrefix}.${monthly ? 'monthly' : 'committers'}.${reportFormat}`, finalReport, {
            encoding: 'utf-8',
          });
          this.log(`Report written to ${reportFormat.toUpperCase()}`);
        } catch (err) {
          this.error(`Failed to save ${reportFormat.toUpperCase()} report: ${getErrorMessage(err)}`);
        }
      }

      this.log(finalReport);
      return finalReport;
    } catch (error) {
      this.error(`Failed to generate report: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Fetches git commit data with month and author information
   * @param sinceDate - Date range for git log
   * @param beforeDateEndOfDay - End date for git log
   * @param ignores - indicate elements to exclude for git log
   * @param cwd - directory to use for git log
   */
  private fetchGitCommitData(
    sinceDate: string,
    beforeDateEndOfDay: string,
    ignores?: string,
    cwd?: string,
  ): CommitEntry[] {
    const logParameters = [
      'log',
      // "--all", // Include committers on all branches in the repo
      // "--date=format:%Y-%m", // Format date as YYYY-MM
      `--since="${sinceDate}"`,
      `--until="${beforeDateEndOfDay}"`,
      `--format=${GIT_OUTPUT_FORMAT}`,
      ...(cwd ? ['--', cwd] : []),
      ...(ignores ? ['--', ignores] : []),
    ];

    const logProcess = spawnSync('git', logParameters, {
      encoding: 'utf-8',
    });

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
