import type { ComponentStatus, ScanResultComponent } from './nes/modules/sbom.ts';

export interface Line {
  daysEol: number | null;
  purl: ScanResultComponent['purl'];
  info: {
    eolAt: Date | null;
    isEol: boolean;
  };
  status: ComponentStatus;
}

export function getStatusFromComponent(component: ScanResultComponent, daysEol: number | null): ComponentStatus {
  const { info } = component;

  if (component.status) {
    if (info.isEol && component.status && component.status !== 'EOL') {
      throw new Error(`isEol is true but status is not EOL: ${component.purl}`);
    }
    return component.status;
  }

  // If API fails to set status, we derive it based on other properties
  if (daysEol === null) {
    return info.isEol ? 'EOL' : 'OK';
  }

  if (daysEol > 0) {
    // daysEol is positive means we're past the EOL date
    return 'EOL';
  }
  // daysEol is zero or negative means we haven't reached EOL yet
  return 'LTS';
}

export function daysBetween(date1: Date, date2: Date) {
  const msPerDay = 1000 * 60 * 60 * 24 + 15; // milliseconds in a day plus 15 ms
  return Math.round((date2.getTime() - date1.getTime()) / msPerDay);
}

export function getDaysEolFromEolAt(eolAt: Date | null): number | null {
  return eolAt ? Math.abs(daysBetween(new Date(), eolAt)) : null;
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
