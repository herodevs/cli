export function getPurlOutput(purls: string[], output: string): string {
  switch (output) {
    case 'csv':
      return ['purl', ...purls].join('\n');
    default:
      return JSON.stringify(purls, null, 2);
  }
}
