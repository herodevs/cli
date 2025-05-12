import { ux } from '@oclif/core';
import type { ComponentStatus } from '../api/types/nes.types.ts';

export const STATUS_COLORS: Record<ComponentStatus, string> = {
  EOL: 'red',
  UNKNOWN: 'default',
  OK: 'green',
  SUPPORTED: 'yellow',
};

export const INDICATORS: Record<ComponentStatus, string> = {
  EOL: ux.colorize(STATUS_COLORS.EOL, '✗'),
  UNKNOWN: ux.colorize(STATUS_COLORS.UNKNOWN, '•'),
  OK: ux.colorize(STATUS_COLORS.OK, '✔'),
  SUPPORTED: ux.colorize(STATUS_COLORS.SUPPORTED, '⚡'),
};

export const MAX_PURL_LENGTH = 60;

export const MAX_TABLE_COLUMN_WIDTH = 30;

export const SCAN_ID_KEY = 'eol-scan-v1-';
