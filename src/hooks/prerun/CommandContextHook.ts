/* eslint-disable @typescript-eslint/no-explicit-any */
import { Hook } from '@oclif/core'


export const log = {
  info(...args: any[]) {
    console.log('[default_log]', ...args)
  },
  warn(...args: any[]) {
    console.warn('[default_warn]', ...args)
  },
}

const hook: Hook<'prerun'> = async function (opts) {
  log.info = opts.context.log || log.info
  log.warn = opts.context.log || log.warn
}

export default hook
