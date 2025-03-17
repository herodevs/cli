export interface Sbom {
  components: SbomEntry[];
  dependencies: SbomEntry[];
}
export interface SbomEntry {
  group: string;
  name: string;
  purl: string;
  version: string;
}

export interface CdxGenOptions {
  projectType?: string[];
}
export interface ScanOptions {
  cdxgen?: CdxGenOptions;
}
export type CdxCreator = (dir: string, opts: CdxGenOptions) => Promise<{ bomJson: Sbom }>;
