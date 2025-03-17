export function getPurlOutput(purls: string[], output: string): string {
  switch (output) {
    case 'csv':
      // Add header and put each PURL on its own line
      return ['purl', ...purls]
        .map((purl) =>
          // Escape quotes and wrap in quotes if contains comma or quotes
          purl.includes(',') || purl.includes('"') ? `"${purl.replace(/"/g, '""')}"` : purl,
        )
        .join('\n');
    default:
      return JSON.stringify(purls, null, 2);
  }
}
