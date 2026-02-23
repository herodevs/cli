export const EOL_REPORT_URL = 'https://apps.herodevs.com/eol/reports';
export const GRAPHQL_HOST = 'https://gateway.prod.apps.herodevs.io';
export const GRAPHQL_PATH = '/graphql';
export const IAM_HOST = 'http://iam-dev:5845';
export const IAM_PATH = '/graphql';
export const ANALYTICS_URL = 'https://apps.herodevs.com/api/eol/track';
export const CONCURRENT_PAGE_REQUESTS = 3;
export const PAGE_SIZE = 500;
export const GIT_OUTPUT_FORMAT = `"${['%h', '%an', '%ad'].join('|')}"`;

// Committers Report - Date Constants
export const DEFAULT_DATE_FORMAT = 'yyyy-MM-dd';
export const DEFAULT_DATE_COMMIT_FORMAT = 'MM/dd/yyyy, h:mm:ss a';
export const DEFAULT_DATE_COMMIT_MONTH_FORMAT = 'MMMM yyyy';
export const ENABLE_AUTH = false;
export const ENABLE_USER_SETUP = false;

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

const enableAuthEnv = process.env.ENABLE_AUTH;
const enableAuth = enableAuthEnv === 'true' ? true : enableAuthEnv === 'false' ? false : ENABLE_AUTH;
const enableUserSetupEnv = process.env.ENABLE_USER_SETUP;
const enableUserSetup =
  enableUserSetupEnv === 'true' ? true : enableUserSetupEnv === 'false' ? false : ENABLE_USER_SETUP;
const orgIdEnv = process.env.HD_ORG_ID?.trim();
const orgIdParsed = orgIdEnv ? Number.parseInt(orgIdEnv, 10) : NaN;
const orgIdFromEnv = Number.isInteger(orgIdParsed) && orgIdParsed >= 1 ? orgIdParsed : undefined;

export const config = {
  eolReportUrl: process.env.EOL_REPORT_URL || EOL_REPORT_URL,
  graphqlHost: process.env.GRAPHQL_HOST || GRAPHQL_HOST,
  graphqlPath: process.env.GRAPHQL_PATH || GRAPHQL_PATH,
  iamHost: process.env.IAM_HOST || IAM_HOST,
  iamPath: process.env.IAM_PATH || IAM_PATH,
  analyticsUrl: process.env.ANALYTICS_URL || ANALYTICS_URL,
  concurrentPageRequests,
  pageSize,
  enableAuth,
  enableUserSetup,
  ciTokenFromEnv: process.env.HD_AUTH_TOKEN?.trim() || undefined,
  orgIdFromEnv,
};

export const filenamePrefix = 'herodevs';

export const SCAN_ORIGIN_CLI = 'CLI Scan';
export const SCAN_ORIGIN_AUTOMATED = 'Automated Scan';
