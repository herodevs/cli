/**
 * Input parameters for the EOL scan operation
 */
export interface InsightsEolScanInput {
  scanId?: string;
  /** Array of package URLs in purl format to scan */
  components: string[];
  /** The type of scan being performed (e.g. 'SBOM') */
  type: string;

  // if it's chunked
  page: number;
  totalPages: number;
}

export interface ScanResponse {
  insights: {
    scan: {
      eol: InsightsEolScanResult;
    };
  };
}

/**
 * Result of the EOL scan operation
 */
export interface InsightsEolScanResult {
  scanId?: string;
  success: boolean;
  message: string;
  components: InsightsEolScanComponent[];
  warnings: ScanWarning[];
}

/**
 * Information about a component's EOL status
 */
export interface InsightsEolScanComponentInfo {
  isEol: boolean;
  isUnsafe: boolean;
  eolAt: Date | null;
  status: ComponentStatus;
  daysEol: number | null;
  vulnCount: number | null;
}

export interface InsightsEolScanComponent {
  info: InsightsEolScanComponentInfo;
  purl: string;
}

export interface ScanWarning {
  purl: string;
  message: string;
  type?: string;
  error?: unknown;
  diagnostics?: Record<string, unknown>;
}

export type ComponentStatus = (typeof VALID_STATUSES)[number];
export const VALID_STATUSES = ['UNKNOWN', 'OK', 'EOL', 'SCHEDULED'] as const;
