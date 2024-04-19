import { MonthlyData } from './types';

export function printMonthly(monthlyData: MonthlyData[]) {
  /*
  if (!Object.keys(monthlyData).length) {
    console.log('NO COMMITTERS IN PERIOD');
    return;
  }

  const rows = monthlyData
    .flatMap((r) => {
      return Object.entries(r.committers).flatMap(([committer, commits]) =>
        commits.flatMap((commit) => ({ month: r.name, committer, commit }))
      );
    })
    .map((r) => ({
      ...r,
      flags: { newMonth: true, newCommitter: true } as any,
    }));

  // ugly flag hack for now
  rows.forEach((r, idx) => {
    let newMonth = true;
    let newCommitter = true;
    if (idx == 0 || r.month !== rows[idx - 1].month) {
      // first row / new month? always show both
    } else if (r.committer !== rows[idx - 1].committer) {
      // month's same but new committer
      newMonth = false;
    } else {
      // show both
      newMonth = false;
      newCommitter = false;
    }

    r.flags = { newMonth, newCommitter };
  });

  const distinctCommitters = rows.reduce(
    (arr, row) => (arr.includes(row.committer) ? arr : [...arr, row.committer]),
    []
  );

  console.log('\n');
  ux.table(rows, {
    month: {
      header: 'Month',
      minWidth: 20,
      get: (row) => (row.flags.newMonth ? row.month : ''),
    },
    committer: {
      header: 'Contributor',
      minWidth: 25,
      get: (row) => (row.flags.newCommitter ? row.committer : ''),
    },
    commit: {
      header: 'Commit SHA',
      get: (row) => row.commit.hash,
      minWidth: 15,
    },
    date: {
      header: 'Commit Date',
      get: (row) => row.commit.date,
      minWidth: 20,
    },
    // flags: {}
  });

  const unique = distinctCommitters.sort();
  console.log(
    `\n\n\nThere were ${unique.length} contributors reported: ${unique.join(
      ', '
    )}\n`
  );
  */
}
