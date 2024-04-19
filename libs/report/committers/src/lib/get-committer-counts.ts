import { Commit, CommitterCount } from './types';

export function getCommitterCounts(entries: Commit[]): CommitterCount[] {
  return entries
    .reduce((acc, entry) => {
      let committerCount = acc.find((c) => c.name === entry.committer);
      if (!committerCount) {
        committerCount = { name: entry.committer, count: 0 };
        acc.push(committerCount);
      }
      committerCount.count++;
      return acc;
    }, [] as CommitterCount[])
    .sort((a, b) => b.count - a.count);
}
