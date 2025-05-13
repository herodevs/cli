export const EOL_REPORT_URL = '';
export const GRAPHQL_HOST = 'https://api.nes.herodevs.com';
export const GRAPHQL_PATH = '/graphql';

export const config = {
  eolReportUrl: process.env.EOL_REPORT_URL || EOL_REPORT_URL,
  graphqlHost: process.env.GRAPHQL_HOST || GRAPHQL_HOST,
  graphqlPath: process.env.GRAPHQL_PATH || GRAPHQL_PATH,
};
