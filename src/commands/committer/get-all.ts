
import '@oclif/core/lib/interfaces/parser';
import { Flags } from '@oclif/core';
import { BaseCommand, Flags as flagType } from '../../shared';
import { format, subMonths, parse } from 'date-fns';

const shell = require('shelljs');
const monthsToSubtract = 12;
const dateFmt = 'yyyy-MM-dd';
const defaultStartDate = format(new Date(), dateFmt);
const defaultEndDate = format(subMonths(new Date(), monthsToSubtract), dateFmt);

export class CommitterGetAll extends BaseCommand<typeof CommitterGetAll> {
  static summary = 'Get Committers Between Two Dates';
  static override usage ='<%= command.id %> [flags [-s][-e][-x]]';

  static examples = [
    [
      '<%= config.bin %> <%= command.id %>',
    ].join('\n')
  ];

  static flags = {
    startDate: Flags.string({
      char: 's',
      summary: `Start Date (format: yyyy-MM-dd)`,
      required: false,
      default: () => defaultStartDate as any
    }),
    endDate: Flags.string({
      char: 'e',
      summary: `End Date (format: yyyy-MM-dd)`,
      required: false,
      default: () => defaultEndDate as any
    }),
    exclude: Flags.string({
      char: 'x',
      multiple: true,
      summary: 'Path Exclusions (eg -x="./src/bin" -x="./dist")',
      required: false,
      default: () => "''" as any
    }),
  }


  private _parseDates(startDate: string, endDate: string) {
    return [
      parse(endDate, dateFmt, new Date()),
      parse(startDate, dateFmt, new Date()),
    ];
  }

  public async run(): Promise<flagType<typeof CommitterGetAll>> {
    const { flags } = await this.parse(CommitterGetAll) as any;
    const dates = this._parseDates(flags.startDate, flags.endDate);
    console.log('DATES: ', dates);
    return new Promise((resolve, reject) => {
      shell.exec(`git log --since "${dates[0]}" --until "${dates[1]}" --pretty=format:"%h %an %ad"`, (code: any, stdout: any, stderr: any) => {
        console.log('----------', stderr, stdout);
        if (stderr) {
          return reject(stderr)
        }
        resolve(stdout);

      });
    });
  }
}
