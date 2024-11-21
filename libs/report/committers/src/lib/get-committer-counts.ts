import { type Commit, type CommitterCount, type CommitterLastCommitDate } from './types';

export function getCommitterCounts(entries: Commit[]): CommitterCount[] {
  const lastCommits = getLastCommitDatePerUser(entries);
  return entries
    .reduce((acc, entry) => {
      let committerCount = acc.find((c) => c.name === entry.committer);
      if (!committerCount) {
        committerCount = { name: entry.committer, count: 0, lastCommit: lastCommits[entry.committer] ?? ''};
        acc.push(committerCount);
      }
      committerCount.count++;
      return acc;
    }, [] as CommitterCount[])
    .sort((a, b) => b.count - a.count);
}

export function getLastCommitDatePerUser(entries: Commit[]): CommitterLastCommitDate {
  const lastCommitDates: CommitterLastCommitDate = {};

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const { committer, date } = entry;

    if (Number.isNaN(date.getTime())) continue;

    const currentTimestamp = date.getTime();

    if (!lastCommitDates[committer] || currentTimestamp > new Date(lastCommitDates[committer]).getTime()) {
      lastCommitDates[committer] = date.toLocaleString('en-US', { timeZone: 'UTC' });
    }
  }
  return lastCommitDates;
}
