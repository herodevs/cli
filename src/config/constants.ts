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

const toBoolean = (value: string | undefined): boolean | undefined => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};

const toPositiveInt = (value: string | undefined): number | undefined => {
  if (value === undefined || value === '') return undefined;
  const n = Number.parseInt(value, 10);
  return Number.isInteger(n) && n >= 1 ? n : undefined;
};

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
  iamHost: process.env.IAM_HOST || IAM_HOST,
  iamPath: process.env.IAM_PATH || IAM_PATH,
  analyticsUrl: process.env.ANALYTICS_URL || ANALYTICS_URL,
  concurrentPageRequests,
  pageSize,
  enableAuth: toBoolean(process.env.ENABLE_AUTH) ?? ENABLE_AUTH,
  enableUserSetup: toBoolean(process.env.ENABLE_USER_SETUP) ?? ENABLE_USER_SETUP,
  ciTokenFromEnv: process.env.HD_AUTH_TOKEN?.trim() || undefined,
  orgIdFromEnv: toPositiveInt(process.env.HD_ORG_ID),
  accessTokenFromEnv: process.env.HD_ACCESS_TOKEN?.trim() || undefined,
};

export const filenamePrefix = 'herodevs';

export const SCAN_ORIGIN_CLI = 'CLI Scan';
export const SCAN_ORIGIN_AUTOMATED = 'Automated Scan';
