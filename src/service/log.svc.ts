import debug from 'debug';

const debugLogger = debug('oclif:hd');

/**
 * A simple logging construct when you
 * don't have the command instance handy
 */
export const log = {
  info: (message: string, ...args: unknown[]) => console.log(message, ...args),
  warn: (message: string, ...args: unknown[]) => console.warn(message, ...args),
  debug: (message: string, ...args: unknown[]) => debugLogger(message, ...args),
  error: (message: string | Error) => console.error(message),
};

/**
 * Updates the logger with command context
 */
export function updateLogger(context: {
  log: (message: string) => void;
  warn: (message: string) => void;
  debug: (message: string) => void;
  error: (message: string | Error) => void;
}) {
  log.info = context.log;
  log.warn = context.warn;
  log.debug = context.debug;
  log.error = context.error;
}
