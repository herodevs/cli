export function parseMomentToSimpleDate(momentDate: string | Date | number | null): string {
  // Only return empty string for null
  if (momentDate === null) return '';

  try {
    const dateObj = new Date(momentDate);
    if (Number.isNaN(dateObj.getTime())) {
      throw new Error('Invalid date');
    }
    return dateObj.toISOString().split('T')[0];
  } catch (cause: unknown) {
    throw new Error('Invalid date', { cause });
  }
}
