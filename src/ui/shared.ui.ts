import { ux } from '@oclif/core';
import type { ComponentStatus } from '../api/types/nes.types.ts';

export const STATUS_COLORS: Record<ComponentStatus, string> = {
  EOL: 'red',
  UNKNOWN: 'default',
  OK: 'green',
  SCHEDULED: 'yellow',
};

export const INDICATORS: Record<ComponentStatus, string> = {
  EOL: ux.colorize(STATUS_COLORS.EOL, '✗'),
  UNKNOWN: ux.colorize(STATUS_COLORS.UNKNOWN, '•'),
  OK: ux.colorize(STATUS_COLORS.OK, '✔'),
  SCHEDULED: ux.colorize(STATUS_COLORS.SCHEDULED, '⚡'),
};

export const MAX_PURL_LENGTH = 60;

export const MAX_TABLE_COLUMN_WIDTH = 30;
