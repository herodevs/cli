/* eslint-disable perfectionist/sort-interfaces */
import { ux } from '@oclif/core'
import inquirer from 'inquirer'
import { type Answers } from 'inquirer';

import { type ScanResultComponent } from '../nes/modules/sbom.ts';

interface Line {
  daysEol?: number
  purl: ScanResultComponent['purl']
  info?: {
    eolAt?: Date,
    isEol: boolean
  }
  status: ScanResultComponent['status']
}

function daysBetween(date1: Date, date2: Date) {
  const msPerDay = 1000 * 60 * 60 * 24 + 15; // milliseconds in a day plus 15 ms
  return Math.round((date2.getTime() - date1.getTime()) / msPerDay);
}

function formatLine(l: Line, idx: number, ctx: { longest: number; total: number, }) {
  let { info, purl, status } = l
  let msg = ''
  let stat

  info = info || { eolAt: new Date(), isEol: false }
  const daysEol = info.eolAt ? daysBetween(new Date(), info.eolAt) : undefined


  if (daysEol === undefined) {
    status = info.isEol ? 'EOL' : status
  } else if (daysEol < 0) {
    status = 'EOL'
  } else if (daysEol > 0) {
    status = 'LTS'
  }

  switch (status) {
    case 'EOL': {
      stat = ux.colorize('red', 'EOL')
      msg = `EOL'd ${ux.colorize('red', Math.abs(daysEol!).toString())} days ago.`
      break
    }

    case 'LTS': {
      stat = ux.colorize('yellow', 'LTS')
      msg = `Will go EOL in ${ux.colorize('yellow', Math.abs(daysEol!).toString())} days.`
      break
    }

    case 'OK': {
      stat = ux.colorize('green', 'OK')
      break
    }
  }

  const padlen = ctx.total.toString().length
  const rownum = `${idx + 1}`.padStart(padlen, ' ')
  const name = purl.padEnd(ctx.longest, ' ')
  return {
    name: `${rownum}. [${stat}] ${name} | ${msg}`,
    value: l
  }
}

export function promptComponentDetails(lines: Line[]): Promise<Answers> {

  const context = {
    longest: lines
      .map(l => l.purl.length)
      .reduce((a, l) => Math.max(a, l), 0),
    total: lines.length
  }

  return inquirer
    .prompt([
      {
        choices: lines.map((l, idx) => formatLine(l, idx, context)),
        message: 'Which components',
        name: 'selected',
        pageSize: 20,
        type: 'checkbox'
      }
    ])
}
