import {
  eachMonthOfInterval,
  format,
  isWithinInterval,
  max,
  min,
} from 'date-fns';
import { MonthlyData } from './types';

export function parseMonthly(
  startDate: Date,
  endDate: Date,
  entries: { commitHash: string; committer: string; date: string }[]
) {
  const monthly: MonthlyData[] = [];
  const dates = [startDate, endDate];
  const ival = {
    start: min(dates),
    end: max(dates),
  };
  const range = eachMonthOfInterval(ival);
  for (const idxr in range) {
    const idx = parseInt(idxr);
    if (idx + 1 >= range.length) {
      continue;
    }
    const [start, end] = [range[idx], range[idx + 1]];
    const month: MonthlyData = {
      name: format(start, 'LLLL yyyy'),
      start,
      end,
      committers: {},
    };

    for (const rec of entries) {
      if (isWithinInterval(new Date(rec.date), { start, end })) {
        month.committers[rec.committer] = month.committers[rec.committer] || [];
        month.committers[rec.committer].push({
          hash: rec.commitHash,
          date: rec.date,
        });
      }
    }

    if (Object.keys(month.committers).length > 0) {
      monthly.push(month);
    }
  }
  return monthly;
}
