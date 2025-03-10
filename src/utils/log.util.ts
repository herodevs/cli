/* eslint-disable object-shorthand */
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * A simple logging construct when you 
 * don't have the command instance handy
 */
export const log = {
  info: (message?: any, ...args: any[]) => {
    console.log('[default_log]', ...args)
  },
  warn: (message?: any, ...args: any[]) => {
    console.warn('[default_warn]', ...args)
  },
}

export const initOclifLog = (
  info: (message?: any, ...args: any[]) => void,
  warn: (message?: any, ...args: any[]) => void) => {
  log.info = info
  log.warn = warn
}