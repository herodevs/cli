import { Flags, ux } from '@oclif/core';
import { BaseCommand, run } from '../../shared';
import { format, subMonths, parse, eachMonthOfInterval, max, min, isWithinInterval } from 'date-fns';

const gammaDelimiter = 'ΓΓΓΓ';
const monthsToSubtract = 12;
const dateFmt = 'yyyy-MM-dd';
const defaultStartDate = format(new Date(), dateFmt);
const defaultEndDate = format(subMonths(new Date(), monthsToSubtract), dateFmt);
const gitOutputFormat = `"${['%h', '%an', '%ad'].join(gammaDelimiter)}"`;

type committerCommits = { name: string; commits: string[] }

type MonthlyData = {
  name: string
  start: Date, end: Date,
  committers: Record<string, { hash: string, date: string }[]>
}
type SortedCommitterInfo = { committers: committerCommits[], monthly: MonthlyData[] }


export class ReportCommitters extends BaseCommand<typeof ReportCommitters> {
  static summary = 'Get Committers Between Two Dates';
  static override usage = '<%= command.id %> [flags [-s][-e][-x]]';

  static examples = [['<%= config.bin %> <%= command.id %>'].join('\n')];

  static flags = {
    startDate: Flags.string({
      char: 's',
      summary: `Start Date (format: yyyy-MM-dd)`,
      required: false,
      default: () => defaultStartDate as any,
    }),
    endDate: Flags.string({
      char: 'e',
      summary: `End Date (format: yyyy-MM-dd)`,
      required: false,
      default: () => defaultEndDate as any,
    }),
    exclude: Flags.string({
      char: 'x',
      multiple: true,
      summary: 'Path Exclusions (eg -x="./src/bin" -x="./dist")',
      required: false,
      // default: () => "" as any
    }),
    monthly: Flags.boolean({
      char: 'm',
      summary: 'Break down by calendar month, rather than by committer.  (eg -m)',
      required: false,
      default: false
    }),
    
  };

  private _parseDateFlags(startDate: string, endDate: string) {
    return [parse(endDate, dateFmt, new Date()), parse(startDate, dateFmt, new Date())];
  }

  private _parseGitLogEntries(entries: string[]) {
    return entries.map((entry) => {
      const [commitHash, committer, date] = entry.split(gammaDelimiter);
      return { commitHash, committer, date };
    });
  }

  private _collapseAndSortCommitterInfo(rawEntries: string[]): SortedCommitterInfo {
    const entries = this._parseGitLogEntries(rawEntries);
    const hash = {} as any;
    for (let i = 0; i < entries.length; i++) {
      hash[entries[i].committer] = hash[entries[i].committer] || [];
      hash[entries[i].committer].push([entries[i].commitHash, entries[i].date].join(' '));
    }

    const sortable = [] as { name: string; commits: string[] }[];
    Object.keys(hash).forEach((name) => {
      sortable.push({ name, commits: hash[name] });
    });

    const committers = sortable.sort((a, b) => {
      return b.commits.length - a.commits.length;
    });
    
    const monthly = this.parseMonthly(entries)
    return { committers, monthly }
  }

  private parseMonthly(entries: { commitHash: string; committer: string; date: string; }[]) {
    const monthly: MonthlyData[] = []
    const dates = [ new Date(this.flags.startDate), new Date(this.flags.endDate)]
    const ival = {
      start: min(dates),
      end: max(dates)
    }
    const range = eachMonthOfInterval(ival);
    for(const idxr in range ){
      const idx = parseInt(idxr)
      if( idx + 1 >= range.length){
        continue
      }
      const [ start, end ] = [range[idx], range[idx + 1]]
      const month: MonthlyData = {
        name: format(start, 'LLLL yyyy'),
        start, end, 
        committers: {}
      }

      for(const rec of entries){
        if( isWithinInterval(new Date(rec.date), { start, end }) ){
          month.committers[rec.committer] = month.committers[rec.committer] || []
          month.committers[rec.committer].push({ hash: rec.commitHash, date: rec.date })
        }
      }
      
      if( Object.keys(month.committers).length > 0 ){
        monthly.push(month)
      }
    }
    return monthly
  }

  private printCommitters(committers: committerCommits[]) {
    if (!Object.keys(committers).length) {
      this.log('NO COMMITTERS IN PERIOD');
    }
    this.log('\n--------------------COMMITTERS--------------------\n');

    committers.forEach((committerCommit: committerCommits, i: number) => {
      this.log(` ${i + 1}. ${committerCommit.name} (${committerCommit.commits.length})`);
      committerCommit.commits.forEach((commitInfo: string) => {
        this.log(` \t - ${commitInfo}`);
      });
      this.log('\n');
    });
    this.log('---------------------------------------------------\n');
  }


  private printMonthly(md: MonthlyData[]) {
    if (!Object.keys(md).length) {
      this.log('NO COMMITTERS IN PERIOD');
      return
    }

    const rows = md
      .flatMap(r => {
        return Object
          .entries(r.committers)
          .flatMap(([committer, commits]) => 
            commits.flatMap(commit => 
              ({ month: r.name, committer, commit })
            )
          )
      }).map(r => ({ ...r, flags: { newMonth: true, newCommitter: true } as any }))

    // ugly flag hack for now
    rows.forEach( (r, idx) => {
      let newMonth = true
      let newCommitter = true 
      if( idx == 0 || r.month !== rows[idx - 1].month ){
        // first row / new month? always show both
      }else if(r.committer !== rows[idx - 1].committer){
        // month's same but new committer
        newMonth = false
      }else{
        // show both
        newMonth = false
        newCommitter = false
      }

      r.flags = { newMonth, newCommitter }
    })

    const distinctCommitters = rows.reduce( (arr, row) => arr.includes(row.committer) ? arr : [...arr, row.committer], [])

    this.log('\n')
    ux.table(rows, {
      month: { 
        header: 'Month', 
        minWidth: 20,
        get: row => row.flags.newMonth ? row.month : ''
      },
      committer: {
        header: 'Contributor',
        minWidth: 25,
        get: row => row.flags.newCommitter ? row.committer : ''
      },
      commit: {
        header: 'Commit SHA',
        get: row => row.commit.hash,
        minWidth: 15,
        
      },
      date: {
        header: 'Commit Date',
        get: row => row.commit.date,
        minWidth: 20
      },
      // flags: {}
    })

    const unique = distinctCommitters.sort()
    this.log(`\n\n\nThere were ${unique.length} contributors reported: ${unique.join(', ')}\n`)
  }
    
  // public async run(): Promise<flagType<typeof ReportCommitters>> {
  public async run(): Promise<any> {

    const { flags } = this
    const dates = this._parseDateFlags(flags.startDate, flags.endDate);
    const ignores =
      flags.exclude && flags.exclude.length ? `-- . "!(${flags.exclude.join('|')})"` : '';
    const gitCommand = `git log --since "${dates[0]}" --until "${dates[1]}" --pretty=format:${gitOutputFormat} ${ignores}`;
    const result = await run(gitCommand);

    const { committers, monthly } = this._collapseAndSortCommitterInfo((result as string).split('\n'));
    if( flags.monthly ){
      this.printMonthly(monthly)
      return monthly
    }else{
      this.printCommitters(committers);
      return committers
    }
  }

}
