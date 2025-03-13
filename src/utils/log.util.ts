/**
 * A simple logging construct when you
 * don't have the command instance handy
 */
export const log = {
  info: (_message?: any, ...args: any[]) => {
    console.log('[default_log]', ...args);
  },
  warn: (_message?: any, ...args: any[]) => {
    console.warn('[default_warn]', ...args);
  },
};

export const initOclifLog = (
  info: (message?: any, ...args: any[]) => void,
  warn: (message?: any, ...args: any[]) => void,
) => {
  log.info = info;
  log.warn = warn;
};
