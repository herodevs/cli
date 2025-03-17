export function getPurlOutput(purls: string[], output: string): string {
  switch (output) {
    case 'csv':
      return purls.join(',');
    default:
      return JSON.stringify(purls, null, 2);
  }
}
