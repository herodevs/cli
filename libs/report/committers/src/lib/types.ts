export type Commit = { commitHash: string; committer: string; date: Date };

export type CommitterCommits = { name: string; commits: string[] };

export type CommitterCount = {
  name: string;
  count: number;
  lastCommitDate: string;
};

export type MonthlyData = {
  month: string;
  start: Date;
  end: Date;
  committers: Record<string, number>;
};

export type SortedCommitterInfo = {
  committers: CommitterCommits[];
  monthly: MonthlyData[];
};

export interface CommitterLastCommitDate {
  [committer: string]: string;
}
