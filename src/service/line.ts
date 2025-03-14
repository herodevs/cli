import { ux } from '@oclif/core';
import type { ComponentStatus, ScanResultComponent } from './nes/modules/sbom.ts';

export interface Line {
  daysEol: number | undefined;
  purl: ScanResultComponent['purl'];
  info: {
    eolAt: Date | null;
    isEol: boolean;
  };
  status: ComponentStatus;
}

export function daysBetween(date1: Date, date2: Date) {
  const msPerDay = 1000 * 60 * 60 * 24 + 15; // milliseconds in a day plus 15 ms
  return Math.round((date2.getTime() - date1.getTime()) / msPerDay);
}

export function getMessageAndStatus(status: string, eolAt: Date | null) {
  let msg = '';
  let stat = '';

  const stringifiedDaysEol = eolAt ? Math.abs(daysBetween(new Date(), eolAt)).toString() : 'unknown';

  switch (status) {
    case 'EOL': {
      stat = ux.colorize('red', 'EOL');
      msg = `EOL'd ${ux.colorize('red', stringifiedDaysEol)} days ago.`;
      break;
    }

    case 'LTS': {
      stat = ux.colorize('yellow', 'LTS');
      msg = `Will go EOL in ${ux.colorize('yellow', stringifiedDaysEol)} days.`;
      break;
    }

    case 'OK': {
      stat = ux.colorize('green', 'OK');
      break;
    }
    default:
      throw new Error(`Unknown status: ${status}`);
  }

  return { stat, msg };
}

export function formatLine(l: Line, idx: number, ctx: { longest: number; total: number }) {
  const { info, purl, status } = l;

  if (info.isEol && status !== 'EOL') {
    throw new Error(`isEol is true but status is not EOL: ${purl}`);
  }

  const { stat, msg } = getMessageAndStatus(status, info.eolAt);

  const padlen = ctx.total.toString().length;
  const rownum = `${idx + 1}`.padStart(padlen, ' ');
  const name = purl.padEnd(ctx.longest, ' ');
  return {
    name: `${rownum}. [${stat}] ${name} | ${msg}`,
    value: l,
  };
}
