export interface CommitEntry {
  month: string;
  author: string;
}

export interface AuthorCommitCounts {
  [author: string]: number;
}

export interface MonthlyData {
  [month: string]: AuthorCommitCounts;
}

export interface ReportData {
  monthly: {
    [month: string]: {
      [author: string]: number;
      total: number;
    };
  };
  overall: {
    [author: string]: number;
    total: number;
  };
}

/**
 * Parses git log output into structured data
 * @param output - Git log command output
 * @returns Parsed commit entries
 */
export function parseGitLogOutput(output: string): CommitEntry[] {
  return output
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      // Remove surrounding double quotes if present (e.g. "March|John Doe" → March|John Doe)
      const [month, author] = line.replace(/^"(.*)"$/, '$1').split('|');
      return { month, author };
    });
}

/**
 * Groups commit data by month
 * @param entries - Commit entries
 * @returns Object with months as keys and author commit counts as values
 */
export function groupCommitsByMonth(entries: CommitEntry[]): MonthlyData {
  const result: MonthlyData = {};

  // Group commits by month
  const commitsByMonth = Object.groupBy(entries, (entry) => entry.month);

  // Process each month
  for (const [month, commits] of Object.entries(commitsByMonth)) {
    if (!commits) {
      result[month] = {};
      continue;
    }

    // Count commits per author for this month
    const commitsByAuthor = Object.groupBy(commits, (entry) => entry.author);
    const authorCounts: AuthorCommitCounts = {};

    for (const [author, authorCommits] of Object.entries(commitsByAuthor)) {
      authorCounts[author] = authorCommits?.length ?? 0;
    }

    result[month] = authorCounts;
  }

  return result;
}

/**
 * Calculates overall commit statistics by author
 * @param entries - Commit entries
 * @returns Object with authors as keys and total commit counts as values
 */
export function calculateOverallStats(entries: CommitEntry[]): AuthorCommitCounts {
  const commitsByAuthor = Object.groupBy(entries, (entry) => entry.author);
  const result: AuthorCommitCounts = {};

  // Count commits for each author
  for (const author in commitsByAuthor) {
    result[author] = commitsByAuthor[author]?.length ?? 0;
  }

  return result;
}

/**
 * Formats monthly report sections
 * @param monthlyData - Grouped commit data by month
 * @returns Formatted monthly report sections
 */
export function formatMonthlyReport(monthlyData: MonthlyData): string {
  const sortedMonths = Object.keys(monthlyData).sort();
  let report = '';

  for (const month of sortedMonths) {
    report += `\n## ${month}\n`;

    const authors = Object.entries(monthlyData[month]).sort((a, b) => b[1] - a[1]);

    for (const [author, count] of authors) {
      report += `${count.toString().padStart(6)}  ${author}\n`;
    }

    const monthTotal = authors.reduce((sum, [_, count]) => sum + count, 0);
    report += `${monthTotal.toString().padStart(6)}  TOTAL\n`;
  }

  return report;
}

/**
 * Formats overall statistics section
 * @param overallStats - Overall commit counts by author
 * @param grandTotal - Total number of commits
 * @returns Formatted overall statistics section
 */
export function formatOverallStats(overallStats: AuthorCommitCounts, grandTotal: number): string {
  let report = '\n## Overall Statistics\n';

  const sortedStats = Object.entries(overallStats).sort((a, b) => b[1] - a[1]);

  for (const [author, count] of sortedStats) {
    report += `${count.toString().padStart(6)}  ${author}\n`;
  }

  report += `${grandTotal.toString().padStart(6)}  GRAND TOTAL\n`;

  return report;
}

/**
 * Formats the report data as CSV
 * @param data - The structured report data
 */
export function formatAsCsv(data: ReportData): string {
  // First prepare all author names (for columns)
  const allAuthors = new Set<string>();

  // Collect all unique author names
  for (const monthData of Object.values(data.monthly)) {
    for (const author of Object.keys(monthData)) {
      if (author !== 'total') allAuthors.add(author);
    }
  }

  const authors = Array.from(allAuthors).sort();

  // Create CSV header
  let csv = `Month,${authors.join(',')},Total\n`;

  // Add monthly data rows
  const sortedMonths = Object.keys(data.monthly).sort();
  for (const month of sortedMonths) {
    csv += month;

    // Add data for each author
    for (const author of authors) {
      const count = data.monthly[month][author] || 0;
      csv += `,${count}`;
    }

    // Add monthly total
    csv += `,${`${data.monthly[month].total}\n`}`;
  }

  // Add overall totals row
  csv += 'Overall';
  for (const author of authors) {
    const count = data.overall[author] || 0;
    csv += `,${count}`;
  }

  csv += `,${data.overall.total}\n`;

  return csv;
}

/**
 * Formats the report data as text
 * @param data - The structured report data
 */
export function formatAsText(data: ReportData): string {
  let report = 'Monthly Commit Report\n';

  // Monthly sections
  const sortedMonths = Object.keys(data.monthly).sort();
  for (const month of sortedMonths) {
    report += `\n## ${month}\n`;

    const authors = Object.entries(data.monthly[month])
      .filter(([author]) => author !== 'total')
      .sort((a, b) => b[1] - a[1]);

    for (const [author, count] of authors) {
      report += `${count.toString().padStart(6)}  ${author}\n`;
    }

    report += `${data.monthly[month].total.toString().padStart(6)}  TOTAL\n`;
  }

  // Overall statistics
  report += '\n## Overall Statistics\n';
  const sortedEntries = Object.entries(data.overall)
    .filter(([author]) => author !== 'total')
    .sort((a, b) => b[1] - a[1]);

  for (const [author, count] of sortedEntries) {
    report += `${count.toString().padStart(6)}  ${author}\n`;
  }

  report += `${data.overall.total.toString().padStart(6)}  GRAND TOTAL\n`;

  return report;
}

/**
 * Format output based on user preference
 * @param output
 * @param reportData
 * @returns
 */
export function formatOutputBasedOnFlag(output: string, reportData: ReportData) {
  let formattedOutput: string;
  switch (output) {
    case 'json':
      formattedOutput = JSON.stringify(reportData, null, 2);
      break;
    case 'csv':
      formattedOutput = formatAsCsv(reportData);
      break;
    default:
      formattedOutput = formatAsText(reportData);
  }
  return formattedOutput;
}
