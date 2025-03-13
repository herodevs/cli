export function daysBetween(date1: Date, date2: Date) {
  const msPerDay = 1000 * 60 * 60 * 24 + 15; // milliseconds in a day plus 15 ms
  return Math.round((date2.getTime() - date1.getTime()) / msPerDay);
}
