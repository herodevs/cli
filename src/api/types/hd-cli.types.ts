import { type ComponentStatus, type InsightsEolScanComponent, type ScanWarning, VALID_STATUSES } from './nes.types.ts';

export const isValidComponentStatus = (status: string): status is ComponentStatus => {
  return VALID_STATUSES.includes(status as ComponentStatus);
};

export const validateComponentStatuses = (statuses: string[]): ComponentStatus[] => {
  const validStatuses = statuses.filter(isValidComponentStatus);
  if (validStatuses.length !== statuses.length) {
    throw new Error('Invalid component status provided');
  }
  return validStatuses;
};

export interface ScanInputOptions {
  type: 'SBOM' | 'OTHER';
  page: number;
  totalPages: number;
  scanId?: string;
}

export const DEFAULT_SCAN_INPUT_OPTIONS: ScanInputOptions = {
  type: 'SBOM',
  page: 1,
  totalPages: 1,
} satisfies ScanInputOptions;

export type ScanResultComponentsMap = Map<string, InsightsEolScanComponent>;

export type ScanInput = {
  components: string[];
  options: ScanInputOptions;
};
export interface ScanResult {
  components: ScanResultComponentsMap;
  diagnostics?: Record<string, unknown>;
  message: string;
  success: boolean;
  warnings: ScanWarning[];
}
