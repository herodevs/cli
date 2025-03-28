import { ux } from '@oclif/core';
import type { ComponentStatus } from '../api/types/nes.types.ts';

export const STATUS_COLORS: Record<ComponentStatus, string> = {
  EOL: 'red',
  UNKNOWN: 'default',
  OK: 'green',
  LTS: 'yellow',
};

export const INDICATORS: Record<ComponentStatus, string> = {
  EOL: ux.colorize(STATUS_COLORS.EOL, '✗'),
  UNKNOWN: ux.colorize(STATUS_COLORS.UNKNOWN, '•'),
  OK: ux.colorize(STATUS_COLORS.OK, '✔'),
  LTS: ux.colorize(STATUS_COLORS.LTS, '⚡'),
};
