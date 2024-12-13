import { eachMonthOfInterval, format, isWithinInterval } from 'date-fns';
import { Commit, MonthlyData } from './types';

export function parseMonthly(startDate: Date, endDate: Date, entries: Commit[]) {
  const monthly: MonthlyData[] = [];
  const range = eachMonthOfInterval({
    start: startDate,
    end: endDate,
  });

  for (let idx = 0; idx < range.length - 1; idx++) {
    const [start, end] = [range[idx], range[idx + 1]];
    const month: MonthlyData = {
      month: format(start, 'LLLL yyyy'),
      start: startDate,
      end: endDate,
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

function monthlyDataHumanReadable(data: MonthlyData) {
  return {
    ...data,
    start: format(data.start, 'yyyy-MM-dd'),
    end: format(data.end, 'yyyy-MM-dd'),
  };
}

export function outputMonthlyCommitters(commits: MonthlyData[]) {
  const mapped = commits.map((c) => monthlyDataHumanReadable(c));
  console.table(mapped);
}

export function outputMonthlyCommittersJson(commits: MonthlyData[]) {
  console.log(JSON.stringify(commits, null, 2));
}
