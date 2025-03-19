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
}

export type ComponentStatus = 'EOL' | 'LTS' | 'OK';

export interface ScanResultComponent {
  info: {
    eolAt: Date | null;
    isEol: boolean;
    isUnsafe: boolean;
  };
  purl: string;
  status?: ComponentStatus;
}

export interface ScanResult {
  components: Map<string, ScanResultComponent>;
  diagnostics?: Record<string, unknown>;
  message: string;
  success: boolean;
}
