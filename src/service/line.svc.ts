import type { ComponentStatus, ScanResultComponent } from '../api/types/nes.types.ts';

export interface Line {
  daysEol: number | null;
  purl: ScanResultComponent['purl'];
  info: {
    eolAt: Date | null;
    isEol: boolean;
  };
  status: ComponentStatus;
}

export function getMessageAndStatus(status: string, daysEol: number | null) {
  let msg = '';
  let stat = '';

  const stringifiedDaysEol = daysEol ? daysEol.toString() : 'unknown';

  switch (status) {
    case 'EOL': {
      stat = 'EOL';
      msg = `EOL'd ${stringifiedDaysEol} days ago.`;
      break;
    }

    case 'LTS': {
      stat = 'LTS';
      msg = `Will go EOL in ${stringifiedDaysEol} days.`;
      break;
    }

    case 'OK': {
      stat = 'OK';
      break;
    }

    case 'UNKNOWN': {
      stat = 'UNKNOWN';
      msg = 'No data found';
      break;
    }

    default:
      throw new Error(`Unknown status: ${status}`);
  }

  return { stat, msg };
}

export function formatLine(l: Line, idx: number, ctx: { longest: number; total: number }) {
  const { daysEol, purl, status } = l;

  const { stat, msg } = getMessageAndStatus(status, daysEol);

  const padlen = ctx.total.toString().length;
  const rownum = `${idx + 1}`.padStart(padlen, ' ');
  const name = purl.padEnd(ctx.longest, ' ');
  return {
    name: `${rownum}. [${stat}] ${name} | ${msg}`,
    value: l,
  };
}
