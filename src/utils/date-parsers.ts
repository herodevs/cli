import { endOfDay, endOfMonth, format, formatISO, parse, startOfDay, subMonths } from 'date-fns';

export const DEFAULT_DATE_FORMAT = 'yyyy-MM-dd';
export const DEFAULT_DATE_COMMIT_FORMAT = 'MM/dd/yyyy, h:mm:ss a';
export const DEFAULT_DATE_COMMIT_MONTH_FORMAT = 'MMMM yyyy';

export const parseDate = (input: string) => parse(input, DEFAULT_DATE_FORMAT, new Date());

export const formatDate = (input: Date) => format(input, DEFAULT_DATE_FORMAT);

export const formatISODate = (input: Date) => formatISO(input);

export const formatCommitDate = (input: Date) => format(input, DEFAULT_DATE_COMMIT_FORMAT);

export const formatCommitDateMonth = (input: Date) => format(input, DEFAULT_DATE_COMMIT_MONTH_FORMAT);

export const subtractMonths = (input: Date, months: number) => subMonths(input, months);

export const getStartOfDay = (input: Date) => startOfDay(input);

export const getEndOfDay = (input: Date) => endOfDay(input);

export const getEndOfMonth = (input: Date) => endOfMonth(input);
