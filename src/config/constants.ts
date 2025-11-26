export const EOL_REPORT_URL = 'https://apps.herodevs.com/eol/reports';
export const GRAPHQL_HOST = 'https://gateway.prod.apps.herodevs.io';
export const GRAPHQL_PATH = '/graphql';
export const ANALYTICS_URL = 'https://apps.herodevs.com/api/eol/track';
export const CONCURRENT_PAGE_REQUESTS = 3;
export const PAGE_SIZE = 500;
export const GIT_OUTPUT_FORMAT = `"${['%h', '%an', '%ad'].join('|')}"`;

// Committers Report - Date Constants
export const DEFAULT_DATE_FORMAT = 'yyyy-MM-dd';
export const DEFAULT_DATE_COMMIT_FORMAT = 'MM/dd/yyyy, h:mm:ss a';
export const DEFAULT_DATE_COMMIT_MONTH_FORMAT = 'MMMM yyyy';

// Trackers - Constants
export const DEFAULT_TRACKER_RUN_DATA_FILE = 'data.json';
export const TRACKER_GIT_OUTPUT_FORMAT = `"${['%H', '%an', '%ad'].join('|')}"`;

let concurrentPageRequests = CONCURRENT_PAGE_REQUESTS;
const parsed = Number.parseInt(process.env.CONCURRENT_PAGE_REQUESTS ?? '0', 10);
if (parsed > 0) {
  concurrentPageRequests = parsed;
}

let pageSize = PAGE_SIZE;
const parsedPageSize = Number.parseInt(process.env.PAGE_SIZE ?? '0', 10);
if (parsedPageSize > 0) {
  pageSize = parsedPageSize;
}

export const config = {
  eolReportUrl: process.env.EOL_REPORT_URL || EOL_REPORT_URL,
  graphqlHost: process.env.GRAPHQL_HOST || GRAPHQL_HOST,
  graphqlPath: process.env.GRAPHQL_PATH || GRAPHQL_PATH,
  analyticsUrl: process.env.ANALYTICS_URL || ANALYTICS_URL,
  concurrentPageRequests,
  pageSize,
};

export const filenamePrefix = 'herodevs';
