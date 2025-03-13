/**
 * A simple logging construct when you
 * don't have the command instance handy
 */
export const log = {
  info: (_message?: unknown, ...args: unknown[]) => {
    console.log('[default_log]', ...args);
  },
  warn: (_message?: unknown, ...args: unknown[]) => {
    console.warn('[default_warn]', ...args);
  },
  debug: (_message?: unknown, ...args: unknown[]) => {
    console.debug('[default_debug]', ...args);
  },
};

export const initOclifLog = (
  info: (message?: unknown, ...args: unknown[]) => void,
  warn: (message?: unknown, ...args: unknown[]) => void,
  debug: (message?: unknown, ...args: unknown[]) => void,
) => {
  log.info = info;
  log.warn = warn;
  log.debug = debug;
};
