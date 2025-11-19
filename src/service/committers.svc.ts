import {
  formatCommitDate,
  formatCommitDateMonth,
  formatDate,
  getEndOfMonth,
} from "../utils/date-parsers.js";

export type ReportFormat = "txt" | "csv" | "json";

export type CommitEntry = {
  commitHash: string;
  author: string;
  date: Date;
  monthGroup: string;
};

export type CommitAuthorData = {
  commits: CommitEntry[];
  lastCommitOn: Date;
};

export type CommitMonthData = {
  start: Date | string;
  end: Date | string;
  totalCommits: number;
  committers: AuthorCommitCount;
};

export type AuthorCommitCount = {
  [author: string]: number;
};

export type AuthorReportTableRow = {
  index: number;
  author: string;
  commits: number;
  lastCommitOn: string;
};

export type MonthlyReportTableRow = {
  index: number;
  month: number;
  start: string;
  end: string;
  totalCommits: number;
};

export type MonthlyReportRow = {
  month: string;
} & CommitMonthData;

export type AuthorReportRow = {
  author: string;
} & CommitAuthorData;

export type CommittersReport = AuthorReportRow[] | MonthlyReportRow[];

/**
 * Parses git log output into structured data
 * @param output - Git log command output
 * @returns Parsed commit entries
 */
export function parseGitLogOutput(output: string): CommitEntry[] {
  return output
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      // Remove surrounding double quotes if present (e.g. "March|John Doe" → March|John Doe)
      const [commitHash, author, date] = line
        .replace(/^"(.*)"$/, "$1")
        .split("|");
      return {
        commitHash,
        author,
        date: new Date(date),
        monthGroup: formatCommitDateMonth(new Date(date)),
      };
    });
}

/**
 * Generates commits author report
 * @param entries - commit entries from git log
 * @returns Commits Author Report
 */
export function generateCommittersReport(entries: CommitEntry[]) {
  return Array.from(
    entries
      .sort((a, b) => b.date.valueOf() - a.date.valueOf())
      .reduce((acc, curr, index, array) => {
        if (!acc.has(curr.author)) {
          const byAuthor = array.filter((c) => c.author === curr.author);
          acc.set(curr.author, {
            commits: byAuthor,
            lastCommitOn: byAuthor[0].date,
          });
        }
        return acc;
      }, new Map<string, CommitAuthorData>()),
  )
    .map(
      ([key, value]): AuthorReportRow => ({
        author: key,
        commits: value.commits,
        lastCommitOn: value.lastCommitOn,
      }),
    )
    .sort((a, b) => b.commits.length - a.commits.length);
}

/**
 * Generates commits monthly report
 * @param entries - commit entries from git log
 * @returns Monthly Report
 */
export function generateMonthlyReport(entries: CommitEntry[]) {
  return Array.from(
    entries
      .sort((a, b) => b.date.valueOf() - a.date.valueOf())
      .reduce((acc, curr, index, array) => {
        if (!acc.has(curr.monthGroup)) {
          const monthlyCommits = array.filter(
            (e) => e.monthGroup === curr.monthGroup,
          );
          acc.set(curr.monthGroup, {
            start: formatDate(monthlyCommits[0].date),
            end: formatDate(getEndOfMonth(monthlyCommits[0].date)),
            totalCommits: monthlyCommits.length,
            committers: monthlyCommits.reduce(
              (acc: AuthorCommitCount, curr) => {
                if (!acc[curr.author]) {
                  acc[curr.author] = monthlyCommits.filter(
                    (c) => c.author === curr.author,
                  ).length;
                }
                return acc;
              },
              {},
            ),
          });
        }
        return acc;
      }, new Map<string, CommitMonthData>()),
  )
    .map(
      ([key, value], index): MonthlyReportRow => ({
        month: key,
        ...value,
      }),
    )
    .sort((a, b) => new Date(a.end).valueOf() - new Date(b.end).valueOf());
}
