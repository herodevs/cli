import type { Sbom, SbomDependency, SbomEntry } from './eol/cdx.svc.ts';

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
 * Extract PURLs from components recursively
 */
function extractPurlsFromComponents(components: SbomEntry[], purlSet: Set<string>): void {
  for (const component of components) {
    if (component.purl) {
      purlSet.add(component.purl);
    }
  }
}

/**
 * Extract PURLs from dependencies
 */
function extractPurlsFromDependencies(dependencies: SbomDependency[], purlSet: Set<string>): void {
  for (const dependency of dependencies) {
    if (dependency.ref) {
      purlSet.add(dependency.ref);
    }

    if (dependency.dependsOn) {
      for (const dep of dependency.dependsOn) {
        purlSet.add(dep);
      }
    }
  }
}

/**
 * Extract all PURLs from a CycloneDX SBOM, including components and dependencies
 */
export function extractPurls(sbom: Sbom): string[] {
  const purlSet = new Set<string>();

  // Extract from direct components
  if (sbom.components) {
    extractPurlsFromComponents(sbom.components, purlSet);
  }

  // Extract from dependencies
  if (sbom.dependencies) {
    extractPurlsFromDependencies(sbom.dependencies, purlSet);
  }

  return Array.from(purlSet);
}

/**
 * Parse a purls file in either JSON or text format, including the format of
 * herodevs.purls.json - { purls: [ 'pkg:npm/express@4.18.2', 'pkg:npm/react@18.3.1' ] }
 * or a text file with one purl per line.
 */
export function parsePurlsFile(purlsFileString: string): string[] {
  // Handle empty string
  if (!purlsFileString.trim()) {
    return [];
  }

  try {
    // Try parsing as JSON first
    const parsed = JSON.parse(purlsFileString);

    if (parsed && Array.isArray(parsed.purls)) {
      return parsed.purls;
    }

    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // If not JSON, try parsing as text file
    const lines = purlsFileString
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && line.startsWith('pkg:'));

    // Handle single purl case (no newlines)
    if (lines.length === 0 && purlsFileString.trim().startsWith('pkg:')) {
      return [purlsFileString.trim()];
    }

    // Return any valid purls found
    if (lines.length > 0) {
      return lines;
    }
  }

  throw new Error('Invalid purls file: must be either JSON with purls array or text file with one purl per line');
}
