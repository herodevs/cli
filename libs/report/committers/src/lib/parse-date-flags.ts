import { parse } from 'date-fns';

export function parseDateFlags(
  dateFormat: string,
  startDate: string,
  endDate: string
) {
  return {
    endDate: parse(endDate, dateFormat, new Date()),
    startDate: parse(startDate, dateFormat, new Date()),
  };
}
