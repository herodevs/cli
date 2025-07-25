/**
 * Input parameters for the EOL scan operation
 */
export interface CreateEolReportInput {
  /** Array of package URLs in purl format to scan */
  components: string[];
}

export interface ScanResponse {
  eol: {
    createReport: {
      success: boolean;
      report: EolReport;
    };
  };
}

export interface ReportMetadata {
  totalComponentsCount: number;
  unknownComponentsCount: number;
}

/**
 * Result of the EOL scan operation
 */
export interface EolReport {
  id?: string;
  createdOn: string;
  components: EolScanComponent[];
  metadata: ReportMetadata;
}

export interface CveStats {
  cveId: string;
  cvssScore: number;
  publishedAt: string;
}

/**
 * Information about a component's EOL status
 */
export interface EolScanComponentMetadata {
  isEol: boolean;
  isUnsafe: boolean;
  eolAt: string | null;
  daysEol: number | null;
  eolReasons: string[];
  cve: CveStats[];
}

export interface EolScanComponent {
  metadata: EolScanComponentMetadata | null;
  purl: string;
  nesRemediation?: { target: string } | null;
}

export type ComponentStatus = (typeof VALID_STATUSES)[number];
export const VALID_STATUSES = ['UNKNOWN', 'OK', 'EOL', 'EOL_UPCOMING'] as const;
