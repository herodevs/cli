export const EOL_REPORT_URL = 'https://eol-report-card.apps.herodevs.com/reports';
export const GRAPHQL_HOST = 'https://api.nes.herodevs.com';
export const GRAPHQL_PATH = '/graphql';
export const ANALYTICS_URL = 'https://eol-api.herodevs.com/track';

export const config = {
  eolReportUrl: process.env.EOL_REPORT_URL || EOL_REPORT_URL,
  graphqlHost: process.env.GRAPHQL_HOST || GRAPHQL_HOST,
  graphqlPath: process.env.GRAPHQL_PATH || GRAPHQL_PATH,
  analyticsUrl: process.env.ANALYTICS_URL || ANALYTICS_URL,
  showVulnCount: true,
};

export const filenamePrefix = 'herodevs';
