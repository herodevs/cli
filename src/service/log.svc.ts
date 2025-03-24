import { getLogger } from '@oclif/core';

/**
 * A simple logging construct when you
 * don't have the command instance handy
 */
export const log = getLogger('oclif:hd');

// Function to update the logger with command context
export function updateLogger(context: {
  log: (message: string) => void;
  warn: (message: string) => void;
  debug: (message: string) => void;
  error: (message: string | Error) => void;
}) {
  // Create wrapper functions that handle both string messages and format strings
  log.info = (formatter: unknown, ...args: unknown[]) => {
    if (typeof formatter === 'string') {
      context.log(formatter);
    } else {
      context.log(String(formatter));
    }
  };

  log.warn = (formatter: unknown, ...args: unknown[]) => {
    if (typeof formatter === 'string') {
      context.warn(formatter);
    } else {
      context.warn(String(formatter));
    }
  };

  log.debug = (formatter: unknown, ...args: unknown[]) => {
    if (typeof formatter === 'string') {
      context.debug(formatter);
    } else {
      context.debug(String(formatter));
    }
  };

  log.error = (formatter: unknown, ...args: unknown[]) => {
    if (typeof formatter === 'string' || formatter instanceof Error) {
      context.error(formatter);
    } else {
      context.error(String(formatter));
    }
  };
}
