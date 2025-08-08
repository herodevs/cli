import { deriveComponentStatus } from '@herodevs/eol-shared';
import type { ComponentStatus, EolReport } from '@herodevs/eol-shared';
import { ux } from '@oclif/core';
import terminalLink from 'terminal-link';

const STATUS_COLORS: Record<ComponentStatus, string> = {
  EOL: 'red',
  UNKNOWN: 'default',
  OK: 'green',
  EOL_UPCOMING: 'yellow',
};

/**
 * Formats status row text with appropriate color and icon
 */
export const getStatusRowText: Record<ComponentStatus, (text: string) => string> = {
  EOL: (text: string) => ux.colorize(STATUS_COLORS.EOL, `✗ ${text}`),
  UNKNOWN: (text: string) => ux.colorize(STATUS_COLORS.UNKNOWN, `• ${text}`),
  OK: (text: string) => ux.colorize(STATUS_COLORS.OK, `✔ ${text}`),
  EOL_UPCOMING: (text: string) => ux.colorize(STATUS_COLORS.EOL_UPCOMING, `! ${text}`),
};

/**
 * Counts components by their status, including NES remediation availability
 */
export function countComponentsByStatus(report: EolReport): Record<ComponentStatus | 'NES_AVAILABLE', number> {
  const grouped: Record<ComponentStatus | 'NES_AVAILABLE', number> = {
    UNKNOWN: 0,
    OK: 0,
    EOL_UPCOMING: 0,
    EOL: 0,
    NES_AVAILABLE: 0,
  };

  for (const component of report.components) {
    const status = deriveComponentStatus(component.metadata);
    grouped[status]++;

    if (component.nesRemediation?.remediations?.length) {
      grouped.NES_AVAILABLE++;
    }
  }

  return grouped;
}

/**
 * Formats scan results for console display
 */
export function formatScanResults(report: EolReport): string[] {
  const { UNKNOWN, OK, EOL_UPCOMING, EOL, NES_AVAILABLE } = countComponentsByStatus(report);

  if (!UNKNOWN && !OK && !EOL_UPCOMING && !EOL) {
    return [ux.colorize('yellow', 'No components found in scan.')];
  }

  return [
    ux.colorize('bold', 'Scan results:'),
    ux.colorize('bold', '-'.repeat(40)),
    ux.colorize('bold', `${report.components.length.toLocaleString()} total packages scanned`),
    getStatusRowText.EOL(`${EOL.toLocaleString().padEnd(5)} End-of-Life (EOL)`),
    getStatusRowText.EOL_UPCOMING(`${EOL_UPCOMING.toLocaleString().padEnd(5)} EOL Upcoming`),
    getStatusRowText.OK(`${OK.toLocaleString().padEnd(5)} OK`),
    getStatusRowText.UNKNOWN(`${UNKNOWN.toLocaleString().padEnd(5)} Unknown Status`),
    getStatusRowText.UNKNOWN(
      `${NES_AVAILABLE.toLocaleString().padEnd(5)} HeroDevs NES Remediation${NES_AVAILABLE !== 1 ? 's' : ''} Available`,
    ),
  ];
}

/**
 * Formats web report URL for console display
 */
export function formatWebReportUrl(id: string, reportCardUrl: string): string[] {
  const url = ux.colorize(
    'blue',
    terminalLink(new URL(reportCardUrl).hostname, `${reportCardUrl}/${id}`, { fallback: (_, url) => url }),
  );

  return [ux.colorize('bold', '-'.repeat(40)), `🌐 View your full EOL report at: ${url}\n`];
}
