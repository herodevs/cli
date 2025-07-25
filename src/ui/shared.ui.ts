import type { ComponentStatus } from '@herodevs/eol-shared';
import { ux } from '@oclif/core';

export const STATUS_COLORS: Record<ComponentStatus, string> = {
  EOL: 'red',
  UNKNOWN: 'default',
  OK: 'green',
  EOL_UPCOMING: 'yellow',
};

export const INDICATORS: Record<ComponentStatus, string> = {
  EOL: ux.colorize(STATUS_COLORS.EOL, '✗'),
  UNKNOWN: ux.colorize(STATUS_COLORS.UNKNOWN, '•'),
  OK: ux.colorize(STATUS_COLORS.OK, '✔'),
  EOL_UPCOMING: ux.colorize(STATUS_COLORS.EOL_UPCOMING, '⚡'),
};
