import { ux } from '@oclif/core';
import type { ComponentStatus } from '../api/types/nes.types.ts';

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

export const SCAN_ID_KEY = 'eol-scan-v1-';
