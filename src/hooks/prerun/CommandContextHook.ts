/* eslint-disable unicorn/filename-case */

import { Hook } from '@oclif/core'

import { initOclifLog, log } from '../../utils/log.util'

const hook: Hook<'prerun'> = async function (opts) {
  initOclifLog(opts.context.log, opts.context.log)
  log.info = opts.context.log || log.info
  log.warn = opts.context.log || log.warn
}

export default hook
