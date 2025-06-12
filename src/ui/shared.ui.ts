import { ux } from '@oclif/core';
import type { ComponentStatus } from '../api/types/nes.types.ts';

export const STATUS_COLORS: Record<ComponentStatus, string> = {
  EOL: 'red',
  UNKNOWN: 'default',
  OK: 'green',
  SUPPORTED: 'yellow',
  NES_AVAILABLE: 'default',
};

export const INDICATORS: Record<ComponentStatus, string> = {
  EOL: ux.colorize(STATUS_COLORS.EOL, '✗'),
  UNKNOWN: ux.colorize(STATUS_COLORS.UNKNOWN, '•'),
  OK: ux.colorize(STATUS_COLORS.OK, '✔'),
  SUPPORTED: ux.colorize(STATUS_COLORS.SUPPORTED, '⚡'),
  NES_AVAILABLE: ux.colorize(STATUS_COLORS.NES_AVAILABLE, '!'),
};

export const SCAN_ID_KEY = 'eol-scan-v1-';
