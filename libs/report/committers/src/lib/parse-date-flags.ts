import { parse } from 'date-fns';

export function parseDateFlags(dateFormat: string, beforeDate: string, afterDate: string) {
  return {
    afterDate: parse(afterDate, dateFormat, new Date()),
    beforeDate: parse(beforeDate, dateFormat, new Date()),
  };
}
