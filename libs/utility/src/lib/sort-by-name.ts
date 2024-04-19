export function sortByName<T extends { name: string }>(a: T, b: T): number {
  return a.name === b.name ? 0 : a.name > b.name ? 1 : -1;
}
