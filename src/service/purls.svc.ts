import type { Sbom } from './eol/cdx.svc.ts';

/**
 * Formats a value for CSV output by wrapping it in quotes if it contains commas.
 * This ensures that values containing commas aren't split into multiple columns
 * when the CSV is opened in a spreadsheet application.
 */
export function formatCsvValue(value: string): string {
  // If the value contains a comma, wrap it in quotes to preserve it as a single cell
  return value.includes(',') ? `"${value}"` : value;
}

/**
 * Converts an array of PURLs into either CSV or JSON format.
 * For CSV output, adds a header row with "purl" and formats values to preserve commas.
 * For JSON output, returns a properly indented JSON string.
 */
export function getPurlOutput(purls: string[], output: string): string {
  switch (output) {
    case 'csv':
      return ['purl', ...purls].map(formatCsvValue).join('\n');
    default:
      return JSON.stringify({ purls }, null, 2);
  }
}

/**
 * Translate an SBOM to a list of purls for api request.
 */
export async function extractPurls(sbom: Sbom): Promise<string[]> {
  const { components: comps } = sbom;
  return comps.map((c) => c.purl) ?? [];
}

/**
 * Parse a purls file in either JSON or text format, including the format of
 * eol.purls.json - { purls: [ 'pkg:npm/express@4.18.2', 'pkg:npm/react@18.3.1' ] }
 * or a text file with one purl per line.
 */
export function parsePurlsFile(purlsFileString: string): string[] {
  try {
    const parsed = JSON.parse(purlsFileString);

    if (parsed && Array.isArray(parsed.purls)) {
      return parsed.purls;
    }

    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    const lines = purlsFileString
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && line.startsWith('pkg:'));

    if (lines.length > 0) {
      return lines;
    }
  }

  throw new Error('Invalid purls file: must be either JSON with purls array or text file with one purl per line');
}
