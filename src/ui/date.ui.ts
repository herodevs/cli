export function parseDateToString(date: unknown): string {
  if (date === null) {
    return '';
  }
  if (typeof date === 'string' && date) {
    return new Date(date).toISOString();
  }
  if (typeof date === 'number') {
    return new Date(date).toISOString();
  }
  if (date instanceof Date) {
    return date.toISOString();
  }
  throw new Error('Invalid date');
}
