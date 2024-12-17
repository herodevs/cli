import { eachMonthOfInterval, format, isWithinInterval, max, min } from 'date-fns';
import { Commit, MonthlyData } from './types';

export function parseMonthly(startDate: Date, endDate: Date, entries: Commit[]) {
  const monthly: MonthlyData[] = [];
  const range = eachMonthOfInterval({
    start: startDate,
    end: endDate,
  });

  for (let idx = 0; idx < range.length - 1; idx++) {
    // `convertToUTC` is an awful hack to convert the date to UTC
    // This is needed because the date-fns eachMonthOfInterval function
    // is not timezone aware and will return the date in the local timezone
    // Refs: https://github.com/date-fns/date-fns/issues/3097
    const [start, end] = [range[idx], range[idx + 1]];
    const month: MonthlyData = {
      month: format(start, 'LLLL yyyy'),
      start: max([start, startDate]),
      end: min([end, endDate]),
      committers: {},
    };

    for (const rec of entries) {
      if (isWithinInterval(rec.date, { start, end })) {
        month.committers[rec.committer] = (month.committers[rec.committer] || 0) + 1;
      }
    }

    if (Object.keys(month.committers).length > 0) {
      monthly.push(month);
    }
  }
  return monthly;
}

function convertToUTC(date: Date): Date {
  const timezoneOffset = date.getTimezoneOffset() * -1;
  return new Date(date.getTime() + timezoneOffset * 60000);
}

function monthlyDataHumanReadable(data: MonthlyData) {
  const totalCommits = Object.values(data.committers).reduce((sum, count) => sum + count);
  return {
    month: data.month,
    start: format(data.start, 'yyyy-MM-dd'),
    end: format(data.end, 'yyyy-MM-dd'),
    totalCommits,
  };
}

export function outputMonthlyCommitters(commits: MonthlyData[]) {
  const mapped = commits.map((c) => monthlyDataHumanReadable(c));
  console.table(mapped);
}

export function outputMonthlyCommittersJson(commits: MonthlyData[]) {
  console.log(JSON.stringify(commits, null, 2));
}
