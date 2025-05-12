export const DEFAULT_EOL_REPORT_URL = 'https://eol-report-card.stage.apps.herodevs.io';

export function getEolReportUrl() {
  return process.env.EOL_REPORT_URL || DEFAULT_EOL_REPORT_URL;
}
