
export interface Sbom { components: SbomEntry[], dependencies: SbomEntry[] }
export interface SbomEntry { evidence?: SbomEvidence; group: string, name: string, purl: string, version: string, }
export interface SbomEvidence { occurrences?: Array<{ location: string }> }
export interface SbomMap { components: Record<string, SbomEntry>, purls: string[] }

export interface CdxGenOptions {
  projectType?: string[]
}
export interface ScanOptions {
  cdxgen?: CdxGenOptions
}
export interface CdxCreator {
  // eslint-disable-next-line no-unused-vars
  (dir: string, opts: CdxGenOptions): Promise<{ bomJson: Sbom }>
}
