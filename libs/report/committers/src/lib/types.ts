export type Commit = { commitHash: string; committer: string; date: Date };

export type CommitterCommits = { name: string; commits: string[] };

export type CommitterCount = {
  name: string;
  count: number;
};

export type MonthlyData = {
  name: string;
  start: Date;
  end: Date;
  committers: Record<string, { hash: string; date: string }[]>;
};

export type SortedCommitterInfo = {
  committers: CommitterCommits[];
  monthly: MonthlyData[];
};
