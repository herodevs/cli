import { getLogger } from '@oclif/core';

// Create a logger instance that we can update with the command context
export const log = getLogger('hd');

// Function to update the logger with command context
export function updateLogger(context: {
  log: (message: string) => void;
  warn: (message: string) => void;
  debug: (message: string) => void;
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
}
