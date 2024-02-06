import {Flags} from '@oclif/core'
import {BaseCommand, Flags as flagType, run} from '../../shared'
import {format, subMonths, parse} from 'date-fns'

const gammaDelimiter = 'ΓΓΓΓ'
const monthsToSubtract = 12
const dateFmt = 'yyyy-MM-dd'
const defaultStartDate = format(new Date(), dateFmt)
const defaultEndDate = format(subMonths(new Date(), monthsToSubtract), dateFmt)
const gitOutputFormat = `"${['%h', '%an', '%ad'].join(gammaDelimiter)}"`

type committerCommits = { name: string; commits: string[] }

export class CommitterGetAll extends BaseCommand<typeof CommitterGetAll> {
  static summary = 'Get Committers Between Two Dates'
  static override usage = '<%= command.id %> [flags [-s][-e][-x]]'

  static examples = [['<%= config.bin %> <%= command.id %>'].join('\n')]

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
  }

  private _parseDateFlags(startDate: string, endDate: string) {
    return [parse(endDate, dateFmt, new Date()), parse(startDate, dateFmt, new Date())]
  }

  private _parseGitLogEntries(entries: string[]) {
    return entries.map((entry) => {
      const [commitHash, committer, date] = entry.split(gammaDelimiter)
      return { commitHash, committer, date }
    })
  }

  private _collapseAndSortCommitterInfo(rawEntries: string[]): committerCommits[] {
    const entries = this._parseGitLogEntries(rawEntries)
    const hash = {} as any
    for (let i = 0; i < entries.length; i++) {
      hash[entries[i].committer] = hash[entries[i].committer] || []
      hash[entries[i].committer].push([entries[i].commitHash, entries[i].date].join(' '))
    }

    const sortable = [] as { name: string; commits: string[] }[]
    Object.keys(hash).forEach((name) => {
      sortable.push({ name, commits: hash[name] })
    })

    return sortable.sort((a, b) => {
      return b.commits.length - a.commits.length
    })
  }

  private _printOutput(committers: committerCommits[]) {
    if (!Object.keys(committers).length) {
      this.log('NO COMMITTERS IN PERIOD')
    }
    this.log('\n--------------------COMMITTERS--------------------\n')

    committers.forEach((committerCommit: committerCommits, i: number) => {
      this.log(` ${i + 1}. ${committerCommit.name} (${committerCommit.commits.length})`)
      committerCommit.commits.forEach((commitInfo: string) => {
        this.log(` \t - ${commitInfo}`)
      })
      this.log('\n')
    })
    this.log('---------------------------------------------------\n')
  }

  public async run(): Promise<flagType<typeof CommitterGetAll>> {
    const { flags } = (await this.parse(CommitterGetAll)) as any
    const dates = this._parseDateFlags(flags.startDate, flags.endDate)
    const ignores =
      flags.exclude && flags.exclude.length ? `-- . "!(${flags.exclude.join('|')})"` : ''
    const gitCommand = `git log --since "${dates[0]}" --until "${dates[1]}" --pretty=format:${gitOutputFormat} ${ignores}`
    const result = await run(gitCommand)
    const committers = this._collapseAndSortCommitterInfo((result as string).split('\n'))
    this._printOutput(committers)
    return Promise.resolve() as any
  }
}
