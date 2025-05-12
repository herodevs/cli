// NOTE: ENVIRONMENT can be overridden in bin/dev.js and/or bin/run.js
export const ENVIRONMENT = process.env.ENVIRONMENT || 'production';

export const EOL_REPORT_URL_DEVELOPMENT = 'https://eol-report-card.stage.apps.herodevs.io';
export const EOL_REPORT_URL_PRODUCTION: string | null = null;

export const GRAPHQL_HOST_LOCALHOST = 'http://localhost:3000';
export const GRAPHQL_HOST_DEVELOPMENT = 'https://api.dev.nes.herodevs.com';
export const GRAPHQL_HOST_PRODUCTION = 'https://api.nes.herodevs.com';

export const GRAPHQL_PATH = '/graphql';

export function getEolReportUrl() {
  switch (ENVIRONMENT) {
    case 'development':
      return EOL_REPORT_URL_DEVELOPMENT;
    default:
      return EOL_REPORT_URL_PRODUCTION;
  }
}

export function getGraphQLHost() {
  switch (ENVIRONMENT) {
    case 'localhost':
      return GRAPHQL_HOST_LOCALHOST;
    case 'development':
      return GRAPHQL_HOST_DEVELOPMENT;
    default:
      return GRAPHQL_HOST_PRODUCTION;
  }
}
