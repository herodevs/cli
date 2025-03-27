export type ScanInput = { components: string[]; type: 'SBOM' } | { type: 'OTHER' };

export interface ScanResponse {
  insights: {
    scan: {
      eol: ScanResponseReport;
    };
  };
}

export interface ScanResponseReport {
  components: ScanResultComponent[];
  diagnostics?: Record<string, unknown>;
  message: string;
  success: boolean;
  warnings?: ScanWarning[];
}

export const VALID_STATUSES = ['UNKNOWN', 'OK', 'EOL', 'LTS'] as const;
export type ComponentStatus = (typeof VALID_STATUSES)[number];

export interface ScanResultComponent {
  info: {
    eolAt: Date | null;
    isEol: boolean;
    daysEol: number | null;
    isUnsafe: boolean;
    status: ComponentStatus;
  };
  purl: string;
}

export interface ScanWarning {
  purl: string;
  message: string;
  type?: string;
  error?: unknown;
  diagnostics?: Record<string, unknown>;
}

export type ScanResultComponentsMap = Map<string, ScanResultComponent>;

export interface ScanResult {
  components: ScanResultComponentsMap;
  diagnostics?: Record<string, unknown>;
  message: string;
  success: boolean;
  warnings: ScanWarning[];
}
