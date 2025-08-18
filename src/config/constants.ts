export const EOL_REPORT_URL = 'https://eol-report-card.apps.herodevs.com/reports';
export const GRAPHQL_HOST = 'https://api.nes.herodevs.com';
export const GRAPHQL_PATH = '/graphql';
export const ANALYTICS_URL = 'https://eol-api.herodevs.com/track';
export const CONCURRENT_PAGE_REQUESTS = 3;
export const PAGE_SIZE = 500;

let concurrentPageRequests = CONCURRENT_PAGE_REQUESTS;
const parsed = Number.parseInt(process.env.CONCURRENT_PAGE_REQUESTS!, 10);
if (parsed > 0) {
  concurrentPageRequests = parsed;
}

let pageSize = PAGE_SIZE;
const parsedPageSize = Number.parseInt(process.env.PAGE_SIZE!, 10);
if (parsedPageSize > 0) {
  pageSize = parsedPageSize;
}

export const config = {
  eolReportUrl: process.env.EOL_REPORT_URL || EOL_REPORT_URL,
  graphqlHost: process.env.GRAPHQL_HOST || GRAPHQL_HOST,
  graphqlPath: process.env.GRAPHQL_PATH || GRAPHQL_PATH,
  analyticsUrl: process.env.ANALYTICS_URL || ANALYTICS_URL,
  showVulnCount: true,
  concurrentPageRequests,
  pageSize,
};

export const filenamePrefix = 'herodevs';
